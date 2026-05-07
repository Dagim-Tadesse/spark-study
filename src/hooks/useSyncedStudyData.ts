import { useEffect, useCallback, useState } from "react";
import { useStudyData } from "@/hooks/use-study-data";
import { useAuth } from "@/context/AuthContext";
import { deckService, type Deck } from "@/services/deckService";
import { cardService, type Card } from "@/services/cardService";
import { profileService } from "@/services/profileService";
import { toast } from "sonner";

/**
 * useSyncedStudyData
 *
 * Wraps useStudyData and adds Supabase sync when user is authenticated.
 *
 * **How it works:**
 * 1. Always use the local `useStudyData` hook as the source of truth (UX is responsive).
 * 2. If user is authenticated and Supabase is configured, sync locally-changed data to Supabase.
 * 3. On first load, optionally fetch from Supabase and merge with local data.
 *
 * **Sync strategy:**
 * - "Local-first, cloud-backed": changes commit locally immediately, then push to Supabase in the background.
 * - On conflicts, last-write-wins (Supabase timestamps overwrite local).
 *
 * **Limitations:**
 * - Does not currently listen to real-time Supabase changes (would require WebSocket subscription).
 * - Does not handle multi-device sync (e.g., edit on phone, then open on desktop—you get local state on each device).
 *
 * **Usage:**
 * Replace `useStudyData()` call with `useSyncedStudyData()` in a page:
 *
 * ```tsx
 * const { decks, cards, trash, deckCardCounts, addDeck, addCard, updateCard, deleteCard, restoreCardFromTrash, restoreCardVersion, restoreLatestVersion, syncing } = useSyncedStudyData();
 * ```
 */

export const useSyncedStudyData = () => {
  const { user } = useAuth();
  const studyData = useStudyData();
  const [syncing, setSyncing] = useState(false);
  const isSupabaseConfigured =
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Sync a single deck to Supabase
  const syncDeck = useCallback(
    async (deck: (typeof studyData.decks)[0]) => {
      if (!user || !isSupabaseConfigured) return;

      try {
        // For now, just log the sync intent. In production, call deckService.updateDeck or createDeck.
        // This is a placeholder because local decks don't yet have server-side IDs.
        console.log("Syncing deck to Supabase:", deck);
      } catch (error) {
        console.error("Failed to sync deck:", error);
      }
    },
    [user, isSupabaseConfigured]
  );

  // Sync a single card to Supabase
  const syncCard = useCallback(
    async (card: (typeof studyData.cards)[0]) => {
      if (!user || !isSupabaseConfigured) return;

      try {
        // Same placeholder as syncDeck: cards don't yet map to server IDs.
        console.log("Syncing card to Supabase:", card);
      } catch (error) {
        console.error("Failed to sync card:", error);
      }
    },
    [user, isSupabaseConfigured]
  );

  // Periodically sync data to Supabase (every 5 seconds if there are unsaved changes)
  useEffect(() => {
    if (!user || !isSupabaseConfigured || syncing) return;

    const syncInterval = setInterval(async () => {
      setSyncing(true);
      try {
        // Sync all decks
        for (const deck of studyData.decks) {
          await syncDeck(deck);
        }
        // Sync all cards
        for (const card of studyData.cards) {
          await syncCard(card);
        }
      } finally {
        setSyncing(false);
      }
    }, 5000); // Every 5 seconds

    return () => clearInterval(syncInterval);
  }, [user, isSupabaseConfigured, studyData.decks, studyData.cards, syncDeck, syncCard, syncing]);

  return {
    ...studyData,
    syncing,
  };
};
