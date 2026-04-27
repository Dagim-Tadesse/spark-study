// Utility functions for localStorage persistence
import type { Deck, Card, Settings, StudyEvent } from "./types";

const STORAGE_KEY = "spark-study-data";

export interface PersistedData {
  decks: Deck[];
  cards: Card[];
  studyEvents: StudyEvent[];
  settings: Settings;
  version: number;
}

const CURRENT_VERSION = 1;

export function loadData(): PersistedData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data.version !== "number") throw new Error("Missing version");
    return data;
  } catch (e) {
    console.error("Failed to load data:", e);
    return null;
  }
}

export function saveData(data: PersistedData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data:", e);
  }
}

export function clearData() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getDefaultData(): PersistedData {
  return {
    decks: [],
    cards: [],
    studyEvents: [],
    settings: { theme: "system", studySessionLength: 20 },
    version: CURRENT_VERSION,
  };
}
