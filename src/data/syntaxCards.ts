import { cppSyntaxCards } from './cppSyntaxCards';

export type SyntaxLanguage = 'python' | 'java' | 'javascript' | 'cpp';

export interface SyntaxCard {
    id: string;
    language: SyntaxLanguage;
    category: string;
    description: string;
    syntax: string;
    useCase: string;
    timeComplexity: string;
}

export const pythonSyntaxCards: SyntaxCard[] = [
    // --- String Methods ---
    {
        id: "py-str-split-default",
        language: "python",
        category: "String Methods",
        description: "Split string by whitespace",
        syntax: "words = s.split()",
        useCase: "Parsing words from a sentence without worrying about extra spaces.",
        timeComplexity: "O(N)"
    },
    {
        id: "py-str-split-custom",
        language: "python",
        category: "String Methods",
        description: "Split string by specific delimiter",
        syntax: "parts = s.split(',')",
        useCase: "Parsing CSV data or specific delimited logs.",
        timeComplexity: "O(N)"
    },
    {
        id: "py-str-join",
        language: "python",
        category: "String Methods",
        description: "Join array of strings into one string",
        syntax: "res = '-'.join(words)",
        useCase: "Constructing a final string from an array of computed parts.",
        timeComplexity: "O(N)"
    },
    {
        id: "py-str-strip",
        language: "python",
        category: "String Methods",
        description: "Remove leading and trailing whitespace",
        syntax: "clean = s.strip()",
        useCase: "Cleaning up dirty input string data.",
        timeComplexity: "O(N)"
    },
    {
        id: "py-str-replace",
        language: "python",
        category: "String Methods",
        description: "Replace all occurrences of a substring",
        syntax: "new_s = s.replace('old', 'new')",
        useCase: "Sanitizing strings, e.g., removing all periods from an IP address.",
        timeComplexity: "O(N)"
    },
    {
        id: "py-str-find",
        language: "python",
        category: "String Methods",
        description: "Find index of substring (returns -1 if not found)",
        syntax: "idx = s.find('sub')",
        useCase: "Checking substring existence and location safely without exceptions.",
        timeComplexity: "O(N*M)"
    },
    {
        id: "py-str-index",
        language: "python",
        category: "String Methods",
        description: "Find index of substring (raises ValueError if not found)",
        syntax: "idx = s.index('sub')",
        useCase: "When you are absolutely sure the substring exists and want it to fail fast if not.",
        timeComplexity: "O(N*M)"
    },
    {
        id: "py-str-startswith",
        language: "python",
        category: "String Methods",
        description: "Check if string starts with prefix",
        syntax: "is_start = s.startswith('pre')",
        useCase: "Trie prefix matching problems or parsing specific command prefixes.",
        timeComplexity: "O(K)"
    },
    {
        id: "py-str-endswith",
        language: "python",
        category: "String Methods",
        description: "Check if string ends with suffix",
        syntax: "is_end = s.endswith('suf')",
        useCase: "File extension checking or suffix parsing.",
        timeComplexity: "O(K)"
    },
    {
        id: "py-str-upper-lower",
        language: "python",
        category: "String Methods",
        description: "Convert string to upper, lower, or capitalized form",
        syntax: "u, l, c = s.upper(), s.lower(), s.capitalize()",
        useCase: "Normalizing strings before comparative operations (e.g., case-insensitive anagram verification).",
        timeComplexity: "O(N)"
    },
    {
        id: "py-str-is-checks",
        language: "python",
        category: "String Methods",
        description: "Check character types",
        syntax: "b1, b2, b3 = char.isalpha(), char.isdigit(), char.isalnum()",
        useCase: "Valid Palindrome problem, identifying numbers in string parsing.",
        timeComplexity: "O(1) per char"
    },
    {
        id: "py-str-ord-chr",
        language: "python",
        category: "String Methods",
        description: "Convert char to ASCII int and back",
        syntax: "val, ch = ord('a'), chr(97)",
        useCase: "Using array indices [0-25] for alphabet instead of hash maps (e.g. ord(c) - ord('a')).",
        timeComplexity: "O(1)"
    },
    {
        id: "py-str-slice-reverse",
        language: "python",
        category: "String Methods",
        description: "Reverse a string using slicing",
        syntax: "rev = s[::-1]",
        useCase: "Quick palindrome checks: s == s[::-1].",
        timeComplexity: "O(N)"
    },
    {
        id: "py-str-fstring",
        language: "python",
        category: "String Methods",
        description: "Format integers or variables into strings",
        syntax: "res = f'Value: {count}'",
        useCase: "Constructing complex string keys or output formats efficiently.",
        timeComplexity: "O(N)"
    },

    // --- List Operations ---
    {
        id: "py-list-append-extend",
        language: "python",
        category: "List Operations",
        description: "Add single item vs add multiple items",
        syntax: "arr.append(x); arr.extend([y, z])",
        useCase: "Building flat arrays iteratively without nested list elements.",
        timeComplexity: "O(1) amortized, O(K) for extend"
    },
    {
        id: "py-list-insert",
        language: "python",
        category: "List Operations",
        description: "Insert item at specific index",
        syntax: "arr.insert(0, val)",
        useCase: "Prepending to array (though deque is better for this!).",
        timeComplexity: "O(N)"
    },
    {
        id: "py-list-pop",
        language: "python",
        category: "List Operations",
        description: "Remove and return last item or item at index",
        syntax: "last = arr.pop(); first = arr.pop(0)",
        useCase: "Stack operations (pop()) or queue operations (pop(0), but use deque!).",
        timeComplexity: "O(1) last, O(N) index"
    },
    {
        id: "py-list-remove",
        language: "python",
        category: "List Operations",
        description: "Remove first occurrence of value",
        syntax: "arr.remove(val)",
        useCase: "Deleting a specific element when the index is unknown.",
        timeComplexity: "O(N)"
    },
    {
        id: "py-list-reverse",
        language: "python",
        category: "List Operations",
        description: "In-place reverse vs iterator reverse",
        syntax: "arr.reverse() vs rev_iter = reversed(arr)",
        useCase: "Reversing an array without taking extra memory (in-place).",
        timeComplexity: "O(N)"
    },
    {
        id: "py-list-sort-inplace",
        language: "python",
        category: "List Operations",
        description: "Sort list in-place",
        syntax: "arr.sort(key=lambda x: x[1], reverse=True)",
        useCase: "Sorting intervals or sorting by specific tuple elements to save memory.",
        timeComplexity: "O(N log N)"
    },
    {
        id: "py-list-sorted",
        language: "python",
        category: "List Operations",
        description: "Return new sorted list from iterable",
        syntax: "new_arr = sorted(arr)",
        useCase: "When you need to keep the original array intact but need a sorted version.",
        timeComplexity: "O(N log N) + O(N) space"
    },
    {
        id: "py-list-slice",
        language: "python",
        category: "List Operations",
        description: "Extract sublist",
        syntax: "sub = arr[start:end:step]",
        useCase: "Creating copies of arrays (arr[:]) or getting middle portions.",
        timeComplexity: "O(K) where K is slice length"
    },
    {
        id: "py-list-comprehension",
        language: "python",
        category: "List Operations",
        description: "Create filtered list concisely",
        syntax: "evens = [x for x in arr if x % 2 == 0]",
        useCase: "Quick initializations or filtering without writing map/filter functions.",
        timeComplexity: "O(N)"
    },
    {
        id: "py-list-zip",
        language: "python",
        category: "List Operations",
        description: "Iterate multiple lists simultaneously",
        syntax: "for a, b in zip(listA, listB):",
        useCase: "Comparing character by character in two strings or traversing parallel arrays.",
        timeComplexity: "O(min(N, M))"
    },
    {
        id: "py-list-enumerate",
        language: "python",
        category: "List Operations",
        description: "Iterate with index and value",
        syntax: "for i, val in enumerate(arr):",
        useCase: "Almost every loop where you need the index (e.g., Two Sum hash map population).",
        timeComplexity: "O(N)"
    },
    {
        id: "py-list-math",
        language: "python",
        category: "List Operations",
        description: "Common list math operations",
        syntax: "length, minimum, maximum, total = len(arr), min(arr), max(arr), sum(arr)",
        useCase: "Getting bounds or totals instantly without manual iteration.",
        timeComplexity: "O(1) len, O(N) others"
    },
    {
        id: "py-list-init-grid",
        language: "python",
        category: "List Operations",
        description: "Initialize 2D grid correctly",
        syntax: "grid = [[0] * cols for _ in range(rows)]",
        useCase: "Dynamic Programming memorization tables or graph adjacency matrices.",
        timeComplexity: "O(rows * cols)"
    },
    {
        id: "py-list-copy",
        language: "python",
        category: "List Operations",
        description: "Shallow vs Deep Copy",
        syntax: "shallow = arr.copy(); import copy; deep = copy.deepcopy(arr)",
        useCase: "Backtracking recursion where you need to append a snapshot of the current path.",
        timeComplexity: "O(N) shallow, O(N) deep"
    },

    // --- Dictionary Operations ---
    {
        id: "py-dict-get-default",
        language: "python",
        category: "Dictionary Operations",
        description: "Get value with fallback if key is missing",
        syntax: "val = d.get(key, 0)",
        useCase: "Counting frequencies without catching KeyError.",
        timeComplexity: "O(1)"
    },
    {
        id: "py-dict-views",
        language: "python",
        category: "Dictionary Operations",
        description: "Get dict keys, values, or entries",
        syntax: "k, v, i = d.keys(), d.values(), d.items()",
        useCase: "Iterating over hash map components.",
        timeComplexity: "O(N)"
    },
    {
        id: "py-dict-update",
        language: "python",
        category: "Dictionary Operations",
        description: "Merge another dictionary into current",
        syntax: "d.update(other_d)",
        useCase: "Combining hash maps or mass-updating configurations.",
        timeComplexity: "O(K)"
    },
    {
        id: "py-dict-pop",
        language: "python",
        category: "Dictionary Operations",
        description: "Remove key and return value with default",
        syntax: "val = d.pop('key', default_val)",
        useCase: "Safely deleting entries when you aren't certain the key exists.",
        timeComplexity: "O(1)"
    },
    {
        id: "py-dict-defaultdict",
        language: "python",
        category: "Dictionary Operations",
        description: "Dictionary with default factory type",
        syntax: "from collections import defaultdict\nd = defaultdict(list)\nd[key].append(val)",
        useCase: "Building adjacency lists for graphs or grouping items.",
        timeComplexity: "O(1)"
    },
    {
        id: "py-dict-counter",
        language: "python",
        category: "Dictionary Operations",
        description: "Count frequencies of iterable elements",
        syntax: "from collections import Counter\ncounts = Counter(arr)\ntop = counts.most_common(k)",
        useCase: "Top K Frequent Elements problem or checking string anagrams.",
        timeComplexity: "O(N) build, O(N log K) most_common"
    },
    {
        id: "py-dict-comprehension",
        language: "python",
        category: "Dictionary Operations",
        description: "Create dictionary defensively and concisely",
        syntax: "d = {k: v for k, v in enumerate(arr)}",
        useCase: "Mapping indices to values rapidly to create lookup tables.",
        timeComplexity: "O(N)"
    },
    {
        id: "py-dict-in-operator",
        language: "python",
        category: "Dictionary Operations",
        description: "Check if key exists in dictionary",
        syntax: "if key in d:",
        useCase: "Checking for seen/visited nodes or checking target differences in Two Sum.",
        timeComplexity: "O(1)"
    },
    {
        id: "py-dict-iterate-items",
        language: "python",
        category: "Dictionary Operations",
        description: "Iterate key-value pairs",
        syntax: "for key, val in d.items():",
        useCase: "Finding max frequencies or filtering based on keys and values together.",
        timeComplexity: "O(N)"
    },

    // --- Set Operations ---
    {
        id: "py-set-add-remove",
        language: "python",
        category: "Set Operations",
        description: "Add, explicitly remove, or safely discard elements",
        syntax: "s.add(x); s.remove(y); s.discard(z)",
        useCase: "Tracking visited grid positions or unique seen values.",
        timeComplexity: "O(1)"
    },
    {
        id: "py-set-math",
        language: "python",
        category: "Set Operations",
        description: "Union, intersection, difference operators",
        syntax: "u, i, d = s1 | s2, s1 & s2, s1 - s2",
        useCase: "Finding common characters in strings (intersection) or unseen elements (difference).",
        timeComplexity: "O(min(len(s1), len(s2)))"
    },
    {
        id: "py-set-in",
        language: "python",
        category: "Set Operations",
        description: "Fast lookup",
        syntax: "if x in s:",
        useCase: "Longest Consecutive Sequence — O(1) checks to see if adjacent numbers exist.",
        timeComplexity: "O(1)"
    },
    {
        id: "py-set-comprehension",
        language: "python",
        category: "Set Operations",
        description: "Build set conditionally",
        syntax: "unique_evens = {x for x in arr if x % 2 == 0}",
        useCase: "Extracting unique elements that match criteria.",
        timeComplexity: "O(N)"
    },
    {
        id: "py-set-convert",
        language: "python",
        category: "Set Operations",
        description: "Fast deduplication",
        syntax: "unique_arr = list(set(arr))",
        useCase: "Removing duplicates from an array.",
        timeComplexity: "O(N)"
    },

    // --- Heap and Priority Queue ---
    {
        id: "py-heap-import-heapify",
        language: "python",
        category: "Heap and Priority Queue",
        description: "Transform list into min heap in-place",
        syntax: "import heapq\nheapq.heapify(arr)",
        useCase: "Initializing a priority queue efficiently from existing data.",
        timeComplexity: "O(N)"
    },
    {
        id: "py-heap-push-pop",
        language: "python",
        category: "Heap and Priority Queue",
        description: "Add element and extract minimum",
        syntax: "heapq.heappush(heap, val)\nmin_val = heapq.heappop(heap)",
        useCase: "Dijkstra's Algorithm or Prim's MST.",
        timeComplexity: "O(log N)"
    },
    {
        id: "py-heap-max-heap",
        language: "python",
        category: "Heap and Priority Queue",
        description: "Simulate max heap with negative values",
        syntax: "heapq.heappush(max_heap, -val)\nmax_val = -heapq.heappop(max_heap)",
        useCase: "Finding Kth largest element or managing median in a data stream.",
        timeComplexity: "O(log N)"
    },
    {
        id: "py-heap-nlargest-nsmallest",
        language: "python",
        category: "Heap and Priority Queue",
        description: "Get multiple largest/smallest elements directly",
        syntax: "top_k = heapq.nlargest(k, arr)\nbot_k = heapq.nsmallest(k, arr)",
        useCase: "Quick and readable Kth largest/smallest without writing the heap loop yourself.",
        timeComplexity: "O(N log K)"
    },
    {
        id: "py-heap-push-tuples",
        language: "python",
        category: "Heap and Priority Queue",
        description: "Priority queue with tuples and tie-breaking",
        syntax: "heapq.heappush(pq, (priority, val, unique_id))",
        useCase: "Sorting graph nodes by distance where distance is primary and node ID resolves ties.",
        timeComplexity: "O(log N)"
    },

    // --- Deque and Stack ---
    {
        id: "py-deque-import-init",
        language: "python",
        category: "Deque and Stack",
        description: "Initialize double ended queue",
        syntax: "from collections import deque\nq = deque([1, 2, 3])",
        useCase: "BFS traversal where Left/Right operations must be O(1).",
        timeComplexity: "O(N)"
    },
    {
        id: "py-deque-monotonic",
        language: "python",
        category: "Deque and Stack",
        description: "Monotonic deque pattern",
        syntax: "while q and q[-1] > val: q.pop()\nq.append(val)",
        useCase: "Maintaining sorted candidates. Pop right to maintain order.",
        timeComplexity: "O(1) amortized"
    },
    {
        id: "py-deque-left-operations",
        language: "python",
        category: "Deque and Stack",
        description: "O(1) append and pop from left",
        syntax: "q.appendleft(val); first = q.popleft()",
        useCase: "Processing Tree BFS level-by-level efficiently.",
        timeComplexity: "O(1)"
    },
    {
        id: "py-deque-ordered-dict",
        language: "python",
        category: "Deque and Stack",
        description: "OrderedDict import and usage pattern for LRU Cache",
        syntax: "from collections import OrderedDict\nod = OrderedDict()\nod.move_to_end(key)\noldest = od.popitem(last=False)",
        useCase: "LRU Cache implementation requiring O(1) pop from front and move to back.",
        timeComplexity: "O(1)"
    },
    {
        id: "py-deque-sliding-window",
        language: "python",
        category: "Deque and Stack",
        description: "Sliding window maximum using deque",
        syntax: "while q and q[-1] < val: q.pop()\nq.append(val)",
        useCase: "Maintaining monotonically decreasing candidates for Sliding Window Maximum.",
        timeComplexity: "O(1) amortized"
    },
    {
        id: "py-stack-list",
        language: "python",
        category: "Deque and Stack",
        description: "Using standard list as Stack",
        syntax: "stack = []\nstack.append(val)\nlast = stack.pop()",
        useCase: "DFS traversals or Monotonic Stack problems (e.g., Daily Temperatures).",
        timeComplexity: "O(1)"
    },

    // --- Sorting with Custom Keys ---
    {
        id: "py-sort-tuple-element",
        language: "python",
        category: "Sorting with Custom Keys",
        description: "Sort by second element of tuple",
        syntax: "arr.sort(key=lambda x: x[1])",
        useCase: "Sorting specific interval endpoints (e.g. start/end times).",
        timeComplexity: "O(N log N)"
    },
    {
        id: "py-sort-length",
        language: "python",
        category: "Sorting with Custom Keys",
        description: "Sort strings by length",
        syntax: "words.sort(key=len)",
        useCase: "Longest String Chain or Word Break variations where shortest must be processed first.",
        timeComplexity: "O(N log N)"
    },
    {
        id: "py-sort-multiple-criteria",
        language: "python",
        category: "Sorting with Custom Keys",
        description: "Sort by multiple conditions (first ascending, second descending)",
        syntax: "arr.sort(key=lambda x: (x[0], -x[1]))",
        useCase: "When sorting elements by a primary score, and then a secondary tie-breaker rule.",
        timeComplexity: "O(N log N)"
    },
    {
        id: "py-sorted-lambda",
        language: "python",
        category: "Sorting with Custom Keys",
        description: "Use sorted() returning new array reversed",
        syntax: "res = sorted(arr, key=lambda x: x.score, reverse=True)",
        useCase: "When dealing with objects and needing non-destructive descending sort.",
        timeComplexity: "O(N log N) + O(N) space"
    },

    // --- Two Pointer and Sliding Window Patterns ---
    {
        id: "py-two-pointer-fast-slow",
        language: "python",
        category: "Two Pointer and Sliding Window Patterns",
        description: "Fast and slow pointer initialization for Floyd's cycle detection",
        syntax: "slow, fast = head, head\nwhile fast and fast.next:\n    slow = slow.next\n    fast = fast.next.next\n    if slow == fast: return True",
        useCase: "Detecting cycles in linked lists or finding the middle of a linked list.",
        timeComplexity: "O(N)"
    },
    {
        id: "py-sliding-window-fixed",
        language: "python",
        category: "Two Pointer and Sliding Window Patterns",
        description: "Fixed size sliding window maintaining exactly k elements",
        syntax: "window = sum(arr[:k])\nfor i in range(k, len(arr)):\n    window += arr[i] - arr[i-k]\n    # update result",
        useCase: "Maximum sum subarray of size k, or anagram search of fixed length.",
        timeComplexity: "O(N)"
    },
    {
        id: "py-two-pointer-init",
        language: "python",
        category: "Two Pointer and Sliding Window Patterns",
        description: "Standard opposite end two pointer initialization",
        syntax: "left, right = 0, len(arr) - 1\nwhile left < right:\n    # logic",
        useCase: "Two Sum II (sorted array), trapping rain water, reversing string.",
        timeComplexity: "O(N)"
    },
    {
        id: "py-sliding-window-skeleton",
        language: "python",
        category: "Two Pointer and Sliding Window Patterns",
        description: "Standard sliding window variable size",
        syntax: "left = 0\nfor right in range(len(arr)):\n    # add to window\n    while invalid_condition:\n        # remove left from window\n        left += 1\n    # update result",
        useCase: "Longest substring without repeating characters, longest repeating character replacement.",
        timeComplexity: "O(N)"
    },

    // --- Binary Search ---
    {
        id: "py-bs-bisect",
        language: "python",
        category: "Binary Search",
        description: "Find insertion point retaining sorted order",
        syntax: "import bisect\nidx_left = bisect.bisect_left(arr, val)\nidx_right = bisect.bisect_right(arr, val)",
        useCase: "Finding first or last occurrence of a duplicate in a sorted array, or quick closest value lookups.",
        timeComplexity: "O(log N)"
    },
    {
        id: "py-bs-scratch",
        language: "python",
        category: "Binary Search",
        description: "Classic explicit binary search template",
        syntax: "l, r = 0, len(arr) - 1\nwhile l <= r:\n    m = l + (r - l) // 2\n    if arr[m] == target: return m\n    elif arr[m] < target: l = m + 1\n    else: r = m - 1",
        useCase: "Standard approach when you are searching for exactly one element.",
        timeComplexity: "O(log N)"
    },

    // --- Tree and Graph Traversal ---
    {
        id: "py-graph-adj-list",
        language: "python",
        category: "Tree and Graph Traversal",
        description: "Adjacency list initialization",
        syntax: "adj = defaultdict(list)\nfor u, v in edges:\n    adj[u].append(v)\n    adj[v].append(u)",
        useCase: "Converting arrays of edges into a traversable graph structure.",
        timeComplexity: "O(V + E)"
    },
    {
        id: "py-bfs-visited",
        language: "python",
        category: "Tree and Graph Traversal",
        description: "BFS template with visited set for graphs with cycles",
        syntax: "q = deque([start])\nvisited = {start}\nwhile q:\n    node = q.popleft()\n    for nei in adj[node]:\n        if nei not in visited:\n            visited.add(nei)\n            q.append(nei)",
        useCase: "Shortest path in unweighted graphs or connected components in cyclic graphs.",
        timeComplexity: "O(V + E)"
    },
    {
        id: "py-dijkstra",
        language: "python",
        category: "Tree and Graph Traversal",
        description: "Dijkstra shortest path combining min heap and visited set",
        syntax: "pq = [(0, start)]\nvisited = set()\nwhile pq:\n    dist, node = heapq.heappop(pq)\n    if node in visited: continue\n    visited.add(node)\n    for nei, weight in adj[node]:\n        heapq.heappush(pq, (dist + weight, nei))",
        useCase: "Shortest path in a graph with non-negative edge weights.",
        timeComplexity: "O(E log V)"
    },
    {
        id: "py-dfs-iterative",
        language: "python",
        category: "Tree and Graph Traversal",
        description: "Iterative DFS using an explicit stack",
        syntax: "stack = [root]\nwhile stack:\n    node = stack.pop()\n    # visit node\n    if node.right: stack.append(node.right)\n    if node.left: stack.append(node.left)",
        useCase: "When recursion depth might exceed limits, or specifically avoiding the call stack.",
        timeComplexity: "O(V + E)"
    },
    {
        id: "py-bfs-template",
        language: "python",
        category: "Tree and Graph Traversal",
        description: "Standard BFS Level-by-level traversal",
        syntax: "q = deque([root])\nwhile q:\n    for _ in range(len(q)):\n        node = q.popleft()\n        if node.left: q.append(node.left)\n        if node.right: q.append(node.right)",
        useCase: "Binary Tree level order traversal, finding shortest path in unweighted graphs.",
        timeComplexity: "O(V + E)"
    },
    {
        id: "py-dfs-recursive",
        language: "python",
        category: "Tree and Graph Traversal",
        description: "Standard DFS Recursion",
        syntax: "def dfs(node):\n    if not node: return\n    # visit node\n    dfs(node.left)\n    dfs(node.right)",
        useCase: "Tree validations, paths, depth calculations using the call stack.",
        timeComplexity: "O(V + E)"
    },
    {
        id: "py-treenode-def",
        language: "python",
        category: "Tree and Graph Traversal",
        description: "Standard LeetCode TreeNode class",
        syntax: "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right",
        useCase: "Required for defining helper functions or mock testing locally.",
        timeComplexity: "N/A"
    },
    {
        id: "py-topological-sort",
        language: "python",
        category: "Tree and Graph Traversal",
        description: "Topological sort using BFS with in-degree counting",
        syntax: "q = deque([n for n in range(num) if indegree[n] == 0])\nwhile q:\n    node = q.popleft()\n    res.append(node)\n    for nei in adj[node]:\n        indegree[nei] -= 1\n        if indegree[nei] == 0: q.append(nei)",
        useCase: "Course schedule dependencies or validating DAG structures (Kahn's Algorithm).",
        timeComplexity: "O(V + E)"
    },

    // --- String Building ---
    {
        id: "py-string-builder",
        language: "python",
        category: "String Building",
        description: "Efficient string concatenation loop",
        syntax: "res = []\nfor char in string:\n    res.append(char)\nfinal = ''.join(res)",
        useCase: "Avoiding massive overhead of res += char inside a loop (which allocates a new string every time).",
        timeComplexity: "O(N)"
    },

    // --- Math and Modulo ---
    {
        id: "py-math-int-div-mod",
        language: "python",
        category: "Math and Modulo",
        description: "Integer division and Modulo",
        syntax: "quotient = 10 // 3\nremainder = 10 % 3",
        useCase: "Extracting digits from an integer iteratively (val % 10, val // 10).",
        timeComplexity: "O(1)"
    },
    {
        id: "py-math-abs-pow",
        language: "python",
        category: "Math and Modulo",
        description: "Absolute value and modular exponentiation",
        syntax: "val = abs(-5)\nres = pow(base, exp, mod)",
        useCase: "Handling distances or keeping large exponent calculations within integer bounds.",
        timeComplexity: "O(1), O(log exp)"
    },
    {
        id: "py-math-infinity",
        language: "python",
        category: "Math and Modulo",
        description: "Max and Min values for variables",
        syntax: "pos_inf = float('inf')\nneg_inf = float('-inf')",
        useCase: "Initializing variables when looking for minimums or maximums in arrays.",
        timeComplexity: "O(1)"
    },

    // --- Type Conversions ---
    {
        id: "py-type-conv-basics",
        language: "python",
        category: "Type Conversions",
        description: "Convert string to int and back",
        syntax: "num = int('42')\nchars = str(42)",
        useCase: "Dealing with string-represented numbers safely.",
        timeComplexity: "O(N)"
    },
    {
        id: "py-type-conv-int-digits",
        language: "python",
        category: "Type Conversions",
        description: "Convert int to list of digits and back",
        syntax: "digits = [int(d) for d in str(num)]\nnum = int(''.join(map(str, digits)))",
        useCase: "Happy Number problem, processing each digit mathematically.",
        timeComplexity: "O(N)"
    },

    // --- Backtracking ---
    {
        id: "py-backtracking-template",
        language: "python",
        category: "Backtracking",
        description: "Standard backtracking template (choose, explore, unchoose)",
        syntax: "def backtrack(start, path):\n    if base_case:\n        res.append(path[:])\n        return\n    for i in range(start, len(choices)):\n        path.append(choices[i])\n        backtrack(i + 1, path)\n        path.pop()",
        useCase: "Combinations, permutations, subsets, and puzzle solving.",
        timeComplexity: "O(2^N) or O(N!) depending on problem"
    },

    // --- Dynamic Programming ---
    {
        id: "py-dp-1d",
        language: "python",
        category: "Dynamic Programming",
        description: "1D DP array initialization and bottom-up iteration",
        syntax: "dp = [0] * (n + 1)\ndp[0] = base_val\nfor i in range(1, n + 1):\n    dp[i] = dp[i-1] + arr[i]",
        useCase: "Fibonacci sequence, climbing stairs, or 1D knapsack style problems.",
        timeComplexity: "O(N)"
    },
    {
        id: "py-dp-2d",
        language: "python",
        category: "Dynamic Programming",
        description: "2D DP table initialization for grid or string comparison problems",
        syntax: "dp = [[0] * cols for _ in range(rows)]\nfor r in range(1, rows):\n    for c in range(1, cols):\n        dp[r][c] = dp[r-1][c] + dp[r][c-1]",
        useCase: "Unique paths, longest common subsequence, edit distance.",
        timeComplexity: "O(rows * cols)"
    },
    {
        id: "py-dp-memoization",
        language: "python",
        category: "Dynamic Programming",
        description: "Memoization template using functools lru_cache",
        syntax: "from functools import lru_cache\n@lru_cache(None)\ndef dp(i, j):\n    if base_case: return 0\n    return max(dp(i+1, j), dp(i, j+1))",
        useCase: "Top-down dynamic programming avoiding manual visited dicts.",
        timeComplexity: "O(states)"
    },

    // --- Linked List Patterns ---
    {
        id: "py-linked-list-dummy",
        language: "python",
        category: "Linked List Patterns",
        description: "Dummy node initialization pattern",
        syntax: "dummy = ListNode(0)\ndummy.next = head\ncurr = dummy\n# traverse...\nreturn dummy.next",
        useCase: "Whenever the head of a linked list might change (e.g., removing heads, merging).",
        timeComplexity: "O(1)"
    },
    {
        id: "py-linked-list-reverse",
        language: "python",
        category: "Linked List Patterns",
        description: "Iterative linked list reversal template",
        syntax: "prev, curr = None, head\nwhile curr:\n    nxt = curr.next\n    curr.next = prev\n    prev = curr\n    curr = nxt\nhead = prev",
        useCase: "Reversing entire lists or sublists (Reverse Linked List II or Palindrome Linked List).",
        timeComplexity: "O(N)"
    },
    {
        id: "py-linked-list-node",
        language: "python",
        category: "Linked List Patterns",
        description: "ListNode class definition matching standard LeetCode format",
        syntax: "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next",
        useCase: "Standard node structure for all LeetCode linked list problems.",
        timeComplexity: "N/A"
    },

    // --- Utility ---
    {
        id: "py-util-any-all",
        language: "python",
        category: "Utility",
        description: "any() and all() with lambda examples",
        syntax: "is_valid = all(x > 0 for x in arr)\nhas_zero = any(x == 0 for x in arr)",
        useCase: "Quickly asserting facts about iterables without writing full loops.",
        timeComplexity: "O(N)"
    },
    {
        id: "py-util-recursion-limit",
        language: "python",
        category: "Utility",
        description: "sys.setrecursionlimit with standard high value for deep recursion",
        syntax: "import sys\nsys.setrecursionlimit(2000)",
        useCase: "Preventing RecursionError / Maximum recursion depth exceeded on large test cases.",
        timeComplexity: "O(1)"
    },
    {
        id: "py-util-unpacking",
        language: "python",
        category: "Utility",
        description: "Unpacking operator used to pass a list as arguments",
        syntax: "arr = [1, 2, 3]\nprint(*arr) # equivalent to print(1, 2, 3)",
        useCase: "Passing array elements as arguments to functions (like zip, max) dynamically.",
        timeComplexity: "O(N)"
    },
    {
        id: "py-util-zip-longest",
        language: "python",
        category: "Utility",
        description: "zip_longest from itertools with fillvalue example",
        syntax: "from itertools import zip_longest\nfor a, b in zip_longest(l1, l2, fillvalue=0):",
        useCase: "Iterating over two lists of unequal length seamlessly.",
        timeComplexity: "O(max(N, M))"
    }
];

export const allSyntaxCards: SyntaxCard[] = [...pythonSyntaxCards, ...cppSyntaxCards];

// Bolt Optimization: O(1) lookup map for syntax cards to replace slow array .find() calls
export const syntaxCardMap = allSyntaxCards.reduce((acc, card) => {
  acc[card.id] = card;
  return acc;
}, {} as Record<string, SyntaxCard>);
