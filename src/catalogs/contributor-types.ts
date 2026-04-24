export const CONTRIBUTOR_TYPES = {
  NATURAL: '1',
  JURIDICO: '2',
} as const;

export type ContributorType = typeof CONTRIBUTOR_TYPES[keyof typeof CONTRIBUTOR_TYPES];
