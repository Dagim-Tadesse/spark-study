// Types for Deck, Card, StudyEvent, and Settings
export type UUID = string;

export interface Card {
  id: UUID;
  deckId: UUID;
  front: string;
  back: string;
  tags?: string[];
  dueDate?: string; // ISO date string
  interval?: number;
  ease?: number;
  lastReviewed?: string; // ISO date string
}

export interface Deck {
  id: UUID;
  name: string;
  description?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface StudyEvent {
  id: UUID;
  cardId: UUID;
  deckId: UUID;
  result: 'know' | 'again';
  reviewedAt: string; // ISO date string
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  studySessionLength: number;
  newCardDefaults?: Partial<Card>;
}
