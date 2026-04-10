export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type Category =
  | 'Arrays & Hashing'
  | 'Two Pointers'
  | 'Sliding Window'
  | 'Stack'
  | 'Binary Search'
  | 'Linked List'
  | 'Trees'
  | 'Tries'
  | 'Heap / Priority Queue'
  | 'Backtracking'
  | 'Graphs'
  | 'Advanced Graphs'
  | '1-D Dynamic Programming'
  | '2-D Dynamic Programming'
  | 'Greedy'
  | 'Intervals'
  | 'Math & Geometry'
  | 'Bit Manipulation';

import type { TargetCurriculum } from '../types';
import { MockInterviewContent, mockProblemContent } from './mockProblems';
import leetcodeExtendedCatalogJson from './leetcodeExtendedCatalog.json';
import leetcodePremiumStatusJson from './leetcodePremiumStatus.json';

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  category: Category;
  leetcodeUrl: string;
  videoUrl: string;
  isNeetCode75: boolean;
  isBlind75: boolean;
  isNeetCode150: boolean;
  /** True for all 250 NeetCode 250 curriculum problems (includes full NeetCode 150). */
  isNeetCode250: boolean;
  /** LeetCode paidOnly status fetched from GraphQL metadata refresh. */
  isPremium?: boolean;
  /** Extra LeetCode problems beyond NeetCode 250 (full catalog browse / sprint tier 4). */
  isExtendedCatalog?: boolean;
  mockInterviewContent?: MockInterviewContent;
}

type PremiumStatusPayload = {
  statusById?: Record<string, boolean>;
};

const premiumStatusById = ((leetcodePremiumStatusJson as PremiumStatusPayload).statusById ?? {}) as Record<
  string,
  boolean
>;

export function isProblemPremium(problem: Pick<Problem, 'id' | 'isPremium'>): boolean {
  if (typeof problem.isPremium === 'boolean') return problem.isPremium;
  return Boolean(premiumStatusById[problem.id]);
}

export const TARGET_CURRICULUM_LABELS: Record<TargetCurriculum, string> = {
  NEET_75: 'NeetCode 75',
  NEET_150: 'NeetCode 150',
  NEET_250: 'NeetCode 250',
  EXTENDED: 'NeetCode 250 + extended catalog',
};

/** Whether a problem belongs to the user’s selected target curriculum. */
export function problemMatchesTargetCurriculum(p: Problem, target: TargetCurriculum): boolean {
  switch (target) {
    case 'NEET_75':
      return p.isNeetCode75;
    case 'NEET_150':
      return p.isNeetCode150;
    case 'NEET_250':
      return p.isNeetCode250;
    case 'EXTENDED':
      return p.isNeetCode250 || !!p.isExtendedCatalog;
    default:
      return p.isNeetCode75;
  }
}

export const problems: Problem[] = ([
  { id: 'contains-duplicate', title: 'Contains Duplicate', difficulty: 'Easy', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/contains-duplicate/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'valid-anagram', title: 'Valid Anagram', difficulty: 'Easy', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/valid-anagram/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'two-sum', title: 'Two Sum', difficulty: 'Easy', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/two-sum/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'group-anagrams', title: 'Group Anagrams', difficulty: 'Medium', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/group-anagrams/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'top-k-frequent-elements', title: 'Top K Frequent Elements', difficulty: 'Medium', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/top-k-frequent-elements/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'product-of-array-except-self', title: 'Product of Array Except Self', difficulty: 'Medium', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/product-of-array-except-self/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'valid-sudoku', title: 'Valid Sudoku', difficulty: 'Medium', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/valid-sudoku/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'encode-and-decode-strings', title: 'Encode and Decode Strings', difficulty: 'Medium', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/encode-and-decode-strings/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'longest-consecutive-sequence', title: 'Longest Consecutive Sequence', difficulty: 'Medium', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/longest-consecutive-sequence/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'valid-palindrome', title: 'Valid Palindrome', difficulty: 'Easy', category: 'Two Pointers', leetcodeUrl: 'https://leetcode.com/problems/valid-palindrome/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'two-sum-ii-input-array-is-sorted', title: 'Two Sum II - Input Array Is Sorted', difficulty: 'Medium', category: 'Two Pointers', leetcodeUrl: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: '3sum', title: '3Sum', difficulty: 'Medium', category: 'Two Pointers', leetcodeUrl: 'https://leetcode.com/problems/3sum/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'container-with-most-water', title: 'Container With Most Water', difficulty: 'Medium', category: 'Two Pointers', leetcodeUrl: 'https://leetcode.com/problems/container-with-most-water/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'trapping-rain-water', title: 'Trapping Rain Water', difficulty: 'Hard', category: 'Two Pointers', leetcodeUrl: 'https://leetcode.com/problems/trapping-rain-water/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'best-time-to-buy-and-sell-stock', title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', category: 'Sliding Window', leetcodeUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'longest-substring-without-repeating-characters', title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', category: 'Sliding Window', leetcodeUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'longest-repeating-character-replacement', title: 'Longest Repeating Character Replacement', difficulty: 'Medium', category: 'Sliding Window', leetcodeUrl: 'https://leetcode.com/problems/longest-repeating-character-replacement/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'permutation-in-string', title: 'Permutation in String', difficulty: 'Medium', category: 'Sliding Window', leetcodeUrl: 'https://leetcode.com/problems/permutation-in-string/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'minimum-window-substring', title: 'Minimum Window Substring', difficulty: 'Hard', category: 'Sliding Window', leetcodeUrl: 'https://leetcode.com/problems/minimum-window-substring/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'sliding-window-maximum', title: 'Sliding Window Maximum', difficulty: 'Hard', category: 'Sliding Window', leetcodeUrl: 'https://leetcode.com/problems/sliding-window-maximum/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'valid-parentheses', title: 'Valid Parentheses', difficulty: 'Easy', category: 'Stack', leetcodeUrl: 'https://leetcode.com/problems/valid-parentheses/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'min-stack', title: 'Min Stack', difficulty: 'Medium', category: 'Stack', leetcodeUrl: 'https://leetcode.com/problems/min-stack/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'evaluate-reverse-polish-notation', title: 'Evaluate Reverse Polish Notation', difficulty: 'Medium', category: 'Stack', leetcodeUrl: 'https://leetcode.com/problems/evaluate-reverse-polish-notation/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'generate-parentheses', title: 'Generate Parentheses', difficulty: 'Medium', category: 'Stack', leetcodeUrl: 'https://leetcode.com/problems/generate-parentheses/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'daily-temperatures', title: 'Daily Temperatures', difficulty: 'Medium', category: 'Stack', leetcodeUrl: 'https://leetcode.com/problems/daily-temperatures/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'car-fleet', title: 'Car Fleet', difficulty: 'Medium', category: 'Stack', leetcodeUrl: 'https://leetcode.com/problems/car-fleet/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'largest-rectangle-in-histogram', title: 'Largest Rectangle in Histogram', difficulty: 'Hard', category: 'Stack', leetcodeUrl: 'https://leetcode.com/problems/largest-rectangle-in-histogram/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'binary-search', title: 'Binary Search', difficulty: 'Easy', category: 'Binary Search', leetcodeUrl: 'https://leetcode.com/problems/binary-search/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'search-a-2d-matrix', title: 'Search a 2D Matrix', difficulty: 'Medium', category: 'Binary Search', leetcodeUrl: 'https://leetcode.com/problems/search-a-2d-matrix/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'koko-eating-bananas', title: 'Koko Eating Bananas', difficulty: 'Medium', category: 'Binary Search', leetcodeUrl: 'https://leetcode.com/problems/koko-eating-bananas/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'find-minimum-in-rotated-sorted-array', title: 'Find Minimum in Rotated Sorted Array', difficulty: 'Medium', category: 'Binary Search', leetcodeUrl: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'search-in-rotated-sorted-array', title: 'Search in Rotated Sorted Array', difficulty: 'Medium', category: 'Binary Search', leetcodeUrl: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'time-based-key-value-store', title: 'Time Based Key-Value Store', difficulty: 'Medium', category: 'Binary Search', leetcodeUrl: 'https://leetcode.com/problems/time-based-key-value-store/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'median-of-two-sorted-arrays', title: 'Median of Two Sorted Arrays', difficulty: 'Hard', category: 'Binary Search', leetcodeUrl: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'reverse-linked-list', title: 'Reverse Linked List', difficulty: 'Easy', category: 'Linked List', leetcodeUrl: 'https://leetcode.com/problems/reverse-linked-list/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'merge-two-sorted-lists', title: 'Merge Two Sorted Lists', difficulty: 'Easy', category: 'Linked List', leetcodeUrl: 'https://leetcode.com/problems/merge-two-sorted-lists/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'reorder-list', title: 'Reorder List', difficulty: 'Medium', category: 'Linked List', leetcodeUrl: 'https://leetcode.com/problems/reorder-list/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'remove-nth-node-from-end-of-list', title: 'Remove Nth Node From End of List', difficulty: 'Medium', category: 'Linked List', leetcodeUrl: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'copy-list-with-random-pointer', title: 'Copy List with Random Pointer', difficulty: 'Medium', category: 'Linked List', leetcodeUrl: 'https://leetcode.com/problems/copy-list-with-random-pointer/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'add-two-numbers', title: 'Add Two Numbers', difficulty: 'Medium', category: 'Linked List', leetcodeUrl: 'https://leetcode.com/problems/add-two-numbers/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'linked-list-cycle', title: 'Linked List Cycle', difficulty: 'Easy', category: 'Linked List', leetcodeUrl: 'https://leetcode.com/problems/linked-list-cycle/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'find-the-duplicate-number', title: 'Find the Duplicate Number', difficulty: 'Medium', category: 'Linked List', leetcodeUrl: 'https://leetcode.com/problems/find-the-duplicate-number/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'lru-cache', title: 'LRU Cache', difficulty: 'Medium', category: 'Linked List', leetcodeUrl: 'https://leetcode.com/problems/lru-cache/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'merge-k-sorted-lists', title: 'Merge k Sorted Lists', difficulty: 'Hard', category: 'Linked List', leetcodeUrl: 'https://leetcode.com/problems/merge-k-sorted-lists/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'reverse-nodes-in-k-group', title: 'Reverse Nodes in k-Group', difficulty: 'Hard', category: 'Linked List', leetcodeUrl: 'https://leetcode.com/problems/reverse-nodes-in-k-group/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'invert-binary-tree', title: 'Invert Binary Tree', difficulty: 'Easy', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/invert-binary-tree/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'maximum-depth-of-binary-tree', title: 'Maximum Depth of Binary Tree', difficulty: 'Easy', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'diameter-of-binary-tree', title: 'Diameter of Binary Tree', difficulty: 'Easy', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/diameter-of-binary-tree/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'balanced-binary-tree', title: 'Balanced Binary Tree', difficulty: 'Easy', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/balanced-binary-tree/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'same-tree', title: 'Same Tree', difficulty: 'Easy', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/same-tree/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'subtree-of-another-tree', title: 'Subtree of Another Tree', difficulty: 'Easy', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/subtree-of-another-tree/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'lowest-common-ancestor-of-a-binary-search-tree', title: 'Lowest Common Ancestor of a Binary Search Tree', difficulty: 'Medium', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'binary-tree-level-order-traversal', title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'binary-tree-right-side-view', title: 'Binary Tree Right Side View', difficulty: 'Medium', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/binary-tree-right-side-view/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'count-good-nodes-in-binary-tree', title: 'Count Good Nodes in Binary Tree', difficulty: 'Medium', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/count-good-nodes-in-binary-tree/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'validate-binary-search-tree', title: 'Validate Binary Search Tree', difficulty: 'Medium', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/validate-binary-search-tree/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'kth-smallest-element-in-a-bst', title: 'Kth Smallest Element in a BST', difficulty: 'Medium', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'construct-binary-tree-from-preorder-and-inorder-traversal', title: 'Construct Binary Tree from Preorder and Inorder Traversal', difficulty: 'Medium', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'binary-tree-maximum-path-sum', title: 'Binary Tree Maximum Path Sum', difficulty: 'Hard', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'serialize-and-deserialize-binary-tree', title: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'implement-trie-prefix-tree', title: 'Implement Trie (Prefix Tree)', difficulty: 'Medium', category: 'Tries', leetcodeUrl: 'https://leetcode.com/problems/implement-trie-prefix-tree/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'design-add-and-search-words-data-structure', title: 'Design Add and Search Words Data Structure', difficulty: 'Medium', category: 'Tries', leetcodeUrl: 'https://leetcode.com/problems/design-add-and-search-words-data-structure/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'word-search-ii', title: 'Word Search II', difficulty: 'Hard', category: 'Tries', leetcodeUrl: 'https://leetcode.com/problems/word-search-ii/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'kth-largest-element-in-a-stream', title: 'Kth Largest Element in a Stream', difficulty: 'Easy', category: 'Heap / Priority Queue', leetcodeUrl: 'https://leetcode.com/problems/kth-largest-element-in-a-stream/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'last-stone-weight', title: 'Last Stone Weight', difficulty: 'Easy', category: 'Heap / Priority Queue', leetcodeUrl: 'https://leetcode.com/problems/last-stone-weight/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'k-closest-points-to-origin', title: 'K Closest Points to Origin', difficulty: 'Medium', category: 'Heap / Priority Queue', leetcodeUrl: 'https://leetcode.com/problems/k-closest-points-to-origin/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'kth-largest-element-in-an-array', title: 'Kth Largest Element in an Array', difficulty: 'Medium', category: 'Heap / Priority Queue', leetcodeUrl: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'task-scheduler', title: 'Task Scheduler', difficulty: 'Medium', category: 'Heap / Priority Queue', leetcodeUrl: 'https://leetcode.com/problems/task-scheduler/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'design-twitter', title: 'Design Twitter', difficulty: 'Medium', category: 'Heap / Priority Queue', leetcodeUrl: 'https://leetcode.com/problems/design-twitter/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'find-median-from-data-stream', title: 'Find Median from Data Stream', difficulty: 'Hard', category: 'Heap / Priority Queue', leetcodeUrl: 'https://leetcode.com/problems/find-median-from-data-stream/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'subsets', title: 'Subsets', difficulty: 'Medium', category: 'Backtracking', leetcodeUrl: 'https://leetcode.com/problems/subsets/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'combination-sum', title: 'Combination Sum', difficulty: 'Medium', category: 'Backtracking', leetcodeUrl: 'https://leetcode.com/problems/combination-sum/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'permutations', title: 'Permutations', difficulty: 'Medium', category: 'Backtracking', leetcodeUrl: 'https://leetcode.com/problems/permutations/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'subsets-ii', title: 'Subsets II', difficulty: 'Medium', category: 'Backtracking', leetcodeUrl: 'https://leetcode.com/problems/subsets-ii/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'combination-sum-ii', title: 'Combination Sum II', difficulty: 'Medium', category: 'Backtracking', leetcodeUrl: 'https://leetcode.com/problems/combination-sum-ii/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'word-search', title: 'Word Search', difficulty: 'Medium', category: 'Backtracking', leetcodeUrl: 'https://leetcode.com/problems/word-search/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'palindrome-partitioning', title: 'Palindrome Partitioning', difficulty: 'Medium', category: 'Backtracking', leetcodeUrl: 'https://leetcode.com/problems/palindrome-partitioning/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'letter-combinations-of-a-phone-number', title: 'Letter Combinations of a Phone Number', difficulty: 'Medium', category: 'Backtracking', leetcodeUrl: 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'n-queens', title: 'N-Queens', difficulty: 'Hard', category: 'Backtracking', leetcodeUrl: 'https://leetcode.com/problems/n-queens/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'number-of-islands', title: 'Number of Islands', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/number-of-islands/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'clone-graph', title: 'Clone Graph', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/clone-graph/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'max-area-of-island', title: 'Max Area of Island', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/max-area-of-island/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'pacific-atlantic-water-flow', title: 'Pacific Atlantic Water Flow', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/pacific-atlantic-water-flow/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'surrounded-regions', title: 'Surrounded Regions', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/surrounded-regions/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'rotting-oranges', title: 'Rotting Oranges', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/rotting-oranges/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'walls-and-gates', title: 'Walls and Gates', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/walls-and-gates/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'course-schedule', title: 'Course Schedule', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/course-schedule/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'course-schedule-ii', title: 'Course Schedule II', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/course-schedule-ii/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'redundant-connection', title: 'Redundant Connection', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/redundant-connection/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'number-of-connected-components-in-an-undirected-graph', title: 'Number of Connected Components in an Undirected Graph', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'graph-valid-tree', title: 'Graph Valid Tree', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/graph-valid-tree/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'word-ladder', title: 'Word Ladder', difficulty: 'Hard', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/word-ladder/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'reconstruct-itinerary', title: 'Reconstruct Itinerary', difficulty: 'Hard', category: 'Advanced Graphs', leetcodeUrl: 'https://leetcode.com/problems/reconstruct-itinerary/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'min-cost-to-connect-all-points', title: 'Min Cost to Connect All Points', difficulty: 'Medium', category: 'Advanced Graphs', leetcodeUrl: 'https://leetcode.com/problems/min-cost-to-connect-all-points/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'network-delay-time', title: 'Network Delay Time', difficulty: 'Medium', category: 'Advanced Graphs', leetcodeUrl: 'https://leetcode.com/problems/network-delay-time/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'swim-in-rising-water', title: 'Swim in Rising Water', difficulty: 'Hard', category: 'Advanced Graphs', leetcodeUrl: 'https://leetcode.com/problems/swim-in-rising-water/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'alien-dictionary', title: 'Alien Dictionary', difficulty: 'Hard', category: 'Advanced Graphs', leetcodeUrl: 'https://leetcode.com/problems/alien-dictionary/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'cheapest-flights-within-k-stops', title: 'Cheapest Flights Within K Stops', difficulty: 'Medium', category: 'Advanced Graphs', leetcodeUrl: 'https://leetcode.com/problems/cheapest-flights-within-k-stops/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'climbing-stairs', title: 'Climbing Stairs', difficulty: 'Easy', category: '1-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/climbing-stairs/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'min-cost-climbing-stairs', title: 'Min Cost Climbing Stairs', difficulty: 'Easy', category: '1-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/min-cost-climbing-stairs/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'house-robber', title: 'House Robber', difficulty: 'Medium', category: '1-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/house-robber/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'house-robber-ii', title: 'House Robber II', difficulty: 'Medium', category: '1-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/house-robber-ii/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'longest-palindromic-substring', title: 'Longest Palindromic Substring', difficulty: 'Medium', category: '1-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/longest-palindromic-substring/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'palindromic-substrings', title: 'Palindromic Substrings', difficulty: 'Medium', category: '1-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/palindromic-substrings/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'decode-ways', title: 'Decode Ways', difficulty: 'Medium', category: '1-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/decode-ways/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'coin-change', title: 'Coin Change', difficulty: 'Medium', category: '1-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/coin-change/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'maximum-product-subarray', title: 'Maximum Product Subarray', difficulty: 'Medium', category: '1-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/maximum-product-subarray/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'word-break', title: 'Word Break', difficulty: 'Medium', category: '1-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/word-break/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'longest-increasing-subsequence', title: 'Longest Increasing Subsequence', difficulty: 'Medium', category: '1-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/longest-increasing-subsequence/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'partition-equal-subset-sum', title: 'Partition Equal Subset Sum', difficulty: 'Medium', category: '1-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/partition-equal-subset-sum/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'unique-paths', title: 'Unique Paths', difficulty: 'Medium', category: '2-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/unique-paths/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'longest-common-subsequence', title: 'Longest Common Subsequence', difficulty: 'Medium', category: '2-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/longest-common-subsequence/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'best-time-to-buy-and-sell-stock-with-cooldown', title: 'Best Time to Buy and Sell Stock with Cooldown', difficulty: 'Medium', category: '2-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'coin-change-ii', title: 'Coin Change II', difficulty: 'Medium', category: '2-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/coin-change-ii/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'target-sum', title: 'Target Sum', difficulty: 'Medium', category: '2-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/target-sum/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'interleaving-string', title: 'Interleaving String', difficulty: 'Medium', category: '2-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/interleaving-string/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'longest-increasing-path-in-a-matrix', title: 'Longest Increasing Path in a Matrix', difficulty: 'Hard', category: '2-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/longest-increasing-path-in-a-matrix/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'distinct-subsequences', title: 'Distinct Subsequences', difficulty: 'Hard', category: '2-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/distinct-subsequences/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'edit-distance', title: 'Edit Distance', difficulty: 'Hard', category: '2-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/edit-distance/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'burst-balloons', title: 'Burst Balloons', difficulty: 'Hard', category: '2-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/burst-balloons/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'regular-expression-matching', title: 'Regular Expression Matching', difficulty: 'Hard', category: '2-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/regular-expression-matching/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'maximum-subarray', title: 'Maximum Subarray', difficulty: 'Medium', category: 'Greedy', leetcodeUrl: 'https://leetcode.com/problems/maximum-subarray/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'jump-game', title: 'Jump Game', difficulty: 'Medium', category: 'Greedy', leetcodeUrl: 'https://leetcode.com/problems/jump-game/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'jump-game-ii', title: 'Jump Game II', difficulty: 'Medium', category: 'Greedy', leetcodeUrl: 'https://leetcode.com/problems/jump-game-ii/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'gas-station', title: 'Gas Station', difficulty: 'Medium', category: 'Greedy', leetcodeUrl: 'https://leetcode.com/problems/gas-station/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'hand-of-straights', title: 'Hand of Straights', difficulty: 'Medium', category: 'Greedy', leetcodeUrl: 'https://leetcode.com/problems/hand-of-straights/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'merge-triplets-to-form-target-triplet', title: 'Merge Triplets to Form Target Triplet', difficulty: 'Medium', category: 'Greedy', leetcodeUrl: 'https://leetcode.com/problems/merge-triplets-to-form-target-triplet/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'partition-labels', title: 'Partition Labels', difficulty: 'Medium', category: 'Greedy', leetcodeUrl: 'https://leetcode.com/problems/partition-labels/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'valid-parenthesis-string', title: 'Valid Parenthesis String', difficulty: 'Medium', category: 'Greedy', leetcodeUrl: 'https://leetcode.com/problems/valid-parenthesis-string/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'insert-interval', title: 'Insert Interval', difficulty: 'Medium', category: 'Intervals', leetcodeUrl: 'https://leetcode.com/problems/insert-interval/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'merge-intervals', title: 'Merge Intervals', difficulty: 'Medium', category: 'Intervals', leetcodeUrl: 'https://leetcode.com/problems/merge-intervals/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'non-overlapping-intervals', title: 'Non-overlapping Intervals', difficulty: 'Medium', category: 'Intervals', leetcodeUrl: 'https://leetcode.com/problems/non-overlapping-intervals/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'meeting-rooms', title: 'Meeting Rooms', difficulty: 'Easy', category: 'Intervals', leetcodeUrl: 'https://leetcode.com/problems/meeting-rooms/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'meeting-rooms-ii', title: 'Meeting Rooms II', difficulty: 'Medium', category: 'Intervals', leetcodeUrl: 'https://leetcode.com/problems/meeting-rooms-ii/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'minimum-interval-to-include-each-query', title: 'Minimum Interval to Include Each Query', difficulty: 'Hard', category: 'Intervals', leetcodeUrl: 'https://leetcode.com/problems/minimum-interval-to-include-each-query/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'rotate-image', title: 'Rotate Image', difficulty: 'Medium', category: 'Math & Geometry', leetcodeUrl: 'https://leetcode.com/problems/rotate-image/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'spiral-matrix', title: 'Spiral Matrix', difficulty: 'Medium', category: 'Math & Geometry', leetcodeUrl: 'https://leetcode.com/problems/spiral-matrix/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'set-matrix-zeroes', title: 'Set Matrix Zeroes', difficulty: 'Medium', category: 'Math & Geometry', leetcodeUrl: 'https://leetcode.com/problems/set-matrix-zeroes/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'happy-number', title: 'Happy Number', difficulty: 'Easy', category: 'Math & Geometry', leetcodeUrl: 'https://leetcode.com/problems/happy-number/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'plus-one', title: 'Plus One', difficulty: 'Easy', category: 'Math & Geometry', leetcodeUrl: 'https://leetcode.com/problems/plus-one/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'powx-n', title: 'Pow(x, n)', difficulty: 'Medium', category: 'Math & Geometry', leetcodeUrl: 'https://leetcode.com/problems/powx-n/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'multiply-strings', title: 'Multiply Strings', difficulty: 'Medium', category: 'Math & Geometry', leetcodeUrl: 'https://leetcode.com/problems/multiply-strings/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'detect-squares', title: 'Detect Squares', difficulty: 'Medium', category: 'Math & Geometry', leetcodeUrl: 'https://leetcode.com/problems/detect-squares/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'single-number', title: 'Single Number', difficulty: 'Easy', category: 'Bit Manipulation', leetcodeUrl: 'https://leetcode.com/problems/single-number/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
  { id: 'number-of-1-bits', title: 'Number of 1 Bits', difficulty: 'Easy', category: 'Bit Manipulation', leetcodeUrl: 'https://leetcode.com/problems/number-of-1-bits/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'counting-bits', title: 'Counting Bits', difficulty: 'Easy', category: 'Bit Manipulation', leetcodeUrl: 'https://leetcode.com/problems/counting-bits/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'reverse-bits', title: 'Reverse Bits', difficulty: 'Easy', category: 'Bit Manipulation', leetcodeUrl: 'https://leetcode.com/problems/reverse-bits/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'missing-number', title: 'Missing Number', difficulty: 'Easy', category: 'Bit Manipulation', leetcodeUrl: 'https://leetcode.com/problems/missing-number/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'sum-of-two-integers', title: 'Sum of Two Integers', difficulty: 'Medium', category: 'Bit Manipulation', leetcodeUrl: 'https://leetcode.com/problems/sum-of-two-integers/', videoUrl: '', isNeetCode75: true, isBlind75: true, isNeetCode150: true, isNeetCode250: true },
  { id: 'reverse-integer', title: 'Reverse Integer', difficulty: 'Medium', category: 'Bit Manipulation', leetcodeUrl: 'https://leetcode.com/problems/reverse-integer/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: true, isNeetCode250: true },
{ id: 'longest-common-prefix', title: 'Longest Common Prefix', difficulty: 'Easy', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/longest-common-prefix/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'remove-element', title: 'Remove Element', difficulty: 'Easy', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/remove-element/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'find-the-index-of-the-first-occurrence-in-a-string', title: 'Find the Index of the First Occurrence in a String', difficulty: 'Easy', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'first-missing-positive', title: 'First Missing Positive', difficulty: 'Hard', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/first-missing-positive/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'length-of-last-word', title: 'Length of Last Word', difficulty: 'Easy', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/length-of-last-word/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'text-justification', title: 'Text Justification', difficulty: 'Hard', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/text-justification/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'sort-colors', title: 'Sort Colors', difficulty: 'Medium', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/sort-colors/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'pascals-triangle', title: 'Pascal\'s Triangle', difficulty: 'Easy', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/pascals-triangle/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'best-time-to-buy-and-sell-stock-ii', title: 'Best Time to Buy and Sell Stock II', difficulty: 'Medium', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'majority-element', title: 'Majority Element', difficulty: 'Easy', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/majority-element/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'largest-number', title: 'Largest Number', difficulty: 'Medium', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/largest-number/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'repeated-dna-sequences', title: 'Repeated DNA Sequences', difficulty: 'Medium', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/repeated-dna-sequences/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'isomorphic-strings', title: 'Isomorphic Strings', difficulty: 'Easy', category: 'Arrays & Hashing', leetcodeUrl: 'https://leetcode.com/problems/isomorphic-strings/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: '4sum', title: '4Sum', difficulty: 'Medium', category: 'Two Pointers', leetcodeUrl: 'https://leetcode.com/problems/4sum/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'remove-duplicates-from-sorted-array', title: 'Remove Duplicates from Sorted Array', difficulty: 'Easy', category: 'Two Pointers', leetcodeUrl: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'remove-duplicates-from-sorted-array-ii', title: 'Remove Duplicates from Sorted Array II', difficulty: 'Medium', category: 'Two Pointers', leetcodeUrl: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array-ii/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'merge-sorted-array', title: 'Merge Sorted Array', difficulty: 'Easy', category: 'Two Pointers', leetcodeUrl: 'https://leetcode.com/problems/merge-sorted-array/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'rotate-array', title: 'Rotate Array', difficulty: 'Medium', category: 'Two Pointers', leetcodeUrl: 'https://leetcode.com/problems/rotate-array/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'move-zeroes', title: 'Move Zeroes', difficulty: 'Easy', category: 'Two Pointers', leetcodeUrl: 'https://leetcode.com/problems/move-zeroes/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'reverse-string', title: 'Reverse String', difficulty: 'Easy', category: 'Two Pointers', leetcodeUrl: 'https://leetcode.com/problems/reverse-string/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'valid-palindrome-ii', title: 'Valid Palindrome II', difficulty: 'Easy', category: 'Two Pointers', leetcodeUrl: 'https://leetcode.com/problems/valid-palindrome-ii/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'minimum-size-subarray-sum', title: 'Minimum Size Subarray Sum', difficulty: 'Medium', category: 'Sliding Window', leetcodeUrl: 'https://leetcode.com/problems/minimum-size-subarray-sum/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'contains-duplicate-ii', title: 'Contains Duplicate II', difficulty: 'Easy', category: 'Sliding Window', leetcodeUrl: 'https://leetcode.com/problems/contains-duplicate-ii/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'find-k-closest-elements', title: 'Find K Closest Elements', difficulty: 'Medium', category: 'Sliding Window', leetcodeUrl: 'https://leetcode.com/problems/find-k-closest-elements/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'simplify-path', title: 'Simplify Path', difficulty: 'Medium', category: 'Stack', leetcodeUrl: 'https://leetcode.com/problems/simplify-path/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'implement-stack-using-queues', title: 'Implement Stack using Queues', difficulty: 'Easy', category: 'Stack', leetcodeUrl: 'https://leetcode.com/problems/implement-stack-using-queues/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'decode-string', title: 'Decode String', difficulty: 'Medium', category: 'Stack', leetcodeUrl: 'https://leetcode.com/problems/decode-string/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'remove-k-digits', title: 'Remove K Digits', difficulty: 'Medium', category: 'Stack', leetcodeUrl: 'https://leetcode.com/problems/remove-k-digits/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: '132-pattern', title: '132 Pattern', difficulty: 'Medium', category: 'Stack', leetcodeUrl: 'https://leetcode.com/problems/132-pattern/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'baseball-game', title: 'Baseball Game', difficulty: 'Easy', category: 'Stack', leetcodeUrl: 'https://leetcode.com/problems/baseball-game/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'asteroid-collision', title: 'Asteroid Collision', difficulty: 'Medium', category: 'Stack', leetcodeUrl: 'https://leetcode.com/problems/asteroid-collision/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'find-first-and-last-position-of-element-in-sorted-array', title: 'Find First and Last Position of Element in Sorted Array', difficulty: 'Medium', category: 'Binary Search', leetcodeUrl: 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'search-insert-position', title: 'Search Insert Position', difficulty: 'Easy', category: 'Binary Search', leetcodeUrl: 'https://leetcode.com/problems/search-insert-position/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'sqrtx', title: 'Sqrt(x)', difficulty: 'Easy', category: 'Binary Search', leetcodeUrl: 'https://leetcode.com/problems/sqrtx/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'search-in-rotated-sorted-array-ii', title: 'Search in Rotated Sorted Array II', difficulty: 'Medium', category: 'Binary Search', leetcodeUrl: 'https://leetcode.com/problems/search-in-rotated-sorted-array-ii/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'populating-next-right-pointers-in-each-node', title: 'Populating Next Right Pointers in Each Node', difficulty: 'Medium', category: 'Binary Search', leetcodeUrl: 'https://leetcode.com/problems/populating-next-right-pointers-in-each-node/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'find-peak-element', title: 'Find Peak Element', difficulty: 'Medium', category: 'Binary Search', leetcodeUrl: 'https://leetcode.com/problems/find-peak-element/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'valid-perfect-square', title: 'Valid Perfect Square', difficulty: 'Easy', category: 'Binary Search', leetcodeUrl: 'https://leetcode.com/problems/valid-perfect-square/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'swap-nodes-in-pairs', title: 'Swap Nodes in Pairs', difficulty: 'Medium', category: 'Linked List', leetcodeUrl: 'https://leetcode.com/problems/swap-nodes-in-pairs/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'rotate-list', title: 'Rotate List', difficulty: 'Medium', category: 'Linked List', leetcodeUrl: 'https://leetcode.com/problems/rotate-list/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'remove-duplicates-from-sorted-list', title: 'Remove Duplicates from Sorted List', difficulty: 'Easy', category: 'Linked List', leetcodeUrl: 'https://leetcode.com/problems/remove-duplicates-from-sorted-list/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'binary-tree-inorder-traversal', title: 'Binary Tree Inorder Traversal', difficulty: 'Easy', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/binary-tree-inorder-traversal/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'unique-binary-search-trees-ii', title: 'Unique Binary Search Trees II', difficulty: 'Medium', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/unique-binary-search-trees-ii/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'unique-binary-search-trees', title: 'Unique Binary Search Trees', difficulty: 'Medium', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/unique-binary-search-trees/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'symmetric-tree', title: 'Symmetric Tree', difficulty: 'Easy', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/symmetric-tree/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'binary-tree-zigzag-level-order-traversal', title: 'Binary Tree Zigzag Level Order Traversal', difficulty: 'Medium', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'construct-binary-tree-from-inorder-and-postorder-traversal', title: 'Construct Binary Tree from Inorder and Postorder Traversal', difficulty: 'Medium', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/construct-binary-tree-from-inorder-and-postorder-traversal/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'convert-sorted-array-to-binary-search-tree', title: 'Convert Sorted Array to Binary Search Tree', difficulty: 'Easy', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'path-sum', title: 'Path Sum', difficulty: 'Easy', category: 'Trees', leetcodeUrl: 'https://leetcode.com/problems/path-sum/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'ipo', title: 'IPO', difficulty: 'Hard', category: 'Heap / Priority Queue', leetcodeUrl: 'https://leetcode.com/problems/ipo/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'reorganize-string', title: 'Reorganize String', difficulty: 'Medium', category: 'Heap / Priority Queue', leetcodeUrl: 'https://leetcode.com/problems/reorganize-string/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'car-pooling', title: 'Car Pooling', difficulty: 'Medium', category: 'Heap / Priority Queue', leetcodeUrl: 'https://leetcode.com/problems/car-pooling/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'maximum-performance-of-a-team', title: 'Maximum Performance of a Team', difficulty: 'Hard', category: 'Heap / Priority Queue', leetcodeUrl: 'https://leetcode.com/problems/maximum-performance-of-a-team/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'longest-happy-string', title: 'Longest Happy String', difficulty: 'Medium', category: 'Heap / Priority Queue', leetcodeUrl: 'https://leetcode.com/problems/longest-happy-string/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'permutations-ii', title: 'Permutations II', difficulty: 'Medium', category: 'Backtracking', leetcodeUrl: 'https://leetcode.com/problems/permutations-ii/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'n-queens-ii', title: 'N-Queens II', difficulty: 'Hard', category: 'Backtracking', leetcodeUrl: 'https://leetcode.com/problems/n-queens-ii/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'combinations', title: 'Combinations', difficulty: 'Medium', category: 'Backtracking', leetcodeUrl: 'https://leetcode.com/problems/combinations/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'restore-ip-addresses', title: 'Restore IP Addresses', difficulty: 'Medium', category: 'Backtracking', leetcodeUrl: 'https://leetcode.com/problems/restore-ip-addresses/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'matchsticks-to-square', title: 'Matchsticks to Square', difficulty: 'Medium', category: 'Backtracking', leetcodeUrl: 'https://leetcode.com/problems/matchsticks-to-square/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'partition-to-k-equal-sum-subsets', title: 'Partition to K Equal Sum Subsets', difficulty: 'Medium', category: 'Backtracking', leetcodeUrl: 'https://leetcode.com/problems/partition-to-k-equal-sum-subsets/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'maximum-length-of-a-concatenated-string-with-unique-characters', title: 'Maximum Length of a Concatenated String with Unique Characters', difficulty: 'Medium', category: 'Backtracking', leetcodeUrl: 'https://leetcode.com/problems/maximum-length-of-a-concatenated-string-with-unique-characters/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'splitting-a-string-into-descending-consecutive-values', title: 'Splitting a String Into Descending Consecutive Values', difficulty: 'Medium', category: 'Backtracking', leetcodeUrl: 'https://leetcode.com/problems/splitting-a-string-into-descending-consecutive-values/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'extra-characters-in-a-string', title: 'Extra Characters in a String', difficulty: 'Medium', category: 'Tries', leetcodeUrl: 'https://leetcode.com/problems/extra-characters-in-a-string/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'evaluate-division', title: 'Evaluate Division', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/evaluate-division/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'island-perimeter', title: 'Island Perimeter', difficulty: 'Easy', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/island-perimeter/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'accounts-merge', title: 'Accounts Merge', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/accounts-merge/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'open-the-lock', title: 'Open the Lock', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/open-the-lock/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'is-graph-bipartite', title: 'Is Graph Bipartite?', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/is-graph-bipartite/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'find-eventual-safe-states', title: 'Find Eventual Safe States', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/find-eventual-safe-states/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'snakes-and-ladders', title: 'Snakes and Ladders', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/snakes-and-ladders/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'shortest-bridge', title: 'Shortest Bridge', difficulty: 'Medium', category: 'Graphs', leetcodeUrl: 'https://leetcode.com/problems/shortest-bridge/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree', title: 'Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree', difficulty: 'Hard', category: 'Advanced Graphs', leetcodeUrl: 'https://leetcode.com/problems/find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'path-with-maximum-probability', title: 'Path with Maximum Probability', difficulty: 'Medium', category: 'Advanced Graphs', leetcodeUrl: 'https://leetcode.com/problems/path-with-maximum-probability/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'remove-max-number-of-edges-to-keep-graph-fully-traversable', title: 'Remove Max Number of Edges to Keep Graph Fully Traversable', difficulty: 'Hard', category: 'Advanced Graphs', leetcodeUrl: 'https://leetcode.com/problems/remove-max-number-of-edges-to-keep-graph-fully-traversable/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'path-with-minimum-effort', title: 'Path With Minimum Effort', difficulty: 'Medium', category: 'Advanced Graphs', leetcodeUrl: 'https://leetcode.com/problems/path-with-minimum-effort/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'triangle', title: 'Triangle', difficulty: 'Medium', category: '1-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/triangle/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'perfect-squares', title: 'Perfect Squares', difficulty: 'Medium', category: '1-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/perfect-squares/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'integer-break', title: 'Integer Break', difficulty: 'Medium', category: '1-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/integer-break/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'combination-sum-iv', title: 'Combination Sum IV', difficulty: 'Medium', category: '1-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/combination-sum-iv/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'concatenated-words', title: 'Concatenated Words', difficulty: 'Hard', category: '1-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/concatenated-words/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'unique-paths-ii', title: 'Unique Paths II', difficulty: 'Medium', category: '2-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/unique-paths-ii/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'minimum-path-sum', title: 'Minimum Path Sum', difficulty: 'Medium', category: '2-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/minimum-path-sum/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'maximal-square', title: 'Maximal Square', difficulty: 'Medium', category: '2-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/maximal-square/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'ones-and-zeroes', title: 'Ones and Zeroes', difficulty: 'Medium', category: '2-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/ones-and-zeroes/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'longest-palindromic-subsequence', title: 'Longest Palindromic Subsequence', difficulty: 'Medium', category: '2-D Dynamic Programming', leetcodeUrl: 'https://leetcode.com/problems/longest-palindromic-subsequence/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'maximum-length-of-pair-chain', title: 'Maximum Length of Pair Chain', difficulty: 'Medium', category: 'Greedy', leetcodeUrl: 'https://leetcode.com/problems/maximum-length-of-pair-chain/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'dota2-senate', title: 'Dota2 Senate', difficulty: 'Medium', category: 'Greedy', leetcodeUrl: 'https://leetcode.com/problems/dota2-senate/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'maximum-sum-circular-subarray', title: 'Maximum Sum Circular Subarray', difficulty: 'Medium', category: 'Greedy', leetcodeUrl: 'https://leetcode.com/problems/maximum-sum-circular-subarray/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'longest-turbulent-subarray', title: 'Longest Turbulent Subarray', difficulty: 'Medium', category: 'Greedy', leetcodeUrl: 'https://leetcode.com/problems/longest-turbulent-subarray/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'two-city-scheduling', title: 'Two City Scheduling', difficulty: 'Medium', category: 'Greedy', leetcodeUrl: 'https://leetcode.com/problems/two-city-scheduling/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'candy', title: 'Candy', difficulty: 'Hard', category: 'Greedy', leetcodeUrl: 'https://leetcode.com/problems/candy/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'data-stream-as-disjoint-intervals', title: 'Data Stream as Disjoint Intervals', difficulty: 'Hard', category: 'Intervals', leetcodeUrl: 'https://leetcode.com/problems/data-stream-as-disjoint-intervals/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'zigzag-conversion', title: 'Zigzag Conversion', difficulty: 'Medium', category: 'Math & Geometry', leetcodeUrl: 'https://leetcode.com/problems/zigzag-conversion/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'palindrome-number', title: 'Palindrome Number', difficulty: 'Easy', category: 'Math & Geometry', leetcodeUrl: 'https://leetcode.com/problems/palindrome-number/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'integer-to-roman', title: 'Integer to Roman', difficulty: 'Medium', category: 'Math & Geometry', leetcodeUrl: 'https://leetcode.com/problems/integer-to-roman/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'roman-to-integer', title: 'Roman to Integer', difficulty: 'Easy', category: 'Math & Geometry', leetcodeUrl: 'https://leetcode.com/problems/roman-to-integer/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'spiral-matrix-ii', title: 'Spiral Matrix II', difficulty: 'Medium', category: 'Math & Geometry', leetcodeUrl: 'https://leetcode.com/problems/spiral-matrix-ii/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'add-binary', title: 'Add Binary', difficulty: 'Easy', category: 'Bit Manipulation', leetcodeUrl: 'https://leetcode.com/problems/add-binary/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'add-to-array-form-of-integer', title: 'Add to Array-Form of Integer', difficulty: 'Easy', category: 'Bit Manipulation', leetcodeUrl: 'https://leetcode.com/problems/add-to-array-form-of-integer/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
  { id: 'shuffle-the-array', title: 'Shuffle the Array', difficulty: 'Easy', category: 'Bit Manipulation', leetcodeUrl: 'https://leetcode.com/problems/shuffle-the-array/', videoUrl: '', isNeetCode75: false, isBlind75: false, isNeetCode150: false, isNeetCode250: true },
] as Problem[]).map(problem => ({
  ...problem,
  isPremium: isProblemPremium(problem),
  mockInterviewContent: mockProblemContent[problem.id]
}) as Problem);

export const extendedCatalogProblems: Problem[] = (leetcodeExtendedCatalogJson as Problem[]).map(
  (p) => ({
    ...p,
    isPremium: isProblemPremium(p),
    mockInterviewContent: mockProblemContent[p.id],
  }) as Problem
);

export const allProblems: Problem[] = [...problems, ...extendedCatalogProblems];

/** Pool used for recommendations: main list for curated tiers; full list for extended. */
export function problemsPoolForTargetCurriculum(curriculum: TargetCurriculum): Problem[] {
  const base = curriculum === 'EXTENDED' ? allProblems : problems;
  return base.filter((p) => problemMatchesTargetCurriculum(p, curriculum));
}

export function countTargetCurriculumProblems(curriculum: TargetCurriculum): number {
  return problemsPoolForTargetCurriculum(curriculum).length;
}

export const PHASE_1_CATEGORIES: Category[] = [
  'Arrays & Hashing',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Binary Search',
  'Linked List',
  'Trees',
  'Heap / Priority Queue',
];

export const PHASE_2_CATEGORIES: Category[] = [
  'Graphs',
  'Advanced Graphs',
  '1-D Dynamic Programming',
  '2-D Dynamic Programming',
  'Greedy',
  'Intervals',
  'Math & Geometry',
  'Bit Manipulation',
  'Tries',
  'Backtracking',
];

export const problemMap = allProblems.reduce((acc, problem) => {
  acc[problem.id] = problem;
  return acc;
}, {} as Record<string, Problem>);
