// Generate a random UUID for chat identification
export const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Helper to create a text highlighter based on key terms
export const createKeyTermsMatcher = (text: string): string[] => {
  // Remove common words and extract key terms
  const commonWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "is",
    "are",
    "was",
    "were",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "by",
    "about",
    "as",
    "of",
  ]);

  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 3 &&
        !commonWords.has(word) &&
        !word.match(/[0-9]+/) &&
        !word.match(/^\W+$/)
    )
    .map((term) => term.replace(/[^\w]/g, ""));
};
