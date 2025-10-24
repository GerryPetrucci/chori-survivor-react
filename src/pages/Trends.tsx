import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
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
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
        <Box sx={{ p: 3 }}>
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


const Trends: React.FC = () => {
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState<string>('7'); // '7' por defecto, 'all' para todas las semanas
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);

  useEffect(() => {
    loadTrendsData();
  }, []);

  const loadTrendsData = async (week?: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Cargando datos de tendencias para semana:', week || selectedWeek);
      
      const targetWeek = week || selectedWeek;
      // Si es 'all', no pasar semana (undefined), si es número, convertir a número
      const weekParam = targetWeek === 'all' ? undefined : parseInt(targetWeek);
      
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <InsightsIcon sx={{ mr: 2 }} />
          Análisis de Tendencias
        </Typography>
        
        <FormControl sx={{ minWidth: 200 }}>
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

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="trends tabs">
          <Tab label="Estadísticas de Equipos" {...a11yProps(0)} />
          <Tab label="Distribución de Picks" {...a11yProps(1)} />
          <Tab label="Tendencias Semanales" {...a11yProps(2)} />
          <Tab label="Análisis de Riesgo" {...a11yProps(3)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Equipos Más Populares
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Equipo</TableCell>
                      <TableCell align="right">Picks</TableCell>
                      <TableCell align="right">Récord (W-L-T)</TableCell>
                      <TableCell align="right">Popularidad</TableCell>
                      <TableCell align="right">Tasa de Éxito</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trendsData.teamStats.slice(0, 10).map((team) => (
                      <TableRow key={team.team_id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {team.logo_url && (
                              <Avatar
                                src={team.logo_url}
                                alt={team.team_name}
                                sx={{ width: 24, height: 24, mr: 1 }}
                              />
                            )}
                            {team.team_name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{team.pick_count}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={`${team.win_count}-${team.loss_count}-${team.tie_count}`}
                            size="small"
                            color={team.win_count > team.loss_count ? 'success' : team.win_count === team.loss_count ? 'warning' : 'error'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Distribución de Picks por Equipo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {trendsData.selectedWeek ? `Semana ${trendsData.selectedWeek}` : 'Todas las Semanas'}
                </Typography>
              </Box>
              {trendsData.pickDistribution && trendsData.pickDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={trendsData.pickDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="team_abbreviation" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pick_count" fill="#8884d8" name="Total de Picks" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">
                  No hay datos de distribución de picks para {trendsData.selectedWeek ? `la semana ${trendsData.selectedWeek}` : 'las semanas seleccionadas'}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tendencias de Actividad Semanal
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trendsData.weeklyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="pick_count"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Total de Picks"
                  />
                  <Area
                    type="monotone"
                    dataKey="win_count"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Picks Correctos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Análisis de Riesgo por Equipos
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Equipo</TableCell>
                      <TableCell align="right">Tasa de Éxito</TableCell>
                      <TableCell align="right">Total Picks</TableCell>
                      <TableCell align="right">Nivel de Riesgo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trendsData.teamStats
                      .filter(team => team.pick_count >= 3)
                      .sort((a, b) => b.win_rate - a.win_rate)
                      .map((team) => {
                        const riskLevel = team.win_rate >= 70 ? 'low' : team.win_rate >= 50 ? 'medium' : 'high';
                        const riskColor = riskLevel === 'low' ? 'success' : riskLevel === 'medium' ? 'warning' : 'error';
                        const riskIcon = riskLevel === 'low' ? <TrendingUpIcon /> : riskLevel === 'medium' ? <InsightsIcon /> : <WarningIcon />;
                        
                        return (
                          <TableRow key={team.team_id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {team.logo_url && (
                                  <Avatar
                                    src={team.logo_url}
                                    alt={team.team_name}
                                    sx={{ width: 24, height: 24, mr: 1 }}
                                  />
                                )}
                                {team.team_name}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${team.win_rate.toFixed(1)}%`}
                                color={riskColor}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">{team.pick_count}</TableCell>
                            <TableCell align="right">
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
            </CardContent>
          </Card>
        </Box>
      </TabPanel>
    </Box>
  );
};

export default Trends;
