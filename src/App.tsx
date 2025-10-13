import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './components/AppRouter';

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#EF4444', // rojo
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FFB4A2', // coral suave
    },
    background: {
      default: '#FFF7F6',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
    },
    success: { main: '#16A34A' },
    error: { main: '#DC2626' },
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
