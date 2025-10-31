# type: ignore
from fastapi import FastAPI, HTTPException, Query, Body
from supabase import create_client, Client
from datetime import datetime, timedelta
import pytz
import logging
import requests
import asyncio
import os
from pydantic import BaseModel

from math import floor

# Configuracion de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuración de Supabase
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Variables de entorno de Supabase no configuradas correctamente")
    raise ValueError("VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Configuración de NFL API Data
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "115f54c5d8msh65bec7d1186e70fp12be67jsn8fc1b8736a43")
BASE_URL = "https://nfl-api-data.p.rapidapi.com"
RAPIDAPI_HOST = "nfl-api-data.p.rapidapi.com"
CDMX_TZ = pytz.timezone('America/Mexico_City')

# Crear app FastAPI con root_path para que funcione detrás del proxy /api
app = FastAPI(root_path="/api")

# Modelo para team_records
class TeamRecord(BaseModel):
    id: int | None = None
    team_id: int
    year: int
    week: int
    wins: int
    losses: int
    ties: int
    updated_at: str | None = None

class TeamRecordCreate(BaseModel):
    team_id: int
    year: int
    week: int
    wins: int
    losses: int
    ties: int
# ENDPOINT: Guardar récord semanal de todos los equipos (ejecutar al final de cada semana)

# ENDPOINT: Guardar récord semanal de todos los equipos (ejecutar al final de cada semana)
@app.post("/save-weekly-team-records")
async def save_weekly_team_records(year: int = Query(...), week: int | None = Query(None)):
    """
    Consulta el récord de cada equipo en la API externa y lo guarda en la tabla team_records para la semana indicada.
    Si la semana es mayor o igual a la semana actual, no hace nada.
    """
    try:
        # Validar semana actual
        season_query = supabase.table("seasons").select("*").eq("year", year).eq("is_active", True).execute()
        if not season_query.data:
            raise HTTPException(status_code=404, detail="No se encontró la temporada activa para ese año")
        current_season = season_query.data[0]
        current_week = current_season.get("current_week", 1)

        # Si no se pasa week, usar la semana actual menos 1 (para guardar el récord de la semana anterior)
        if week is None:
            week = max(1, current_week - 1)

        if week >= current_week:
            return {"inserted": 0, "updated": 0, "status": "skipped", "message": f"La semana {week} es mayor o igual a la semana actual ({current_week}). No se actualiza nada."}

        # Obtener todos los equipos locales con info relevante
        teams_query = supabase.table("teams").select("id, name, city, abbreviation").execute()
        if not teams_query.data:
            raise HTTPException(status_code=404, detail="No hay equipos en la base de datos")
        teams = teams_query.data

        # Obtener lista de equipos de la API externa (nuevo endpoint)
        api_url = f"{BASE_URL}/nfl-team-listing/v1/data"
        headers = {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST
        }
        api_resp = requests.get(api_url, headers=headers, timeout=20)
        if api_resp.status_code != 200:
            raise HTTPException(status_code=500, detail="No se pudo obtener lista de equipos de la API externa")
        api_teams = [t['team'] for t in api_resp.json() if 'team' in t]

        # Mapeo: para cada equipo de la API, buscar el id local usando abbreviation, name o location
        def find_local_team(api_team):
            api_name = api_team.get('name', '').lower()
            api_city = api_team.get('location', '').lower()
            api_abbr = api_team.get('abbreviation', '').lower()
            for t in teams:
                if (
                    t['name'].lower() == api_name or
                    t['city'].lower() == api_city or
                    t['abbreviation'].lower() == api_abbr
                ):
                    return t['id']
            # Fallback: buscar por inclusión
            for t in teams:
                if t['name'].lower() in api_name or api_name in t['name'].lower():
                    return t['id']
            return None

        inserted = 0
        updated = 0
        for api_team in api_teams:
            local_team_id = find_local_team(api_team)
            if not local_team_id:
                logger.warning(f"No se encontró equipo local para {api_team}")
                continue
            nfl_id = api_team.get('id')
            url = f"{BASE_URL}/nfl-team-record?id={nfl_id}&year={year}"
            response = requests.get(url, headers=headers, timeout=20)
            if response.status_code != 200:
                logger.warning(f"No se pudo obtener récord para equipo {nfl_id}")
                continue
            data = response.json()
            items = data.get('items', [])
            overall = next((item for item in items if item.get('id') == '0' or item.get('name') == 'overall'), None)
            if not overall:
                logger.warning(f"No se encontró récord global para equipo {nfl_id}")
                continue
            wins = next((s['value'] for s in overall.get('stats', []) if s['name'] == 'wins'), 0)
            losses = next((s['value'] for s in overall.get('stats', []) if s['name'] == 'losses'), 0)
            ties = next((s['value'] for s in overall.get('stats', []) if s['name'] == 'ties'), 0)
            record_data = {
                "team_id": local_team_id,
                "year": year,
                "week": week,
                "wins": wins,
                "losses": losses,
                "ties": ties
            }
            existing = supabase.table("team_records").select("id").eq("team_id", local_team_id).eq("year", year).eq("week", week).execute()
            if existing.data:
                supabase.table("team_records").update(record_data).eq("id", existing.data[0]['id']).execute()
                updated += 1
            else:
                supabase.table("team_records").insert(record_data).execute()
                inserted += 1
        return {"inserted": inserted, "updated": updated, "status": "ok"}
    except Exception as e:
        logger.error(f"Error guardando récords semanales: {e}")
        raise HTTPException(status_code=500, detail=f"Error guardando récords: {str(e)}")

def validate_score(score):
    if score is None:
        return None
    try:
        return int(score)
    except (ValueError, TypeError):
        return None

class UpdateOddsRequest(BaseModel):
    week: int = None

@app.get("/")
async def root():
    """Endpoint raíz de la API"""
    return {
        "message": "ChoriSurvivor NFL API",
        "version": "1.0.0",
        "status": "active",
        "endpoints": [
            "GET /get-weekly-odds?week={week}",
            "POST /update-weekly-odds",
            "POST /update-matches",
            "POST /set-current-week",
            "GET /current-week",
            "POST /auto-update-picks",
            "POST /auto-assign-last-game-picks",
            "POST /daily-update",
            "POST /update-weekly-odds-auto",
            "POST /save-weekly-team-records",
            "GET /test-env",
            "GET /list-teams",
            "GET /test-api"
        ],
        "cron_jobs": {
            "set-current-week": "Martes y Jueves a las 5:00 AM (0 5 * * 2,4)",
            "daily-update": "Todos los días a las 23:59 (59 23 * * *)",
            "update-weekly-odds-auto": "Todos los días a las 5:00 AM (0 5 * * *)",
            "auto-assign-last-game-picks": "5 minutos después del último partido de la semana (dinámico)"
        }
    }

@app.get("/get-weekly-odds")
async def get_weekly_odds(week: int = Query(..., description="Número de semana")):
    """
    Obtener odds de la semana específica
    """
    try:
        logger.info(f"Consultando odds para la semana {week}")
        
        # Obtener season_id actual
        season_query = supabase.table("seasons").select("id").eq("year", 2025).execute()
        if not season_query.data:  # type: ignore
            raise HTTPException(status_code=404, detail="No se encontró la temporada 2025")
        
        season_id = season_query.data[0]['id']  # type: ignore
        
        # Consultar weekly_odds con información de equipos
        odds_query = supabase.table("weekly_odds").select("""
            *,
            matches(
                id,
                game_date,
                home_team_id,
                away_team_id,
                home_teams:home_team_id(name, abbreviation),
                away_teams:away_team_id(name, abbreviation)
            )
        """).eq("week_number", week).execute()
        
        if not odds_query.data:  # type: ignore
            return []
        
        return odds_query.data  # type: ignore
        
    except Exception as e:
        logger.error(f"Error obteniendo weekly odds: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo odds: {str(e)}")


def find_team_match(api_team_name, db_teams):
    """
    Buscar coincidencia entre nombre de API y equipos de base de datos
    """
    api_name_lower = api_team_name.lower()
    
    # Mapeo manual de nombres de API a nombres de DB
    team_mappings = {
        'detroit lions': 'Lions',
        'los angeles chargers': 'Chargers',
        'philadelphia eagles': 'Eagles',
        'dallas cowboys': 'Cowboys',
        'kansas city chiefs': 'Chiefs',
        'atlanta falcons': 'Falcons',
        'tampa bay buccaneers': 'Buccaneers',
        'cleveland browns': 'Browns',
        'cincinnati bengals': 'Bengals',
        'san francisco 49ers': '49ers',
        'chicago bears': 'Bears',
        'buffalo bills': 'Bills',
        'denver broncos': 'Broncos',
        'arizona cardinals': 'Cardinals',
        'new york giants': 'Giants',
        'washington commanders': 'Commanders',
        'new york jets': 'Jets',
        'miami dolphins': 'Dolphins',
        'new england patriots': 'Patriots',
        'baltimore ravens': 'Ravens',
        'pittsburgh steelers': 'Steelers',
        'houston texans': 'Texans',
        'indianapolis colts': 'Colts',
        'jacksonville jaguars': 'Jaguars',
        'tennessee titans': 'Titans',
        'green bay packers': 'Packers',
        'minnesota vikings': 'Vikings',
        'carolina panthers': 'Panthers',
        'new orleans saints': 'Saints',
        'los angeles rams': 'Rams',
        'seattle seahawks': 'Seahawks',
        'las vegas raiders': 'Raiders'
    }
    
    # Buscar mapeo directo
    if api_name_lower in team_mappings:
        target_name = team_mappings[api_name_lower]
        for team in db_teams:
            if team['name'] == target_name:
                return team
    
    # Buscar por coincidencia parcial en el nombre
    for team in db_teams:
        team_name_lower = team['name'].lower()
        if team_name_lower in api_name_lower or api_name_lower.endswith(team_name_lower):
            return team
    
    return None


@app.post("/update-weekly-odds")
async def update_weekly_odds(body: UpdateOddsRequest = Body(None)):
    """
    Actualiza las odds de la semana actual de NFL.
    Si se especifica 'week', actualiza esa semana específica.
    Si no se especifica, actualiza la semana actual.
    """
    try:
        week_param = body.week if body else None
        odds_updated = 0
        odds_inserted = 0
        
        # Obtener temporada activa
        season_query = supabase.table("seasons").select("*").eq("is_active", True).execute()
        if not season_query.data:  # type: ignore
            raise HTTPException(status_code=404, detail="No se encontró temporada activa")
        
        current_season = season_query.data[0]  # type: ignore
        season_id = current_season['id']
        
        # Determinar qué semana procesar
        if week_param is None:
            # TODO: Lógica para determinar semana actual
            week_param = 8  # Por ahora, usar semana 8 como ejemplo
        
        logger.info(f"INICIANDO: Actualización de odds - Semana {week_param}")
        
        # Obtener partidos de la semana desde la base de datos
        matches_query = supabase.table("matches").select(
            "id, home_team_id, away_team_id, game_date, week"
        ).eq("season_id", season_id).eq("week", week_param).execute()
        
        if not matches_query.data:  # type: ignore
            return {
                "odds_updated": 0,
                "odds_inserted": 0,
                "status": "no_matches_found",
                "message": f"No se encontraron partidos para la semana {week_param}"
            }
        
        matches = matches_query.data  # type: ignore
        logger.info(f"Procesando odds para {len(matches)} partidos de la semana {week_param}")
        
        # Obtener eventos de la API para la semana
        logger.info(f"Obteniendo eventos de la semana {week_param} desde la API")
        
        # Obtener eventos desde la API NFL por año (2025)
        current_year = 2025  # Temporada NFL 2025-2026
        url = f"{BASE_URL}/nfl-events"
        
        try:
            headers_api = {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': RAPIDAPI_HOST
            }
            params_api = {
                'year': current_year
            }
            response = requests.get(url, headers=headers_api, params=params_api, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            events = data.get('events', [])
            logger.info(f"TOTAL EVENTS FOUND: {len(events)}")
            
            # Filtrar eventos de la semana específica
            week_events = []
            for event in events:
                season_year = event.get('season', {}).get('year', None)
                week_num = event.get('week', {}).get('number', None)
                if season_year == 2025 and week_num == week_param:
                    week_events.append(event)
            
            logger.info(f"Eventos de semana {week_param} encontrados: {len(week_events)}")
            
        except Exception as e:
            logger.error(f"Error obteniendo eventos de la API: {e}")
            raise HTTPException(status_code=500, detail=f"Error obteniendo eventos: {str(e)}")
        
        # Crear un diccionario para mapear equipos de API a database
        teams_query = supabase.table("teams").select("id, name, city, abbreviation").execute()
        db_teams = []
        if teams_query.data:  # type: ignore
            db_teams = teams_query.data  # type: ignore
        
        for match in matches:
            match_id = match['id']
            home_team_id = match['home_team_id']
            away_team_id = match['away_team_id']
            
            # Obtener nombres de equipos de la database
            home_team_query = supabase.table("teams").select("name").eq("id", home_team_id).execute()
            away_team_query = supabase.table("teams").select("name").eq("id", away_team_id).execute()
            
            if not home_team_query.data or not away_team_query.data:  # type: ignore
                logger.warning(f"No se encontraron nombres de equipos para match {match_id}")
                continue
                
            home_team_name = home_team_query.data[0]['name']  # type: ignore
            away_team_name = away_team_query.data[0]['name']  # type: ignore
            
            # Buscar el evento en week_events que coincida con estos equipos
            matching_event = None
            for event in week_events:
                competitors = event.get('competitions', [{}])[0].get('competitors', [])
                if len(competitors) >= 2:
                    api_team_names = [comp.get('team', {}).get('displayName', '') for comp in competitors]
                    
                    # Buscar coincidencias usando la función de matching
                    home_match = None
                    away_match = None
                    
                    for api_name in api_team_names:
                        matched_team = find_team_match(api_name, db_teams)
                        if matched_team:
                            if matched_team['name'] == home_team_name:
                                home_match = api_name
                            elif matched_team['name'] == away_team_name:
                                away_match = api_name
                    
                    # Si encontramos ambos equipos, es una coincidencia
                    if home_match and away_match:
                        matching_event = event
                        logger.info(f"Match encontrado: {home_team_name} ({home_match}) vs {away_team_name} ({away_match})")
                        break
            
            if not matching_event:
                logger.warning(f"No se encontró evento de API para match {match_id} ({home_team_name} vs {away_team_name})")
                continue
                
            event_api_id = matching_event.get('id')
            logger.info(f"Procesando odds para match {match_id}: {home_team_name} vs {away_team_name} (API ID: {event_api_id})")
            
            # Obtener odds del evento
            try:
                odds_url = f"{BASE_URL}/nfl-eventodds"
                odds_params = {
                    'id': event_api_id
                }
                odds_response = requests.get(odds_url, headers={
                    'X-RapidAPI-Key': RAPIDAPI_KEY,
                    'X-RapidAPI-Host': RAPIDAPI_HOST
                }, params=odds_params, timeout=30)
                odds_response.raise_for_status()
                odds_data = odds_response.json()
                
                # Procesar odds
                odds_items = odds_data.get('items', [])
                if not odds_items:
                    logger.info(f"No hay odds disponibles para evento {event_api_id}")
                    continue
                
                # Usar el primer provider (mayor prioridad)
                primary_odds = odds_items[0]
                provider_name = primary_odds.get('provider', {}).get('name', 'Unknown')
                
                # Preparar datos para inserción/actualización usando la estructura real de la tabla
                odds_record = {
                    'match_id': match_id,
                    'event_api_id': event_api_id,
                    'week_number': week_param,
                    'season_id': season_id,
                    'home_team_id': home_team_id,
                    'away_team_id': away_team_id,
                    'game_date': match['game_date'],
                    'provider_name': provider_name,
                    'spread': None,
                    'home_spread_odds': None,
                    'away_spread_odds': None,
                    'home_moneyline': None,
                    'away_moneyline': None,
                    'over_under': None,
                    'over_odds': None,
                    'under_odds': None,
                    'home_is_favorite': None,
                    'away_is_favorite': None,
                    'last_updated': datetime.now(pytz.timezone('America/Mexico_City')).isoformat()
                }
                
                # Extraer spread data
                spread_value = primary_odds.get('spread')
                if spread_value is not None:
                    odds_record['spread'] = spread_value
                
                # Extraer moneyline y spread odds de los equipos
                home_team_odds = primary_odds.get('homeTeamOdds', {})
                away_team_odds = primary_odds.get('awayTeamOdds', {})
                
                if isinstance(home_team_odds, dict):
                    odds_record['home_moneyline'] = home_team_odds.get('moneyLine')
                    odds_record['home_spread_odds'] = home_team_odds.get('spreadOdds')
                    odds_record['home_is_favorite'] = home_team_odds.get('favorite', False)
                
                if isinstance(away_team_odds, dict):
                    odds_record['away_moneyline'] = away_team_odds.get('moneyLine')
                    odds_record['away_spread_odds'] = away_team_odds.get('spreadOdds')
                    odds_record['away_is_favorite'] = away_team_odds.get('favorite', False)
                
                # Extraer over/under data
                over_under_value = primary_odds.get('overUnder')
                if over_under_value is not None:
                    odds_record['over_under'] = over_under_value
                    odds_record['over_odds'] = primary_odds.get('overOdds')
                    odds_record['under_odds'] = primary_odds.get('underOdds')
                
                # Verificar si ya existe un registro para este match
                logger.info(f"Intentando insertar/actualizar odds: {odds_record}")
                
                existing_query = supabase.table("weekly_odds").select("id").eq("match_id", match_id).eq("week_number", week_param).execute()
                
                if existing_query.data:  # type: ignore
                    # Actualizar registro existente
                    logger.info(f"Actualizando registro existente para match {match_id}")
                    update_result = supabase.table("weekly_odds").update(odds_record).eq("match_id", match_id).eq("week_number", week_param).execute()
                    if update_result.data:  # type: ignore
                        odds_updated += 1
                        logger.info(f"✅ Odds actualizados para match {match_id}, provider {provider_name}")
                    else:
                        logger.warning(f"❌ Error actualizando odds para match {match_id}: {update_result}")
                else:
                    # Insertar nuevo registro
                    logger.info(f"Insertando nuevo registro para match {match_id}")
                    insert_result = supabase.table("weekly_odds").insert(odds_record).execute()
                    if insert_result.data:  # type: ignore
                        odds_inserted += 1
                        logger.info(f"✅ Odds insertados para match {match_id}, provider {provider_name}")
                    else:
                        logger.warning(f"❌ Error insertando odds para match {match_id}: {insert_result}")
            
            except Exception as e:
                logger.error(f"Error procesando odds para evento {event_api_id}: {e}")
                continue
        
        logger.info(f"COMPLETADO - Odds actualizadas: {odds_updated}, Odds insertadas: {odds_inserted}")
        
        return {
            "odds_updated": odds_updated,
            "odds_inserted": odds_inserted,
            "week": week_param,
            "status": "completed"
        }
        
    except Exception as e:
        logger.error(f"Error crítico en update_weekly_odds: {e}")
        raise HTTPException(status_code=500, detail=f"Error actualizando odds: {str(e)}")

class UpdateMatchesRequest(BaseModel):
    week: int = None

@app.post("/update-matches")
async def update_matches(body: UpdateMatchesRequest = Body(None)):
    """
    Actualiza o agrega partidos de NFL en la base de datos Supabase. 
    Si se proporciona 'week' en el body, solo procesa esa semana específica.
    Si no se proporciona 'week' o body, procesa desde la semana actual hacia adelante.
    
    Ejemplos de uso:
    - POST /update-matches (sin body) -> procesa semana actual hacia adelante
    - POST /update-matches {"week": 1} -> procesa solo semana 1
    """
    try:
        week_param = body.week if body else None
        matches_updated = 0
        matches_inserted = 0

        # Obtener la temporada activa
        season_query = supabase.table("seasons").select("*").eq("is_active", True).execute()
        if not season_query.data:
            logger.error("No hay temporada activa en la base de datos")
            raise HTTPException(status_code=404, detail="No hay temporada activa")
        current_season = season_query.data[0]
        season_id = current_season['id']
        season_year = current_season['year']

        # Obtener fechas desde la semana actual hasta el final de la temporada
        logger.info("INICIANDO: Procesamiento con NFL API Data - Semana actual en adelante")
        
        # Calcular fechas desde la semana actual hasta el final de la temporada NFL
        today = datetime.now(pytz.utc)
        
        # Temporada NFL 2025-2026: Septiembre 2025 a Febrero 2026
        # Semana 1 regular: ~4 de septiembre 2025
        # Última semana playoff/Super Bowl: ~8 de febrero 2026
        season_start = datetime(2025, 9, 4, tzinfo=pytz.utc)  # Inicio temporada 2025
        season_end = datetime(2026, 2, 8, tzinfo=pytz.utc)    # Final temporada (Super Bowl)
        
        # Si se proporciona week_param, solo procesar esa semana
        if week_param is not None:
            week_start = datetime(season_year, 9, 4, tzinfo=pytz.utc) + timedelta(weeks=week_param-1)
            test_dates = [week_start.strftime("%Y-%m-%d")]
        else:
            today = datetime.now(pytz.utc)
            season_start = datetime(2025, 9, 4, tzinfo=pytz.utc)
            season_end = datetime(2026, 2, 8, tzinfo=pytz.utc)
            current_date = max(today.date(), season_start.date())
            end_date = season_end.date()
            test_dates = []
            date_cursor = current_date
            while date_cursor <= end_date and len(test_dates) < 50:
                test_dates.append(date_cursor.strftime("%Y-%m-%d"))
                date_cursor += timedelta(days=7)
        logger.info(f"Procesando {len(test_dates)} fechas desde {test_dates[0] if test_dates else 'ninguna'} hasta {test_dates[-1] if test_dates else 'ninguna'}")
        
        # Obtener eventos desde la API NFL por año (2025)
        current_year = 2025  # Temporada NFL 2025-2026
        url = f"{BASE_URL}/nfl-events"
        logger.info(f"Consultando API NFL para el año {current_year}")
        
        try:
            headers = {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': RAPIDAPI_HOST
            }
            params = {
                'year': current_year
            }
            response = requests.get(url, headers=headers, params=params, timeout=30)
            logger.info(f"API RESPONSE: Status {response.status_code} - {url}")
            
            if response.status_code == 429:
                logger.warning(f"RATE LIMIT: Esperando 60 segundos...")
                await asyncio.sleep(60)
                raise HTTPException(status_code=429, detail="Rate limit alcanzado")
            
            response.raise_for_status()
            data = response.json()
            logger.info(f"DATA KEYS: {data.keys() if isinstance(data, dict) else 'Not dict'}")
            
            if not data or 'events' not in data or not data['events']:
                logger.info(f"NO EVENTS: Sin eventos para el año {current_year}")
                return {
                    "matches_updated": 0,
                    "matches_inserted": 0,
                    "status": "no_events_found"
                }
            
            events = data.get('events', [])
            logger.info(f"TOTAL EVENTS FOUND: {len(events)}")

            # Filtrar solo partidos de temporada regular (season.type == 2)
            regular_events = []
            for event in events:
                season_info = event.get('season', {})
                if season_info.get('type') == 2:
                    regular_events.append(event)
            events = regular_events
            logger.info(f"FILTERED EVENTS (regular season only): {len(events)}")

            # Solo filtrar por fecha si NO se especificó una semana específica
            if week_param is None:
                # Filtrar solo eventos desde la fecha actual hacia adelante
                today = datetime.now(pytz.utc)
                filtered_events = []
                for event in events:
                    event_date = event.get('date')
                    if not event_date:
                        continue
                    try:
                        event_dt = datetime.strptime(event_date, "%Y-%m-%dT%H:%MZ")
                        event_dt = pytz.utc.localize(event_dt)
                        # Solo procesar eventos desde hoy hacia adelante
                        if event_dt.date() >= today.date():
                            filtered_events.append(event)
                    except Exception as e:
                        logger.warning(f"Error parseando fecha {event_date}: {e}")
                        continue
                events = filtered_events
                logger.info(f"FILTERED EVENTS (from today onwards): {len(events)}")
            else:
                logger.info(f"PROCESANDO SEMANA ESPECÍFICA {week_param}: No filtrar por fecha, procesando solo eventos de temporada regular")
            
        except Exception as e:
            logger.error(f"ERROR API: {url} - {e}")
            raise HTTPException(status_code=500, detail=f"Error consultando API NFL: {str(e)}")

        logger.info(f"PROCESSING: {len(events)} eventos NFL")
        for i, event in enumerate(events):
            logger.info(f"EVENT {i+1}/{len(events)}: Processing event ID {event.get('id')}")
            
            # Extraer datos de NFL API Data
            event_date = event.get('date')
            if not event_date:
                logger.warning(f"Evento sin fecha: {event.get('id')}")
                continue
            
            # Parsear fecha del evento y convertir a hora de Mexico (UTC-6)
            try:
                event_dt = datetime.strptime(event_date, "%Y-%m-%dT%H:%MZ")
                event_dt = pytz.utc.localize(event_dt)
                # Convertir a hora de Mexico (UTC-6)
                mexico_tz = pytz.timezone('America/Mexico_City')
                event_dt_mexico = event_dt.astimezone(mexico_tz)
                game_datetime = event_dt_mexico.strftime("%Y-%m-%d %H:%M:%S")
            except Exception as e:
                logger.warning(f"Error parseando fecha {event_date}: {e}")
                continue
            
            # Obtener número de semana desde la API
            week_info = event.get('week', {})
            week_num = week_info.get('number')
            if not week_num:
                logger.warning(f"Evento sin número de semana: {event.get('id')}")
                continue
                
            # Si se especificó una semana específica, ignorar eventos de otras semanas
            if week_param is not None and int(week_num) != week_param:
                logger.info(f"Ignorando evento de semana {week_num} (solicitada semana {week_param})")
                continue
            
            # Obtener información de la competición (partido)
            competitions = event.get('competitions', [])
            if not competitions:
                logger.warning(f"Evento sin competiciones: {event.get('id')}")
                continue
            
            competition = competitions[0]  # Tomar la primera competición
            competitors = competition.get('competitors', [])
            
            if len(competitors) != 2:
                logger.warning(f"Competición sin 2 equipos: {event.get('id')}")
                continue
            
            # Identificar home/away teams
            home_team_data = next((c for c in competitors if c.get('homeAway') == 'home'), None)
            away_team_data = next((c for c in competitors if c.get('homeAway') == 'away'), None)
            
            if not home_team_data or not away_team_data:
                logger.warning(f"No se pudieron identificar equipos home/away: {event.get('id')}")
                continue
            
            # Extraer nombres de equipos con manejo de errores
            try:
                home_team_name = home_team_data['team']['location'] + ' ' + home_team_data['team']['name']
                away_team_name = away_team_data['team']['location'] + ' ' + away_team_data['team']['name']
            except KeyError as e:
                logger.warning(f"Error extrayendo nombres de equipos para evento {event.get('id')}: {e}")
                logger.debug(f"home_team_data: {home_team_data}")
                logger.debug(f"away_team_data: {away_team_data}")
                continue
            
            # Extraer scores si existen
            home_score = validate_score(home_team_data.get('score'))
            away_score = validate_score(away_team_data.get('score'))
            
            # Verificar si el partido está completado
            status = competition.get('status', {}).get('type', {})
            is_completed = status.get('completed', False)
            # Buscar los equipos por nombre
            logger.info(f"Buscando equipos: {home_team_name} vs {away_team_name}")
            
            # Usar abreviaciones para búsqueda más precisa
            home_abbr = home_team_data['team']['abbreviation']
            away_abbr = away_team_data['team']['abbreviation']
            
            # Buscar por abreviación primero, luego por nombre
            home_team_query = supabase.table("teams").select("id, name, abbreviation").eq("abbreviation", home_abbr).execute()
            if not home_team_query.data:
                home_team_query = supabase.table("teams").select("id, name, abbreviation").ilike("name", f"%{home_team_data['team']['name']}%").execute()
            
            away_team_query = supabase.table("teams").select("id, name, abbreviation").eq("abbreviation", away_abbr).execute()
            if not away_team_query.data:
                away_team_query = supabase.table("teams").select("id, name, abbreviation").ilike("name", f"%{away_team_data['team']['name']}%").execute()
            
            logger.info(f"Resultados búsqueda - Home: {home_team_query.data}, Away: {away_team_query.data}")
            
            if not home_team_query.data or not away_team_query.data:
                logger.warning(f"Equipos no encontrados: {home_team_name} vs {away_team_name}")
                continue
            home_team_id = home_team_query.data[0]['id']  # type: ignore
            away_team_id = away_team_query.data[0]['id']  # type: ignore
            
            logger.info(f"IDs encontrados - Home: {home_team_id}, Away: {away_team_id}")
            
            # Buscar el partido en Supabase
            logger.info(f"Buscando partido: Season {season_id}, Week {week_num}, Home {home_team_id}, Away {away_team_id}")
            match_query = supabase.table("matches").select("*").eq(
                "season_id", season_id
            ).eq(
                "week", week_num
            ).eq(
                "home_team_id", home_team_id
            ).eq(
                "away_team_id", away_team_id
            ).execute()
            
            logger.info(f"Partido encontrado: {len(match_query.data)} resultados")
            now_str = datetime.now(pytz.utc).strftime("%Y-%m-%d %H:%M:%S")
            
            # Validar scores 0-0 en partidos no completados
            if not is_completed and home_score == 0 and away_score == 0:
                home_score_db = None
                away_score_db = None
                status_db = "scheduled"
            else:
                home_score_db = home_score
                away_score_db = away_score
                status_db = "completed" if is_completed else "scheduled"

            # ...actualización de partido...
            if match_query.data:
                match = match_query.data[0]
                logger.info(f"Partido existente - DB: {match.get('home_score')}-{match.get('away_score')}, API: {home_score}-{away_score}")
                # Actualizar marcadores solo si son diferentes
                if (match.get('home_score') != home_score_db or match.get('away_score') != away_score_db):
                    update_data = {
                        "home_score": home_score_db,
                        "away_score": away_score_db,
                        "status": status_db,
                        "updated_at": now_str
                    }
                    if game_datetime:
                        update_data["game_date"] = game_datetime
                    logger.info(f"Actualizando partido ID {match['id']} con datos: {update_data}")
                    result = supabase.table("matches").update(update_data).eq("id", match['id']).execute()
                    logger.info(f"Resultado actualización: {result}")
                    matches_updated += 1
                    logger.info(f"Actualizado: {home_team_name} {home_score_db} - {away_score_db} {away_team_name} (Semana {week_num})")
                else:
                    logger.info(f"No necesita actualización: {home_team_name} vs {away_team_name} (marcadores iguales)")
            else:
                # Insertar nuevo partido
                insert_data = {
                    "season_id": season_id,
                    "week": week_num,
                    "home_team_id": home_team_id,
                    "away_team_id": away_team_id,
                    "game_date": game_datetime,
                    "home_score": home_score_db,
                    "away_score": away_score_db,
                    "status": status_db,
                    "game_type": "regular",
                    "created_at": now_str,
                    "updated_at": now_str
                }
                logger.info(f"INSERTING: {insert_data}")
                insert_result = supabase.table("matches").insert(insert_data).execute()
                logger.info(f"INSERT SUCCESS: {insert_result}")
                matches_inserted += 1
                logger.info(f"INSERTED: {home_team_name} vs {away_team_name} (Semana {week_param})")
        logger.info(f"COMPLETED - Actualizados: {matches_updated}, Insertados: {matches_inserted}")
        return {
            "matches_updated": matches_updated,
            "matches_inserted": matches_inserted,
            "status": "completed"
        }
    except Exception as e:
        logger.error(f"Error crítico durante la actualización: {e}")
        raise HTTPException(status_code=500, detail=f"Error crítico durante la actualización de partidos: {str(e)}")

@app.post("/set-current-week")
async def set_current_week():
    """
    Calcula y actualiza automáticamente la semana actual basándose en los partidos.
    La nueva semana comienza a las 00:00 del día siguiente después del último partido de la semana anterior.
    """
    try:
        # Obtener temporada activa
        season_query = supabase.table("seasons").select("*").eq("is_active", True).execute()
        if not season_query.data:
            raise HTTPException(status_code=404, detail="No hay temporada activa")
        
        current_season = season_query.data[0]
        season_id = current_season['id']
        now_cdmx = datetime.now(CDMX_TZ)
        
        # Obtener todos los partidos completados ordenados por semana descendente
        completed_matches_query = supabase.table("matches")\
            .select("week, game_date, status")\
            .eq("season_id", season_id)\
            .in_("status", ["completed", "final", "Final"])\
            .order("week", desc=True)\
            .order("game_date", desc=True)\
            .limit(100)\
            .execute()
        
        if not completed_matches_query.data:
            # No hay partidos completados, verificar si hay partidos programados
            scheduled_matches = supabase.table("matches")\
                .select("week, game_date, status")\
                .eq("season_id", season_id)\
                .eq("status", "scheduled")\
                .order("game_date", asc=False)\
                .limit(1)\
                .execute()
            
            if scheduled_matches.data:
                # Hay partidos programados, estamos en la semana del primer partido programado
                calculated_week = scheduled_matches.data[0]['week']
                logger.info(f"No hay partidos completados. Primera semana programada: {calculated_week}")
            else:
                # No hay partidos en absoluto
                calculated_week = 1
                logger.info("No hay partidos registrados, usando semana 1")
        else:
            # Hay partidos completados
            completed_matches = completed_matches_query.data
            
            # Encontrar la semana más alta completada
            max_completed_week = max(match['week'] for match in completed_matches)
            
            # Obtener el último partido de esa semana
            last_match_of_week = None
            for match in completed_matches:
                if match['week'] == max_completed_week:
                    if not last_match_of_week:
                        last_match_of_week = match
                    else:
                        match_date = datetime.fromisoformat(match['game_date'].replace('Z', '+00:00'))
                        current_last_date = datetime.fromisoformat(last_match_of_week['game_date'].replace('Z', '+00:00'))
                        if match_date > current_last_date:
                            last_match_of_week = match
            
            last_week = last_match_of_week['week']
            last_match_date = datetime.fromisoformat(last_match_of_week['game_date'].replace('Z', '+00:00'))
            last_match_date_cdmx = last_match_date.astimezone(CDMX_TZ)
            
            # Calcular medianoche del día siguiente al último partido
            midnight_next_day = (last_match_date_cdmx + timedelta(days=1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            
            logger.info(f"Última semana completada: {last_week}")
            logger.info(f"Último partido de semana {last_week}: {last_match_date_cdmx}")
            logger.info(f"Medianoche siguiente: {midnight_next_day}, Ahora: {now_cdmx}")
            
            if now_cdmx >= midnight_next_day:
                # Ya pasó medianoche después del último partido
                # Verificar si hay partidos de la siguiente semana
                next_week = last_week + 1
                next_week_matches = supabase.table("matches")\
                    .select("week")\
                    .eq("season_id", season_id)\
                    .eq("week", next_week)\
                    .limit(1)\
                    .execute()
                
                if next_week_matches.data:
                    calculated_week = next_week
                    logger.info(f"✅ Ya pasó medianoche, nueva semana: {calculated_week}")
                else:
                    # No hay más semanas, mantener la última
                    calculated_week = last_week
                    logger.info(f"No hay semana {next_week}, manteniendo semana {last_week}")
            else:
                # Aún no es medianoche, seguimos en la semana del último partido
                calculated_week = last_week
                logger.info(f"Aún no es medianoche, semana actual: {calculated_week}")
        
        # Limitar a max_weeks
        max_weeks = current_season.get('max_weeks', 18)
        calculated_week = min(calculated_week, max_weeks)
        
        # Actualizar en la base de datos
        supabase.table("seasons").update({
            "current_week": calculated_week
        }).eq("id", season_id).execute()
        
        logger.info(f"✅ Semana actual actualizada a: {calculated_week}")
        
        return {
            "current_week": calculated_week,
            "season_year": current_season['year'],
            "season_id": season_id,
            "updated": True,
            "timestamp": now_cdmx.isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error al actualizar la semana actual: {e}")
        raise HTTPException(status_code=500, detail=f"Error al actualizar la semana actual: {str(e)}")

@app.get("/current-week")
async def get_current_week():
    """
    Obtiene la semana actual de la temporada activa.
    Usa la misma lógica que set_current_week pero en modo solo lectura.
    """
    try:
        # Simplemente leer el valor de current_week de la temporada activa
        season_query = supabase.table("seasons").select("*").eq("is_active", True).execute()
        if not season_query.data:
            raise HTTPException(status_code=404, detail="No hay temporada activa")
        
        current_season = season_query.data[0]
        
        return {
            "current_week": current_season['current_week'],
            "season_year": current_season['year'],
            "season_id": current_season['id'],
            "timestamp": datetime.now(CDMX_TZ).isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error al obtener la semana actual: {e}")
        raise HTTPException(status_code=500, detail=f"Error al obtener la semana actual: {str(e)}")

@app.get("/test-env")
async def test_env():
    return {
        "supabase_url": SUPABASE_URL,
        "supabase_key_length": len(SUPABASE_KEY) if SUPABASE_KEY else 0,
        "rapidapi_key": RAPIDAPI_KEY[:10] + "..." if RAPIDAPI_KEY else "Not set",
        "base_url": BASE_URL,
        "rapidapi_host": RAPIDAPI_HOST,
        "has_supabase_url": bool(SUPABASE_URL and SUPABASE_URL != "https://your-supabase-url.supabase.co"),
        "has_supabase_key": bool(SUPABASE_KEY and SUPABASE_KEY != "your-supabase-key"),
        "has_rapidapi_key": bool(RAPIDAPI_KEY and len(RAPIDAPI_KEY) > 10)
    }

@app.get("/list-teams")
async def list_teams():
    """Lista todos los equipos en la base de datos"""
    try:
        teams_query = supabase.table("teams").select("id, name, city, abbreviation").execute()
        return {
            "teams_count": len(teams_query.data),
            "teams": teams_query.data
        }
    except Exception as e:
        logger.error(f"Error obteniendo equipos: {e}")
        return {"error": str(e)}

@app.get("/update-matches/{year}")
async def update_matches_by_year(year: int):
    """Actualiza partidos para un año específico"""
    try:
        if year < 2020 or year > 2030:
            raise HTTPException(status_code=400, detail="Año debe estar entre 2020 y 2030")
        
        url = f"{BASE_URL}/nfl-events"
        headers = {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST
        }
        params = {
            'year': year
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        return {
            "status": "success",
            "year": year,
            "events_found": len(data.get('events', [])),
            "leagues": data.get('leagues', []),
            "events_sample": data.get('events', [])[:3] if data.get('events') else []
        }
    except Exception as e:
        logger.error(f"Error getting NFL data for {year}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/test-api")
async def test_api():
    try:
        # Usar año actual para probar la nueva API
        test_year = datetime.now().year
        url = f"{BASE_URL}/nfl-events"
        headers = {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST
        }
        params = {
            'year': test_year
        }
        logger.info(f"Testing NFL API Data connectivity to: {url}")
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        return {
            "status": "success",
            "url": url,
            "status_code": response.status_code,
            "has_events": data.get('events') is not None,
            "events_count": len(data.get('events', [])) if data.get('events') else 0,
            "leagues_count": len(data.get('leagues', [])) if data.get('leagues') else 0,
            "sample_event": data.get('events', [{}])[0] if data.get('events') else {}
        }
    except Exception as e:
        logger.error(f"NFL API Data test failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "url": f"{BASE_URL}/nfl-events?year={datetime.now().year}"
        }

# --- LÓGICA DE ACTUALIZACIÓN DE PICKS Y ENTRIES ---
from collections import defaultdict

def update_picks_and_entries(supabase, season_id, week_num):
    """
    Actualiza los picks y las entradas en Supabase, calculando puntos, estado, streaks y estadísticas.
    """
    # Obtener todos los picks de la temporada hasta la semana actual
    picks_query = supabase.table("picks").select("* , entry_id").eq("season_id", season_id).lte("week", week_num).execute()
    picks = picks_query.data if picks_query.data else []
    entry_picks = defaultdict(list)
    for pick in picks:
        entry_picks[pick['entry_id']].append(pick)

    for entry_id, picks_list in entry_picks.items():
        # Obtener la entrada
        entry_query = supabase.table("entries").select("*").eq("id", entry_id).execute()
        if not entry_query.data:
            continue
        entry = entry_query.data[0]
        wins = losses = ties = 0
        current_streak = longest_streak = streak = 0
        last_result = None
        eliminated_week = None
        is_active = True
        status = entry.get('status', 'alive')
        for pick in sorted(picks_list, key=lambda p: int(p['week'])):
            result = pick.get('result')
            if result == 'W':
                wins += 1
                if last_result == 'W':
                    streak += 1
                else:
                    streak = 1
                last_result = 'W'
            elif result == 'L':
                losses += 1
                streak = 0
                last_result = 'L'
                if losses == 1 and status == 'alive':
                    status = 'last_chance'
                elif losses >= 2 or (status == 'last_chance' and losses > 1):
                    status = 'eliminated'
                    is_active = False
                    eliminated_week = pick['week']
            elif result == 'T':
                ties += 1
                streak = 0
                last_result = 'T'
            longest_streak = max(longest_streak, streak)
        current_streak = streak
        # Actualizar la entrada en Supabase
        update_data = {
            "total_wins": wins,
            "total_losses": losses,
            "longest_streak": longest_streak,
            "current_streak": current_streak,
            "is_active": is_active,
            "eliminated_week": eliminated_week,
            "status": status
        }
        supabase.table("entries").update(update_data).eq("id", entry_id).execute()
    return True

def update_entry_statistics(supabase, season_id):
    """
    Actualiza todas las estadísticas de las entradas basándose en los picks.
    Calcula: total_wins, total_losses, longest_streak, current_streak, status, eliminated_week
    """
    entries_updated = 0
    
    # Obtener todas las entradas de la temporada
    entries_query = supabase.table("entries").select("*").eq("season_id", season_id).execute()
    if not entries_query.data:
        return 0
    
    for entry in entries_query.data:
        entry_id = entry['id']
        
        # Obtener todos los picks de esta entrada ordenados por semana
        picks_query = supabase.table("picks").select("*").eq("entry_id", entry_id).eq("season_id", season_id).order("week").execute()
        picks = picks_query.data if picks_query.data else []
        
        # Calcular estadísticas
        total_wins = 0
        total_losses = 0
        current_streak = 0
        longest_streak = 0
        temp_streak = 0
        status = "alive"
        eliminated_week = None
        loss_count = 0
        
        for pick in picks:
            result = pick.get('result')
            week = pick.get('week')
            
            # Normalizar valores antiguos y nuevos
            if result in ['W', 'win']:
                total_wins += 1
                temp_streak += 1
                longest_streak = max(longest_streak, temp_streak)
            elif result in ['L', 'loss']:
                total_losses += 1
                loss_count += 1
                temp_streak = 0  # Reset streak on loss
                
                # Lógica de eliminación
                if loss_count == 1:
                    status = "last_chance"
                elif loss_count >= 2:
                    status = "eliminated"
                    eliminated_week = week
                    break  # No procesar más picks después de eliminación
            elif result in ['T', 'draw']:
                # Empate no afecta racha pero tampoco la resetea
                pass
            # Si result es None o 'pending', no afecta las estadísticas
        
        # Current streak es la racha actual (solo si la última decisión fue victoria)
        current_streak = 0
        if picks:
            # Contar victorias consecutivas desde el final
            for pick in reversed(picks):
                if pick.get('result') in ['W', 'win']:
                    current_streak += 1
                elif pick.get('result') in ['L', 'loss', 'T', 'draw']:
                    break
        
        # Actualizar la entrada
        update_data = {
            "total_wins": total_wins,
            "total_losses": total_losses,
            "longest_streak": longest_streak,
            "current_streak": current_streak,
            "status": status,
            "eliminated_week": eliminated_week,
            "is_active": status != "eliminated"
        }
        
        supabase.table("entries").update(update_data).eq("id", entry_id).execute()
        entries_updated += 1
        
        logger.info(f"Entry ID {entry_id}: W={total_wins}, L={total_losses}, "
                   f"Current Streak={current_streak}, Longest={longest_streak}, Status={status}")
    
    return entries_updated

# --- Actualización automática de picks según marcadores ---
@app.post("/auto-update-picks")
async def auto_update_picks():
    """
    Actualiza automáticamente el campo result y los puntos de los picks pendientes según el marcador del partido, y actualiza las entradas.
    """
    try:
        # Obtener temporada y semana actual
        season_query = supabase.table("seasons").select("*").eq("is_active", True).execute()
        if not season_query.data:
            raise HTTPException(status_code=404, detail="No hay temporada activa")
        current_season = season_query.data[0]
        season_id = current_season['id']
        week_num = current_season.get('current_week', 1)

        # Obtener todos los picks de la temporada actual hasta la semana actual, sin importar el valor de 'result'
        picks_query = supabase.table("picks").select("*, match_id, selected_team_id, entry_id, week, created_at").eq("season_id", season_id).lte("week", week_num).execute()
        picks = picks_query.data if picks_query.data else []
        updated_count = 0
        for pick in picks:
            match_id = pick['match_id']
            team_id = pick['selected_team_id']
            entry_id = pick['entry_id']
            week = pick['week']
            # Obtener el partido con la hora del partido
            match_query = supabase.table("matches").select("home_team_id, away_team_id, home_score, away_score, game_date").eq("id", match_id).execute()
            if not match_query.data:
                continue
            match = match_query.data[0]
            home_id = match['home_team_id']
            away_id = match['away_team_id']
            home_score = match['home_score']
            away_score = match['away_score']
            game_date = match.get('game_date')

            # Si no hay marcador, poner pick en 'pending'
            if home_score is None or away_score is None:
                if pick.get('result') != 'pending':
                    supabase.table("picks").update({
                        "result": "pending",
                        "points_earned": 0
                    }).eq("id", pick['id']).execute()
                    logger.info(f"Pick ID {pick['id']}: Partido sin marcador, resultado cambiado a 'pending'")
                continue

            # Calcular el multiplicador basado en las horas de anticipación
            multiplier = 0
            if game_date and pick.get('created_at'):
                # Convertir las fechas a UTC para comparación
                try:
                    if isinstance(game_date, str):
                        # Intentar primero formato ISO con 'T'
                        try:
                            match_time = datetime.strptime(game_date, "%Y-%m-%dT%H:%M:%S")
                        except ValueError:
                            # Si falla, intentar formato estándar
                            match_time = datetime.strptime(game_date, "%Y-%m-%d %H:%M:%S")
                    else:
                        match_time = game_date
                    match_time = pytz.utc.localize(match_time) if match_time.tzinfo is None else match_time

                    if isinstance(pick['created_at'], str):
                        # Intentar diferentes formatos de fecha
                        try:
                            # Formato ISO con microsegundos
                            pick_time = datetime.strptime(pick['created_at'], "%Y-%m-%dT%H:%M:%S.%f")
                        except ValueError:
                            try:
                                # Formato ISO sin microsegundos
                                pick_time = datetime.strptime(pick['created_at'], "%Y-%m-%dT%H:%M:%S")
                            except ValueError:
                                # Formato estándar
                                pick_time = datetime.strptime(pick['created_at'], "%Y-%m-%d %H:%M:%S")
                    else:
                        pick_time = pick['created_at']
                    pick_time = pytz.utc.localize(pick_time) if pick_time.tzinfo is None else pick_time

                    # Calcular horas de diferencia
                    time_diff = match_time - pick_time
                    hours_diff = time_diff.total_seconds() / 3600
                    
                    # Log para depuración
                    logger.info(f"Pick ID {pick['id']}: Pick time={pick_time}, Match time={match_time}, Hours diff={hours_diff:.2f}")
                    
                    # Lógica especial del multiplicador:
                    # - Si pick se hace DESPUÉS del partido (hours_diff <= 0): multiplier = 0
                    # - Si pick se hace minutos ANTES (0 < hours_diff < 1): multiplier = 1
                    # - Si pick se hace horas ANTES (hours_diff >= 1): multiplier = floor(hours_diff)
                    if hours_diff <= 0:
                        # Pick después del partido
                        multiplier = 0
                        logger.info(f"  → Pick made AFTER game: multiplier = 0")
                    elif hours_diff < 1:
                        # Pick minutos antes (0 < hours < 1)
                        multiplier = 1
                        logger.info(f"  → Pick made minutes before game: multiplier = 1")
                    else:
                        # Pick horas antes (hours >= 1)
                        multiplier = floor(hours_diff)
                        logger.info(f"  → Pick made {floor(hours_diff)} hours before game: multiplier = {multiplier}")
                except Exception as e:
                    logger.error(f"Error calculando multiplicador para pick {pick['id']}: {e}")
                    multiplier = 0

            # Determinar resultado
            if home_score > away_score:
                winner_id = home_id
            elif home_score < away_score:
                winner_id = away_id
            else:
                winner_id = None  # Empate

            # Calcular result
            if winner_id is None:
                result = 'T'
            elif team_id == winner_id:
                result = 'W'
            else:
                result = 'L'

            # Calcular puntos basados en el resultado y multiplicador
            if result == 'W':
                points_earned = int(1.0 * multiplier)
            elif result == 'T':
                points_earned = int(0.5 * multiplier)
            else:
                points_earned = 0

            # Actualizar pick con resultado y puntos
            supabase.table("picks").update({
                "result": result, 
                "points_earned": points_earned
            }).eq("id", pick['id']).execute()
            
            logger.info(f"Pick ID {pick['id']}: Resultado={result}, Horas de anticipación={multiplier}, " \
                      f"Puntos ganados={points_earned}, Semana={week}")
                      
            updated_count += 1
        # Actualizar estadísticas de entradas
        entries_updated = update_entry_statistics(supabase, season_id)
        return {
            "status": "success", 
            "picks_updated": updated_count, 
            "entries_updated": entries_updated,
            "detail": "Picks y entradas actualizados automáticamente"
        }
    except Exception as e:
        logger.error(f"Error en auto_update_picks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- ENDPOINTS ORQUESTADORES PARA CRON JOBS ---

@app.post("/daily-update")
async def daily_update():
    """
    Endpoint orquestador que se ejecuta diariamente a las 23:59.
    1. Actualiza partidos (update-matches)
    2. Si tiene éxito, actualiza picks automáticamente (auto-update-picks)
    
    Configurado en vercel.json para ejecutarse: 59 23 * * * (23:59 todos los días)
    """
    results = {
        "timestamp": datetime.now(pytz.timezone('America/Mexico_City')).isoformat(),
        "update_matches": None,
        "auto_update_picks": None,
        "status": "started"
    }
    
    try:
        logger.info("🔄 DAILY UPDATE: Iniciando actualización diaria")
        
        # Paso 1: Actualizar partidos
        logger.info("📊 DAILY UPDATE: Ejecutando update-matches")
        try:
            matches_result = await update_matches(body=UpdateMatchesRequest())
            results["update_matches"] = {
                "status": "success",
                "data": matches_result
            }
            logger.info(f"✅ DAILY UPDATE: update-matches completado - {matches_result}")
        except Exception as e:
            logger.error(f"❌ DAILY UPDATE: Error en update-matches - {e}")
            results["update_matches"] = {
                "status": "error",
                "error": str(e)
            }
            results["status"] = "partial_failure"
            # No continuar si falla update-matches
            return results
        
        # Paso 2: Actualizar picks (solo si update-matches tuvo éxito)
        logger.info("🎯 DAILY UPDATE: Ejecutando auto-update-picks")
        try:
            picks_result = await auto_update_picks()
            results["auto_update_picks"] = {
                "status": "success",
                "data": picks_result
            }
            logger.info(f"✅ DAILY UPDATE: auto-update-picks completado - {picks_result}")
            results["status"] = "completed"
        except Exception as e:
            logger.error(f"❌ DAILY UPDATE: Error en auto-update-picks - {e}")
            results["auto_update_picks"] = {
                "status": "error",
                "error": str(e)
            }
            results["status"] = "partial_failure"
        
        return results
        
    except Exception as e:
        logger.error(f"❌ DAILY UPDATE: Error crítico - {e}")
        results["status"] = "error"
        results["error"] = str(e)
        raise HTTPException(status_code=500, detail=f"Error en daily-update: {str(e)}")

@app.post("/update-weekly-odds-auto")
async def update_weekly_odds_auto():
    """
    Endpoint que actualiza las odds de la semana actual automáticamente.
    Obtiene la semana actual de la temporada activa y actualiza las odds.
    
    Configurado en vercel.json para ejecutarse: 0 5 * * * (5:00 AM todos los días)
    """
    try:
        logger.info("🎲 AUTO ODDS UPDATE: Iniciando actualización automática de odds")
        
        # Obtener temporada activa y semana actual
        season_query = supabase.table("seasons").select("*").eq("is_active", True).execute()
        if not season_query.data:
            raise HTTPException(status_code=404, detail="No hay temporada activa")
        
        current_season = season_query.data[0]
        current_week = current_season.get('current_week', 1)
        
        logger.info(f"🎲 AUTO ODDS UPDATE: Actualizando odds para semana {current_week}")
        
        # Ejecutar update-weekly-odds con la semana actual
        result = await update_weekly_odds(body=UpdateOddsRequest(week=current_week))
        
        logger.info(f"✅ AUTO ODDS UPDATE: Completado - {result}")
        
        return {
            "timestamp": datetime.now(pytz.timezone('America/Mexico_City')).isoformat(),
            "week": current_week,
            "season_id": current_season['id'],
            "season_year": current_season['year'],
            "result": result,
            "status": "completed"
        }
        
    except Exception as e:
        logger.error(f"❌ AUTO ODDS UPDATE: Error - {e}")
        raise HTTPException(status_code=500, detail=f"Error en update-weekly-odds-auto: {str(e)}")

# =====================================================
# ENDPOINT FINAL AUTO-PICKS - ASIGNAR PICKS A ENTRADAS SIN SELECCIÓN
# =====================================================

@app.post("/auto-assign-last-game-picks")
async def auto_assign_last_game_picks():
    """
    Endpoint que se ejecuta 5 minutos después de que el último partido de la semana comience.
    
    Lógica:
    1. Obtiene el último partido de la semana actual (por hora de inicio)
    2. Identifica todas las entradas que NO han hecho pick para esa semana
    3. Para cada entrada sin pick:
       a. Intenta asignar el equipo visitante (away_team) del último partido
       b. Si el equipo visitante ya fue usado en una semana anterior por esa entrada,
          asigna el PRIMER equipo que haya PERDIDO en una semana anterior
       c. Si ningún equipo ha perdido (entrada sin pérdidas), asigna el away_team de todas formas
    4. El pick se marca como automático con created_at = game_date (así multiplicador = 1)
    5. El pick se marca como 'auto_assigned' en un campo metadata para rastreo
    
    Multiplicador:
    - Como created_at = game_date, la diferencia es 0 horas
    - floor(0) = 0, pero necesitamos multiplicador = 1
    - Por eso se le da created_at = game_date - 1 minuto, así la diferencia es ~0.016 horas
    - floor(0.016) = 0, pero > 0 entonces multiplicador = 1
    """
    try:
        logger.info("🎯 AUTO ASSIGN PICKS: Iniciando asignación automática de picks")
        
        # Obtener temporada activa
        season_query = supabase.table("seasons").select("*").eq("is_active", True).execute()
        if not season_query.data:
            logger.error("No hay temporada activa")
            raise HTTPException(status_code=404, detail="No hay temporada activa")
        
        current_season = season_query.data[0]
        season_id = current_season['id']
        current_week = current_season.get('current_week', 1)
        
        logger.info(f"📅 Season ID: {season_id}, Week: {current_week}")
        
        # PASO 1: Obtener el último partido de la semana (por hora de inicio)
        matches_query = supabase.table("matches").select(
            "id, home_team_id, away_team_id, game_date, week"
        ).eq("season_id", season_id).eq("week", current_week).order("game_date", desc=True).limit(1).execute()
        
        if not matches_query.data:
            logger.warning(f"No hay partidos registrados para la semana {current_week}")
            return {
                "status": "no_matches",
                "message": f"No hay partidos para la semana {current_week}",
                "picks_assigned": 0
            }
        
        last_match = matches_query.data[0]
        last_match_id = last_match['id']
        away_team_id = last_match['away_team_id']
        game_date = last_match['game_date']
        
        logger.info(f"🏈 Last match of week: ID={last_match_id}, Away team={away_team_id}, Game time={game_date}")
        
        # PASO 2: Obtener todas las entradas activas de esta semana que NO tengan pick
        # Primero, obtener todos los entry_ids que YA tienen pick para esta semana
        existing_picks_query = supabase.table("picks").select(
            "entry_id"
        ).eq("season_id", season_id).eq("week", current_week).execute()
        
        entry_ids_with_picks = set([p['entry_id'] for p in existing_picks_query.data]) if existing_picks_query.data else set()
        logger.info(f"Entradas con picks en semana {current_week}: {len(entry_ids_with_picks)}")
        
        # Obtener todas las entradas activas
        all_entries_query = supabase.table("entries").select(
            "id, user_id"
        ).eq("season_id", season_id).eq("is_active", True).execute()
        
        if not all_entries_query.data:
            logger.warning("No hay entradas activas")
            return {
                "status": "no_entries",
                "message": "No hay entradas activas",
                "picks_assigned": 0
            }
        
        entries_without_picks = [e for e in all_entries_query.data if e['id'] not in entry_ids_with_picks]
        logger.info(f"Entradas SIN pick en semana {current_week}: {len(entries_without_picks)}")
        
        if not entries_without_picks:
            logger.info("Todas las entradas tienen pick para esta semana")
            return {
                "status": "all_have_picks",
                "message": "Todas las entradas ya tienen pick",
                "picks_assigned": 0
            }
        
        # PASO 3: Asignar picks automáticamente
        picks_assigned = 0
        assignment_details = []
        
        for entry in entries_without_picks:
            entry_id = entry['id']
            logger.info(f"\n📌 Processing entry {entry_id}")
            
            # Obtener todos los equipos usados por esta entrada en semanas anteriores
            used_teams_query = supabase.table("picks").select(
                "selected_team_id"
            ).eq("entry_id", entry_id).neq("week", current_week).execute()
            
            used_team_ids = set([p['selected_team_id'] for p in used_teams_query.data]) if used_teams_query.data else set()
            logger.info(f"   Teams previously used: {used_team_ids}")
            
            # Determinar qué equipo asignar
            assigned_team_id = away_team_id
            assignment_reason = "away_team_default"
            
            # Si el away_team ya fue usado, buscar un equipo que haya perdido
            if away_team_id in used_team_ids:
                logger.info(f"   Away team {away_team_id} ya fue usado, buscando equipo que perdió...")
                
                # Obtener picks perdedores de esta entrada en semanas anteriores
                lost_picks_query = supabase.table("picks").select(
                    "selected_team_id, week"
                ).eq("entry_id", entry_id).eq("result", "L").execute()
                
                if lost_picks_query.data:
                    # Tomar el primer equipo que perdió
                    assigned_team_id = lost_picks_query.data[0]['selected_team_id']
                    lost_week = lost_picks_query.data[0]['week']
                    assignment_reason = f"lost_team_from_week_{lost_week}"
                    logger.info(f"   Asignando team {assigned_team_id} que perdió en semana {lost_week}")
                else:
                    logger.info(f"   Sin equipos que hayan perdido, manteniendo away_team {away_team_id}")
                    assignment_reason = "away_team_no_losses"
            
            # PASO 4: Crear el pick automático
            # La clave es que created_at < game_date por 1 minuto, para que el multiplicador sea 1
            game_datetime = datetime.fromisoformat(game_date.replace('Z', '+00:00')) if isinstance(game_date, str) else game_date
            pick_datetime = game_datetime - timedelta(minutes=1)  # 1 minuto antes
            
            pick_data = {
                "entry_id": entry_id,
                "match_id": last_match_id,
                "selected_team_id": assigned_team_id,
                "week": current_week,
                "season_id": season_id,
                "confidence": 0,  # Auto-assigned
                "result": "pending",
                "created_at": pick_datetime.isoformat(),
                "metadata": {
                    "auto_assigned": True,
                    "reason": assignment_reason,
                    "assigned_at": datetime.now(pytz.timezone('America/Mexico_City')).isoformat()
                }
            }
            
            try:
                insert_result = supabase.table("picks").insert(pick_data).execute()
                if insert_result.data:
                    picks_assigned += 1
                    assignment_details.append({
                        "entry_id": entry_id,
                        "team_id": assigned_team_id,
                        "reason": assignment_reason,
                        "match_id": last_match_id,
                        "week": current_week,
                        "status": "success"
                    })
                    logger.info(f"   ✅ Pick asignado a entry {entry_id}: team {assigned_team_id} ({assignment_reason})")
                else:
                    logger.error(f"   ❌ Error insertando pick para entry {entry_id}")
                    assignment_details.append({
                        "entry_id": entry_id,
                        "status": "error",
                        "message": "Insert failed"
                    })
            except Exception as e:
                logger.error(f"   ❌ Exception asignando pick a entry {entry_id}: {e}")
                assignment_details.append({
                    "entry_id": entry_id,
                    "status": "error",
                    "message": str(e)
                })
        
        logger.info(f"\n✅ AUTO ASSIGN PICKS COMPLETADO: {picks_assigned} picks asignados")
        
        return {
            "status": "completed",
            "timestamp": datetime.now(pytz.timezone('America/Mexico_City')).isoformat(),
            "week": current_week,
            "season_id": season_id,
            "last_match_id": last_match_id,
            "picks_assigned": picks_assigned,
            "total_entries_without_picks": len(entries_without_picks),
            "assignments": assignment_details
        }
        
    except Exception as e:
        logger.error(f"❌ AUTO ASSIGN PICKS ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Error en auto-assign-last-game-picks: {str(e)}")

@app.get("/get-auto-assign-schedule")
async def get_auto_assign_schedule():
    """
    Devuelve cuándo debe ejecutarse el auto-assign-last-game-picks.
    Retorna la fecha/hora del último partido + 5 minutos.
    
    Usado por GitHub Actions para programar dinámicamente la ejecución.
    """
    try:
        logger.info("🕐 GET SCHEDULE: Calculando tiempo de ejecución")
        
        # Obtener temporada activa
        season_query = supabase.table("seasons").select("*").eq("is_active", True).execute()
        if not season_query.data:
            raise HTTPException(status_code=404, detail="No hay temporada activa")
        
        current_season = season_query.data[0]
        season_id = current_season['id']
        current_week = current_season.get('current_week', 1)
        
        # Obtener el último partido de la semana
        matches_query = supabase.table("matches").select(
            "id, home_team_id, away_team_id, game_date, week, status"
        ).eq("season_id", season_id).eq("week", current_week).order("game_date", desc=True).limit(1).execute()
        
        if not matches_query.data:
            return {
                "status": "no_matches",
                "message": f"No hay partidos para la semana {current_week}",
                "should_execute": False,
                "execution_time": None
            }
        
        last_match = matches_query.data[0]
        game_date_str = last_match['game_date']
        
        # Parsear game_date y agregar 5 minutos
        try:
            if isinstance(game_date_str, str):
                try:
                    game_dt = datetime.strptime(game_date_str, "%Y-%m-%dT%H:%M:%S")
                except ValueError:
                    game_dt = datetime.strptime(game_date_str, "%Y-%m-%d %H:%M:%S")
            else:
                game_dt = game_date_str
            
            # Localizar a CDMX timezone
            game_dt = CDMX_TZ.localize(game_dt) if game_dt.tzinfo is None else game_dt.astimezone(CDMX_TZ)
            
            # Agregar 5 minutos
            execution_time = game_dt + timedelta(minutes=5)
            now_cdmx = datetime.now(CDMX_TZ)
            
            # Determinar si ya pasó el tiempo de ejecución
            should_execute_now = now_cdmx >= execution_time
            minutes_until_execution = (execution_time - now_cdmx).total_seconds() / 60
            
            return {
                "status": "scheduled",
                "season_id": season_id,
                "current_week": current_week,
                "last_match_id": last_match['id'],
                "game_start_time": game_dt.isoformat(),
                "execution_time": execution_time.isoformat(),
                "execution_time_utc": execution_time.astimezone(pytz.utc).isoformat(),
                "current_time": now_cdmx.isoformat(),
                "should_execute_now": should_execute_now,
                "minutes_until_execution": round(minutes_until_execution, 2),
                "match_status": last_match.get('status', 'unknown')
            }
            
        except Exception as e:
            logger.error(f"Error parseando fecha: {e}")
            raise HTTPException(status_code=500, detail=f"Error parseando fecha: {str(e)}")
        
    except Exception as e:
        logger.error(f"❌ GET SCHEDULE ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo schedule: {str(e)}")

# Para Vercel, el objeto app es el handler
# Vercel automáticamente detecta FastAPI y lo ejecuta
