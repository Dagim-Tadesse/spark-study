import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { storage } from '../lib/storage';

export interface Profile {
  id: string;
  streak: number;
  last_study_date: string | null;
  total_reviews: number;
  successful_reviews: number;
  created_at: string;
}

export const profileService = {
  async getProfile(userId: string) {
    if (!isSupabaseConfigured || !supabase || userId.startsWith('demo-')) {
      const profiles = storage.get<Profile>('profiles');
      const found = profiles.find(p => p.id === userId);
      return found || {
        id: userId,
        streak: 0,
        last_study_date: null,
        total_reviews: 0,
        successful_reviews: 0,
        created_at: new Date().toISOString()
      } as Profile;
    }
    const { data, error } = await supabase
      .from('spark_study_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile not found
        return {
          id: userId,
          streak: 0,
          last_study_date: null,
          total_reviews: 0,
          successful_reviews: 0,
          created_at: new Date().toISOString()
        } as Profile;
      }
      throw error;
    }
    
    return data as Profile;
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    if (!isSupabaseConfigured || !supabase || userId.startsWith('demo-')) {
      const profiles = storage.get<Profile>('profiles');
      const index = profiles.findIndex(p => p.id === userId);
      if (index !== -1) {
        profiles[index] = { ...profiles[index], ...updates };
        storage.save('profiles', profiles);
        return profiles[index];
      } else {
        const newProfile = { id: userId, streak: 0, last_study_date: null, total_reviews: 0, successful_reviews: 0, created_at: new Date().toISOString(), ...updates } as Profile;
        storage.addItem('profiles', newProfile);
        return newProfile;
      }
    }
    const { data, error } = await supabase
      .from('spark_study_profiles')
      .upsert({ id: userId, ...updates }) // Use upsert to handle missing profiles
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  }
};
