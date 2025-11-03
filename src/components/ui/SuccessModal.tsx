import { Dialog, DialogContent, Box, Typography, Button } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  message: string;
  title?: string;
}

export default function SuccessModal({ open, onClose, message, title = '¡Éxito!' }: SuccessModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          textAlign: 'center',
          p: 2
        }
      }}
    >
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}
        >
          <CheckCircle
            sx={{
              fontSize: 80,
              color: 'success.main',
              animation: 'scaleIn 0.3s ease-out'
            }}
          />
          <Typography variant="h5" fontWeight="bold" color="success.main">
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {message}
          </Typography>
          <Button
            variant="contained"
            onClick={onClose}
            sx={{ mt: 2, minWidth: 120 }}
          >
            Aceptar
          </Button>
        </Box>
      </DialogContent>

      <style>
        {`
          @keyframes scaleIn {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </Dialog>
  );
}
