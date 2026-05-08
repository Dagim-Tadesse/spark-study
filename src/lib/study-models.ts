export type CardHistoryEntry = {
  front: string;
  back: string;
  tags: string[];
  timestamp: number;
};

export type Card = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  tags: string[];
  history: CardHistoryEntry[];
  template: string;
};

export type Deck = {
  id: string;
  name: string;
  color: string;
  progress: number;
};

export type TrashItem = Card & {
  deletedAt: number;
};

export type StudyData = {
  version: 1;
  decks: Deck[];
  cards: Card[];
  trash: TrashItem[];
};

export const STORAGE_KEY = "spark-study-v1";

export const MAX_HISTORY_PER_CARD = 20;

export const defaultDecks: Deck[] = [
  {
    id: "deck-physics-formulas",
    name: "Physics Formulas",
    color: "bg-study-front",
    progress: 72,
  },
  {
    id: "deck-spanish-verbs",
    name: "Spanish Verbs",
    color: "bg-success",
    progress: 54,
  },
  {
    id: "deck-general-knowledge",
    name: "General Knowledge",
    color: "bg-accent",
    progress: 88,
  },
];

export const defaultCards: Card[] = [
  {
    id: "card-newton-second-law",
    deckId: "deck-physics-formulas",
    template: "Formula",
    front: "What is the relationship between force, mass, and acceleration?",
    back: "Newton's Second Law\\nF = m × a\\nForce equals mass multiplied by acceleration.",
    tags: ["physics"],
    history: [],
  },
  {
    id: "card-general-info",
    deckId: "deck-general-knowledge",
    template: "Q&A",
    front: "What is the capital of France?",
    back: "Paris",
    tags: ["general"],
    history: [],
  },
];

export const defaultStudyData: StudyData = {
  version: 1,
  decks: defaultDecks,
  cards: defaultCards,
  trash: [],
};
