import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Avatar,
  Zoom,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

interface PickSuccessModalProps {
  open: boolean;
  onClose: () => void;
  week: number;
  team?: {
    id: number;
    name: string;
    city: string;
    abbreviation: string;
    logo_url: string;
  } | null;
}

export default function PickSuccessModal({ open, onClose, week, team }: PickSuccessModalProps) {
  const getTeamLogo = (logoUrl: string | undefined) => {
    if (!logoUrl) return '/assets/logos/nfl_logo.png';
    return logoUrl.startsWith('/assets/') ? logoUrl : `/assets${logoUrl}`;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          textAlign: 'center',
          p: 2,
        }
      }}
    >
      <DialogContent>
        <Zoom in={open}>
          <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
            {/* Ícono de éxito */}
            <Avatar 
              sx={{ 
                bgcolor: 'success.main', 
                width: 80, 
                height: 80,
                mb: 1
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 50, color: 'white' }} />
            </Avatar>

            {/* Mensaje principal */}
            <Typography variant="h5" fontWeight="bold" color="success.main">
              ¡Pick Guardado!
            </Typography>

            <Typography variant="h6" color="text.primary">
              Se ha guardado tu selección para la semana {week}
            </Typography>

            {/* Logo del equipo seleccionado */}
            {team && (
              <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    border: 3,
                    borderColor: 'success.main',
                    p: 1,
                  }}
                >
                  <img
                    src={getTeamLogo(team.logo_url)}
                    alt={team.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {team.city} {team.name}
                </Typography>
              </Box>
            )}
          </Box>
        </Zoom>
      </DialogContent>
    </Dialog>
  );
}