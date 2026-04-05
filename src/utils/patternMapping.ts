import { PatternId } from '../types';
import { type Problem } from '../data/problems';
import leetcodeExtendedCatalogJson from '../data/leetcodeExtendedCatalog.json';

type ExtendedCatalog = Record<
  string, // string id, e.g. "contains-duplicate"
  {
    id: number;
    title: string;
    titleSlug: string;
    difficulty: string;
    paidOnly: boolean;
    topicTags: { name: string; id: string; slug: string }[];
  }
>;

const catalog = leetcodeExtendedCatalogJson as unknown as ExtendedCatalog;

export const getPatternForProblem = (problem: Problem): PatternId | null => {
  const catalogEntry = catalog[problem.id];
  const tags = catalogEntry?.topicTags.map(t => t.name) || [];

  // Fast and Slow Pointers (cycle detection, usually Linked List with Two Pointers)
  if (
    problem.title === 'Linked List Cycle' ||
    problem.title === 'Linked List Cycle II' ||
    problem.title === 'Happy Number' ||
    problem.title === 'Find the Duplicate Number' ||
    problem.title === 'Middle of the Linked List' ||
    problem.title === 'Palindrome Linked List' ||
    problem.title === 'Remove Nth Node From End of List' ||
    problem.title === 'Reorder List' ||
    problem.title === 'Sort List'
  ) {
    return 'fast-slow-pointers';
  }

  // Two Heaps
  if (
    problem.title === 'Find Median from Data Stream' ||
    problem.title === 'Sliding Window Median' ||
    problem.title === 'IPO' ||
    problem.title === 'Maximize Capital'
  ) {
    return 'two-heaps';
  }

  // Topological Sort
  if (
    tags.includes('Topological Sort') || 
    problem.title.includes('Course Schedule') ||
    problem.title === 'Alien Dictionary' ||
    problem.title === 'Sequence Reconstruction'
  ) {
    return 'topological-sort';
  }

  // Top K Elements
  if (
    (tags.includes('Heap (Priority Queue)') && (problem.title.includes('Kth') || problem.title.includes('Top K') || problem.title.includes('K Closest'))) ||
    problem.title === 'Task Scheduler' ||
    problem.title === 'Kth Largest Element in an Array' ||
    problem.title === 'Kth Largest Element in a Stream' ||
    problem.title === 'Top K Frequent Elements' ||
    problem.title === 'K Closest Points to Origin' ||
    problem.title === 'Find K Pairs with Smallest Sums' ||
    problem.title === 'Design Twitter'
  ) {
      return 'top-k-elements';
  }

  // BFS
  if (
    tags.includes('Breadth-First Search') || 
    (problem.category === 'Graphs' && problem.title.includes('Rotting Oranges')) ||
    problem.title.includes('Level Order Traversal') ||
    problem.title === 'Word Ladder' ||
    problem.title === 'Minimum Depth of Binary Tree' ||
    problem.title === 'Populating Next Right Pointers in Each Node' ||
    problem.title === 'Shortest Path in Binary Matrix'
  ) {
    return 'bfs';
  }

  // Sliding Window
  if (tags.includes('Sliding Window') || problem.category === 'Sliding Window') {
    return 'sliding-window';
  }

  // Binary Search
  if (tags.includes('Binary Search') || problem.category === 'Binary Search') {
    return 'binary-search';
  }

  // Two Pointers
  if (tags.includes('Two Pointers') || problem.category === 'Two Pointers') {
    return 'two-pointers';
  }

  return null; // Not matching any of the 8 core patterns
};
