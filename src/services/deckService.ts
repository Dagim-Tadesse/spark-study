import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export interface Deck {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export const deckService = {
  async getDecks(userId: string) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured');
    }
    const { data, error } = await supabase
      .from('spark_study_decks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Deck[];
  },

  async createDeck(userId: string, name: string, color: string = 'bg-primary') {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured');
    }
    const { data, error } = await supabase
      .from('spark_study_decks')
      .insert([{ user_id: userId, name, color }])
      .select()
      .single();

    if (error) throw error;
    return data as Deck;
  },

  async updateDeck(id: string, updates: Partial<Deck>) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured');
    }
    const { data, error } = await supabase
      .from('spark_study_decks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Deck;
  },

  async deleteDeck(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured');
    }
    const { error } = await supabase
      .from('spark_study_decks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
