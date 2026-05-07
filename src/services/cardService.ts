import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export interface Card {
  id: string;
  deck_id: string;
  user_id: string;
  template: string;
  front: string;
  back: string;
  tag: string;
  created_at: string;
  next_review: number;
  interval: number;
}

export const cardService = {
  async getCards(userId: string) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured');
    }
    const { data, error } = await supabase
      .from('spark_study_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Card[];
  },

  async createCard(cardData: Omit<Card, 'id' | 'created_at'>) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured');
    }
    const { data, error } = await supabase
      .from('spark_study_cards')
      .insert([cardData])
      .select()
      .single();

    if (error) throw error;
    return data as Card;
  },

  async updateCard(id: string, updates: Partial<Card>) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured');
    }
    const { data, error } = await supabase
      .from('spark_study_cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Card;
  },

  async deleteCard(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured');
    }
    const { error } = await supabase
      .from('spark_study_cards')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
