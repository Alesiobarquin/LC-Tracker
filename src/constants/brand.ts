export const BRAND = {
  name: 'LC Tracker',
  wordmark: 'LC TRACKER',
  seoTagline: 'LeetCode tracker for spaced repetition',
  landing: {
    badges: ['Pattern fluency', 'Daily momentum', 'Review memory', 'Spaced repetition'],
    headlineTop: 'Train With Structure.',
    headlineBottom: 'Keep What You Learn.',
    body: 'Track every LeetCode session, surface weak patterns, and review on schedule with a practical retention loop.',
    ctaPrimary: 'Start sprint',
    ctaSecondary: 'GitHub',
    loopTitle: 'Plan → Practice → Retain',
    loopBody: 'One daily loop. Three jobs. No random grinding.',
    loopSteps: [
      {
        title: 'Plan',
        body: 'Get a focused daily set from your curriculum, reviews due, and time budget.',
      },
      {
        title: 'Practice',
        body: 'Log attempts with timing and notes so weak spots stay visible.',
      },
      {
        title: 'Retain',
        body: 'Spaced reviews resurface problems before they fade — not after.',
      },
    ],
    previewTitle: 'See the workflow',
    previewBody: 'A quiet daily plan, a review queue that respects memory, and pattern progress you can trust.',
    featuresHeadlineA: 'Retention-first review scheduling',
    featuresHeadlineB: 'Data-backed practice loops',
    featuresHeadlineC: 'Session traceability',
    finalCtaTitle: 'Ready to prepare better?',
    finalCtaBody: 'Build consistency with a focused plan, not random grinding.',
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
        title: 'Local-first mindset',
        body: 'Track prep without invented vanity metrics or locked-in progress.',
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
