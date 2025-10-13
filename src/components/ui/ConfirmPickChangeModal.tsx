import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
  SwapHoriz as SwapIcon,
} from '@mui/icons-material';

interface ConfirmPickChangeModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  week: number;
  currentTeam?: {
    city: string;
    name: string;
    logo_url?: string;
  };
  newTeam?: {
    city: string;
    name: string;
    logo_url?: string;
  };
}

export default function ConfirmPickChangeModal({
  open,
  onClose,
  onConfirm,
  week,
  currentTeam,
  newTeam
}: ConfirmPickChangeModalProps) {

  const getTeamLogo = (logoUrl: string | undefined) => {
    if (!logoUrl) return '/assets/logos/nfl_logo.png';
    return logoUrl.startsWith('/assets/') ? logoUrl : `/assets${logoUrl}`;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'background.paper'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <WarningIcon color="warning" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Confirmar Cambio de Pick
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Semana {week}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          ¿Estás seguro de que quieres cambiar tu pick de la semana {week}?
        </Alert>

        <Box display="flex" flexDirection="column" gap={3}>
          {/* Pick Actual */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" color="text.secondary" gutterBottom>
              Pick Actual:
            </Typography>
            <Box 
              display="flex" 
              alignItems="center" 
              gap={2} 
              p={2} 
              bgcolor="error.light" 
              borderRadius={1}
              sx={{ opacity: 0.8 }}
            >
              <img
                src={getTeamLogo(currentTeam?.logo_url)}
                alt={currentTeam?.name}
                style={{ width: 40, height: 40, objectFit: 'contain' }}
              />
              <Typography variant="h6" fontWeight="bold" color="error.dark">
                {currentTeam?.city} {currentTeam?.name}
              </Typography>
            </Box>
          </Box>

          {/* Icono de cambio */}
          <Box display="flex" justifyContent="center">
            <SwapIcon sx={{ fontSize: 32, color: 'warning.main' }} />
          </Box>

          {/* Nuevo Pick */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" color="text.secondary" gutterBottom>
              Nuevo Pick:
            </Typography>
            <Box 
              display="flex" 
              alignItems="center" 
              gap={2} 
              p={2} 
              bgcolor="success.light" 
              borderRadius={1}
            >
              <img
                src={getTeamLogo(newTeam?.logo_url)}
                alt={newTeam?.name}
                style={{ width: 40, height: 40, objectFit: 'contain' }}
              />
              <Typography variant="h6" fontWeight="bold" color="success.dark">
                {newTeam?.city} {newTeam?.name}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          color="inherit"
          size="large"
        >
          Cancelar
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          color="warning"
          size="large"
          sx={{ minWidth: 120 }}
        >
          Confirmar Cambio
        </Button>
      </DialogActions>
    </Dialog>
  );
}