
import { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Deck, Card, DeckId } from './types';

export const useFlashcardData = () => {
  const [decks, setDecks] = useState<Deck[]>([]);

  const addDeck = (title: string) => {
    const newDeck: Deck = {
      id: uuidv4(),
      title,
      cards: [],
    };
    setDecks((prev) => [...prev, newDeck]);
  };

  const addCardToDeck = (deckId: DeckId, front: string, back: string) => {
    setDecks((prevDecks) =>
      prevDecks.map((deck) =>
        deck.id === deckId
          ? {
              ...deck,
              cards: [...deck.cards, { id: uuidv4(), front, back, createdAt: Date.now(), tags: [] }],
            }
          : deck
      )
    );
  };

  return { decks, addDeck, addCardToDeck };
};
