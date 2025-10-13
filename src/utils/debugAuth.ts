import { supabase } from '../config/supabase';

export const debugAuth = {
  // Verificar si un usuario existe en auth.users
  checkAuthUser: async (email: string) => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) {
        console.error('❌ Error listing users:', error);
        return { exists: false, error };
      }
      
      const user = data.users.find(u => u.email === email);
      console.log('🔍 User in auth.users:', user);
      return { exists: !!user, user, error: null };
    } catch (err: any) {
      console.error('❌ Error checking auth user:', err);
      return { exists: false, error: err.message };
    }
  },

  // Verificar si un perfil existe en user_profiles
  checkUserProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      console.log('🔍 User profile:', data);
      console.log('❌ Profile error:', error);
      
      return { exists: !error && !!data, profile: data, error };
    } catch (err: any) {
      console.error('❌ Error checking user profile:', err);
      return { exists: false, error: err.message };
    }
  },

  // Verificar todos los usuarios en user_profiles
  listAllProfiles: async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('📋 All profiles:', data);
      console.log('❌ List error:', error);
      
      return { profiles: data || [], error };
    } catch (err: any) {
      console.error('❌ Error listing profiles:', err);
      return { profiles: [], error: err.message };
    }
  },

  // Verificar si el trigger existe
  checkTrigger: async () => {
    try {
      const { data, error } = await supabase
        .rpc('check_trigger_exists');
      
      console.log('🔧 Trigger check:', data);
      return { exists: !!data, error };
    } catch (err: any) {
      console.error('❌ Trigger check failed:', err);
      return { exists: false, error: err.message };
    }
  },

  // Crear perfil manualmente
  createProfileManually: async (userId: string, username: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          username,
          full_name: username,
          email,
          user_type: 'user'
        })
        .select()
        .single();
      
      console.log('✅ Profile created manually:', data);
      return { profile: data, error };
    } catch (err: any) {
      console.error('❌ Error creating profile manually:', err);
      return { profile: null, error: err.message };
    }
  }
};