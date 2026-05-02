import { supabase } from '../lib/supabaseClient';

export interface Deck {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export const deckService = {
  async getDecks(userId: string) {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Deck[];
  },

  async createDeck(userId: string, name: string, color: string = 'bg-primary') {
    const { data, error } = await supabase
      .from('decks')
      .insert([{ user_id: userId, name, color }])
      .select()
      .single();

    if (error) throw error;
    return data as Deck;
  },

  async updateDeck(id: string, updates: Partial<Deck>) {
    const { data, error } = await supabase
      .from('decks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Deck;
  },

  async deleteDeck(id: string) {
    const { error } = await supabase
      .from('decks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
