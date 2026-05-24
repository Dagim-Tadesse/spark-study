import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { storage } from '../lib/storage';

export interface Card {
  id: string;
  deck_id: string;
  user_id: string;
  template: string;
  front: string;
  back: string;
  tags: string[];
  created_at: string;
  next_review: number; // Stored as number (ms) in JS, but timestamptz in DB
  interval: number;
  ease: number;
}

export const cardService = {
  async getCards(userId: string) {
    if (!isSupabaseConfigured || !supabase || userId.startsWith('demo-')) {
      return storage.get<Card>('cards').filter(c => c.user_id === userId);
    }
    const { data, error } = await supabase
      .from('spark_study_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(card => ({
      ...card,
      next_review: new Date(card.next_review).getTime()
    })) as Card[];
  },

  async createCard(cardData: Omit<Card, 'id' | 'created_at'>) {
    if (!isSupabaseConfigured || !supabase || cardData.user_id.startsWith('demo-')) {
      const newCard: Card = {
        ...cardData,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
      };
      return storage.addItem<Card>('cards', newCard);
    }
    
    // Map to DB schema: tag -> tags, next_review -> ISO string
    const dbPayload = {
      ...cardData,
      next_review: new Date(cardData.next_review).toISOString(),
    };

    const { data, error } = await supabase
      .from('spark_study_cards')
      .insert([dbPayload])
      .select()
      .single();

    if (error) throw error;
    
    // Map back to frontend Card type
    return {
      ...data,
      next_review: new Date(data.next_review).getTime()
    } as Card;
  },

  async updateCard(id: string, updates: Partial<Card>) {
    if (!isSupabaseConfigured || !supabase || (updates.user_id && updates.user_id.startsWith('demo-')) || !id.includes('-')) { 
      // Very crude check for demo IDs which are short strings, while supabase uses UUIDs
      return storage.updateItem<Card>('cards', id, updates) as Promise<Card>;
    }

    const dbUpdates: Record<string, unknown> = { ...updates };
    if (updates.next_review !== undefined) {
      dbUpdates.next_review = new Date(updates.next_review).toISOString();
    }

    const { data, error } = await supabase
      .from('spark_study_cards')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      next_review: new Date(data.next_review).getTime()
    } as Card;
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
