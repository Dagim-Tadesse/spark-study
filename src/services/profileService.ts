import { supabase } from '../lib/supabaseClient';

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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile not found, this happens for older users who didn't trigger the SQL trigger.
        // We gracefully return a default profile.
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
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates }) // Use upsert to handle missing profiles
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  }
};
