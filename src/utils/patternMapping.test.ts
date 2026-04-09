import { describe, it, expect, vi } from 'vitest';
import { getPatternForProblem } from './patternMapping';
import { Problem } from '../data/problems';

vi.mock('../data/leetcodeExtendedCatalog.json', () => ({
  default: {
    'problem-with-tags': {
      topicTags: [{ name: 'Topological Sort' }]
    },
    'problem-with-heap-tag': {
      topicTags: [{ name: 'Heap (Priority Queue)' }]
    },
    'problem-with-bfs-tag': {
      topicTags: [{ name: 'Breadth-First Search' }]
    },
    'problem-with-sliding-window-tag': {
      topicTags: [{ name: 'Sliding Window' }]
    },
    'problem-with-binary-search-tag': {
      topicTags: [{ name: 'Binary Search' }]
    },
    'problem-with-two-pointers-tag': {
      topicTags: [{ name: 'Two Pointers' }]
    }
  }
}));

describe('getPatternForProblem', () => {
  const createMockProblem = (overrides: Partial<Problem> = {}): Problem => ({
    id: 'test-id',
    title: 'Test Problem',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    leetcodeUrl: '',
    videoUrl: '',
    isNeetCode75: false,
    isBlind75: false,
    isNeetCode150: false,
    isNeetCode250: false,
    ...overrides
  });

  it('identifies Fast and Slow Pointers by title', () => {
    const problem = createMockProblem({ title: 'Linked List Cycle' });
    expect(getPatternForProblem(problem)).toBe('fast-slow-pointers');

    const problem2 = createMockProblem({ title: 'Happy Number' });
    expect(getPatternForProblem(problem2)).toBe('fast-slow-pointers');
  });

  it('identifies Two Heaps by title', () => {
    const problem = createMockProblem({ title: 'Find Median from Data Stream' });
    expect(getPatternForProblem(problem)).toBe('two-heaps');
  });

  it('identifies Topological Sort by tag or title', () => {
    const problemByTag = createMockProblem({ id: 'problem-with-tags' });
    expect(getPatternForProblem(problemByTag)).toBe('topological-sort');

    const problemByTitle = createMockProblem({ title: 'Course Schedule II' });
    expect(getPatternForProblem(problemByTitle)).toBe('topological-sort');

    const problemByExactTitle = createMockProblem({ title: 'Alien Dictionary' });
    expect(getPatternForProblem(problemByExactTitle)).toBe('topological-sort');
  });

  it('identifies Top K Elements by tag and title or specific title', () => {
    const problemByTagAndTitle = createMockProblem({
      id: 'problem-with-heap-tag',
      title: 'Top K Frequent Elements'
    });
    expect(getPatternForProblem(problemByTagAndTitle)).toBe('top-k-elements');

    const problemBySpecificTitle = createMockProblem({ title: 'Task Scheduler' });
    expect(getPatternForProblem(problemBySpecificTitle)).toBe('top-k-elements');
  });

  it('identifies BFS by tag, category/title, or specific title', () => {
    const problemByTag = createMockProblem({ id: 'problem-with-bfs-tag' });
    expect(getPatternForProblem(problemByTag)).toBe('bfs');

    const problemByCategoryTitle = createMockProblem({
      category: 'Graphs',
      title: 'Rotting Oranges'
    });
    expect(getPatternForProblem(problemByCategoryTitle)).toBe('bfs');

    const problemBySpecificTitle = createMockProblem({ title: 'Word Ladder' });
    expect(getPatternForProblem(problemBySpecificTitle)).toBe('bfs');
  });

  it('identifies Sliding Window by tag or category', () => {
    const problemByTag = createMockProblem({ id: 'problem-with-sliding-window-tag' });
    expect(getPatternForProblem(problemByTag)).toBe('sliding-window');

    const problemByCategory = createMockProblem({ category: 'Sliding Window' });
    expect(getPatternForProblem(problemByCategory)).toBe('sliding-window');
  });

  it('identifies Binary Search by tag or category', () => {
    const problemByTag = createMockProblem({ id: 'problem-with-binary-search-tag' });
    expect(getPatternForProblem(problemByTag)).toBe('binary-search');

    const problemByCategory = createMockProblem({ category: 'Binary Search' });
    expect(getPatternForProblem(problemByCategory)).toBe('binary-search');
  });

  it('identifies Two Pointers by tag or category', () => {
    const problemByTag = createMockProblem({ id: 'problem-with-two-pointers-tag' });
    expect(getPatternForProblem(problemByTag)).toBe('two-pointers');

    const problemByCategory = createMockProblem({ category: 'Two Pointers' });
    expect(getPatternForProblem(problemByCategory)).toBe('two-pointers');
  });

  it('returns null for problems that do not match any pattern', () => {
    const problem = createMockProblem({
      id: 'no-pattern',
      title: 'Contains Duplicate',
      category: 'Arrays & Hashing'
    });
    expect(getPatternForProblem(problem)).toBeNull();
  });
});
