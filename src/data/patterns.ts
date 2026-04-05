import { PatternFoundation } from '../types';

export const patterns: PatternFoundation[] = [
  {
    id: 'two-pointers',
    name: 'Two Pointers (Converging)',
    description: 'Use on sorted arrays to find pairs. The foundational technique for iterating arrays with two indices.',
    templateCodePython: `def two_pointers(nums, target):\n    l, r = 0, len(nums) - 1\n    while l < r:\n        total = nums[l] + nums[r]\n        if total == target:\n            return [l, r]\n        elif total < target:\n            l += 1\n        else:\n            r -= 1\n    return []`,
    templateCodeJs: `function twoPointers(nums, target) {\n  let l = 0, r = nums.length - 1;\n  while (l < r) {\n    const total = nums[l] + nums[r];\n    if (total === target) return [l, r];\n    else if (total < target) l++;\n    else r--;\n  }\n  return [];\n}`,
    relatedCategories: ['Two Pointers'],
    relatedTags: ['Two Pointers']
  },
  {
    id: 'sliding-window',
    name: 'Sliding Window (Variable Size)',
    description: 'Builds on Two Pointers. Use this for contiguous subarrays where you need to track a "state" (sum, frequency, etc.).',
    templateCodePython: `def sliding_window(arr):\n    left = 0\n    state = 0 # Can be a sum, a dictionary, etc.\n    res = 0\n    \n    for right in range(len(arr)):\n        # 1. Add right element to state\n        state += arr[right] \n        \n        # 2. While condition is violated, shrink from left\n        while state > target: \n            state -= arr[left]\n            left += 1\n            \n        # 3. Update result\n        res = max(res, right - left + 1)\n    return res`,
    templateCodeJs: `function slidingWindow(arr) {\n  let left = 0;\n  let state = 0; // Can be a sum, an object/map, etc.\n  let res = 0;\n  \n  for (let right = 0; right < arr.length; right++) {\n    // 1. Add right element to state\n    state += arr[right];\n    \n    // 2. While condition is violated, shrink from left\n    while (state > target) {\n      state -= arr[left];\n      left++;\n    }\n    \n    // 3. Update result\n    res = Math.max(res, right - left + 1);\n  }\n  return res;\n}`,
    relatedCategories: ['Sliding Window'],
    relatedTags: ['Sliding Window']
  },
  {
    id: 'fast-slow-pointers',
    name: 'Fast and Slow Pointers',
    description: 'A Two Pointer variation where pointers move at different speeds. Perfect for cycle detection in Linked Lists.',
    templateCodePython: `def has_cycle(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n        if slow == fast:\n            return True\n    return False`,
    templateCodeJs: `function hasCycle(head) {\n  let slow = head, fast = head;\n  while (fast && fast.next) {\n    slow = slow.next;\n    fast = fast.next.next;\n    if (slow === fast) return true;\n  }\n  return false;\n}`,
    relatedCategories: ['Linked List'],
    relatedTags: [] 
  },
  {
    id: 'binary-search',
    name: 'Binary Search (Find Boundaries)',
    description: 'Use this to find the "first" or "last" occurrence in a sorted space with O(log N) time complexity.',
    templateCodePython: `def binary_search(nums, target, find_first):\n    l, r = 0, len(nums) - 1\n    ans = -1\n    while l <= r:\n        mid = l + (r - l) // 2\n        if nums[mid] == target:\n            ans = mid\n            if find_first: r = mid - 1 # Nudge left\n            else: l = mid + 1          # Nudge right\n        elif nums[mid] < target:\n            l = mid + 1\n        else:\n            r = mid - 1\n    return ans`,
    templateCodeJs: `function binarySearch(nums, target, findFirst) {\n  let l = 0, r = nums.length - 1;\n  let ans = -1;\n  while (l <= r) {\n    let mid = Math.floor(l + (r - l) / 2);\n    if (nums[mid] === target) {\n      ans = mid;\n      if (findFirst) r = mid - 1; // Nudge left\n      else l = mid + 1;           // Nudge right\n    } else if (nums[mid] < target) {\n      l = mid + 1;\n    } else {\n      r = mid - 1;\n    }\n  }\n  return ans;\n}`,
    relatedCategories: ['Binary Search'],
    relatedTags: ['Binary Search']
  },
  {
    id: 'bfs',
    name: 'BFS (Level Order Traversal)',
    description: 'The foundation for Graphs and Trees. Use for shortest path in unweighted graphs or level-by-level processing.',
    templateCodePython: `from collections import deque\n\ndef bfs(root):\n    if not root: return []\n    queue = deque([root])\n    res = []\n    \n    while queue:\n        level_size = len(queue)\n        current_level = []\n        for _ in range(level_size):\n            node = queue.popleft()\n            current_level.append(node.val)\n            if node.left: queue.append(node.left)\n            if node.right: queue.append(node.right)\n        res.append(current_level)\n    return res`,
    templateCodeJs: `function bfs(root) {\n  if (!root) return [];\n  const queue = [root];\n  const res = [];\n  \n  while (queue.length > 0) {\n    const levelSize = queue.length;\n    const currentLevel = [];\n    for (let i = 0; i < levelSize; i++) {\n      const node = queue.shift();\n      currentLevel.push(node.val);\n      if (node.left) queue.push(node.left);\n      if (node.right) queue.push(node.right);\n    }\n    res.push(currentLevel);\n  }\n  return res;\n}`,
    relatedCategories: ['Trees', 'Graphs'],
    relatedTags: ['Breadth-First Search']
  },
  {
    id: 'topological-sort',
    name: "Topological Sort (Kahn's Algorithm)",
    description: 'Advanced Graph theory. Essential for processing nodes with prerequisite dependencies (like Course Schedule).',
    templateCodePython: `from collections import deque\n\ndef topo_sort(nodes, edges):\n    adj = {i: [] for i in nodes}\n    in_degree = {i: 0 for i in nodes}\n    for u, v in edges:\n        adj[u].append(v)\n        in_degree[v] += 1\n        \n    queue = deque([i for i in nodes if in_degree[i] == 0])\n    res = []\n    \n    while queue:\n        u = queue.popleft()\n        res.append(u)\n        for v in adj[u]:\n            in_degree[v] -= 1\n            if in_degree[v] == 0:\n                queue.append(v)\n    return res if len(res) == len(nodes) else []`,
    templateCodeJs: `function topoSort(nodes, edges) {\n  const adj = new Map(nodes.map(i => [i, []]));\n  const inDegree = new Map(nodes.map(i => [i, 0]));\n  \n  for (const [u, v] of edges) {\n    adj.get(u).push(v);\n    inDegree.set(v, inDegree.get(v) + 1);\n  }\n  \n  const queue = [];\n  for (const [node, degree] of inDegree.entries()) {\n    if (degree === 0) queue.push(node);\n  }\n  \n  const res = [];\n  while (queue.length > 0) {\n    const u = queue.shift();\n    res.push(u);\n    for (const v of adj.get(u)) {\n      inDegree.set(v, inDegree.get(v) - 1);\n      if (inDegree.get(v) === 0) queue.push(v);\n    }\n  }\n  return res.length === nodes.length ? res : [];\n}`,
    relatedCategories: ['Advanced Graphs', 'Graphs'],
    relatedTags: ['Topological Sort']
  },
  {
    id: 'top-k-elements',
    name: 'Top K Elements (Heap)',
    description: 'The definitive optimization technique. Use to find K largest/smallest items without doing a full O(N log N) array sort.',
    templateCodePython: `import heapq\n\ndef top_k(nums, k):\n    # Min-heap to keep track of the largest K elements\n    min_heap = []\n    for num in nums:\n        heapq.heappush(min_heap, num)\n        if len(min_heap) > k:\n            heapq.heappop(min_heap)\n    return min_heap`,
    templateCodeJs: `// Typically uses a priority queue/heap library in JS\nfunction topK(nums, k) {\n  // Using a MinPriorityQueue class\n  const minHeap = new MinPriorityQueue();\n  for (let num of nums) {\n    minHeap.enqueue(num);\n    if (minHeap.size() > k) {\n      minHeap.dequeue();\n    }\n  }\n  return minHeap.toArray().map(x => x.element);\n}`,
    relatedCategories: ['Heap / Priority Queue'],
    relatedTags: ['Heap (Priority Queue)']
  },
  {
    id: 'two-heaps',
    name: 'Two Heaps',
    description: 'Advanced optimization. The elite pattern for tracking the running median in a continuous data stream.',
    templateCodePython: `class MedianFinder:\n    def __init__(self):\n        self.small = [] # Max-heap (stores smaller half)\n        self.large = [] # Min-heap (stores larger half)\n\n    def addNum(self, num):\n        # Push to small, then move largest of small to large\n        heapq.heappush(self.small, -num)\n        heapq.heappush(self.large, -heapq.heappop(self.small))\n        \n        # Maintain size property: len(small) >= len(large)\n        if len(self.large) > len(self.small):\n            heapq.heappush(self.small, -heapq.heappop(self.large))`,
    templateCodeJs: `class MedianFinder {\n  constructor() {\n    this.small = new MaxPriorityQueue(); // stores smaller half\n    this.large = new MinPriorityQueue(); // stores larger half\n  }\n\n  addNum(num) {\n    this.small.enqueue(num);\n    this.large.enqueue(this.small.dequeue().element);\n    \n    if (this.large.size() > this.small.size()) {\n      this.small.enqueue(this.large.dequeue().element);\n    }\n  }\n}`,
    relatedCategories: ['Heap / Priority Queue'], 
    relatedTags: ['Data Stream'] 
  }
];
