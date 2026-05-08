import { storage } from '../lib/storage';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export interface StudyEvent {
  id: string;
  user_id: string;
  card_id: string;
  grade: number;
  timestamp: string;
}

export const studyEventService = {
  async logEvent(userId: string, cardId: string, grade: number) {
    const event: StudyEvent = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: userId,
      card_id: cardId,
      grade,
      timestamp: new Date().toISOString(),
    };

    if (!isSupabaseConfigured || !supabase || userId.startsWith('demo-')) {
      return storage.addItem<StudyEvent>('study_events', event);
    }

    const { data, error } = await supabase
      .from('spark_study_events')
      .insert([event])
      .select()
      .single();

    if (error) throw error;
    return data as StudyEvent;
  },

  async getEvents(userId: string) {
    if (!isSupabaseConfigured || !supabase || userId.startsWith('demo-')) {
      return storage.get<StudyEvent>('study_events').filter(e => e.user_id === userId);
    }

    const { data, error } = await supabase
      .from('spark_study_events')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data as StudyEvent[];
  }
};
