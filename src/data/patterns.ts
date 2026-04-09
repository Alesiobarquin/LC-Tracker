import { PatternFoundation } from '../types';

export const patterns: PatternFoundation[] = [
  {
      id: 'two-pointers',
      isCore: true,
      name: 'Two Pointers (Converging)',
      description: 'Use on sorted arrays to find pairs. The foundational technique for iterating arrays with two indices.',
      templateCodePython: `def two_pointers(nums, target):\n    l, r = 0, len(nums) - 1\n    while l < r:\n        total = nums[l] + nums[r]\n        if total == target:\n            return [l, r]\n        elif total < target:\n            l += 1\n        else:\n            r -= 1\n    return []`,
      templateCodeJs: `function twoPointers(nums, target) {\n  let l = 0, r = nums.length - 1;\n  while (l < r) {\n    const total = nums[l] + nums[r];\n    if (total === target) return [l, r];\n    else if (total < target) l++;\n    else r--;\n  }\n  return [];\n}`,
      relatedCategories: ['Two Pointers'],
      relatedTags: ['Two Pointers'],
      educativeProblems: [
        {
              "title": "Valid Palindrome",
              "badges": [
                    "easy",
                    "Blind 75"
              ]
        },
        {
              "title": "3Sum",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Remove nth Node from End of List",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Sort Colors",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Reverse Words in a String",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Valid Word Abbreviation",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Valid Palindrome II",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Lowest Common Ancestor of a Binary Tree III",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Strobogrammatic Number",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Minimum Number of Moves to Make Palindrome",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Next Palindrome Using Same Digits",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Count Subarrays With Fixed Bounds",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Find the Lexicographically Largest String From Box II",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Get the Maximum Score",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Create Maximum Number",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Append Characters to String to Make Subsequence",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Squares of a Sorted Array",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Reverse String",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Intersection of Two Linked Lists",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Partition Labels",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Remove Element",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "String Compression",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Rotate Array",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Next Permutation",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Remove Duplicates from Sorted Array",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Reverse Vowels of a String",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Is Subsequence",
              "badges": [
                    "med"
              ]
        }
      ]
    },
  {
      id: 'fast-slow-pointers',
      isCore: true,
      name: 'Fast and Slow Pointers',
      description: 'A Two Pointer variation where pointers move at different speeds. Perfect for cycle detection in Linked Lists.',
      templateCodePython: `def has_cycle(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n        if slow == fast:\n            return True\n    return False`,
      templateCodeJs: `function hasCycle(head) {\n  let slow = head, fast = head;\n  while (fast && fast.next) {\n    slow = slow.next;\n    fast = fast.next.next;\n    if (slow === fast) return true;\n  }\n  return false;\n}`,
      relatedCategories: ['Linked List'],
      relatedTags: [],
      educativeProblems: [
        {
              "title": "Linked List Cycle",
              "badges": [
                    "easy",
                    "Blind 75"
              ]
        },
        {
              "title": "Happy Number",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Middle of the Linked List",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Circular Array Loop",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Find The Duplicate Number",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Palindrome Linked List",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Linked List Cycle III",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Linked List Cycle IV",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Maximum Twin Sum of a Linked List",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Split a Circular Linked List",
              "badges": [
                    "med"
              ]
        }
      ] 
    },
  {
      id: 'sliding-window',
      isCore: true,
      name: 'Sliding Window (Variable Size)',
      description: 'Builds on Two Pointers. Use this for contiguous subarrays where you need to track a "state" (sum, frequency, etc.).',
      templateCodePython: `def sliding_window(arr):\n    left = 0\n    state = 0 # Can be a sum, a dictionary, etc.\n    res = 0\n    \n    for right in range(len(arr)):\n        # 1. Add right element to state\n        state += arr[right] \n        \n        # 2. While condition is violated, shrink from left\n        while state > target: \n            state -= arr[left]\n            left += 1\n            \n        # 3. Update result\n        res = max(res, right - left + 1)\n    return res`,
      templateCodeJs: `function slidingWindow(arr) {\n  let left = 0;\n  let state = 0; // Can be a sum, an object/map, etc.\n  let res = 0;\n  \n  for (let right = 0; right < arr.length; right++) {\n    // 1. Add right element to state\n    state += arr[right];\n    \n    // 2. While condition is violated, shrink from left\n    while (state > target) {\n      state -= arr[left];\n      left++;\n    }\n    \n    // 3. Update result\n    res = Math.max(res, right - left + 1);\n  }\n  return res;\n}`,
      relatedCategories: ['Sliding Window'],
      relatedTags: ['Sliding Window'],
      educativeProblems: [
        {
              "title": "Longest Repeating Character Replacement",
              "badges": [
                    "med",
                    "Blind 75"
              ]
        },
        {
              "title": "Minimum Window Substring",
              "badges": [
                    "hard",
                    "Blind 75"
              ]
        },
        {
              "title": "Longest Substring without Repeating Characters",
              "badges": [
                    "med",
                    "Blind 75"
              ]
        },
        {
              "title": "Best Time to Buy and Sell Stock",
              "badges": [
                    "easy",
                    "Blind 75"
              ]
        },
        {
              "title": "Repeated DNA Sequences",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Sliding Window Maximum",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Minimum Window Subsequence",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Minimum Size Subarray Sum",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Fruit Into Baskets",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Frequency of the Most Frequent Element",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Maximum Average Subarray I",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Diet Plan Performance",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Subarrays with K Different Integers",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Count Subarrays With Score Less Than K",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Count Substrings With K-Frequency Characters II",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Substring with Concatenation of All Words",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Binary Subarrays With Sum",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Permutation in String",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Number of Substrings Containing All Three Characters",
              "badges": [
                    "med"
              ]
        }
      ]
    },
  {
      id: 'intervals',
      isCore: false,
      name: 'Intervals',
      description: 'An advanced pattern from Educative Grokking for Intervals.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Merge Intervals",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Insert Interval",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Meeting Rooms II",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Interval List Intersections",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Employee Free Time",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Task Scheduler",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Remove Covered Intervals",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Count Days Without Meetings",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Car Pooling",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Data Stream as Disjoint Intervals",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Minimum Interval to Include Each Query",
                  "badges": [
                        "hard"
                  ]
            }
      ]
    },
  {
      id: 'in-place-manipulation-of-a-linked-list',
      isCore: false,
      name: 'In-Place Manipulation of a Linked List',
      description: 'An advanced pattern from Educative Grokking for In-Place Manipulation of a Linked List.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Reverse Linked List",
                  "badges": [
                        "easy",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Reorder List",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Reverse Nodes in k-Group",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Reverse Linked List II",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Swapping Nodes in a Linked List",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Reverse Nodes In Even Length Groups",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Swap Nodes in Pairs",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Split Linked List in Parts",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Remove Linked List Elements",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Delete N Nodes After M Nodes of a Linked List",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Remove Duplicates from Sorted List",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Insert into a Sorted Circular Linked List",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Odd Even Linked List",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Rotate List",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Mock Interview",
                  "badges": []
            },
            {
                  "title": "45m",
                  "badges": []
            },
            {
                  "title": "0 Attempts Remaining",
                  "badges": []
            },
            {
                  "title": "Two Pointer Strategies",
                  "badges": []
            }
      ]
    },
  {
      id: 'two-heaps',
      isCore: true,
      name: 'Two Heaps',
      description: 'Advanced optimization. The elite pattern for tracking the running median in a continuous data stream.',
      templateCodePython: `class MedianFinder:\n    def __init__(self):\n        self.small = [] # Max-heap (stores smaller half)\n        self.large = [] # Min-heap (stores larger half)\n\n    def addNum(self, num):\n        # Push to small, then move largest of small to large\n        heapq.heappush(self.small, -num)\n        heapq.heappush(self.large, -heapq.heappop(self.small))\n        \n        # Maintain size property: len(small) >= len(large)\n        if len(self.large) > len(self.small):\n            heapq.heappush(self.small, -heapq.heappop(self.large))`,
      templateCodeJs: `class MedianFinder {\n  constructor() {\n    this.small = new MaxPriorityQueue(); // stores smaller half\n    this.large = new MinPriorityQueue(); // stores larger half\n  }\n\n  addNum(num) {\n    this.small.enqueue(num);\n    this.large.enqueue(this.small.dequeue().element);\n    \n    if (this.large.size() > this.small.size()) {\n      this.small.enqueue(this.large.dequeue().element);\n    }\n  }\n}`,
      relatedCategories: ['Heap / Priority Queue'], 
      relatedTags: ['Data Stream'] 
    },
  {
      id: 'k-way-merge',
      isCore: false,
      name: 'K-way Merge',
      description: 'An advanced pattern from Educative Grokking for K-way Merge.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Merge Sorted Array",
                  "badges": [
                        "easy",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Merge K Sorted Lists",
                  "badges": [
                        "hard",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Kth Smallest Number in M Sorted Lists",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Find K Pairs with Smallest Sums",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Kth Smallest Element in a Sorted Matrix",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "K-th Smallest Prime Fraction",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Super Ugly Number",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Mock Interview",
                  "badges": []
            },
            {
                  "title": "45m",
                  "badges": []
            },
            {
                  "title": "0 Attempts Remaining",
                  "badges": []
            },
            {
                  "title": "Merging Strategies",
                  "badges": []
            }
      ]
    },
  {
      id: 'top-k-elements',
      isCore: true,
      name: 'Top K Elements (Heap)',
      description: 'The definitive optimization technique. Use to find K largest/smallest items without doing a full O(N log N) array sort.',
      templateCodePython: `import heapq\n\ndef top_k(nums, k):\n    # Min-heap to keep track of the largest K elements\n    min_heap = []\n    for num in nums:\n        heapq.heappush(min_heap, num)\n        if len(min_heap) > k:\n            heapq.heappop(min_heap)\n    return min_heap`,
      templateCodeJs: `// Typically uses a priority queue/heap library in JS\nfunction topK(nums, k) {\n  // Using a MinPriorityQueue class\n  const minHeap = new MinPriorityQueue();\n  for (let num of nums) {\n    minHeap.enqueue(num);\n    if (minHeap.size() > k) {\n      minHeap.dequeue();\n    }\n  }\n  return minHeap.toArray().map(x => x.element);\n}`,
      relatedCategories: ['Heap / Priority Queue'],
      relatedTags: ['Heap (Priority Queue)'],
      educativeProblems: [
        {
              "title": "Top K Frequent Elements",
              "badges": [
                    "med",
                    "Blind 75"
              ]
        },
        {
              "title": "Kth Largest Element in a Stream",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Reorganize String",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "K Closest Points to Origin",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Kth Largest Element in an Array",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Maximal Score After Applying K Operations",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Find the Kth Largest Integer in the Array",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Third Maximum Number",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Find Subsequence of Length K with the Largest Sum",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Minimum Cost to Hire K Workers",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Smallest Range Covering Elements from K Lists",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Maximum Performance of a Team",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "K Maximum Sum Combinations From Two Arrays",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "K Empty Slots",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Find the K-Sum of an Array",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Maximum Product After K Increments",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Least Number of Unique Integers after K Removals",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Final Array State After K Multiplication Operations I",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "•",
              "badges": []
        }
      ]
    },
  {
      id: 'binary-search',
      isCore: true,
      name: 'Binary Search (Find Boundaries)',
      description: 'Use this to find the "first" or "last" occurrence in a sorted space with O(log N) time complexity.',
      templateCodePython: `def binary_search(nums, target, find_first):\n    l, r = 0, len(nums) - 1\n    ans = -1\n    while l <= r:\n        mid = l + (r - l) // 2\n        if nums[mid] == target:\n            ans = mid\n            if find_first: r = mid - 1 # Nudge left\n            else: l = mid + 1          # Nudge right\n        elif nums[mid] < target:\n            l = mid + 1\n        else:\n            r = mid - 1\n    return ans`,
      templateCodeJs: `function binarySearch(nums, target, findFirst) {\n  let l = 0, r = nums.length - 1;\n  let ans = -1;\n  while (l <= r) {\n    let mid = Math.floor(l + (r - l) / 2);\n    if (nums[mid] === target) {\n      ans = mid;\n      if (findFirst) r = mid - 1; // Nudge left\n      else l = mid + 1;           // Nudge right\n    } else if (nums[mid] < target) {\n      l = mid + 1;\n    } else {\n      r = mid - 1;\n    }\n  }\n  return ans;\n}`,
      relatedCategories: ['Binary Search'],
      relatedTags: ['Binary Search'],
      educativeProblems: [
        {
              "title": "Search in Rotated Sorted Array",
              "badges": [
                    "med",
                    "Blind 75"
              ]
        },
        {
              "title": "Binary Search",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "First Bad Version",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Find K Closest Elements",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Single Element in a Sorted Array",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Split Array Largest Sum",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "The K Weakest Rows in a Matrix",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Maximum Value at a Given Index in a Bounded Array",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Search in Rotated Sorted Array II",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Count Pairs Whose Sum is Less than Target",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Find Minimum in Rotated Sorted Array II",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Maximum Running Time of N Computers",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Minimize Max Distance to Gas Station",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Divide Chocolate",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Split Array Into Two Arrays to Minimize Sum Difference",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Number of Flowers in Full Bloom",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Koko Eating Bananas",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Search Insert Position",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Find Peak Element",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Find First and Last Position of Element in Sorted Array",
              "badges": [
                    "med"
              ]
        }
      ]
    },
  {
      id: 'subsets',
      isCore: false,
      name: 'Subsets',
      description: 'An advanced pattern from Educative Grokking for Subsets.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Subsets",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Permutations",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Letter Combinations of a Phone Number",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Generate Parentheses",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Find K-Sum Subsets",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Letter Case Permutation",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Letter Tile Possibilities",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Subsets II",
                  "badges": [
                        "med"
                  ]
            }
      ]
    },
  {
      id: 'greedy-techniques',
      isCore: false,
      name: 'Greedy Techniques',
      description: 'An advanced pattern from Educative Grokking for Greedy Techniques.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Jump Game I",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Boats to Save People",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Gas Stations",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Two City Scheduling",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Minimum Number of Refueling Stops",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Largest Palindromic Number",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Jump Game II",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Number of Steps to Reduce a Binary Number to One",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Rearranging Fruits",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Maximum Swap",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Can Place Flowers",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Largest Odd Number in String",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Assign Cookies",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Candy",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Minimum Replacements to Sort the Array",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Sort an Array",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Text Justification",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Best Time to Buy and Sell Stock II",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Wildcard Matching",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Remove K Digits",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Largest Number",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Strong Password Checker",
                  "badges": [
                        "med"
                  ]
            }
      ]
    },
  {
      id: 'backtracking',
      isCore: false,
      name: 'Backtracking',
      description: 'An advanced pattern from Educative Grokking for Backtracking.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Word Search",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "House Robber III",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "N-Queens II",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Restore IP Addresses",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Flood Fill",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Minimum Moves to Spread Stones Over Grid",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Sudoku Solver",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Matchsticks to Square",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Binary Watch",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Optimal Account Balancing",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Split a String Into the Max Number of Unique Substrings",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Binary Tree Paths",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "All Paths From Source to Target",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Remove Invalid Parentheses",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Unique Paths III",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "N-Queens",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Combinations",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Word Ladder II",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Flip Game",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Additive Number",
                  "badges": [
                        "med"
                  ]
            }
      ]
    },
  {
      id: 'dynamic-programming',
      isCore: false,
      name: 'Dynamic Programming',
      description: 'An advanced pattern from Educative Grokking for Dynamic Programming.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Coin Change",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Counting Bits",
                  "badges": [
                        "easy",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Maximum Product Subarray",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Combination Sum",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Word Break",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Palindromic Substrings",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Longest Common Subsequence",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Decode Ways",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Climbing Stairs",
                  "badges": [
                        "easy",
                        "Blind 75"
                  ]
            },
            {
                  "title": "0/1 Knapsack",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "N-th Tribonacci Number",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Partition Equal Subset Sum",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "01 Matrix",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "House Robber II",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Word Break II",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Count the Number of Good Subsequences",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Binary Tree Cameras",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Number of Ways to Form a Target String Given a Dictionary",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Pascal’s Triangle",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Triangle",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Frog Jump",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Cherry Pickup",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Regular Expression Matching",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Dungeon Game",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Burst Balloons",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Shortest Common Supersequence",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Interleaving String",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Maximal Rectangle",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Longest Increasing Path in a Matrix",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Min Cost Climbing Stairs",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Number of Longest Increasing Subsequence",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Distinct Subsequences",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Cheapest Flights Within K Stops",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Minimum Path Sum",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Best Time to Buy and Sell Stock III",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Maximal Square",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "The Number of Good Subsets",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Freedom Trail",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Mock Interview",
                  "badges": []
            },
            {
                  "title": "45m",
                  "badges": []
            },
            {
                  "title": "0 Attempts Remaining",
                  "badges": []
            },
            {
                  "title": "Advanced Algorithmic Techniques",
                  "badges": []
            }
      ]
    },
  {
      id: 'cyclic-sort',
      isCore: false,
      name: 'Cyclic Sort',
      description: 'An advanced pattern from Educative Grokking for Cyclic Sort.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Missing Number",
                  "badges": [
                        "easy",
                        "Blind 75"
                  ]
            },
            {
                  "title": "First Missing Positive",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Find the Corrupt Pair",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Find the First K Missing Positive Numbers",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Sort Array By Parity II",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Cyclic Sort",
                  "badges": [
                        "easy"
                  ]
            }
      ]
    },
  {
      id: 'topological-sort',
      isCore: true,
      name: "Topological Sort (Kahn's Algorithm)",
      description: 'Advanced Graph theory. Essential for processing nodes with prerequisite dependencies (like Course Schedule).',
      templateCodePython: `from collections import deque\n\ndef topo_sort(nodes, edges):\n    adj = {i: [] for i in nodes}\n    in_degree = {i: 0 for i in nodes}\n    for u, v in edges:\n        adj[u].append(v)\n        in_degree[v] += 1\n        \n    queue = deque([i for i in nodes if in_degree[i] == 0])\n    res = []\n    \n    while queue:\n        u = queue.popleft()\n        res.append(u)\n        for v in adj[u]:\n            in_degree[v] -= 1\n            if in_degree[v] == 0:\n                queue.append(v)\n    return res if len(res) == len(nodes) else []`,
      templateCodeJs: `function topoSort(nodes, edges) {\n  const adj = new Map(nodes.map(i => [i, []]));\n  const inDegree = new Map(nodes.map(i => [i, 0]));\n  \n  for (const [u, v] of edges) {\n    adj.get(u).push(v);\n    inDegree.set(v, inDegree.get(v) + 1);\n  }\n  \n  const queue = [];\n  for (const [node, degree] of inDegree.entries()) {\n    if (degree === 0) queue.push(node);\n  }\n  \n  const res = [];\n  while (queue.length > 0) {\n    const u = queue.shift();\n    res.push(u);\n    for (const v of adj.get(u)) {\n      inDegree.set(v, inDegree.get(v) - 1);\n      if (inDegree.get(v) === 0) queue.push(v);\n    }\n  }\n  return res.length === nodes.length ? res : [];\n}`,
      relatedCategories: ['Advanced Graphs', 'Graphs'],
      relatedTags: ['Topological Sort'],
      educativeProblems: [
        {
              "title": "Alien Dictionary",
              "badges": [
                    "hard",
                    "Blind 75"
              ]
        },
        {
              "title": "Course Schedule",
              "badges": [
                    "med",
                    "Blind 75"
              ]
        },
        {
              "title": "Compilation Order",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Verifying an Alien Dictionary",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Course Schedule II",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Find All Possible Recipes from Given Supplies",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Build a Matrix with Conditions",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Longest Path With Different Adjacent Characters",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Parallel Courses III",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Parallel Courses",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Sort Items by Groups Respecting Dependencies",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "•",
              "badges": []
        }
      ]
    },
  {
      id: 'sort-and-search',
      isCore: false,
      name: 'Sort and Search',
      description: 'An advanced pattern from Educative Grokking for Sort and Search.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Sum of Mutated Array Closest to Target",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Contains Duplicate II",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Find K-th Smallest Pair Distance",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Maximum Number of Integers to Choose from a Range I",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Find the Distance Value Between Two Arrays",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Find Target Indices After Sorting Array",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Russian Doll Envelopes",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Minimum Operations to Make All Array Elements Equal",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Longest Subsequence With Limited Sum",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Range Sum of Sorted Subarray Sums",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Magnetic Force Between Two Balls",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Minimum Space Wasted from Packaging",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Two Sum Less Than K",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Valid Triangle Number",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Count Pairs in Two Arrays",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Put Marbles in Bags",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "H-Index",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Reverse Pairs",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Mock Interview",
                  "badges": []
            },
            {
                  "title": "45m",
                  "badges": []
            },
            {
                  "title": "0 Attempts Remaining",
                  "badges": []
            },
            {
                  "title": "Sorting and Searching Patterns",
                  "badges": []
            }
      ]
    },
  {
      id: 'matrices',
      isCore: false,
      name: 'Matrices',
      description: 'An advanced pattern from Educative Grokking for Matrices.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Set Matrix Zeros",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Rotate Image",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Spiral Matrix",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Where Will the Ball Fall",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Island Perimeter",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Convert 1D Array Into 2D Array",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Spiral Matrix II",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Flip Columns For Maximum Number of Equal Rows",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Number of Spaces Cleaning Robot Cleaned",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Transpose Matrix",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Count Negative Numbers in a Sorted Matrix",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Minimum Time Takes to Reach Destination Without Drowning",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Smallest Rectangle Enclosing Black Pixels",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Minimize Maximum Value in a Grid",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Kth Smallest Number in Multiplication Table",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Swim in Rising Water",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Best Meeting Point",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Game of Life",
                  "badges": [
                        "med"
                  ]
            }
      ]
    },
  {
      id: 'stacks',
      isCore: false,
      name: 'Stacks',
      description: 'An advanced pattern from Educative Grokking for Stacks.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Valid Parentheses",
                  "badges": [
                        "easy",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Basic Calculator",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Remove All Adjacent Duplicates In String",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Minimum Remove to Make Valid Parentheses",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Exclusive Time of Functions",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Flatten Nested List Iterator",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Implement Queue Using Stacks",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Decode String",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Daily Temperatures",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Minimum String Length After Removing Substrings",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Number of Valid Subarrays",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Number of Visible People in a Queue",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Parsing A Boolean Expression",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Remove Duplicate Letters",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Longest Valid Parentheses",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Next Greater Element IV",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Maximum Width Ramp",
                  "badges": [
                        "med"
                  ]
            }
      ]
    },
  {
      id: 'graphs',
      isCore: false,
      name: 'Graphs',
      description: 'An advanced pattern from Educative Grokking for Graphs.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Clone Graph",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Graph Valid Tree",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Network Delay Time",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Paths in Maze That Lead to Same Room",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Bus Routes",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Reconstruct Itinerary",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Lucky Numbers in a Matrix",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Path with Maximum Probability",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Reorder Routes to Make All Paths Lead to the City Zero",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Tree Diameter",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Find the Town Judge",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Find Center of Star Graph",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Longest Cycle in a Graph",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Minimum Cost to Make at Least One Valid Path in a Grid",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Shortest Cycle in a Graph",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Shortest Path Visiting All Nodes",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Max Area of Island",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Mock Interview",
                  "badges": []
            },
            {
                  "title": "45m",
                  "badges": []
            },
            {
                  "title": "0 Attempts Remaining",
                  "badges": []
            },
            {
                  "title": "Graph Algorithms",
                  "badges": []
            }
      ]
    },
  {
      id: 'tree-depth-first-search',
      isCore: false,
      name: 'Tree Depth-First Search',
      description: 'An advanced pattern from Educative Grokking for Tree Depth-First Search.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Serialize and Deserialize Binary Tree",
                  "badges": [
                        "hard",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Invert Binary Tree",
                  "badges": [
                        "easy",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Binary Tree Maximum Path Sum",
                  "badges": [
                        "hard",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Build Binary Tree from Preorder and Inorder Traversal",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Lowest Common Ancestor of a Binary Tree",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Validate Binary Search Tree",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Maximum Depth of Binary Tree",
                  "badges": [
                        "easy",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Kth Smallest Element in a BST",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Flatten Binary Tree to Linked List",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Diameter of Binary Tree",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Convert Sorted Array to Binary Search Tree",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Binary Tree Right Side View",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Nested List Weight Sum II",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Inorder Successor in BST",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Height of Binary Tree After Subtree Removal Queries",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Delete Nodes And Return Forest",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Sum of Distances in a Tree",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Recover a Tree From Preorder Traversal",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Binary Tree Preorder Traversal",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Univalued Binary Tree",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Path Sum",
                  "badges": [
                        "med"
                  ]
            }
      ]
    },
  {
      id: 'bfs',
      isCore: true,
      name: 'BFS (Level Order Traversal)',
      description: 'The foundation for Graphs and Trees. Use for shortest path in unweighted graphs or level-by-level processing.',
      templateCodePython: `from collections import deque\n\ndef bfs(root):\n    if not root: return []\n    queue = deque([root])\n    res = []\n    \n    while queue:\n        level_size = len(queue)\n        current_level = []\n        for _ in range(level_size):\n            node = queue.popleft()\n            current_level.append(node.val)\n            if node.left: queue.append(node.left)\n            if node.right: queue.append(node.right)\n        res.append(current_level)\n    return res`,
      templateCodeJs: `function bfs(root) {\n  if (!root) return [];\n  const queue = [root];\n  const res = [];\n  \n  while (queue.length > 0) {\n    const levelSize = queue.length;\n    const currentLevel = [];\n    for (let i = 0; i < levelSize; i++) {\n      const node = queue.shift();\n      currentLevel.push(node.val);\n      if (node.left) queue.push(node.left);\n      if (node.right) queue.push(node.right);\n    }\n    res.push(currentLevel);\n  }\n  return res;\n}`,
      relatedCategories: ['Trees', 'Graphs'],
      relatedTags: ['Breadth-First Search'],
      educativeProblems: [
        {
              "title": "Level Order Traversal of Binary Tree",
              "badges": [
                    "med",
                    "Blind 75"
              ]
        },
        {
              "title": "Binary Tree Zigzag Level Order Traversal",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Populating Next Right Pointers in Each Node",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Vertical Order Traversal of a Binary Tree",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Symmetric Tree",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Word Ladder",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Connect All Siblings of a Binary Tree",
              "badges": [
                    "med"
              ]
        },
        {
              "title": "Two Sum IV - Input is a BST",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Find Minimum Diameter After Merging Two Trees",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Closest Node to Path in Tree",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Frog Position After T Seconds",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Average of Levels in Binary Tree",
              "badges": [
                    "easy"
              ]
        },
        {
              "title": "Open the Lock",
              "badges": [
                    "hard"
              ]
        },
        {
              "title": "Mock Interview",
              "badges": []
        },
        {
              "title": "45m",
              "badges": []
        },
        {
              "title": "0 Attempts Remaining",
              "badges": []
        },
        {
              "title": "Tree Traversal Techniques",
              "badges": []
        }
      ]
    },
  {
      id: 'trie',
      isCore: false,
      name: 'Trie',
      description: 'An advanced pattern from Educative Grokking for Trie.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Implement Trie",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Design Add and Search Words Data Structure",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Word Search II",
                  "badges": [
                        "hard",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Search Suggestions System",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Replace Words",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Top K Frequent Words",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Lexicographical Numbers",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Longest Common Prefix",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Index Pairs of a String",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "K-th Smallest in Lexicographical Order",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Palindrome Pairs",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Longest Common Suffix Queries",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Map Sum Pairs",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Check If a Word is a Prefix of Any Word in a Sentence",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Longest Word With All Prefixes",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "•",
                  "badges": []
            }
      ]
    },
  {
      id: 'hash-maps',
      isCore: false,
      name: 'Hash Maps',
      description: 'An advanced pattern from Educative Grokking for Hash Maps.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Design HashMap",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Fraction to Recurring Decimal",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Logger Rate Limiter",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Next Greater Element I",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Isomorphic Strings",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Find Duplicate File in System",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Longest Palindrome",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Continuous Subarray Sum",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Unique Number of Occurrences",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "High Five",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Bulls and Cows",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Number of Wonderful Substrings",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Number of Distinct Islands",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Custom Sort String",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Total Appeal of a String",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Dot Product of Two Sparse Vectors",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Longest Happy Prefix",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Find Longest Self-Contained Substring",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Intersection of Two Arrays",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Word Pattern",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Valid Sudoku",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Roman to Integer",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Contiguous Array",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Jewels and Stones",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Vowel Spellchecker",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "N-Repeated Element in Size 2N Array",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Powerful Integers",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Before and After Puzzle",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Intersection of Two Arrays II",
                  "badges": [
                        "med"
                  ]
            }
      ]
    },
  {
      id: 'knowing-what-to-track',
      isCore: false,
      name: 'Knowing What to Track',
      description: 'An advanced pattern from Educative Grokking for Knowing What to Track.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Valid Anagram",
                  "badges": [
                        "easy",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Group Anagrams",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Palindrome Permutation",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Design Tic-Tac-Toe",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Maximum Frequency Stack",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "First Unique Character in a String",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Find All Anagrams in a String",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Longest Palindrome by Concatenating Two-Letter Words",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Ransom Note",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Minimum Number of Pushes to Type Word II",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Rank Teams by Votes",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Pairs of Songs With Total Durations Divisible by 60",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Count Anagrams",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Divide Array Into Increasing Sequences",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Max Consecutive Ones",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Count and Say",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Find Words That Can Be Formed by Characters",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Check if One String Swap Can Make Strings Equal",
                  "badges": [
                        "med"
                  ]
            }
      ]
    },
  {
      id: 'union-find',
      isCore: false,
      name: 'Union Find',
      description: 'An advanced pattern from Educative Grokking for Union Find.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Number of Islands",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Longest Consecutive Sequence",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Redundant Connection",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Most Stones Removed with Same Row or Column",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Last Day Where You Can Still Cross",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Regions Cut by Slashes",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Accounts Merge",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Minimize Malware Spread",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Evaluate Division",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Find if Path Exists in Graph",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "The Skyline Problem",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Similar String Groups",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Optimize Water Distribution in a Village",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Number of Islands II",
                  "badges": [
                        "hard"
                  ]
            }
      ]
    },
  {
      id: 'custom-data-structures',
      isCore: false,
      name: 'Custom Data Structures',
      description: 'An advanced pattern from Educative Grokking for Custom Data Structures.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Snapshot Array",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Time-Based Key-Value Store",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Implement LRU Cache",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Insert Delete GetRandom O(1)",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Min Stack",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Range Module",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Shortest Word Distance II",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "LFU Cache",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Moving Average from Data Stream",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Two Sum III - Data structure design",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Range Sum Query - Immutable",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Design HashSet",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Max Stack",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Stream of Characters",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "All O`one Data Structures",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Finding MK Average",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Mock Interview",
                  "badges": []
            },
            {
                  "title": "45m",
                  "badges": []
            },
            {
                  "title": "0 Attempts Remaining",
                  "badges": []
            },
            {
                  "title": "Fundamental Data Structures",
                  "badges": []
            }
      ]
    },
  {
      id: 'bitwise-manipulation',
      isCore: false,
      name: 'Bitwise Manipulation',
      description: 'An advanced pattern from Educative Grokking for Bitwise Manipulation.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Encode and Decode Strings",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Reverse Bits",
                  "badges": [
                        "easy",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Find the Difference",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Complement of Base 10 Integer",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Flipping an Image",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Single Number",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Single Number II",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Find the Longest Substring Having Vowels in Even Counts",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Longest Subarray With Maximum Bitwise AND",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Count Triplets That Can Form Two Arrays of Equal XOR",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Sum of All Subset XOR Totals",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Find The K-th Lucky Number",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Minimum Number of K Consecutive Bit Flips",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Minimum One Bit Operations to Make Integers Zero",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Triples with Bitwise AND Equal To Zero",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Power of Two",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Hamming Distance",
                  "badges": [
                        "med"
                  ]
            }
      ]
    },
  {
      id: 'math-and-geometry',
      isCore: false,
      name: 'Math and Geometry',
      description: 'An advanced pattern from Educative Grokking for Math and Geometry.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Minimum Area Rectangle",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Maximum Area Rectangle With Point Constraints I",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Reverse Integer",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Minimum Number of Lines to Cover Points",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Minimize Manhattan Distances",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Convex Polygon",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Check If It Is a Straight Line",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Minimum Cuts to Divide a Circle",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Valid Square",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Rectangle Overlap",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Minimum Time Visiting All Points",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Rectangle Area",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Queries on Number of Points Inside a Circle",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Max Points on a Line",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Maximum Number of Visible Points",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Detonate the Maximum Bombs",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Self Crossing",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Erect the Fence",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Nth Magical Number",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Add Strings",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Perfect Squares",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Palindrome Number",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Fibonacci Number",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Integer to English Words",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Add Two Numbers",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Plus One",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Confusing Number",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Nim Game",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Bulb Switcher",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Water and Jug Problem",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Poor Pigs",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Add to Array-Form of Integer",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Greatest Common Divisor of Strings",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Count Substrings with Only One Distinct Letter",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Equal Rational Numbers",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Adding Two Negabinary Numbers",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Power of Three",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Mock Interview",
                  "badges": []
            },
            {
                  "title": "45m",
                  "badges": []
            },
            {
                  "title": "0 Attempts Remaining",
                  "badges": []
            },
            {
                  "title": "Complex Patterns and Operations",
                  "badges": []
            }
      ]
    },
  {
      id: 'challenge-yourself',
      isCore: false,
      name: 'Challenge Yourself',
      description: 'An advanced pattern from Educative Grokking for Challenge Yourself.',
      templateCodePython: '# To be added\npass',
      templateCodeJs: '// To be added\n',
      relatedCategories: [],
      relatedTags: [],
      educativeProblems: [
            {
                  "title": "Challenge Yourself: Introduction",
                  "badges": []
            },
            {
                  "title": "Number of Connected Components in an Undirected Graph",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Pacific Atlantic Water Flow",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Contains Duplicate",
                  "badges": [
                        "easy",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Maximum Subarray",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Two Sum",
                  "badges": [
                        "easy",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Find Minimum in Rotated Sorted Array",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Non-overlapping Intervals",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Meeting Rooms",
                  "badges": [
                        "easy",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Subtree of Another Tree",
                  "badges": [
                        "easy",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Number of 1 Bits",
                  "badges": [
                        "easy",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Container with Most Water",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Product of Array Except Self",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Longest Increasing Subsequence",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Sum of Two Integers",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Unique Paths",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Longest Palindromic Substring",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "House Robber",
                  "badges": [
                        "med",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Same Tree",
                  "badges": [
                        "easy",
                        "Blind 75"
                  ]
            },
            {
                  "title": "Shortest Bridge",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Median of Two Sorted Arrays",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Largest Rectangle in Histogram",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Sort List",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Evaluate Reverse Polish Notation",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "4Sum",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Loud and Rich",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Majority Element",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Permutations II",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Number of Provinces",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Linked List Cycle II",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Minimum Flips to Make the Binary String Alternate",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Lemonade Change",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Find All Numbers Disappeared in an Array",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Find All Duplicates in an Array",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Design In-Memory File System",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Design File System",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Asteroid Collision",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Rotting Oranges",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Add Binary",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Multiply Strings",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Lowest Common Ancestor of a Binary Search Tree",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Merge Two Sorted Lists",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Balanced Binary Tree",
                  "badges": [
                        "easy"
                  ]
            },
            {
                  "title": "Maximum Profit in Job Scheduling",
                  "badges": [
                        "hard"
                  ]
            },
            {
                  "title": "Minimum Height Trees",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "String to Integer (atoi)",
                  "badges": [
                        "med"
                  ]
            },
            {
                  "title": "Trapping Rain Water",
                  "badges": [
                        "hard"
                  ]
            }
      ]
    }
];
