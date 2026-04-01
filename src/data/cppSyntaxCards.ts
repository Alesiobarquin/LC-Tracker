import { SyntaxCard } from './syntaxCards';

export const cppSyntaxCards: SyntaxCard[] = [
    // --- String Methods ---
    {
        id: "cpp-str-substr",
        language: "cpp",
        category: "String Methods",
        description: "Extract a substring",
        syntax: "string sub = s.substr(start_pos, length);",
        useCase: "Extracting a portion of a string. Note that the second argument is LENGTH, not end index.",
        timeComplexity: "O(K) where K is length"
    },
    {
        id: "cpp-str-find",
        language: "cpp",
        category: "String Methods",
        description: "Find index of substring",
        syntax: "size_t pos = s.find(\"target\");\nif (pos != string::npos) { // found }",
        useCase: "Checking substring existence and location safely.",
        timeComplexity: "O(N*M)"
    },
    {
        id: "cpp-str-append",
        language: "cpp",
        category: "String Methods",
        description: "Append character or string",
        syntax: "s.push_back('a'); // char\ns += \"bc\"; // string",
        useCase: "Efficiently building strings during string manipulation tasks.",
        timeComplexity: "O(1) amortized"
    },
    {
        id: "cpp-str-pop-back",
        language: "cpp",
        category: "String Methods",
        description: "Remove last character",
        syntax: "s.pop_back();",
        useCase: "Backtracking algorithms involving strings where you un-choose a character.",
        timeComplexity: "O(1)"
    },
    {
        id: "cpp-str-compare",
        language: "cpp",
        category: "String Methods",
        description: "Compare strings",
        syntax: "if (s1 == s2) { ... }\nint res = s1.compare(s2); // <0, 0, >0",
        useCase: "Dictionary order comparisons or exact equality checks.",
        timeComplexity: "O(min(N, M))"
    },
    {
        id: "cpp-str-isalnum",
        language: "cpp",
        category: "String Methods",
        description: "Check character types",
        syntax: "#include <cctype>\nif (isalnum(c)) { ... }\n// isalpha(c), isdigit(c), islower(c)",
        useCase: "Valid Palindrome problem, identifying numbers in string parsing.",
        timeComplexity: "O(1) per char"
    },
    {
        id: "cpp-str-tolower",
        language: "cpp",
        category: "String Methods",
        description: "Convert character to lower/upper",
        syntax: "char lower = tolower(c);\nchar upper = toupper(c);",
        useCase: "Normalizing characters before comparative operations (e.g., case-insensitive anagram verification).",
        timeComplexity: "O(1)"
    },
    {
        id: "cpp-str-to-int",
        language: "cpp",
        category: "String Methods",
        description: "String to Integer (stoi) and Integer to String (to_string)",
        syntax: "int num = stoi(\"42\");\nstring s = to_string(42);",
        useCase: "Dealing with string-represented numbers safely.",
        timeComplexity: "O(N)"
    },

    // --- Vector Operations ---
    {
        id: "cpp-vec-init",
        language: "cpp",
        category: "Vector Operations",
        description: "Initialize 1D and 2D vectors",
        syntax: "vector<int> v(size, init_val);\nvector<vector<int>> grid(rows, vector<int>(cols, init_val));",
        useCase: "Dynamic Programming memorization tables or graph adjacency matrices.",
        timeComplexity: "O(N) or O(rows * cols)"
    },
    {
        id: "cpp-vec-push-pop",
        language: "cpp",
        category: "Vector Operations",
        description: "Add or remove from end",
        syntax: "v.push_back(val);\nv.pop_back();",
        useCase: "Stack operations using a vector, or building dynamic arrays.",
        timeComplexity: "O(1) amortized"
    },
    {
        id: "cpp-vec-back",
        language: "cpp",
        category: "Vector Operations",
        description: "Access first and last elements",
        syntax: "int first = v.front();\nint last = v.back();",
        useCase: "Quick access to ends without v[0] or v[v.size() - 1].",
        timeComplexity: "O(1)"
    },
    {
        id: "cpp-vec-insert",
        language: "cpp",
        category: "Vector Operations",
        description: "Insert item at specific position",
        syntax: "v.insert(v.begin() + index, val);",
        useCase: "Inserting in middle (inefficient, requires shifting).",
        timeComplexity: "O(N)"
    },
    {
        id: "cpp-vec-erase",
        language: "cpp",
        category: "Vector Operations",
        description: "Remove elements at index or range",
        syntax: "v.erase(v.begin() + index);\nv.erase(v.begin() + start, v.begin() + end);",
        useCase: "Deleting items from middle of vector.",
        timeComplexity: "O(N)"
    },
    {
        id: "cpp-vec-resize",
        language: "cpp",
        category: "Vector Operations",
        description: "Change vector size",
        syntax: "v.resize(new_size, fill_value);",
        useCase: "Expanding or shrinking an already initialized vector dynamically.",
        timeComplexity: "O(N)"
    },
    {
        id: "cpp-vec-iterator",
        language: "cpp",
        category: "Vector Operations",
        description: "Iterate with constraints",
        syntax: "for (int x : v) { ... }\nfor (auto it = v.rbegin(); it != v.rend(); ++it) { ... }",
        useCase: "Range-based for loops for cleanliness, reverse iterators for backwards traversal.",
        timeComplexity: "O(N)"
    },

    // --- Map and Unordered Map ---
    {
        id: "cpp-map-unordered",
        language: "cpp",
        category: "Map and Set Operations",
        description: "Hash map vs Tree map",
        syntax: "unordered_map<int, int> umap; // Hash Map O(1)\nmap<int, int> omap; // BST Map O(log N)",
        useCase: "unordered_map for frequency counting (Two Sum). map for sorted keys (Intervals, Sweepline).",
        timeComplexity: "O(1) vs O(log N)"
    },
    {
        id: "cpp-map-insert-bracket",
        language: "cpp",
        category: "Map and Set Operations",
        description: "operator[] default insert, increment, and overwrite",
        syntax: "int x = umap[key];   // missing key is inserted with value 0\numap[key]++;         // 0 -> 1 for new key\numap[key] = val;      // explicit insert or overwrite",
        useCase: "Frequency counting and updates when you want missing keys to auto-initialize.",
        timeComplexity: "O(1) amortized"
    },
    {
        id: "cpp-map-find",
        language: "cpp",
        category: "Map and Set Operations",
        description: "Check if key exists safely",
        syntax: "if (umap.find(key) != umap.end()) { // found }",
        useCase: "Checking for seen targets without inserting an empty element (which umap[key] does).",
        timeComplexity: "O(1) amortized"
    },
    {
        id: "cpp-map-count",
        language: "cpp",
        category: "Map and Set Operations",
        description: "Check existence and count",
        syntax: "if (umap.count(key) > 0) { // found }",
        useCase: "Simpler syntax for checking if key exists, returns 1 or 0.",
        timeComplexity: "O(1) amortized"
    },
    {
        id: "cpp-set-unordered",
        language: "cpp",
        category: "Map and Set Operations",
        description: "Hash set vs Tree set",
        syntax: "unordered_set<int> uset; // Hash Set O(1)\nset<int> oset; // BST Set O(log N)",
        useCase: "Tracking visited nodes (uset). Maintaining dynamically sorted streaming elements (oset).",
        timeComplexity: "O(1) vs O(log N)"
    },
    {
        id: "cpp-set-insert-erase",
        language: "cpp",
        category: "Map and Set Operations",
        description: "Add or remove elements",
        syntax: "uset.insert(val);\nuset.erase(val);",
        useCase: "Tracking uniqueness and managing sliding windows of unique chars.",
        timeComplexity: "O(1) amortized"
    },

    // --- Deque, Queue, and Stack ---
    {
        id: "cpp-deque-ops",
        language: "cpp",
        category: "Deque, Queue, and Stack",
        description: "Double ended queue operations",
        syntax: "#include <deque>\ndeque<int> dq;\ndq.push_front(v); dq.push_back(v);\ndq.pop_front(); dq.pop_back();\nint f = dq.front(); int b = dq.back();",
        useCase: "Sliding window maximum or BFS where insertions are needed front and back.",
        timeComplexity: "O(1)"
    },
    {
        id: "cpp-queue-ops",
        language: "cpp",
        category: "Deque, Queue, and Stack",
        description: "Standard Queue operations",
        syntax: "#include <queue>\nqueue<int> q;\nq.push(x);\nq.pop(); // DOES NOT RETURN VALUE\nint top = q.front();",
        useCase: "Standard BFS Level-order traversal.",
        timeComplexity: "O(1)"
    },
    {
        id: "cpp-stack-ops",
        language: "cpp",
        category: "Deque, Queue, and Stack",
        description: "Standard Stack operations",
        syntax: "#include <stack>\nstack<int> s;\ns.push(x);\ns.pop(); // DOES NOT RETURN VALUE\nint top = s.top();",
        useCase: "Iterative DFS traversals or Monotonic Stack problems (e.g., Daily Temperatures).",
        timeComplexity: "O(1)"
    },

    // --- Priority Queue and Heap ---
    {
        id: "cpp-pq-max-heap",
        language: "cpp",
        category: "Priority Queue and Heap",
        description: "Default Max Heap",
        syntax: "#include <queue>\npriority_queue<int> maxHeap;\nmaxHeap.push(val);\nint mx = maxHeap.top();\nmaxHeap.pop();",
        useCase: "Finding Kth smallest elements (keep K max items).",
        timeComplexity: "O(log N)"
    },
    {
        id: "cpp-pq-min-heap",
        language: "cpp",
        category: "Priority Queue and Heap",
        description: "Standard Min Heap structure",
        syntax: "priority_queue<int, vector<int>, greater<int>> minHeap;",
        useCase: "Dijkstra's Algorithm or finding Kth largest elements.",
        timeComplexity: "O(log N)"
    },
    {
        id: "cpp-pq-pairs",
        language: "cpp",
        category: "Priority Queue and Heap",
        description: "Heap with pairs (sorts by first, then second)",
        syntax: "priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;\npq.push({dist, node});",
        useCase: "Dijkstra's shortest path combining min heap and visited set.",
        timeComplexity: "O(log N)"
    },
    {
        id: "cpp-pq-custom-compare",
        language: "cpp",
        category: "Priority Queue and Heap",
        description: "Priority queue with custom struct comparator",
        syntax: "struct Compare { bool operator()(ListNode* a, ListNode* b) { return a->val > b->val; } };\npriority_queue<ListNode*, vector<ListNode*>, Compare> pq;",
        useCase: "Merge K Sorted Lists, sorting custom object pointers dynamically.",
        timeComplexity: "O(log N)"
    },

    // --- Sorting and Algorithms ---
    {
        id: "cpp-algo-sort",
        language: "cpp",
        category: "Sorting and Algorithms",
        description: "Sort vector",
        syntax: "#include <algorithm>\nsort(v.begin(), v.end());\nsort(v.rbegin(), v.rend()); // desc",
        useCase: "Sorting arrays prior to Two Pointers or Binary Search.",
        timeComplexity: "O(N log N)"
    },
    {
        id: "cpp-algo-sort-custom",
        language: "cpp",
        category: "Sorting and Algorithms",
        description: "Sort with custom lambda comparator",
        syntax: "sort(intervals.begin(), intervals.end(), [](const vector<int>& a, const vector<int>& b) {\n    return a[1] < b[1]; // sort by end time\n});",
        useCase: "Sorting intervals or sorting by specific structured elements.",
        timeComplexity: "O(N log N)"
    },
    {
        id: "cpp-algo-reverse",
        language: "cpp",
        category: "Sorting and Algorithms",
        description: "Reverse array or string",
        syntax: "reverse(v.begin(), v.end());",
        useCase: "Reversing path results, string palindromes.",
        timeComplexity: "O(N)"
    },
    {
        id: "cpp-algo-max-min",
        language: "cpp",
        category: "Math and Utilities",
        description: "Max, min, and abs",
        syntax: "int mx = max(a, b); // Note: must be same type\nint mt = max({a, b, c}); // multi max\nint diff = abs(a - b);",
        useCase: "Updating max/min bounds safely in O(1).",
        timeComplexity: "O(1)"
    },
    {
        id: "cpp-algo-swap",
        language: "cpp",
        category: "Math and Utilities",
        description: "Swap two elements safely",
        syntax: "swap(a, b);\nswap(v[i], v[j]);",
        useCase: "In-place array manipulations (e.g. Partitioning in QuickSort, Dutch National Flag).",
        timeComplexity: "O(1)"
    },

    // --- Binary Search ---
    {
        id: "cpp-bs-lower-bound",
        language: "cpp",
        category: "Binary Search",
        description: "Lower bound (first element >= target)",
        syntax: "auto it = lower_bound(v.begin(), v.end(), target);\nint idx = it - v.begin(); // get integer index",
        useCase: "Finding exact matches or first element not smaller than target in log N.",
        timeComplexity: "O(log N)"
    },
    {
        id: "cpp-bs-upper-bound",
        language: "cpp",
        category: "Binary Search",
        description: "Upper bound (first element > target)",
        syntax: "auto it = upper_bound(v.begin(), v.end(), target);\nint idx = it - v.begin();",
        useCase: "Finding strict upper boundaries in log N time.",
        timeComplexity: "O(log N)"
    },
    {
        id: "cpp-bs-binary-search",
        language: "cpp",
        category: "Binary Search",
        description: "Check if element exists natively",
        syntax: "bool exists = binary_search(v.begin(), v.end(), target);",
        useCase: "Fast existence checks on sorted vectors when index isn't needed.",
        timeComplexity: "O(log N)"
    },

    // --- Advanced String Processing ---
    {
        id: "cpp-str-stringstream",
        language: "cpp",
        category: "String Methods",
        description: "Split string by spaces (StringStream)",
        syntax: "#include <sstream>\nstringstream ss(s);\nstring word;\nwhile (ss >> word) { ... }",
        useCase: "Parsing words from a sentence without manual pointer management.",
        timeComplexity: "O(N)"
    },
    {
        id: "cpp-str-getline",
        language: "cpp",
        category: "String Methods",
        description: "Split string by custom delimiter",
        syntax: "stringstream ss(s);\nstring part;\nwhile (getline(ss, part, '-')) { ... }",
        useCase: "Parsing CSV data, dates, or file paths.",
        timeComplexity: "O(N)"
    },
    
    // --- Advanced Vector and Arrays ---
    {
        id: "cpp-vec-accumulate",
        language: "cpp",
        category: "Vector Operations",
        description: "Sum of a vector or array",
        syntax: "#include <numeric>\nint sum = accumulate(v.begin(), v.end(), 0);\n// use 0LL for long long",
        useCase: "Quickly finding the total sum without a manual loop.",
        timeComplexity: "O(N)"
    },
    {
        id: "cpp-vec-iota",
        language: "cpp",
        category: "Vector Operations",
        description: "Fill vector with sequentially increasing values",
        syntax: "#include <numeric>\niota(v.begin(), v.end(), 0); // 0, 1, 2, 3...",
        useCase: "Initializing parent arrays for Disjoint Set Union (Union Find).",
        timeComplexity: "O(N)"
    },
    {
        id: "cpp-algo-fill",
        language: "cpp",
        category: "Vector Operations",
        description: "Fill array or vector with specific value",
        syntax: "fill(v.begin(), v.end(), -1);\nmemset(arr, -1, sizeof(arr)); // C-style arrays only",
        useCase: "Initializing DP tables to -1.",
        timeComplexity: "O(N)"
    },

    // --- Pairs and Tuples ---
    {
        id: "cpp-pair-basics",
        language: "cpp",
        category: "Math and Utilities",
        description: "Pair initialization and access",
        syntax: "pair<int, int> p = make_pair(1, 2);\npair<int, string> p2 = {1, \"a\"};\nint f = p.first; int s = p.second;",
        useCase: "Grouping two elements without defining a custom struct. Often used for BFS states.",
        timeComplexity: "O(1)"
    },
    {
        id: "cpp-pair-structured-binding",
        language: "cpp",
        category: "Math and Utilities",
        description: "Structured bindings (C++17)",
        syntax: "auto [u, v] = my_pair;\nfor (auto& [key, val] : umap) { ... }",
        useCase: "Clean iteration over hash maps or unpacking pairs instantly.",
        timeComplexity: "O(1)"
    },

    // --- Data Structure Nuances ---
    {
        id: "cpp-set-multiset",
        language: "cpp",
        category: "Map and Set Operations",
        description: "Multiset initialization and count based erase",
        syntax: "multiset<int> ms;\nms.insert(5); ms.insert(5);\nms.erase(ms.find(5)); // erases ONLY ONE 5\nms.erase(5); // erases ALL 5s",
        useCase: "Sliding window problems tracking dynamic minimum/maximum values, allowing duplicates.",
        timeComplexity: "O(log N)"
    },

    // --- Advanced Sorting and Modulo Math ---
    {
        id: "cpp-algo-nth-element",
        language: "cpp",
        category: "Sorting and Algorithms",
        description: "Find Kth element (Quickselect)",
        syntax: "nth_element(v.begin(), v.begin() + K, v.end());\nint kth = v[K];",
        useCase: "Finding the median or Kth largest/smallest element in O(N) average time.",
        timeComplexity: "O(N) average"
    },
    {
        id: "cpp-algo-partial-sort",
        language: "cpp",
        category: "Sorting and Algorithms",
        description: "Partial sort",
        syntax: "partial_sort(v.begin(), v.begin() + K, v.end());",
        useCase: "Extracting the top K elements fully sorted in O(N log K) time.",
        timeComplexity: "O(N log K)"
    },
    {
        id: "cpp-bit-tricks",
        language: "cpp",
        category: "Math and Utilities",
        description: "Bit manipulation builtin macros",
        syntax: "int ones = __builtin_popcount(n);\nint lz = __builtin_clz(n);\nint tz = __builtin_ctz(n);\n// use __builtin_popcountll for long long",
        useCase: "Counting number of 1 bits, leading zeros, or trailing zeros cleanly.",
        timeComplexity: "O(1)"
    },
    {
        id: "cpp-math-gcd-lcm",
        language: "cpp",
        category: "Math and Utilities",
        description: "Greatest Common Divisor and Least Common Multiple",
        syntax: "#include <numeric>\nint g = std::gcd(a, b); // C++17\nint l = std::lcm(a, b);",
        useCase: "Fraction reduction or determining cycles.",
        timeComplexity: "O(log(min(a, b)))"
    },

    // --- Pointers and Linked List ---
    {
        id: "cpp-ll-dummy-node",
        language: "cpp",
        category: "Linked List Patterns",
        description: "Dummy node setup to handle head edge-cases",
        syntax: "ListNode dummy(0);\ndummy.next = head;\nListNode* curr = &dummy;\nreturn dummy.next;",
        useCase: "Whenever head of list might be removed, shifted, or lists are merged.",
        timeComplexity: "O(1)"
    },

    // --- Two Pointer Templates ---
    {
        id: "cpp-two-ptr-sliding-window",
        language: "cpp",
        category: "Two Pointer and Sliding Window Patterns",
        description: "Sliding window string tracking pattern",
        syntax: "int left = 0, res = 0;\nfor (int right = 0; right < s.size(); right++) {\n    // add s[right] to state\n    while (invalid_state) {\n        // remove s[left] from state\n        left++;\n    }\n    res = max(res, right - left + 1);\n}",
        useCase: "Longest substring without repeating characters, longest repeating replacement.",
        timeComplexity: "O(N)"
    },

    // --- Graph and Tree Traversals ---
    {
        id: "cpp-graph-adj-list",
        language: "cpp",
        category: "Tree and Graph Traversal",
        description: "Adjacency list from edge arrays",
        syntax: "vector<vector<int>> adj(n);\nfor (auto& edge : edges) {\n    adj[edge[0]].push_back(edge[1]);\n    adj[edge[1]].push_back(edge[0]);\n}",
        useCase: "Initializing graph representations for BFS/DFS.",
        timeComplexity: "O(V + E)"
    },
    {
        id: "cpp-graph-bfs",
        language: "cpp",
        category: "Tree and Graph Traversal",
        description: "Level order Graph BFS",
        syntax: "queue<int> q;\nq.push(start);\nvector<bool> visited(n, false);\nvisited[start] = true;\nwhile (!q.empty()) {\n    int curr = q.front(); q.pop();\n    for (int nei : adj[curr]) {\n        if (!visited[nei]) {\n            visited[nei] = true;\n            q.push(nei);\n        }\n    }\n}",
        useCase: "Finding shortest path in unweighted graphs or connected components.",
        timeComplexity: "O(V + E)"
    }
];
