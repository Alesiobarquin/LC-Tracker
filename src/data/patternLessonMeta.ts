import type { PatternId } from '../types';

export type PatternStage =
  | 'Foundations'
  | 'Traversal'
  | 'Search & Ordering'
  | 'Graphs'
  | 'Dynamic Programming'
  | 'Advanced Optimization';

export interface PatternLessonMeta {
  stage: PatternStage;
  recognitionSignals: string[];
  antiPatterns: string[];
  prerequisites: PatternId[];
  invariants: string[];
  commonMistakes: string[];
  complexity: string;
  estimatedMinutes: number;
  workedExample: {
    title: string;
    input: string;
    walkthrough: string[];
    result: string;
  };
}

const defaultMeta = (stage: PatternStage, estimatedMinutes = 25): PatternLessonMeta => ({
  stage,
  recognitionSignals: [
    'The problem asks for relationships between positions, windows, or ordered state.',
    'A brute-force nested loop can be reduced by maintaining local pointers or state.',
  ],
  antiPatterns: [
    'Do not force this pattern when the input is unordered and hashing is enough.',
    'Avoid coding the template before naming the invariant you need to preserve.',
  ],
  prerequisites: [],
  invariants: [
    'Name what stays true after every move.',
    'Track the exact condition that lets you discard work safely.',
  ],
  commonMistakes: [
    'Off-by-one updates on loop bounds.',
    'Updating state after comparing instead of before.',
    'Confusing “solved once” with pattern mastery.',
  ],
  complexity: 'Typically better than the obvious O(N^2) approach; verify with the template.',
  estimatedMinutes,
  workedExample: {
    title: 'Recognition drill',
    input: 'Identify the reusable state and the rule that advances it.',
    walkthrough: [
      'Restate the goal in one sentence.',
      'Name the moving parts and what they represent.',
      'Write the loop invariant before coding.',
      'Trace one failing case that breaks a naive approach.',
    ],
    result: 'You can explain when to reach for the pattern and when to abandon it.',
  },
});

export const PATTERN_LESSON_META: Partial<Record<PatternId, PatternLessonMeta>> = {
  'two-pointers': {
    stage: 'Foundations',
    recognitionSignals: [
      'Array/string is sorted or can be processed from both ends.',
      'You need a pair/triple whose sum or difference meets a target.',
      'You can discard one side after comparing the current pair.',
    ],
    antiPatterns: [
      'Do not use converging pointers on unsorted pair-sum problems without sorting or hashing first.',
      'Do not advance both pointers after every comparison.',
    ],
    prerequisites: [],
    invariants: [
      'Everything outside [l, r] has already been considered and can be ignored.',
      'The current pair is the next best candidate under the ordering constraint.',
    ],
    commonMistakes: [
      'Forgetting to skip duplicates in multi-sum variants.',
      'Using <= instead of < and revisiting the same index.',
      'Sorting when relative indices matter and the problem forbids it.',
    ],
    complexity: 'O(N) after sorting when needed; O(1) extra space for the classic converging form.',
    estimatedMinutes: 30,
    workedExample: {
      title: 'Two Sum II on a sorted array',
      input: 'nums = [2, 7, 11, 15], target = 9',
      walkthrough: [
        'Start with l=0 (2) and r=3 (15). Sum=17 is too large, so move r left.',
        'Now l=0 (2), r=2 (11). Sum=13 is still too large, so move r left again.',
        'Now l=0 (2), r=1 (7). Sum=9 matches the target.',
        'Return the 1-indexed pair [1, 2].',
      ],
      result: '[1, 2]',
    },
  },
  'fast-slow-pointers': {
    ...defaultMeta('Foundations', 25),
    recognitionSignals: [
      'Cycle detection in a linked list or functional graph.',
      'Finding a middle node in one pass.',
      'Need O(1) space instead of a visited set.',
    ],
    prerequisites: ['two-pointers'],
  },
  'sliding-window': {
    ...defaultMeta('Foundations', 35),
    recognitionSignals: [
      'Contiguous subarray/substring with a constraint on sum, uniqueness, or frequency.',
      'You can grow a right edge and shrink a left edge while maintaining window state.',
    ],
    prerequisites: ['two-pointers'],
  },
  'two-heaps': {
    ...defaultMeta('Advanced Optimization', 30),
    recognitionSignals: [
      'Need a running median or balanced split of a stream.',
      'You repeatedly need the current largest of one half and smallest of the other.',
    ],
  },
  'top-k-elements': {
    ...defaultMeta('Search & Ordering', 30),
    recognitionSignals: [
      'Find the K largest/smallest/most frequent items.',
      'A full sort is unnecessary if only the boundary matters.',
    ],
  },
  'binary-search': {
    ...defaultMeta('Search & Ordering', 35),
    recognitionSignals: [
      'Search space is monotonic: once a predicate flips, it stays flipped.',
      'You need the first/last valid boundary rather than an exact match only.',
    ],
  },
  'topological-sort': {
    ...defaultMeta('Graphs', 35),
    recognitionSignals: [
      'Tasks have prerequisites or directed dependencies.',
      'You need a valid order or to detect a cycle in a DAG-like graph.',
    ],
  },
  bfs: {
    ...defaultMeta('Graphs', 30),
    recognitionSignals: [
      'Shortest path in an unweighted graph.',
      'Level-order traversal of trees or grids.',
    ],
  },
};

export const PATTERN_STAGE_ORDER: PatternStage[] = [
  'Foundations',
  'Traversal',
  'Search & Ordering',
  'Graphs',
  'Dynamic Programming',
  'Advanced Optimization',
];

export function getPatternLessonMeta(id: PatternId, isCore?: boolean): PatternLessonMeta {
  return PATTERN_LESSON_META[id] ?? defaultMeta(isCore === false ? 'Advanced Optimization' : 'Traversal');
}
