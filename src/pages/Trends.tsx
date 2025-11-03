// Componente personalizado para el tick del eje X que muestra el logo del equipo
const TeamLogoTick = ({ x, y, payload, ...rest }: any) => {
  // trendsData y getTeamLogo deben estar en scope, así que se pasan como props o se accede por closure
  // Aquí asumimos que payload.value es la abreviación
  // Buscar el equipo por la abreviación
  if (!rest.trendsData || !rest.getTeamLogo) return null;
  const team = rest.trendsData.pickDistribution.find((t: any) => t.team_abbreviation === payload.value);
  if (!team) return null;
  return (
    <image
      href={rest.getTeamLogo(team.logo_url)}
      x={x - 12}
      y={y + 6}
      width={24}
      height={24}
      style={{ borderRadius: '50%' }}
    />
  );
};
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InsightsIcon from '@mui/icons-material/Insights';
import WarningIcon from '@mui/icons-material/Warning';
import { TrendsService, type TrendsData } from '../services/trendsService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

// Define the color palette
const colorPalette = ['#764ba2', '#667eea', '#d875e6'];

// Function to assign random colors without repetition
const getRandomColors = (count: number): string[] => {
  const shuffled = [...colorPalette].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Example usage: Assign colors to charts
const chartColors = getRandomColors(3); // Adjust count based on the number of data series

const Trends: React.FC = () => {
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState<string>('all');  // Inicia en 'all', luego se actualiza a la semana actual
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);

  useEffect(() => {
    loadTrendsData('current'); // Cargar datos de la semana actual al inicio
  }, []);

  const loadTrendsData = async (week?: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Cargando datos de tendencias para semana:', week || selectedWeek);
      
      const targetWeek = week || selectedWeek;
      // Si es 'all', no pasar semana (undefined), si es 'current', undefined para que use la semana actual, si es número, convertir a número
      const weekParam = targetWeek === 'all' || targetWeek === 'current' ? undefined : parseInt(targetWeek);
      
      const result = await TrendsService.getAllTrendsData(weekParam);
      console.log('📊 Resultado de TrendsService:', result);
      
      if (result.error) {
        console.error('❌ Error en TrendsService:', result.error);
        setError(typeof result.error === 'string' ? result.error : result.error.message || 'Error al cargar datos');
        return;
      }
      
      if (result.data) {
        console.log('✅ Datos de tendencias cargados:', result.data);
        setTrendsData(result.data);
        // Actualizar semanas disponibles si están en los datos
        if (result.data.availableWeeks) {
          setAvailableWeeks(result.data.availableWeeks);
        }
        // Si era 'current', actualizar al número de semana real
        if (targetWeek === 'current') {
          const currentWeek = result.data.currentSeason?.current_week;
          if (currentWeek) {
            setSelectedWeek(currentWeek.toString());
          }
        }
      } else {
        console.log('⚠️ No se recibieron datos');
        setError('No se encontraron datos de tendencias');
      }
    } catch (err) {
      console.error('💥 Error inesperado al cargar tendencias:', err);
      setError('Error inesperado al cargar los datos de tendencias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar semanas disponibles al inicio
    const loadAvailableWeeks = async () => {
      try {
        const { weeks } = await TrendsService.getAvailableWeeks();
        setAvailableWeeks(weeks || []);
      } catch (error) {
        console.error('Error loading available weeks:', error);
      }
    };
    
    loadAvailableWeeks();
    loadTrendsData(); // Cargar datos iniciales
  }, []); // Solo al montar el componente

  const handleWeekChange = (event: SelectChangeEvent<string>) => {
    const newWeek = event.target.value;
    setSelectedWeek(newWeek);
    loadTrendsData(newWeek); // Recargar datos inmediatamente
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Función para obtener el logo del equipo basado en su abreviación o nombre
  const getTeamLogo = (logoUrl?: string): string => {
    if (logoUrl) {
      return logoUrl.startsWith('/assets/') ? logoUrl : `/assets${logoUrl}`;
    }

    return '/assets/logos/nfl_logo.png'; // Fallback
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {typeof error === 'string' ? error : 'Error al cargar los datos de tendencias'}
        </Alert>
      </Box>
    );
  }

  if (!trendsData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No hay datos de tendencias disponibles</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: 1200, 
      mx: 'auto',
      px: { xs: 1, sm: 2, md: 3 },
      py: { xs: 1, sm: 2 }
    }}>
      {/* Header con gradiente */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: { xs: 2, sm: 3 },
          p: { xs: 2, sm: 3 },
          mb: { xs: 2, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }, flexWrap: 'wrap', justifyContent: 'center' }}>
          <InsightsIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }} />
          Análisis de Tendencias
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Descubre patrones y estadísticas del survivor pool
        </Typography>
      </Box>

      {/* Contenedor principal con Tabs */}
      <Paper sx={{ 
        p: { xs: 1, sm: 2, md: 3 }, 
        mt: { xs: 2, sm: 3 }, 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Controles superiores */}
        <Box sx={{ 
          p: { xs: 1, sm: 2 }, 
          display: 'flex', 
          justifyContent: { xs: 'center', sm: 'flex-end' }, 
          borderBottom: 1, 
          borderColor: 'divider', 
          flexWrap: 'wrap', 
          gap: 1 
        }}>
          <FormControl sx={{ minWidth: { xs: 120, sm: 150, md: 200 } }} size="small">
            <InputLabel id="week-select-label">Semana</InputLabel>
            <Select
              labelId="week-select-label"
              id="week-select"
              value={selectedWeek}
              label="Semana"
              onChange={handleWeekChange}
            >
              <MenuItem value="all">Todas las Semanas</MenuItem>
              {/* Mostrar semanas ordenadas ascendentemente */}
              {[...availableWeeks].sort((a, b) => a - b).map((week) => (
                <MenuItem key={week} value={week.toString()}>
                  Semana {week}
                </MenuItem>
              ))}
              {/* Agregar semana 7 como opción por defecto si no está en available weeks */}
              {!availableWeeks.includes(7) && (
                <MenuItem value="7">Semana 7</MenuItem>
              )}
            </Select>
          </FormControl>
        </Box>

        {/* Tabs de navegación */}
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider', 
            minHeight: { xs: 40, sm: 48 },
            '& .MuiTab-root': {
              fontSize: { xs: '0.65rem', sm: '0.875rem' },
              minWidth: { xs: 60, sm: 120 },
              px: { xs: 0.5, sm: 2 },
              py: { xs: 1, sm: 1.5 }
            }
          }}
        >
          <Tab label="Estadísticas" {...a11yProps(0)} />
          <Tab label="Distribución" {...a11yProps(1)} />
          <Tab label="Tendencias" {...a11yProps(2)} />
          <Tab label="Riesgo" {...a11yProps(3)} />
        </Tabs>

        {/* Contenido de las tabs */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Equipos Más Populares
          </Typography>
          <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: { xs: 300, sm: 650 } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Equipo</TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Picks</TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>Récord</TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>Popularidad</TableCell>
                  <TableCell align="right">Éxito</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trendsData.teamStats.slice(0, 10).map((team) => (
                  <TableRow key={team.team_id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
                        <img
                          src={getTeamLogo(team.logo_url)} // Usar solo logo_url
                          alt={team.team_name}
                          style={{ width: 24, height: 24, borderRadius: '50%' }}
                        />
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {team.team_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{team.pick_count}</TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Chip 
                        label={`${team.win_count}-${team.loss_count}-${team.tie_count}`}
                        size="small"
                        color={team.win_count > team.loss_count ? 'success' : team.win_count === team.loss_count ? 'warning' : 'error'}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <LinearProgress
                          variant="determinate"
                          value={(team.pick_count / Math.max(...trendsData.teamStats.map(t => t.pick_count))) * 100}
                          sx={{ width: 60, mr: 1 }}
                        />
                        {((team.pick_count / Math.max(...trendsData.teamStats.map(t => t.pick_count))) * 100).toFixed(1)}%
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${team.win_rate.toFixed(1)}%`}
                        color={team.win_rate >= 70 ? 'success' : team.win_rate >= 50 ? 'warning' : 'error'}
                        size="small"
                        sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

            <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Distribución de Picks por Equipo
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {trendsData.selectedWeek ? `Semana ${trendsData.selectedWeek}` : 'Todas las Semanas'}
        </Typography>
        {trendsData.pickDistribution && trendsData.pickDistribution.length > 0 ? (
          <Box sx={{ width: '100%', height: { xs: 300, sm: 350, md: 400 } }}>
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendsData.pickDistribution.map(team => ({
              ...team,
              // Preferir el loss_count calculado en backend; si no existe, usar fallback solo cuando win_count esté definido
              loss_count: team.loss_count !== undefined ? team.loss_count : (team.win_count !== undefined ? team.pick_count - team.win_count : undefined)
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="team_abbreviation"
                style={{ fontSize: '12px' }}
                tick={
                  <TeamLogoTick trendsData={trendsData} getTeamLogo={getTeamLogo} />
                }
                interval={0}
                height={48}
              />
              <YAxis style={{ fontSize: '12px' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '14px' }} />
              <Bar
                dataKey="pick_count"
                fill={chartColors[0]}
                name="Total de Picks"
              />
              {trendsData.pickDistribution.some(team => team.win_count !== undefined) && (
                <>
                  <Bar
                    dataKey="win_count"
                    fill={chartColors[1]}
                    name="Picks Correctos"
                  />
                  <Bar
                    dataKey="loss_count"
                    fill={chartColors[2]}
                    name="Picks Incorrectos"
                  />
                </>
              )}
            </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Alert severity="info">
            No hay datos de distribución de picks para {trendsData.selectedWeek ? `la semana ${trendsData.selectedWeek}` : 'las semanas seleccionadas'}
          </Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Tendencias de Actividad Semanal
        </Typography>
        <Box sx={{ width: '100%', height: { xs: 300, sm: 350, md: 400 } }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendsData.weeklyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" style={{ fontSize: '12px' }} />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Area
              type="monotone"
              dataKey="pick_count"
              stroke={chartColors[0]} // Usar el primer color aleatorio
              fill={chartColors[0]}
              name="Total de Picks"
            />
            <Area
              type="monotone"
              dataKey="win_count"
              stroke={chartColors[1]} // Usar el segundo color aleatorio
              fill={chartColors[1]}
              name="Picks Correctos"
            />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Análisis de Riesgo por Equipos
        </Typography>
          <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: { xs: 300, sm: 650 } }}>
            <TableHead>
              <TableRow>
                <TableCell>Equipo</TableCell>
                <TableCell align="right">Éxito</TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Picks</TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Riesgo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trendsData.teamStats
                .filter(team => team.pick_count >= 3)
                .sort((a, b) => b.win_rate - a.win_rate)
                .map((team) => {
                  const riskLevel = team.win_rate >= 70 ? 'low' : team.win_rate >= 50 ? 'medium' : 'high';
                  const riskColor = riskLevel === 'low' ? 'success' : riskLevel === 'medium' ? 'warning' : 'error';
                  const riskIcon = riskLevel === 'low' ? <TrendingUpIcon fontSize="small" /> : riskLevel === 'medium' ? <InsightsIcon fontSize="small" /> : <WarningIcon fontSize="small" />;
                  
                  return (
                    <TableRow key={team.team_id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
                          <img
                            src={getTeamLogo(team.logo_url)} // Usar solo logo_url
                            alt={team.team_name}
                            style={{ width: 24, height: 24, borderRadius: '50%' }}
                          />
                          <Box>
                            <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {team.team_name}
                            </Typography>
                            <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                {team.pick_count} picks
                              </Typography>
                              {riskIcon}
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${team.win_rate.toFixed(1)}%`}
                          color={riskColor}
                          size="small"
                          sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{team.pick_count}</TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {riskIcon}
                          <Typography variant="body2" sx={{ ml: 1, textTransform: 'capitalize' }}>
                            {riskLevel === 'low' ? 'Bajo' : riskLevel === 'medium' ? 'Medio' : 'Alto'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>
      </Paper>
    </Box>
  );
};

export default Trends;
