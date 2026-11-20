/** Lesson → paired Code Portal task IDs for the owner-only software engineering and C# & .NET tracks.
 *  IDs only: the lessons and tasks themselves are served from the private owner-content bucket. */

/** Lesson → paired Code Portal tasks (two verified tasks per lesson). */
export const SE_LESSON_TASKS: Record<string, string[]> = {
  ...Object.fromEntries(Array.from({ length: 11 }, (_, i) => [
    `sef-${i + 1}`,
    [`se-fnd-${String(2 * i + 1).padStart(2, '0')}`, `se-fnd-${String(2 * i + 2).padStart(2, '0')}`],
  ])),
  'swe-1': ['se-swe-01', 'se-swe-02'],
  'swe-2': ['se-swe-03', 'se-swe-04'],
  'swe-3': ['se-swe-05', 'se-swe-06'],
  'swe-4': ['se-swe-07', 'se-swe-08'],
  'swe-5': ['se-swe-09', 'se-swe-10'],
  'swe-6': ['se-swe-11', 'se-swe-12'],
  'swe-7': ['se-swe-13', 'se-swe-14'],
  'swe-8': ['se-swe-15', 'se-swe-16'],
  'swe-9': ['se-swe-17', 'se-swe-18'],
  'swe-10': ['se-swe-19', 'se-swe-20'],
  'swe-11': ['se-swe-21', 'se-swe-22'],
  'swe-12': ['se-swe-23', 'se-swe-24'],
  'swe-13': ['se-swe-25', 'se-swe-26'],
  'swe-14': ['se-swe-27', 'se-swe-28'],
  'swe-15': ['se-swe-29', 'se-swe-30'],
  'swe-16': ['se-swe-31', 'se-swe-32'],
  'swe-17': ['se-swe-33', 'se-swe-34'],
  'swe-18': ['se-swe-35', 'se-swe-36'],
  'swe-19': ['se-swe-37', 'se-swe-38', 'se-swe-39'],
  'swe-20': ['se-swe-40', 'se-swe-41'],
  'swe-21': ['se-swe-42', 'se-swe-43'],
  'swe-22': ['se-swe-44', 'se-swe-45'],
  'swe-23': ['se-swe-46', 'se-swe-47'],
  'swe-24': ['se-swe-48', 'se-swe-49'],
};

/** Lesson → paired Code Portal tasks (two verified tasks per lesson: C#, TypeScript, or Month 5's configuration tasks). */
const pairTasks = (lessonPrefix: string, taskPrefix: string, lessons: number) =>
  Array.from({ length: lessons }, (_, i) => [
    `${lessonPrefix}-${i + 1}`,
    [`${taskPrefix}-${String(2 * i + 1).padStart(2, '0')}`, `${taskPrefix}-${String(2 * i + 2).padStart(2, '0')}`],
  ] as const);

export const DN_LESSON_TASKS: Record<string, string[]> = Object.fromEntries([
  ...pairTasks('dn0', 'cs-0', 10),
  ...pairTasks('dn1', 'cs-1', 8),
  ...pairTasks('dn2', 'cs-2', 8),
  ...pairTasks('dn3', 'cs-3', 8),
  ...pairTasks('dn4', 'ts-4', 8),
  ...pairTasks('dn5', 'ops-5', 8),
  ...pairTasks('dn6', 'cs-6', 8),
].map(([lesson, tasks]) => [lesson, [...tasks]]));
