export const BRAND = {
  name: 'LC Tracker',
  wordmark: 'LC TRACKER',
  seoTagline: 'LeetCode tracker for spaced repetition',
  landing: {
    badges: ['Pattern fluency', 'Daily momentum', 'Review memory', 'Spaced repetition'],
    headlineTop: 'Practice LeetCode.',
    headlineBottom: 'Recall and implement.',
    body: 'Plan LeetCode practice around your daily time budget. Combine recall checks, coding, new learning, and unseen variations.',
    ctaPrimary: 'Start studying',
    ctaSecondary: 'GitHub',
    loopTitle: 'Plan → Practice → Retain',
    loopBody: 'A daily plan combines retrieval and implementation, while protecting time for new learning.',
    loopSteps: [
      {
        title: 'Plan',
        body: 'Get a focused daily set from your curriculum, reviews due, and time budget.',
      },
      {
        title: 'Practice',
        body: 'Retrieve before opening notes. Record correctness, hints, and explanation after coding.',
      },
      {
        title: 'Retain',
        body: 'Revisit reasoning and implementation after a delay, then try an unseen variation.',
      },
    ],
    previewTitle: 'See the workflow',
    previewBody: 'Illustrative examples of a budgeted plan and recorded evidence. These are not user results.',
    featuresHeadlineA: 'Separate recall and coding schedules',
    featuresHeadlineB: 'Learning outcomes and study time',
    featuresHeadlineC: 'Session traceability',
    finalCtaTitle: 'Choose a daily study budget',
    finalCtaBody: 'Track recall and coding attempts while making time for new topics.',
    finalCtaAction: 'Create account',
    trustTitle: 'Built to stay yours',
    trustItems: [
      {
        title: 'Exportable JSON backups',
        body: 'Download your progress anytime. Your data is portable.',
      },
      {
        title: 'Open source',
        body: 'Inspect the code, file issues, and follow the build on GitHub.',
      },
      {
        title: 'Separate evidence from confidence',
        body: 'Imported solves start with unknown confidence. Recall success does not count as a coding pass.',
      },
    ],
    footerStatus: 'Built in public',
  },
  shell: {
    featuresButton: 'Product tour',
    feedbackButton: 'Report issue',
    logoutButton: 'Sign out',
  },
  login: {
    title: 'LC Tracker',
    subtitle: 'Structured LeetCode tracking, review scheduling, and interview prep in one focused workflow.',
    backLabel: 'Back',
  },
} as const;
