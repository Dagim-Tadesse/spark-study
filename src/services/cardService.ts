import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

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
    
    return (data || []).map(card => ({
      ...card,
      next_review: new Date(card.next_review).getTime()
    })) as Card[];
  },

  async createCard(cardData: Omit<Card, 'id' | 'created_at'>) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured');
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
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured');
    }

    const dbUpdates: any = { ...updates };
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
