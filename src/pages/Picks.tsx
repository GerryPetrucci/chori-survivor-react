import { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Alert, 
  Card, 
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { Sports as SportsIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { entriesService } from '../services/supabase';
import PicksModal from '../components/ui/PicksModal';

export default function PicksPage() {
  const [userEntries, setUserEntries] = useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPicksModal, setShowPicksModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadUserEntries();
  }, [user]);

  const loadUserEntries = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data: entries, error: entriesError } = await entriesService.getUserEntries(user.id);
      
      if (entriesError) {
        setError('Error al cargar las entradas: ' + entriesError.message);
        return;
      }

      setUserEntries(entries || []);
      
      // Si solo hay una entrada, seleccionarla automáticamente
      if (entries && entries.length === 1) {
        setSelectedEntry(entries[0].id);
      }
    } catch (err: any) {
      setError('Error al cargar las entradas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMakePick = () => {
    if (selectedEntry) {
      setShowPicksModal(true);
    }
  };

  const getSelectedEntryName = () => {
    const entry = userEntries.find(e => e.id === selectedEntry);
    return entry?.entry_name || '';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          p: 3,
          mb: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" gutterBottom fontWeight="bold">
          🏈 Hacer Picks
        </Typography>
        
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          Selecciona tus equipos para la semana actual
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {userEntries.length === 0 ? (
        <Alert severity="info" sx={{ mt: 3 }}>
          No tienes entradas registradas. Contacta al administrador para obtener un token.
        </Alert>
      ) : (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Selecciona tu Entrada
            </Typography>

            {userEntries.length > 1 ? (
              <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
                <InputLabel>Entrada</InputLabel>
                <Select
                  value={selectedEntry || ''}
                  label="Entrada"
                  onChange={(e) => setSelectedEntry(Number(e.target.value))}
                  MenuProps={{
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {userEntries.map((entry) => (
                    <MenuItem key={entry.id} value={entry.id}>
                      {entry.entry_name} - {entry.status === 'alive' ? 'Vivo' : 
                       entry.status === 'last_chance' ? 'Última oportunidad' : 'Eliminado'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
                Entrada seleccionada: <strong>{userEntries[0]?.entry_name}</strong>
              </Alert>
            )}

            <Button
              variant="contained"
              size="large"
              startIcon={<SportsIcon />}
              onClick={handleMakePick}
              disabled={!selectedEntry}
              sx={{ 
                mt: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                },
                '&:disabled': {
                  background: 'rgba(102, 126, 234, 0.3)',
                  transform: 'none',
                  boxShadow: 'none'
                }
              }}
            >
              Hacer Pick
            </Button>
          </CardContent>
        </Card>
      )}

      <PicksModal
        open={showPicksModal}
        onClose={() => setShowPicksModal(false)}
        entryId={selectedEntry}
        entryName={getSelectedEntryName()}
      />
    </Box>
  );
}