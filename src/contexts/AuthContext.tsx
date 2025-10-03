import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService, userProfilesService } from '../services/supabase';
import type { User, LoginForm } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType extends AuthState {
  login: (credentials: LoginForm) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await authService.getSession();
        if (data.session?.user) {
          const { data: profile } = await userProfilesService.getProfile(data.session.user.id);
          
          if (profile) {
            const user: User = {
              id: profile.id, // Keep as UUID string
              email: profile.email || data.session.user.email || '',
              username: profile.username,
              full_name: profile.full_name,
              user_type: profile.user_type as 'user' | 'admin',
              created_at: profile.created_at,
            };
            dispatch({ type: 'LOGIN_SUCCESS', payload: user });
          } else {
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkSession();
  }, []);

  const login = async (credentials: LoginForm) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const { data, error } = await authService.signIn(credentials.email, credentials.password);
      
      if (data?.user && !error) {
        // Obtener perfil del usuario
        const { data: profile } = await userProfilesService.getProfile(data.user.id);
        
        if (profile) {
          const user: User = {
            id: profile.id, // Keep as UUID string
            email: profile.email || data.user.email || '',
            username: profile.username,
            full_name: profile.full_name,
            user_type: profile.user_type as 'user' | 'admin',
            created_at: profile.created_at,
          };
          dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        } else {
          dispatch({ type: 'LOGIN_ERROR', payload: 'Profile not found' });
        }
      } else {
        dispatch({ type: 'LOGIN_ERROR', payload: error || 'Login failed' });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Network error occurred';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;