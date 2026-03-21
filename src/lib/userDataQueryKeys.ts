export const userDataQueryKeys = {
  settings: (userId: string) => ['user-settings', userId] as const,
  progress: (userId: string) => ['progress', userId] as const,
  activity: (userId: string) => ['activity-log', userId] as const,
  timings: (userId: string) => ['session-timings', userId] as const,
  sprint: (userId: string) => ['sprint-state', userId] as const,
};
