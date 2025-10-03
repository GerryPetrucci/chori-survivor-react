import axios from 'axios';
import type { 
  ApiResponse, 
  LoginResponse, 
  DashboardData, 
  User, 
  Match,
  Pick,
  RankingEntry,
  UserEntry,
  LoginForm,
  RegistrationForm,
  PickForm 
} from '../types';

// Base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for Flask session cookies
});

// Request interceptor for auth tokens (if using JWT in the future)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginForm): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/login', credentials);
    return response.data;
  },

  register: async (userData: RegistrationForm): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>('/register', userData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/logout');
    localStorage.removeItem('authToken');
  },

  checkSession: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>('/check-session');
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getDashboardData: async (semana?: number, entry_id?: string): Promise<DashboardData> => {
    const params = new URLSearchParams();
    if (semana) params.append('semana', semana.toString());
    if (entry_id) params.append('entry_id', entry_id);
    
    const response = await api.get<DashboardData>(`/dashboard?${params}`);
    return response.data;
  },
};

// Matches API
export const matchesAPI = {
  getMatches: async (semana?: number): Promise<Match[]> => {
    const params = semana ? `?semana=${semana}` : '';
    const response = await api.get<Match[]>(`/matches${params}`);
    return response.data;
  },

  updateMatch: async (matchId: number, matchData: Partial<Match>): Promise<ApiResponse<Match>> => {
    const response = await api.put<ApiResponse<Match>>(`/matches/${matchId}`, matchData);
    return response.data;
  },
};

// Picks API
export const picksAPI = {
  getUserPicks: async (entry_id?: string): Promise<Pick[]> => {
    const params = entry_id ? `?entry_id=${entry_id}` : '';
    const response = await api.get<Pick[]>(`/picks${params}`);
    return response.data;
  },

  createPick: async (pickData: PickForm): Promise<ApiResponse<Pick>> => {
    const response = await api.post<ApiResponse<Pick>>('/registrar-pick', pickData);
    return response.data;
  },

  getAvailableTeams: async (semana: number, entry_id: string): Promise<{
    matches: Match[];
    unavailable_teams: number[];
    existing_pick?: Pick;
  }> => {
    const response = await api.get(`/registrar-pick?semana=${semana}&entry_id=${entry_id}`);
    return response.data;
  },
};

// Ranking API
export const rankingAPI = {
  getRanking: async (): Promise<RankingEntry[]> => {
    const response = await api.get<RankingEntry[]>('/ranking');
    return response.data;
  },
};

// User API
export const userAPI = {
  getUserEntries: async (): Promise<UserEntry[]> => {
    const response = await api.get<UserEntry[]>('/user-entries');
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/perfil');
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  generateToken: async (entries: number, password: string): Promise<ApiResponse<{ token: string }>> => {
    const response = await api.post<ApiResponse<{ token: string }>>('/admin_generate_token', {
      entries,
      password,
    });
    return response.data;
  },

  getUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/admin/users');
    return response.data;
  },

  getDatabaseStatus: async (): Promise<any> => {
    const response = await api.get('/admin_db');
    return response.data;
  },
};

// Default export
export default api;