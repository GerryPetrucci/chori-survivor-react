import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './components/AppRouter';

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea', // azul del gradiente
      dark: '#5a6fd8',
      light: '#7c8ef0',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#764ba2', // púrpura del gradiente
      dark: '#6a4190',
      light: '#8659b4',
      contrastText: '#FFFFFF',
    },
    background: {
      default: 'linear-gradient(180deg, #f8faff 0%, #f0f4ff 50%, #e8f2ff 100%)',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1a202c',
      secondary: '#4a5568',
    },
    success: { main: '#16A34A' },
    error: { main: '#DC2626' }, // mantener rojo para errores
    warning: { main: '#F59E0B' },
    info: { main: '#3B82F6' },
  },
  typography: {
    fontFamily: "'Nunito Sans', 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    h1: { fontFamily: "'Poppins', 'Nunito Sans', sans-serif" },
    h2: { fontFamily: "'Poppins', 'Nunito Sans', sans-serif" },
    h3: { fontFamily: "'Poppins', 'Nunito Sans', sans-serif" },
    h4: { fontFamily: "'Poppins', 'Nunito Sans', sans-serif" },
    h5: { fontFamily: "'Poppins', 'Nunito Sans', sans-serif" },
    h6: { fontFamily: "'Poppins', 'Nunito Sans', sans-serif" },
  },
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
