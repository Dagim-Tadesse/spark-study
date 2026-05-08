import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { storage } from '../lib/storage';

export interface Deck {
  id: string;
  user_id: string;
  name: string;
  color: string;
  tags?: string[];
  created_at: string;
}

export const deckService = {
  async getDecks(userId: string) {
    if (!isSupabaseConfigured || !supabase || userId.startsWith('demo-')) {
      return storage.get<Deck>('decks').filter(d => d.user_id === userId);
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
    if (!isSupabaseConfigured || !supabase || userId.startsWith('demo-')) {
      const newDeck: Deck = {
        id: Math.random().toString(36).substr(2, 9),
        user_id: userId,
        name,
        color,
        tags: [],
        created_at: new Date().toISOString()
      };
      return storage.addItem<Deck>('decks', newDeck);
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
    if (!isSupabaseConfigured || !supabase || id.length < 20) { // Demo IDs are shorter
      const decks = storage.get<Deck>('decks');
      const index = decks.findIndex(d => d.id === id);
      if (index !== -1) {
        decks[index] = { ...decks[index], ...updates };
        storage.save('decks', decks);
        return decks[index];
      }
      throw new Error('Deck not found');
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
    if (!isSupabaseConfigured || !supabase || id.length < 20) {
      const decks = storage.get<Deck>('decks');
      storage.save('decks', decks.filter(d => d.id !== id));
      return;
    }
    const { error } = await supabase
      .from('spark_study_decks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
