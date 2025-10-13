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
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Hacer Picks
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Selecciona tus equipos para la semana actual.
      </Typography>

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
              sx={{ mt: 2 }}
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