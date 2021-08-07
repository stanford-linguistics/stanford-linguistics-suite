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

export const SAMPLE_RAW_TEXT =
  'We must adjust to changing times and still hold to unchanging principles.';
