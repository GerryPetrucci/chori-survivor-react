import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
  Chip,
  LinearProgress,
  Fade,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Sports as SportsIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

interface EntriesModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (entries: string[]) => Promise<void>;
  entriesCount: number;
  loading?: boolean;
}

export default function EntriesModal({
  open,
  onClose,
  onConfirm,
  entriesCount,
  loading = false
}: EntriesModalProps) {
  const [entries, setEntries] = useState<string[]>(Array(entriesCount).fill(''));
  const [errors, setErrors] = useState<string[]>(Array(entriesCount).fill(''));
  const [submitting, setSubmitting] = useState(false);

  const handleEntryChange = (index: number, value: string) => {
    const newEntries = [...entries];
    const newErrors = [...errors];
    
    newEntries[index] = value;
    // No limpiar error al escribir
    setEntries(newEntries);
    setErrors(newErrors);
  };

  const validateEntries = (): boolean => {
    const newErrors = Array(entriesCount).fill('');
    let isValid = true;

    // Verificar que todas las entradas tengan nombre
    entries.forEach((entry, index) => {
      if (!entry.trim()) {
        newErrors[index] = 'Campo obligatorio';
        isValid = false;
      } else if (entry.trim().length < 2) {
        newErrors[index] = 'Mínimo 2 caracteres';
        isValid = false;
      } else if (entry.trim().length > 30) {
        newErrors[index] = 'Máximo 30 caracteres';
        isValid = false;
      } else if (!/^[a-zA-Z0-9\s_-]+$/.test(entry.trim())) {
        newErrors[index] = 'Solo letras, números, espacios, _ y -';
        isValid = false;
      }
    });

    // Verificar duplicados
    const trimmedEntries = entries.map(entry => entry.trim().toLowerCase());
    const duplicates = trimmedEntries.filter((entry, index) => 
      entry && trimmedEntries.indexOf(entry) !== index
    );

    if (duplicates.length > 0) {
      entries.forEach((entry, index) => {
        if (duplicates.includes(entry.trim().toLowerCase())) {
          newErrors[index] = 'Nombre duplicado';
          isValid = false;
        }
      });
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleConfirm = async () => {
    if (!validateEntries()) {
      return;
    }

    setSubmitting(true);
    try {
      const trimmedEntries = entries.map(entry => entry.trim());
      await onConfirm(trimmedEntries);
    } catch (error) {
      console.error('Error al crear entradas:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting && !loading) {
      onClose();
    }
  };

  const completedEntries = entries.filter(entry => entry.trim()).length;
  const progress = (completedEntries / entriesCount) * 100;

  const generateSuggestion = (index: number): string => {
    const suggestions = [
      'Mi Entrada Principal',
      'Suerte Dorada',
      'Victoria Segura',
      'El Ganador',
      'Superviviente',
      'Campeón NFL',
      'Pick Perfecto',
      'Última Esperanza',
      'Estrategia Maestra',
      'Destino Final'
    ];
    return suggestions[index] || `Entrada ${index + 1}`;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '500px',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8faff 100%)',
          boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)',
          border: '1px solid rgba(102, 126, 234, 0.1)'
        }
      }}
      TransitionComponent={Fade}
    >
      <DialogTitle sx={{ 
        pb: 1,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background: 'rgba(255,255,255,0.3)'
        }
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <SportsIcon sx={{ mr: 2, color: 'white', fontSize: 28 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                Nombra tus Entradas
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Elige nombres únicos para tus {entriesCount} entrada(s) al pool
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={handleClose} 
            disabled={submitting || loading}
            sx={{ 
              color: 'rgba(255,255,255,0.8)',
              '&:hover': {
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Progress Bar */}
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            mb: 3, 
            background: 'linear-gradient(135deg, #e3f2fd, #f3e5f5)',
            borderRadius: 2
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="body2" fontWeight="medium">
              Progreso de Entradas
            </Typography>
            <Chip 
              label={`${completedEntries}/${entriesCount}`}
              color={completedEntries === entriesCount ? 'success' : 'primary'}
              size="small"
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
              }
            }} 
          />
        </Paper>

        {/* Alert de instrucciones */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Consejos:</strong> Usa nombres creativos y únicos. No podrás cambiarlos después. 
            Los nombres no pueden repetirse entre usuarios del pool.
          </Typography>
        </Alert>

        {/* Formulario de Entradas */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
          {entries.map((entry, index) => (
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  borderRadius: 2,
                  border: errors[index] ? '2px solid' : '1px solid',
                  borderColor: errors[index] ? 'error.main' : 'divider',
                  transition: 'all 0.2s ease'
                }}
              >
                <Box display="flex" alignItems="center" mb={1}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: entry.trim() ? 'success.main' : 'grey.300',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {entry.trim() ? (
                      <CheckIcon sx={{ fontSize: 16, color: 'white' }} />
                    ) : (
                      <Typography variant="caption" color="white" fontWeight="bold">
                        {index + 1}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="subtitle2" fontWeight="medium">
                    Entrada {index + 1}
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  size="small"
                  placeholder={generateSuggestion(index)}
                  value={entry}
                  onChange={(e) => handleEntryChange(index, e.target.value)}
                  error={!!errors[index]}
                  helperText={errors[index] || ' '}
                  disabled={submitting || loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1
                    }
                  }}
                />

                <Button
                  size="small"
                  variant="text"
                  onClick={() => handleEntryChange(index, generateSuggestion(index))}
                  disabled={submitting || loading}
                  sx={{ 
                    mt: 0.5,
                    fontSize: '0.75rem',
                    textTransform: 'none'
                  }}
                >
                  Usar sugerencia
                </Button>
              </Paper>
          ))}
        </Box>

        {/* Loading indicator */}
        {(submitting || loading) && (
          <Box mt={3}>
            <LinearProgress />
            <Typography variant="body2" textAlign="center" mt={1} color="text.secondary">
              {submitting ? 'Creando entradas...' : 'Cargando...'}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={handleClose}
          disabled={submitting || loading}
          variant="outlined"
          sx={{ minWidth: 100 }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={submitting || loading || completedEntries !== entriesCount}
          variant="contained"
          sx={{ 
            minWidth: 150,
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
          {submitting ? 'Creando...' : `Crear ${entriesCount} Entrada(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}