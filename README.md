# 🏈 Chori Survivor - NFL Survivor Pool

Una aplicación web completa para administrar un **NFL Survivor Pool** con sistema de puntos, múltiples entradas por jugador, y automatización total de partidos y asignaciones.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación y Configuración](#instalación-y-configuración)
- [Automatizaciones](#automatizaciones)
- [Reglas del Juego](#reglas-del-juego)
- [Despliegue](#despliegue)
- [API Endpoints](#api-endpoints)

## ✨ Características

### Para Jugadores
- 🎯 **Múltiples Entradas**: Cada jugador puede tener varias entradas independientes
- 📊 **Dos Pools de Competencia**:
  - **Pool Principal**: Último sobreviviente gana el premio mayor
  - **Pool Last Chance**: Competencia por puntos para jugadores eliminados
- ⏰ **Sistema de Puntos por Anticipación**: Mientras más temprano hagas tu pick, más puntos ganas
- 📱 **Diseño Responsive**: Funciona perfectamente en móvil, tablet y desktop
- 🔄 **Cambios de Picks Flexibles**: Cambia tu selección antes de que inicie el partido
- 📈 **Estadísticas y Tendencias**: Visualiza tendencias de victorias, derrotas y picks más populares
- 🏆 **Rankings en Tiempo Real**: Tabla de clasificación actualizada automáticamente
- 📜 **Historial Completo**: Revisa todos tus picks y resultados de semanas anteriores

### Para Administradores
- 👨‍💼 **Panel de Administración**: Control total del pool
- 🎟️ **Sistema de Tokens**: Genera y administra tokens de activación
- 👀 **Visualización de Picks**: Ver todas las selecciones de los jugadores
- 📊 **Gestión de Temporadas**: Control de semanas y estadísticas
- ⚙️ **Automatización Total**: Workflows para actualizar partidos, odds y asignaciones

## 🛠️ Tecnologías

### Frontend
- **React 18** con TypeScript
- **Material-UI (MUI)**: Componentes de interfaz
- **Vite**: Build tool y dev server
- **Recharts**: Visualización de datos
- **React Router**: Navegación

### Backend
- **FastAPI**: Framework Python para API REST
- **Supabase**: Base de datos PostgreSQL + Auth + Storage
- **NFL RapidAPI**: Datos en tiempo real de partidos NFL
- **pytz**: Manejo de zonas horarias (CDMX)

### Automatización
- **GitHub Actions**: Workflows programados (cron jobs)
- **Vercel**: Hosting del backend y frontend

### Seguridad
- **Supabase Auth**: Autenticación JWT
- **RLS (Row Level Security)**: Políticas de seguridad a nivel de base de datos
- **GitHub Secrets**: Gestión segura de credenciales

## 📁 Estructura del Proyecto

```
ChoriSurvivor/
├── api/                          # Backend FastAPI
│   ├── index.py                  # Endpoints principales
│   └── README.md                 # Documentación de API
├── .github/workflows/            # Automatizaciones
│   ├── auto-assign-weekly.yml    # Asignación automática semanal
│   └── nfl-cron-jobs.yml         # Jobs de actualización NFL
├── src/                          # Frontend React
│   ├── components/               # Componentes reutilizables
│   │   ├── admin/               # Componentes de administración
│   │   ├── layout/              # Layout principal
│   │   └── ui/                  # Componentes UI compartidos
│   ├── pages/                    # Páginas de la aplicación
│   │   ├── Dashboard.tsx        # Panel principal
│   │   ├── Matches.tsx          # Partidos de la semana
│   │   ├── Picks.tsx            # Hacer picks
│   │   ├── Ranking.tsx          # Tabla de clasificación
│   │   ├── History.tsx          # Historial de picks
│   │   ├── Trends.tsx           # Tendencias y estadísticas
│   │   ├── Profile.tsx          # Perfil de usuario
│   │   └── Rules.tsx            # Reglas del juego
│   ├── services/                 # Servicios y lógica de negocio
│   │   ├── api.ts               # Cliente API
│   │   ├── supabase.ts          # Cliente Supabase
│   │   ├── emailService.ts      # Envío de emails
│   │   └── trendsService.ts     # Análisis de tendencias
│   ├── contexts/                 # Context providers
│   │   └── AuthContext.tsx      # Contexto de autenticación
│   └── types/                    # Definiciones TypeScript
├── public/assets/logos/          # Logos de equipos NFL
├── package.json                  # Dependencias frontend
├── requirements.txt              # Dependencias backend
└── vercel.json                   # Configuración Vercel
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ y npm
- Python 3.9+
- Cuenta en Supabase
- API Key de NFL RapidAPI
- Cuenta en Vercel (para despliegue)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/GerryPetrucci/chori-survivor-react.git
cd chori-survivor-react
```

### 2. Configurar Frontend
```bash
npm install
```

Crear archivo `.env` en la raíz:
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 3. Configurar Backend
```bash
pip install -r requirements.txt
```

Variables de entorno necesarias (configurar en Vercel):
```env
SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NFL_API_KEY=tu_rapidapi_key
RESEND_API_KEY=tu_resend_api_key (opcional)
```

### 4. Configurar Base de Datos Supabase

Crear las siguientes tablas:
- `users`: Información de usuarios
- `entries`: Entradas de jugadores
- `seasons`: Temporadas NFL
- `teams`: Equipos NFL
- `matches`: Partidos de la temporada
- `picks`: Selecciones de jugadores
- `weekly_odds`: Odds de partidos
- `team_records`: Récords semanales de equipos
- `activation_tokens`: Tokens de activación

### 5. Ejecutar en Desarrollo

**Frontend:**
```bash
npm run dev
```

**Backend (local):**
```bash
cd api
uvicorn index:app --reload
```

## ⚙️ Automatizaciones

### Workflows de GitHub Actions

#### 1. **NFL Cron Jobs** (`nfl-cron-jobs.yml`)
Ejecuta múltiples tareas automatizadas:

- **Set Current Week** - Lunes 00:00 CDMX
  - Actualiza la semana actual de la temporada NFL
  
- **Update Matches** - Lunes a Sábado 00:00, Domingo cada 5 min (09:00-22:00 CDMX)
  - Actualiza información de partidos (horarios, scores, estado)
  
- **Update Weekly Odds** - Martes 18:00 CDMX
  - Actualiza las probabilidades de victoria de cada equipo
  
- **Auto-Assign Last Game** - Lunes 00:00 CDMX
  - Asigna picks automáticamente a jugadores que no eligieron
  
- **Save Weekly Team Records** - Martes 03:00 CDMX
  - Guarda los récords (W-L-T) de todos los equipos

#### 2. **Auto-Assign Weekly** (`auto-assign-weekly.yml`)
Sistema inteligente de asignación automática:

- **Schedule Check** - Lunes 17:00 CDMX
  - Verifica cuándo es el último partido de la semana NFL
  - Programa la ejecución de auto-assign dinámicamente
  
- **Auto-Assign Execution** - Hora programada dinámicamente
  - Asigna picks a entradas sin selección
  - Reglas de asignación:
    1. Intenta asignar equipo VISITANTE del último partido
    2. Si no es elegible, asigna equipo PERDEDOR al azar
  
- **Auto-Update Picks** - 2 minutos después de auto-assign
  - Actualiza estados de los picks asignados

### Configuración de Secrets en GitHub

Agregar en Settings → Secrets and variables → Actions:

```
VERCEL_DOMAIN=tu-dominio.vercel.app
```

## 🎮 Reglas del Juego

### Conceptos Básicos
- Un jugador puede tener **múltiples entradas** independientes
- Cada entrada selecciona **un equipo por semana**
- **No puedes repetir** equipos durante toda la temporada
- Si tu equipo **pierde**, quedas eliminado del Pool Principal

### Los Dos Pools

#### 💚 Pool Principal (Alives)
- **Objetivo**: Ser el último jugador vivo
- **Premio**: El más grande del pool
- **Victoria**: Último superviviente gana
- **Ejemplo**: Si después de la semana 10 solo queda 1 jugador vivo, gana el premio principal

#### 🧡 Pool Last Chance
- **Objetivo**: Obtener la mayor puntuación
- **Premio**: Más pequeño que el principal
- **Victoria**: Entrada con más puntos gana
- **Participantes**: Todos los jugadores, especialmente los eliminados del Pool Principal

### Sistema de Puntuación

**⏰ La Anticipación Premia**
- Las **horas antes** de que escojas tu pick serán el **multiplicador**
- Ejemplo: Pick 24 horas antes + Equipo gana = **24 puntos**

**💔 Penalización por Pérdida**
- Cuando pierdes: **-300 puntos**

**🏆 Criterios de Desempate** (Pool Principal)
1. Mayor puntuación total
2. Más equipos visitantes ganadores
3. División del premio en partes iguales

### Asignación Automática ⚠️

Si NO eliges pick antes del último partido de la semana:

1. **Primera opción**: Equipo VISITANTE del último partido (si es elegible)
2. **Segunda opción**: Equipo PERDEDOR al azar (si visitante no es elegible)
3. **Resultado**: DERROTA AUTOMÁTICA 💀

**💡 Consejo**: ¡Siempre haz tu pick a tiempo!

## 🌐 Despliegue

### Vercel (Recomendado)

1. Conectar repositorio de GitHub a Vercel
2. Configurar variables de entorno
3. Desplegar automáticamente en cada push a `main`

### Variables de Entorno en Vercel

```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# APIs
NFL_API_KEY=tu_rapidapi_key
RESEND_API_KEY=tu_resend_api_key

# Frontend
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## 📡 API Endpoints

Ver documentación completa en [`api/README.md`](./api/README.md)

### Principales Endpoints

#### Temporadas y Semanas
- `GET /api/current-week` - Obtener semana actual
- `POST /api/set-current-week` - Establecer semana actual

#### Partidos
- `POST /api/update-matches` - Actualizar partidos desde NFL API
- `POST /api/update-weekly-odds-auto` - Actualizar odds semanales

#### Picks
- `POST /api/auto-assign-last-game-picks` - Asignación automática
- `POST /api/auto-update-picks` - Actualizar estado de picks

#### Estadísticas
- `POST /api/save-weekly-team-records?year=2024&week=1` - Guardar récords

#### Programación
- `POST /api/schedule-weekly-auto-assign` - Programar auto-assign dinámico

## 👥 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: Amazing Feature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y está destinado para uso personal del grupo de amigos.

## 🙏 Agradecimientos

- **NFL RapidAPI** por los datos en tiempo real
- **Supabase** por la infraestructura backend
- **Material-UI** por los componentes de interfaz
- A todos los participantes del pool 🏈🍻

---

**¡Que tengas suerte en tus picks! 🍀🏆**
