import { useCallback, useEffect, useMemo, useState } from "react";
import {
  defaultStudyData,
  MAX_HISTORY_PER_CARD,
  STORAGE_KEY,
  type Card,
  type CardHistoryEntry,
  type Deck,
  type StudyData,
  type TrashItem,
} from "@/lib/study-models";

type CardUpdate = Partial<
  Pick<Card, "front" | "back" | "tags" | "template" | "deckId">
>;

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const buildHistoryEntry = (card: Card): CardHistoryEntry => ({
  front: card.front,
  back: card.back,
  tags: card.tags,
  timestamp: Date.now(),
});

const normalizeTags = (tags: string[]) =>
  tags.map((tag) => tag.trim()).filter(Boolean);

const isSameSnapshot = (a: CardHistoryEntry, b: CardHistoryEntry) =>
  a.front === b.front &&
  a.back === b.back &&
  a.tags.join("|") === b.tags.join("|");

const appendHistory = (
  history: CardHistoryEntry[],
  entry: CardHistoryEntry,
) => {
  const last = history[history.length - 1];
  if (last && isSameSnapshot(last, entry)) {
    return history;
  }

  const nextHistory = [...history, entry];
  if (nextHistory.length <= MAX_HISTORY_PER_CARD) {
    return nextHistory;
  }

  return nextHistory.slice(nextHistory.length - MAX_HISTORY_PER_CARD);
};

const isCardShape = (value: unknown): value is Card => {
  if (!value || typeof value !== "object") return false;
  const card = value as Partial<Card>;
  return (
    typeof card.id === "string" &&
    typeof card.deckId === "string" &&
    typeof card.front === "string" &&
    typeof card.back === "string" &&
    typeof card.template === "string" &&
    Array.isArray(card.tags) &&
    Array.isArray(card.history)
  );
};

const isDeckShape = (value: unknown): value is Deck => {
  if (!value || typeof value !== "object") return false;
  const deck = value as Partial<Deck>;
  return (
    typeof deck.id === "string" &&
    typeof deck.name === "string" &&
    typeof deck.color === "string" &&
    typeof deck.progress === "number"
  );
};

const isTrashShape = (value: unknown): value is TrashItem => {
  if (!isCardShape(value)) return false;
  const trash = value as Partial<TrashItem>;
  return typeof trash.deletedAt === "number";
};

const parseStoredData = (rawData: string | null): StudyData => {
  if (!rawData) return defaultStudyData;

  try {
    const parsed = JSON.parse(rawData) as Partial<StudyData>;
    if (parsed.version !== 1) return defaultStudyData;
    if (!Array.isArray(parsed.decks) || !parsed.decks.every(isDeckShape))
      return defaultStudyData;
    if (!Array.isArray(parsed.cards) || !parsed.cards.every(isCardShape))
      return defaultStudyData;
    if (!Array.isArray(parsed.trash) || !parsed.trash.every(isTrashShape))
      return defaultStudyData;

    const cards = parsed.cards.map((card) => ({
      ...card,
      tags: normalizeTags(card.tags),
      history: card.history
        .filter(
          (entry) =>
            !!entry &&
            typeof entry.front === "string" &&
            typeof entry.back === "string" &&
            Array.isArray(entry.tags) &&
            typeof entry.timestamp === "number",
        )
        .map((entry) => ({
          front: entry.front,
          back: entry.back,
          tags: normalizeTags(entry.tags),
          timestamp: entry.timestamp,
        }))
        .slice(-MAX_HISTORY_PER_CARD),
    }));

    const now = Date.now();
    const trash = parsed.trash.filter(
      (item) => now - item.deletedAt <= THIRTY_DAYS_MS,
    );

    return {
      version: 1,
      decks: parsed.decks,
      cards,
      trash,
    };
  } catch {
    return defaultStudyData;
  }
};

const createCardId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export const useStudyData = () => {
  const [data, setData] = useState<StudyData>(() =>
    parseStoredData(localStorage.getItem(STORAGE_KEY)),
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const updateCard = useCallback((cardId: string, updates: CardUpdate) => {
    setData((current) => {
      const existing = current.cards.find((card) => card.id === cardId);
      if (!existing) return current;

      const normalizedUpdates: CardUpdate = {
        ...updates,
        tags: updates.tags ? normalizeTags(updates.tags) : undefined,
      };

      const nextCard: Card = {
        ...existing,
        ...normalizedUpdates,
      };

      const unchanged =
        existing.front === nextCard.front &&
        existing.back === nextCard.back &&
        existing.template === nextCard.template &&
        existing.deckId === nextCard.deckId &&
        existing.tags.join("|") === nextCard.tags.join("|");

      if (unchanged) return current;

      const historyEntry = buildHistoryEntry(existing);
      const cards = current.cards.map((card) =>
        card.id === cardId
          ? {
              ...nextCard,
              history: appendHistory(card.history, historyEntry),
            }
          : card,
      );

      return {
        ...current,
        cards,
      };
    });
  }, []);

  const addCard = useCallback((deckId: string, template: string) => {
    const cardId = createCardId();

    setData((current) => {
      const deck = current.decks.find((item) => item.id === deckId);
      const seedTag = deck?.name.split(" ")[0]?.toLowerCase() ?? "study";

      const newCard: Card = {
        id: cardId,
        deckId,
        template,
        front: "New flashcard question",
        back: "Add the answer, example, or equation here.",
        tags: [seedTag],
        history: [],
      };

      return {
        ...current,
        cards: [...current.cards, newCard],
      };
    });

    return cardId;
  }, []);

  const addDeck = useCallback(() => {
    const deckId = `deck-${Date.now()}`;

    setData((current) => {
      const nextNumber = current.decks.length + 1;
      const deckName = `New Deck ${nextNumber}`;
      return {
        ...current,
        decks: [
          ...current.decks,
          { id: deckId, name: deckName, color: "bg-primary", progress: 0 },
        ],
      };
    });

    return deckId;
  }, []);

  const deleteCard = useCallback((cardId: string) => {
    setData((current) => {
      const card = current.cards.find((item) => item.id === cardId);
      if (!card) return current;

      const trashItem: TrashItem = {
        ...card,
        deletedAt: Date.now(),
      };

      return {
        ...current,
        cards: current.cards.filter((item) => item.id !== cardId),
        trash: [trashItem, ...current.trash],
      };
    });
  }, []);

  const restoreCardFromTrash = useCallback((cardId: string) => {
    setData((current) => {
      const card = current.trash.find((item) => item.id === cardId);
      if (!card) return current;

      return {
        ...current,
        cards: [
          ...current.cards,
          {
            id: card.id,
            deckId: card.deckId,
            template: card.template,
            front: card.front,
            back: card.back,
            tags: card.tags,
            history: card.history,
          },
        ],
        trash: current.trash.filter((item) => item.id !== cardId),
      };
    });
  }, []);

  const restoreCardVersion = useCallback(
    (cardId: string, historyTimestamp: number) => {
      setData((current) => {
        const card = current.cards.find((item) => item.id === cardId);
        if (!card) return current;

        const targetVersion = card.history.find(
          (entry) => entry.timestamp === historyTimestamp,
        );
        if (!targetVersion) return current;

        const currentState = buildHistoryEntry(card);
        const cards = current.cards.map((item) => {
          if (item.id !== cardId) return item;

          return {
            ...item,
            front: targetVersion.front,
            back: targetVersion.back,
            tags: targetVersion.tags,
            history: appendHistory(item.history, currentState),
          };
        });

        return {
          ...current,
          cards,
        };
      });
    },
    [],
  );

  const restoreLatestVersion = useCallback((cardId: string) => {
    setData((current) => {
      const card = current.cards.find((item) => item.id === cardId);
      if (!card || !card.history.length) return current;

      const latest = card.history[card.history.length - 1];
      const currentState = buildHistoryEntry(card);

      const trimmedHistory = card.history.slice(0, -1);
      const cards = current.cards.map((item) => {
        if (item.id !== cardId) return item;

        return {
          ...item,
          front: latest.front,
          back: latest.back,
          tags: latest.tags,
          history: appendHistory(trimmedHistory, currentState),
        };
      });

      return {
        ...current,
        cards,
      };
    });
  }, []);

  const deckCardCounts = useMemo(() => {
    return data.cards.reduce<Record<string, number>>((counts, card) => {
      counts[card.deckId] = (counts[card.deckId] ?? 0) + 1;
      return counts;
    }, {});
  }, [data.cards]);

  return {
    decks: data.decks,
    cards: data.cards,
    trash: data.trash,
    deckCardCounts,
    addDeck,
    addCard,
    updateCard,
    deleteCard,
    restoreCardFromTrash,
    restoreCardVersion,
    restoreLatestVersion,
  };
};
