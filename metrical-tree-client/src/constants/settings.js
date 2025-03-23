export const DEFAULT_SETTINGS_CONFIG = {
  unstressedWords: ['it'],
  unstressedTags: ['CC', 'PRP$', 'TO', 'UH', 'DT'],
  unstressedDeps: ['det', 'expl', 'cc', 'mark'],
  ambiguousWords: ['this', 'that', 'these', 'those'],
  ambiguousTags: [
    'MD',
    'IN',
    'PRP',
    'WP$',
    'PDT',
    'WDT',
    'WP',
    'WRB',
  ],
  ambiguousDeps: ['cop', 'neg', 'aux', 'auxpass'],
  stressedWords: [],
};

export const SHORT_SAMPLE_TEXT =
  'Ask not what your country can do for you, ask what you can do for your country.';

export const MEDIUM_SAMPLE_TEXT =
  'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.';

export const LONG_SAMPLE_TEXT =
  'Yesterday, December 7, 1941 — a date which will live in infamy — the United States of America was suddenly and deliberately attacked by naval and air forces of the Empire of Japan. The United States was at peace with that nation and, at the solicitation of Japan, was still in conversation with its government and its emperor looking toward the maintenance of peace in the Pacific.';

export const BOOK_SAMPLE_TEXT =
  'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us, we were all going direct to Heaven, we were all going direct the other way — in short, the period was so far like the present period, that some of its noisiest authorities insisted on its being received, for good or for evil, in the superlative degree of comparison only.';

export const SAMPLE_TEXT_DESCRIPTIONS = {
  short: {
    name: 'Kennedy Quote',
    tooltip: 'JFK\'s famous inaugural address line (17 words) - Excellent for analyzing contrasting stress patterns in parallel structures'
  },
  medium: {
    name: 'Gettysburg Address',
    tooltip: 'Opening of Lincoln\'s historic speech (30 words) - Rich in historical language with formal oratorical stress patterns'
  },
  long: {
    name: 'FDR Pearl Harbor',
    tooltip: 'Roosevelt\'s "Day of Infamy" speech excerpt (65 words) - Complex political discourse with varied sentence structures'
  },
  book: {
    name: 'Tale of Two Cities',
    tooltip: 'Charles Dickens\' famous opening paragraph (120+ words) - Masterful use of parallel structure and antithesis, creating fascinating stress patterns'
  }
};
