// Validation constants
export const DECK_NAME_MIN_LENGTH = 1;
export const DECK_NAME_MAX_LENGTH = 50;
export const CARD_TEXT_MAX_LENGTH = 10000;
export const CARD_TEXT_WARNING_LENGTH = 5000;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateDeckName = (name: string): ValidationResult => {
  const trimmed = name.trim();

  if (!trimmed) {
    return { isValid: false, error: "Deck name cannot be empty" };
  }

  if (trimmed.length > DECK_NAME_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Deck name must be ${DECK_NAME_MAX_LENGTH} characters or less`,
    };
  }

  return { isValid: true };
};

export const validateCardText = (text: string): ValidationResult => {
  if (text.length > CARD_TEXT_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Card content must be ${CARD_TEXT_MAX_LENGTH} characters or less`,
    };
  }

  return { isValid: true };
};

export const getCardTextWarning = (text: string): string | null => {
  if (text.length > CARD_TEXT_WARNING_LENGTH) {
    return `Card content is getting long (${text.length}/${CARD_TEXT_MAX_LENGTH} characters). Consider splitting into multiple cards.`;
  }
  return null;
};
