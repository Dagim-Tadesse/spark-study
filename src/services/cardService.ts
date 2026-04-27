import { supabase } from '../lib/supabaseClient';

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
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Card[];
  },

  async createCard(cardData: Omit<Card, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('cards')
      .insert([cardData])
      .select()
      .single();

    if (error) throw error;
    return data as Card;
  },

  async updateCard(id: string, updates: Partial<Card>) {
    const { data, error } = await supabase
      .from('cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Card;
  },

  async deleteCard(id: string) {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
