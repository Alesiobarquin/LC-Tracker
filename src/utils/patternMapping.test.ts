import { describe, it, expect, vi } from 'vitest';
import { getPatternForProblem } from './patternMapping';
import { Problem } from '../data/problems';

vi.mock('../data/leetcodeExtendedCatalog.json', () => ({
  default: {
    'mock-topological-sort': {
      topicTags: [{ name: 'Topological Sort' }]
    },
    'mock-heap': {
      topicTags: [{ name: 'Heap (Priority Queue)' }]
    },
    'mock-bfs': {
      topicTags: [{ name: 'Breadth-First Search' }]
    },
    'mock-sliding-window': {
      topicTags: [{ name: 'Sliding Window' }]
    },
    'mock-binary-search': {
      topicTags: [{ name: 'Binary Search' }]
    },
    'mock-two-pointers': {
      topicTags: [{ name: 'Two Pointers' }]
    }
  }
}));

describe('getPatternForProblem', () => {
  it('maps Fast and Slow Pointers based on specific titles', () => {
    const problem = { id: 'linked-list-cycle', title: 'Linked List Cycle' } as any as Problem;
    expect(getPatternForProblem(problem)).toBe('fast-slow-pointers');
  });

  it('maps Two Heaps based on specific titles', () => {
    const problem = { id: 'find-median', title: 'Find Median from Data Stream' } as any as Problem;
    expect(getPatternForProblem(problem)).toBe('two-heaps');
  });

  it('maps Topological Sort based on tags or title', () => {
    const problemByTag = { id: 'mock-topological-sort', title: 'Some Problem' } as any as Problem;
    expect(getPatternForProblem(problemByTag)).toBe('topological-sort');

    const problemByTitle = { id: 'alien-dict', title: 'Alien Dictionary' } as any as Problem;
    expect(getPatternForProblem(problemByTitle)).toBe('topological-sort');
  });

  it('maps Top K Elements based on tags+title or specific titles', () => {
    const problemByTagAndTitle1 = { id: 'mock-heap', title: 'Top K Frequent Elements' } as any as Problem;
    expect(getPatternForProblem(problemByTagAndTitle1)).toBe('top-k-elements');

    const problemByTagAndTitle2 = { id: 'mock-heap', title: 'Kth Largest Element' } as any as Problem;
    expect(getPatternForProblem(problemByTagAndTitle2)).toBe('top-k-elements');

    const problemByTagAndTitle3 = { id: 'mock-heap', title: 'K Closest Points' } as any as Problem;
    expect(getPatternForProblem(problemByTagAndTitle3)).toBe('top-k-elements');

    const problemByTitle = { id: 'task-scheduler', title: 'Task Scheduler' } as any as Problem;
    expect(getPatternForProblem(problemByTitle)).toBe('top-k-elements');
  });

  it('maps BFS based on tags, category+title, or specific titles', () => {
    const problemByTag = { id: 'mock-bfs', title: 'Some Problem' } as any as Problem;
    expect(getPatternForProblem(problemByTag)).toBe('bfs');

    const problemByCategoryAndTitle = { id: 'rotting-oranges', title: 'Rotting Oranges', category: 'Graphs' } as any as Problem;
    expect(getPatternForProblem(problemByCategoryAndTitle)).toBe('bfs');

    const problemByTitle = { id: 'word-ladder', title: 'Word Ladder' } as any as Problem;
    expect(getPatternForProblem(problemByTitle)).toBe('bfs');
  });

  it('maps Sliding Window based on tags or category', () => {
    const problemByTag = { id: 'mock-sliding-window', title: 'Some Problem' } as any as Problem;
    expect(getPatternForProblem(problemByTag)).toBe('sliding-window');

    const problemByCategory = { id: 'some-id', title: 'Some Problem', category: 'Sliding Window' } as any as Problem;
    expect(getPatternForProblem(problemByCategory)).toBe('sliding-window');
  });

  it('maps Binary Search based on tags or category', () => {
    const problemByTag = { id: 'mock-binary-search', title: 'Some Problem' } as any as Problem;
    expect(getPatternForProblem(problemByTag)).toBe('binary-search');

    const problemByCategory = { id: 'some-id', title: 'Some Problem', category: 'Binary Search' } as any as Problem;
    expect(getPatternForProblem(problemByCategory)).toBe('binary-search');
  });

  it('maps Two Pointers based on tags or category', () => {
    const problemByTag = { id: 'mock-two-pointers', title: 'Some Problem' } as any as Problem;
    expect(getPatternForProblem(problemByTag)).toBe('two-pointers');

    const problemByCategory = { id: 'some-id', title: 'Some Problem', category: 'Two Pointers' } as any as Problem;
    expect(getPatternForProblem(problemByCategory)).toBe('two-pointers');
  });

  it('returns null for unmapped problems', () => {
    const unmappedProblem = { id: 'unknown-id', title: 'Unknown Problem', category: 'Unknown Category' } as any as Problem;
    expect(getPatternForProblem(unmappedProblem)).toBeNull();
  });
});
