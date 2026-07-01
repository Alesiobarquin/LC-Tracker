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
    explanation: string;
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
        timeComplexity: "O(N)",
        explanation: "split() without arguments separates a string on any whitespace and collapses repeated spaces. The result is a list of non-empty tokens, so you do not need to manually trim or filter empty strings. In interviews, this is the cleanest way to parse words from a sentence before counting, reversing, or scanning them. It walks the string once, so the work is O(N)."
    },
    {
        id: "py-str-split-custom",
        language: "python",
        category: "String Methods",
        description: "Split string by specific delimiter",
        syntax: "parts = s.split(',')",
        useCase: "Parsing CSV data or specific delimited logs.",
        timeComplexity: "O(N)",
        explanation: "split(delimiter) breaks the string wherever that exact delimiter appears. Unlike the default form, repeated delimiters can create empty strings, which matters for CSV-like input and path parsing. Use it when the separator is meaningful and should not be treated like generic whitespace. The scan is linear in the string length."
    },
    {
        id: "py-str-join",
        language: "python",
        category: "String Methods",
        description: "Join array of strings into one string",
        syntax: "res = '-'.join(words)",
        useCase: "Constructing a final string from an array of computed parts.",
        timeComplexity: "O(N)",
        explanation: "join() builds one string by placing the separator between every string in the iterable. The separator comes first, so \"-\".join(words) joins with dashes; every element must already be a string. In LC-style string construction, collect pieces in a list and join once instead of repeatedly doing +=. The total work is linear in the output size."
    },
    {
        id: "py-str-strip",
        language: "python",
        category: "String Methods",
        description: "Remove leading and trailing whitespace",
        syntax: "clean = s.strip()",
        useCase: "Cleaning up dirty input string data.",
        timeComplexity: "O(N)",
        explanation: "strip() returns a new string with leading and trailing whitespace removed. It does not change the original string, and it does not remove whitespace from the middle. Reach for it when normalizing raw input before comparisons or parsing. It may inspect the string from both ends, so treat it as O(N)."
    },
    {
        id: "py-str-replace",
        language: "python",
        category: "String Methods",
        description: "Replace all occurrences of a substring",
        syntax: "new_s = s.replace('old', 'new')",
        useCase: "Sanitizing strings, e.g., removing all periods from an IP address.",
        timeComplexity: "O(N)",
        explanation: "replace(old, new) returns a new string where every occurrence of old has been substituted. Strings are immutable in Python, so the original value is unchanged. This is useful for quick sanitization, but for character-by-character transformations in a loop, a list builder can be clearer. The replacement pass is linear in the string size plus output size."
    },
    {
        id: "py-str-find",
        language: "python",
        category: "String Methods",
        description: "Find index of substring (returns -1 if not found)",
        syntax: "idx = s.find('sub')",
        useCase: "Checking substring existence and location safely without exceptions.",
        timeComplexity: "O(N*M)",
        explanation: "find() searches for a substring and returns its first index, or -1 when it is absent. The -1 sentinel lets you branch without handling an exception. Use it when missing is an expected case, such as scanning logs or checking patterns. Substring search can cost O(N*M) in the simple model."
    },
    {
        id: "py-str-index",
        language: "python",
        category: "String Methods",
        description: "Find index of substring (raises ValueError if not found)",
        syntax: "idx = s.index('sub')",
        useCase: "When you are absolutely sure the substring exists and want it to fail fast if not.",
        timeComplexity: "O(N*M)",
        explanation: "index() searches like find(), but raises ValueError when the substring is missing. That makes it useful only when the problem invariant guarantees the substring exists, or when failure should be loud. In interview code, find() is usually safer unless you have already checked membership. The search cost is the same substring-scan cost."
    },
    {
        id: "py-str-startswith",
        language: "python",
        category: "String Methods",
        description: "Check if string starts with prefix",
        syntax: "is_start = s.startswith('pre')",
        useCase: "Trie prefix matching problems or parsing specific command prefixes.",
        timeComplexity: "O(K)",
        explanation: "startswith(prefix) checks whether the string begins with the given prefix. It compares only the needed prefix length, so it avoids slicing a temporary string. This is handy in trie, command parsing, and prefix validation problems. The work is O(K), where K is the prefix length."
    },
    {
        id: "py-str-endswith",
        language: "python",
        category: "String Methods",
        description: "Check if string ends with suffix",
        syntax: "is_end = s.endswith('suf')",
        useCase: "File extension checking or suffix parsing.",
        timeComplexity: "O(K)",
        explanation: "endswith(suffix) checks whether the string has the given suffix without manually slicing. It compares only the suffix length and handles the boundary check for you. Use it for extension checks, suffix rules, or parsing tokens from the right. The cost is O(K), where K is the suffix length."
    },
    {
        id: "py-str-upper-lower",
        language: "python",
        category: "String Methods",
        description: "Convert string to upper, lower, or capitalized form",
        syntax: "u, l, c = s.upper(), s.lower(), s.capitalize()",
        useCase: "Normalizing strings before comparative operations (e.g., case-insensitive anagram verification).",
        timeComplexity: "O(N)",
        explanation: "upper(), lower(), and capitalize() return normalized copies of the string. They do not mutate s, so store the returned value when you need it later. In interviews, lower() is common before case-insensitive palindrome or anagram checks. Each conversion visits the characters it returns."
    },
    {
        id: "py-str-is-checks",
        language: "python",
        category: "String Methods",
        description: "Check character types",
        syntax: "b1, b2, b3 = char.isalpha(), char.isdigit(), char.isalnum()",
        useCase: "Valid Palindrome problem, identifying numbers in string parsing.",
        timeComplexity: "O(1) per char",
        explanation: "isalpha(), isdigit(), and isalnum() classify a single character or whole string. On one character they are constant-time and read cleanly in pointer loops. They are especially useful when skipping punctuation in palindrome and parser problems. Remember that these methods are broader than just ASCII letters and digits."
    },
    {
        id: "py-str-ord-chr",
        language: "python",
        category: "String Methods",
        description: "Convert char to ASCII int and back",
        syntax: "val, ch = ord('a'), chr(97)",
        useCase: "Using array indices [0-25] for alphabet instead of hash maps (e.g. ord(c) - ord('a')).",
        timeComplexity: "O(1)",
        explanation: "ord() converts a character to its integer code point, and chr() converts a code point back to a character. The common LC pattern is ord(c) - ord(\"a\") to map lowercase letters to indices 0 through 25. Use this when a fixed-size frequency array is simpler and faster than a dictionary. Each conversion is O(1)."
    },
    {
        id: "py-str-slice-reverse",
        language: "python",
        category: "String Methods",
        description: "Reverse a string using slicing",
        syntax: "rev = s[::-1]",
        useCase: "Quick palindrome checks: s == s[::-1].",
        timeComplexity: "O(N)",
        explanation: "s[::-1] creates a reversed copy of the string using slicing with a step of -1. It is concise for quick palindrome checks, but it allocates another string. For memory-sensitive variants, compare with two pointers instead. The slice takes O(N) time and O(N) space."
    },
    {
        id: "py-str-fstring",
        language: "python",
        category: "String Methods",
        description: "Format integers or variables into strings",
        syntax: "res = f'Value: {count}'",
        useCase: "Constructing complex string keys or output formats efficiently.",
        timeComplexity: "O(N)",
        explanation: "An f-string evaluates expressions inside braces and inserts their string forms into the result. The literal text stays outside braces, while variables or expressions go inside braces. It is useful for building readable composite keys or formatted output during debugging. The cost scales with the produced string length."
    },

    // --- List Operations ---
    {
        id: "py-list-append-extend",
        language: "python",
        category: "List Operations",
        description: "Add single item vs add multiple items",
        syntax: "arr.append(x); arr.extend([y, z])",
        useCase: "Building flat arrays iteratively without nested list elements.",
        timeComplexity: "O(1) amortized, O(K) for extend",
        explanation: "append(x) adds x as one element, while extend(iterable) appends each element from the iterable. The common gotcha is append([y, z]) creates a nested list, but extend([y, z]) keeps the array flat. Use these when building results incrementally in traversal, backtracking, or parsing problems. append is amortized O(1), while extend costs O(K) for K added items."
    },
    {
        id: "py-list-insert",
        language: "python",
        category: "List Operations",
        description: "Insert item at specific index",
        syntax: "arr.insert(0, val)",
        useCase: "Prepending to array (though deque is better for this!).",
        timeComplexity: "O(N)",
        explanation: "insert(index, val) places val before the given index and shifts later elements right. Inserting at 0 is readable but expensive because every existing item moves. For interview queues or front-heavy operations, prefer deque. The shift makes this O(N)."
    },
    {
        id: "py-list-pop",
        language: "python",
        category: "List Operations",
        description: "Remove and return last item or item at index",
        syntax: "last = arr.pop(); first = arr.pop(0)",
        useCase: "Stack operations (pop()) or queue operations (pop(0), but use deque!).",
        timeComplexity: "O(1) last, O(N) index",
        explanation: "pop() removes and returns the last element, while pop(i) removes and returns the element at index i. A list is excellent as a stack because pop() from the end is O(1). pop(0) works but shifts the whole list, so use deque.popleft() for queues. Indexed pop is O(N) in the worst case."
    },
    {
        id: "py-list-remove",
        language: "python",
        category: "List Operations",
        description: "Remove first occurrence of value",
        syntax: "arr.remove(val)",
        useCase: "Deleting a specific element when the index is unknown.",
        timeComplexity: "O(N)",
        explanation: "remove(val) deletes the first element equal to val. It searches by value, not index, and raises ValueError if the value is absent. Use it only when deleting a known value from a small or one-off list; for frequent deletions, a set or counter is usually better. The search and shift make it O(N)."
    },
    {
        id: "py-list-reverse",
        language: "python",
        category: "List Operations",
        description: "In-place reverse vs iterator reverse",
        syntax: "arr.reverse() vs rev_iter = reversed(arr)",
        useCase: "Reversing an array without taking extra memory (in-place).",
        timeComplexity: "O(N)",
        explanation: "arr.reverse() reverses the list in place and returns None, while reversed(arr) returns an iterator over the elements backward. The in-place method saves memory when you no longer need the original order. The iterator is useful for loops without copying. Both traverse the list, but only the in-place version mutates it."
    },
    {
        id: "py-list-sort-inplace",
        language: "python",
        category: "List Operations",
        description: "Sort list in-place",
        syntax: "arr.sort(key=lambda x: x[1], reverse=True)",
        useCase: "Sorting intervals or sorting by specific tuple elements to save memory.",
        timeComplexity: "O(N log N)",
        explanation: "sort() mutates the list in place and returns None. key=lambda x: x[1] tells Python to compare each element by index 1, and reverse=True would make the order descending. Use this for intervals, pairs, or objects when changing the original list is fine. Sorting costs O(N log N)."
    },
    {
        id: "py-list-sorted",
        language: "python",
        category: "List Operations",
        description: "Return new sorted list from iterable",
        syntax: "new_arr = sorted(arr)",
        useCase: "When you need to keep the original array intact but need a sorted version.",
        timeComplexity: "O(N log N) + O(N) space",
        explanation: "sorted(arr) returns a new sorted list and leaves arr unchanged. It accepts the same key and reverse arguments as list.sort(), but it allocates a new list. Use it when the original order is still needed later in the solution. The sort is O(N log N) plus O(N) extra space."
    },
    {
        id: "py-list-slice",
        language: "python",
        category: "List Operations",
        description: "Extract sublist",
        syntax: "sub = arr[start:end:step]",
        useCase: "Creating copies of arrays (arr[:]) or getting middle portions.",
        timeComplexity: "O(K) where K is slice length",
        explanation: "arr[start:end:step] copies a range using start inclusive, end exclusive, and an optional step. Missing bounds default to the beginning or end, so arr[:] is a shallow copy. Be careful inside recursion or loops because slicing allocates a new list. The cost is O(K), where K is the slice length."
    },
    {
        id: "py-list-comprehension",
        language: "python",
        category: "List Operations",
        description: "Create filtered list concisely",
        syntax: "evens = [x for x in arr if x % 2 == 0]",
        useCase: "Quick initializations or filtering without writing map/filter functions.",
        timeComplexity: "O(N)",
        explanation: "A list comprehension builds a new list by evaluating the expression for each item that passes the optional if filter. The expression comes before the for clause, and the filter comes last. Use it for concise filtering or transformation when the logic fits on one readable line. It scans the input once and stores the output."
    },
    {
        id: "py-list-zip",
        language: "python",
        category: "List Operations",
        description: "Iterate multiple lists simultaneously",
        syntax: "for a, b in zip(listA, listB):",
        useCase: "Comparing character by character in two strings or traversing parallel arrays.",
        timeComplexity: "O(min(N, M))",
        explanation: "zip(listA, listB) pairs elements by position and stops when the shortest iterable ends. The loop unpacks each pair into a and b, which keeps parallel-array comparisons tidy. Use it for character comparisons, coordinate pairs, or synchronized scans. If unequal lengths matter, use zip_longest instead."
    },
    {
        id: "py-list-enumerate",
        language: "python",
        category: "List Operations",
        description: "Iterate with index and value",
        syntax: "for i, val in enumerate(arr):",
        useCase: "Almost every loop where you need the index (e.g., Two Sum hash map population).",
        timeComplexity: "O(N)",
        explanation: "enumerate(arr) yields each index together with its value. The index comes first in the unpacking pattern: for i, val in enumerate(arr). This avoids manual counter variables in hash map, two-sum, and result-building loops. It is a linear pass over the iterable."
    },
    {
        id: "py-list-math",
        language: "python",
        category: "List Operations",
        description: "Common list math operations",
        syntax: "length, minimum, maximum, total = len(arr), min(arr), max(arr), sum(arr)",
        useCase: "Getting bounds or totals instantly without manual iteration.",
        timeComplexity: "O(1) len, O(N) others",
        explanation: "len() reads a stored list length, while min(), max(), and sum() scan the list. These helpers are good for simple bounds and totals before choosing a more complex pattern. Avoid calling min or max repeatedly inside a loop over the same unchanged array. len is O(1), but the others are O(N)."
    },
    {
        id: "py-list-init-grid",
        language: "python",
        category: "List Operations",
        description: "Initialize 2D grid correctly",
        syntax: "grid = [[0] * cols for _ in range(rows)]",
        useCase: "Dynamic Programming memorization tables or graph adjacency matrices.",
        timeComplexity: "O(rows * cols)",
        explanation: "This creates a fresh inner list for each row of the grid. The comprehension is important: [[0] * cols] * rows aliases the same row object and causes updates to leak across rows. Use this for DP tables, visited matrices, and grid state. Initializing every cell is O(rows * cols)."
    },
    {
        id: "py-list-copy",
        language: "python",
        category: "List Operations",
        description: "Shallow vs Deep Copy",
        syntax: "shallow = arr.copy(); import copy; deep = copy.deepcopy(arr)",
        useCase: "Backtracking recursion where you need to append a snapshot of the current path.",
        timeComplexity: "O(N) shallow, O(N) deep",
        explanation: "copy() makes a shallow copy of the outer list, while deepcopy() recursively copies nested objects. In backtracking, path.copy() or path[:] is usually enough because path contains primitives. Use deepcopy only when nested mutable structures must be independent. Copying costs proportional to the copied structure."
    },

    // --- Dictionary Operations ---
    {
        id: "py-dict-get-default",
        language: "python",
        category: "Dictionary Operations",
        description: "Get value with fallback if key is missing",
        syntax: "val = d.get(key, 0)",
        useCase: "Counting frequencies without catching KeyError.",
        timeComplexity: "O(1)",
        explanation: "get(key, default) reads a dictionary value without raising KeyError when the key is absent. The default is returned but not inserted into the dictionary. It is perfect for frequency reads like counts.get(x, 0) + 1. Average lookup time is O(1)."
    },
    {
        id: "py-dict-views",
        language: "python",
        category: "Dictionary Operations",
        description: "Get dict keys, values, or entries",
        syntax: "k, v, i = d.keys(), d.values(), d.items()",
        useCase: "Iterating over hash map components.",
        timeComplexity: "O(N)",
        explanation: "keys(), values(), and items() return dynamic views over the dictionary contents. items() is the usual choice when you need both key and value in the same loop. These views avoid copying until you explicitly wrap them in list(). Iterating over them is O(N)."
    },
    {
        id: "py-dict-update",
        language: "python",
        category: "Dictionary Operations",
        description: "Merge another dictionary into current",
        syntax: "d.update(other_d)",
        useCase: "Combining hash maps or mass-updating configurations.",
        timeComplexity: "O(K)",
        explanation: "update(other_d) writes all key-value pairs from other_d into d. Existing keys are overwritten, and missing keys are inserted. Use it when merging lookup state or applying a batch of changes. The cost is O(K), where K is the number of incoming pairs."
    },
    {
        id: "py-dict-pop",
        language: "python",
        category: "Dictionary Operations",
        description: "Remove key and return value with default",
        syntax: "val = d.pop('key', default_val)",
        useCase: "Safely deleting entries when you aren't certain the key exists.",
        timeComplexity: "O(1)",
        explanation: "pop(key, default) removes a key and returns its value, falling back to default if the key is absent. Without the default, a missing key raises KeyError. This is useful in sliding-window and cache logic where deletion may be conditional. Average deletion is O(1)."
    },
    {
        id: "py-dict-defaultdict",
        language: "python",
        category: "Dictionary Operations",
        description: "Dictionary with default factory type",
        syntax: "from collections import defaultdict\nd = defaultdict(list)\nd[key].append(val)",
        useCase: "Building adjacency lists for graphs or grouping items.",
        timeComplexity: "O(1)",
        explanation: "defaultdict(list) creates an empty list automatically the first time a missing key is accessed. That lets d[key].append(val) work without an if key not in d branch. It is a strong fit for adjacency lists, grouping anagrams, and bucket maps. Each append is still average O(1)."
    },
    {
        id: "py-dict-counter",
        language: "python",
        category: "Dictionary Operations",
        description: "Count frequencies of iterable elements",
        syntax: "from collections import Counter\ncounts = Counter(arr)\ntop = counts.most_common(k)",
        useCase: "Top K Frequent Elements problem or checking string anagrams.",
        timeComplexity: "O(N) build, O(N log K) most_common",
        explanation: "Counter(arr) builds a frequency map from an iterable. most_common(k) returns the highest-count entries as (value, count) pairs, which is useful for Top K style problems. For anagrams, comparing Counters is often clearer than manual maps. Building is O(N), and extracting top k has extra heap or sorting cost."
    },
    {
        id: "py-dict-comprehension",
        language: "python",
        category: "Dictionary Operations",
        description: "Create dictionary defensively and concisely",
        syntax: "d = {k: v for k, v in enumerate(arr)}",
        useCase: "Mapping indices to values rapidly to create lookup tables.",
        timeComplexity: "O(N)",
        explanation: "A dictionary comprehension builds key-value pairs in one expression. Here enumerate(arr) supplies index-value pairs, but the expression maps k to v, so check that direction matches your lookup need. Use this for quick index maps, reverse maps, or transformed lookup tables. It is O(N) time and space."
    },
    {
        id: "py-dict-in-operator",
        language: "python",
        category: "Dictionary Operations",
        description: "Check if key exists in dictionary",
        syntax: "if key in d:",
        useCase: "Checking for seen/visited nodes or checking target differences in Two Sum.",
        timeComplexity: "O(1)",
        explanation: "key in d checks whether a key exists in the dictionary. It tests keys only, not values. This is the standard guard before reading seen states, target complements, or visited nodes. Average membership testing is O(1)."
    },
    {
        id: "py-dict-iterate-items",
        language: "python",
        category: "Dictionary Operations",
        description: "Iterate key-value pairs",
        syntax: "for key, val in d.items():",
        useCase: "Finding max frequencies or filtering based on keys and values together.",
        timeComplexity: "O(N)",
        explanation: "d.items() lets a loop unpack each key and value together. This keeps code clean when the decision depends on both parts, such as finding the largest count or filtering entries. Do not mutate the dictionary size while iterating over it. The loop is O(N)."
    },

    // --- Set Operations ---
    {
        id: "py-set-add-remove",
        language: "python",
        category: "Set Operations",
        description: "Add, explicitly remove, or safely discard elements",
        syntax: "s.add(x); s.remove(y); s.discard(z)",
        useCase: "Tracking visited grid positions or unique seen values.",
        timeComplexity: "O(1)",
        explanation: "add(x) inserts x, remove(y) deletes y and raises if y is absent, and discard(z) deletes z only if present. The remove vs discard difference matters in sliding-window code where state may already be gone. Use sets for visited cells, duplicate detection, and membership state. These operations are average O(1)."
    },
    {
        id: "py-set-math",
        language: "python",
        category: "Set Operations",
        description: "Union, intersection, difference operators",
        syntax: "u, i, d = s1 | s2, s1 & s2, s1 - s2",
        useCase: "Finding common characters in strings (intersection) or unseen elements (difference).",
        timeComplexity: "O(min(len(s1), len(s2)))",
        explanation: "|, &, and - compute union, intersection, and difference between sets. These operators return new sets rather than mutating the originals. They are useful when the problem asks for overlap, missing elements, or shared character sets. The cost depends on the set sizes involved."
    },
    {
        id: "py-set-in",
        language: "python",
        category: "Set Operations",
        description: "Fast lookup",
        syntax: "if x in s:",
        useCase: "Longest Consecutive Sequence — O(1) checks to see if adjacent numbers exist.",
        timeComplexity: "O(1)",
        explanation: "x in s performs a hash lookup in the set. This is the key operation behind duplicate detection and Longest Consecutive Sequence. Use it when order does not matter and membership is the question. Average lookup is O(1)."
    },
    {
        id: "py-set-comprehension",
        language: "python",
        category: "Set Operations",
        description: "Build set conditionally",
        syntax: "unique_evens = {x for x in arr if x % 2 == 0}",
        useCase: "Extracting unique elements that match criteria.",
        timeComplexity: "O(N)",
        explanation: "A set comprehension scans an iterable, filters values, and stores only unique results. The expression before for is what gets inserted, and the if clause decides which values survive. It is useful when deduplication and filtering happen together. The pass is O(N) average time."
    },
    {
        id: "py-set-convert",
        language: "python",
        category: "Set Operations",
        description: "Fast deduplication",
        syntax: "unique_arr = list(set(arr))",
        useCase: "Removing duplicates from an array.",
        timeComplexity: "O(N)",
        explanation: "set(arr) removes duplicates by hashing, and list(...) converts the unique values back to a list. The order is not guaranteed, so do not use this when original order matters. For order-preserving dedupe, track a seen set while building a result list. The conversion is O(N) average time and space."
    },

    // --- Heap and Priority Queue ---
    {
        id: "py-heap-import-heapify",
        language: "python",
        category: "Heap and Priority Queue",
        description: "Transform list into min heap in-place",
        syntax: "import heapq\nheapq.heapify(arr)",
        useCase: "Initializing a priority queue efficiently from existing data.",
        timeComplexity: "O(N)",
        explanation: "heapq.heapify(arr) rearranges an existing list into a min-heap in place. After heapify, arr[0] is the smallest item, but the whole list is not sorted. Use this when you already have all values and want a priority queue faster than pushing one by one. Heapify is O(N)."
    },
    {
        id: "py-heap-push-pop",
        language: "python",
        category: "Heap and Priority Queue",
        description: "Add element and extract minimum",
        syntax: "heapq.heappush(heap, val)\nmin_val = heapq.heappop(heap)",
        useCase: "Dijkstra's Algorithm or Prim's MST.",
        timeComplexity: "O(log N)",
        explanation: "heappush adds a value while preserving heap order, and heappop removes and returns the smallest value. The heap is just a normal list managed by heapq functions. This is the core pattern for Dijkstra, scheduling, and top-k problems. Each push or pop is O(log N)."
    },
    {
        id: "py-heap-max-heap",
        language: "python",
        category: "Heap and Priority Queue",
        description: "Simulate max heap with negative values",
        syntax: "heapq.heappush(max_heap, -val)\nmax_val = -heapq.heappop(max_heap)",
        useCase: "Finding Kth largest element or managing median in a data stream.",
        timeComplexity: "O(log N)",
        explanation: "Python heapq is a min-heap, so pushing negative values simulates a max-heap. Negate on insertion and negate again after popping to recover the original maximum. This is common for kth-largest and two-heap median patterns. Each operation keeps the O(log N) heap cost."
    },
    {
        id: "py-heap-nlargest-nsmallest",
        language: "python",
        category: "Heap and Priority Queue",
        description: "Get multiple largest/smallest elements directly",
        syntax: "top_k = heapq.nlargest(k, arr)\nbot_k = heapq.nsmallest(k, arr)",
        useCase: "Quick and readable Kth largest/smallest without writing the heap loop yourself.",
        timeComplexity: "O(N log K)",
        explanation: "nlargest(k, arr) and nsmallest(k, arr) return the k extreme values directly. They are concise when you only need the result, not an ongoing heap state. For repeated streaming updates, maintain your own heap instead. The typical cost is O(N log K)."
    },
    {
        id: "py-heap-push-tuples",
        language: "python",
        category: "Heap and Priority Queue",
        description: "Priority queue with tuples and tie-breaking",
        syntax: "heapq.heappush(pq, (priority, val, unique_id))",
        useCase: "Sorting graph nodes by distance where distance is primary and node ID resolves ties.",
        timeComplexity: "O(log N)",
        explanation: "A heap of tuples orders by the first tuple element, then the second, and so on. Put the priority first, then the value or a unique tie-breaker when values may not be directly comparable. This is useful for graph distances, scheduled events, and stable tie handling. Push and pop remain O(log N)."
    },

    // --- Deque and Stack ---
    {
        id: "py-deque-import-init",
        language: "python",
        category: "Deque and Stack",
        description: "Initialize double ended queue",
        syntax: "from collections import deque\nq = deque([1, 2, 3])",
        useCase: "BFS traversal where Left/Right operations must be O(1).",
        timeComplexity: "O(N)",
        explanation: "deque creates a double-ended queue from an optional iterable. Unlike a list, it supports efficient operations at both ends. Use it for BFS queues and sliding-window structures where popleft() is frequent. Building from N items is O(N)."
    },
    {
        id: "py-deque-monotonic",
        language: "python",
        category: "Deque and Stack",
        description: "Monotonic deque pattern",
        syntax: "while q and q[-1] > val: q.pop()\nq.append(val)",
        useCase: "Maintaining sorted candidates. Pop right to maintain order.",
        timeComplexity: "O(1) amortized",
        explanation: "This pattern pops from the right while the new value would break the deque order, then appends the new value. The deque stores only useful candidates, so each value is inserted and removed at most once. Use it for monotonic queue problems where you need fast window minima or ordered candidates. The amortized cost per element is O(1)."
    },
    {
        id: "py-deque-left-operations",
        language: "python",
        category: "Deque and Stack",
        description: "O(1) append and pop from left",
        syntax: "q.appendleft(val); first = q.popleft()",
        useCase: "Processing Tree BFS level-by-level efficiently.",
        timeComplexity: "O(1)",
        explanation: "appendleft(val) adds to the front, and popleft() removes from the front. These are the queue operations lists do poorly at index 0. Use them for BFS and any process that consumes from the left. Both operations are O(1)."
    },
    {
        id: "py-deque-ordered-dict",
        language: "python",
        category: "Deque and Stack",
        description: "OrderedDict import and usage pattern for LRU Cache",
        syntax: "from collections import OrderedDict\nod = OrderedDict()\nod.move_to_end(key)\noldest = od.popitem(last=False)",
        useCase: "LRU Cache implementation requiring O(1) pop from front and move to back.",
        timeComplexity: "O(1)",
        explanation: "OrderedDict keeps keys in insertion order and can move a key to the end in O(1). move_to_end marks a key as recently used, and popitem(last=False) removes the oldest key. This is the classic Python shortcut for LRU Cache before relying on built-in decorators. The cache operations shown are O(1)."
    },
    {
        id: "py-deque-sliding-window",
        language: "python",
        category: "Deque and Stack",
        description: "Sliding window maximum using deque",
        syntax: "while q and q[-1] < val: q.pop()\nq.append(val)",
        useCase: "Maintaining monotonically decreasing candidates for Sliding Window Maximum.",
        timeComplexity: "O(1) amortized",
        explanation: "This monotonic decreasing deque removes smaller values from the right before appending the current value. The front can then represent the best maximum candidate for the current window. In full solutions, also remove expired indices from the left. Each element enters and leaves at most once, so it is O(1) amortized per step."
    },
    {
        id: "py-stack-list",
        language: "python",
        category: "Deque and Stack",
        description: "Using standard list as Stack",
        syntax: "stack = []\nstack.append(val)\nlast = stack.pop()",
        useCase: "DFS traversals or Monotonic Stack problems (e.g., Daily Temperatures).",
        timeComplexity: "O(1)",
        explanation: "A Python list works well as a stack when you only use append() and pop() at the end. The last pushed value is the first popped value. Use this for iterative DFS, parentheses matching, and monotonic stack problems. Both operations are amortized O(1)."
    },

    // --- Sorting with Custom Keys ---
    {
        id: "py-sort-tuple-element",
        language: "python",
        category: "Sorting with Custom Keys",
        description: "Sort by second element of tuple",
        syntax: "arr.sort(key=lambda x: x[1])",
        useCase: "Sorting specific interval endpoints (e.g. start/end times).",
        timeComplexity: "O(N log N)",
        explanation: "arr.sort(key=lambda x: x[1]) sorts the list in place by the second element of each item. The lambda receives each element and returns the comparison key. This is common for intervals, pairs, and heap-like records when one field drives ordering. Sorting is O(N log N)."
    },
    {
        id: "py-sort-length",
        language: "python",
        category: "Sorting with Custom Keys",
        description: "Sort strings by length",
        syntax: "words.sort(key=len)",
        useCase: "Longest String Chain or Word Break variations where shortest must be processed first.",
        timeComplexity: "O(N log N)",
        explanation: "words.sort(key=len) sorts strings in place by their length. Passing len directly is cleaner than writing lambda w: len(w). Use it when processing shorter strings first unlocks DP or chain transitions. The sort is O(N log N), with key extraction done once per element."
    },
    {
        id: "py-sort-multiple-criteria",
        language: "python",
        category: "Sorting with Custom Keys",
        description: "Sort by multiple conditions (first ascending, second descending)",
        syntax: "arr.sort(key=lambda x: (x[0], -x[1]))",
        useCase: "When sorting elements by a primary score, and then a secondary tie-breaker rule.",
        timeComplexity: "O(N log N)",
        explanation: "Returning a tuple from key sorts by the first item, then uses the next item to break ties. In (x[0], -x[1]), the primary value is ascending and the secondary numeric value is descending. This is a common trick for envelopes, intervals, and ranking problems. The sort cost is O(N log N)."
    },
    {
        id: "py-sorted-lambda",
        language: "python",
        category: "Sorting with Custom Keys",
        description: "Use sorted() returning new array reversed",
        syntax: "res = sorted(arr, key=lambda x: x.score, reverse=True)",
        useCase: "When dealing with objects and needing non-destructive descending sort.",
        timeComplexity: "O(N log N) + O(N) space",
        explanation: "sorted() creates a new ordered list using the provided key and reverse flag. The lambda reads x.score for comparison, and reverse=True flips the final order. Use this when sorting objects or records without mutating the original iterable. It costs O(N log N) time and O(N) space."
    },

    // --- Two Pointer and Sliding Window Patterns ---
    {
        id: "py-two-pointer-fast-slow",
        language: "python",
        category: "Two Pointer and Sliding Window Patterns",
        description: "Fast and slow pointer initialization for Floyd's cycle detection",
        syntax: "slow, fast = head, head\nwhile fast and fast.next:\n    slow = slow.next\n    fast = fast.next.next\n    if slow == fast: return True",
        useCase: "Detecting cycles in linked lists or finding the middle of a linked list.",
        timeComplexity: "O(N)",
        explanation: "This initializes slow and fast pointers at the same node and advances fast twice as quickly. The while guard checks both fast and fast.next before touching fast.next.next. If the pointers meet, a cycle exists; if fast reaches the end, there is no cycle. The scan is O(N) with O(1) space."
    },
    {
        id: "py-sliding-window-fixed",
        language: "python",
        category: "Two Pointer and Sliding Window Patterns",
        description: "Fixed size sliding window maintaining exactly k elements",
        syntax: "window = sum(arr[:k])\nfor i in range(k, len(arr)):\n    window += arr[i] - arr[i-k]\n    # update result",
        useCase: "Maximum sum subarray of size k, or anagram search of fixed length.",
        timeComplexity: "O(N)",
        explanation: "This builds the first window sum, then slides by adding the incoming element and subtracting the outgoing one. The index i is the new right edge, and i-k is the element leaving the window. Use it when every valid candidate has exactly k elements. The total work is O(N)."
    },
    {
        id: "py-two-pointer-init",
        language: "python",
        category: "Two Pointer and Sliding Window Patterns",
        description: "Standard opposite end two pointer initialization",
        syntax: "left, right = 0, len(arr) - 1\nwhile left < right:\n    # logic",
        useCase: "Two Sum II (sorted array), trapping rain water, reversing string.",
        timeComplexity: "O(N)",
        explanation: "left and right start at opposite ends and move inward based on the problem rule. The loop condition left < right avoids crossing pointers. This is the standard shape for sorted two-sum, reversal, and container-style optimizations. Each pointer moves at most N times total."
    },
    {
        id: "py-sliding-window-skeleton",
        language: "python",
        category: "Two Pointer and Sliding Window Patterns",
        description: "Standard sliding window variable size",
        syntax: "left = 0\nfor right in range(len(arr)):\n    # add to window\n    while invalid_condition:\n        # remove left from window\n        left += 1\n    # update result",
        useCase: "Longest substring without repeating characters, longest repeating character replacement.",
        timeComplexity: "O(N)",
        explanation: "The right pointer expands the window, and the inner while loop shrinks from the left until the state is valid again. The update usually happens after restoring validity, but some problems update before shrinking. Use this for longest or shortest subarray problems with a maintainable window invariant. Because each pointer only moves forward, the pattern is O(N)."
    },

    // --- Binary Search ---
    {
        id: "py-bs-bisect",
        language: "python",
        category: "Binary Search",
        description: "Find insertion point retaining sorted order",
        syntax: "import bisect\nidx_left = bisect.bisect_left(arr, val)\nidx_right = bisect.bisect_right(arr, val)",
        useCase: "Finding first or last occurrence of a duplicate in a sorted array, or quick closest value lookups.",
        timeComplexity: "O(log N)",
        explanation: "bisect_left returns the first insertion index where val could go, while bisect_right returns the index after the last equal val. The array must already be sorted. These are ideal for boundary searches, duplicate ranges, and counting values below or above a threshold. Each lookup is O(log N)."
    },
    {
        id: "py-bs-scratch",
        language: "python",
        category: "Binary Search",
        description: "Classic explicit binary search template",
        syntax: "l, r = 0, len(arr) - 1\nwhile l <= r:\n    m = l + (r - l) // 2\n    if arr[m] == target: return m\n    elif arr[m] < target: l = m + 1\n    else: r = m - 1",
        useCase: "Standard approach when you are searching for exactly one element.",
        timeComplexity: "O(log N)",
        explanation: "This is the classic closed-interval binary search over indices l through r. The midpoint uses l + (r - l) // 2, then discards the half that cannot contain target. Use it when you need exact control over boundaries or return values. It runs in O(log N) time and O(1) space."
    },

    // --- Tree and Graph Traversal ---
    {
        id: "py-graph-adj-list",
        language: "python",
        category: "Tree and Graph Traversal",
        description: "Adjacency list initialization",
        syntax: "adj = defaultdict(list)\nfor u, v in edges:\n    adj[u].append(v)\n    adj[v].append(u)",
        useCase: "Converting arrays of edges into a traversable graph structure.",
        timeComplexity: "O(V + E)",
        explanation: "This builds an adjacency list from an edge list using defaultdict(list). For each undirected edge, both directions are appended; for directed graphs, only append u to v. This representation is the starting point for BFS, DFS, topological sort, and shortest path problems. Building it is O(V + E) when including the graph structure size."
    },
    {
        id: "py-bfs-visited",
        language: "python",
        category: "Tree and Graph Traversal",
        description: "BFS template with visited set for graphs with cycles",
        syntax: "q = deque([start])\nvisited = {start}\nwhile q:\n    node = q.popleft()\n    for nei in adj[node]:\n        if nei not in visited:\n            visited.add(nei)\n            q.append(nei)",
        useCase: "Shortest path in unweighted graphs or connected components in cyclic graphs.",
        timeComplexity: "O(V + E)",
        explanation: "This BFS uses a deque for FIFO order and a visited set to avoid revisiting nodes in cyclic graphs. Marking a node visited when it is enqueued prevents duplicates from piling up in the queue. Use it for unweighted shortest paths and connected components. It visits each node and edge at most once."
    },
    {
        id: "py-dijkstra",
        language: "python",
        category: "Tree and Graph Traversal",
        description: "Dijkstra shortest path combining min heap and visited set",
        syntax: "pq = [(0, start)]\nvisited = set()\nwhile pq:\n    dist, node = heapq.heappop(pq)\n    if node in visited: continue\n    visited.add(node)\n    for nei, weight in adj[node]:\n        heapq.heappush(pq, (dist + weight, nei))",
        useCase: "Shortest path in a graph with non-negative edge weights.",
        timeComplexity: "O(E log V)",
        explanation: "This is Dijkstra with a min-heap of (distance, node) states. The visited check skips stale heap entries after the shortest distance to a node is finalized. Use it only with non-negative edge weights. The heap operations give the usual O(E log V) complexity."
    },
    {
        id: "py-dfs-iterative",
        language: "python",
        category: "Tree and Graph Traversal",
        description: "Iterative DFS using an explicit stack",
        syntax: "stack = [root]\nwhile stack:\n    node = stack.pop()\n    # visit node\n    if node.right: stack.append(node.right)\n    if node.left: stack.append(node.left)",
        useCase: "When recursion depth might exceed limits, or specifically avoiding the call stack.",
        timeComplexity: "O(V + E)",
        explanation: "This uses a list as an explicit stack instead of the Python call stack. Pushing right before left makes the left child get processed first because the stack is LIFO. Use it when recursion depth is risky or when you want explicit control over traversal order. It is O(V + E) with stack space for the frontier."
    },
    {
        id: "py-bfs-template",
        language: "python",
        category: "Tree and Graph Traversal",
        description: "Standard BFS Level-by-level traversal",
        syntax: "q = deque([root])\nwhile q:\n    for _ in range(len(q)):\n        node = q.popleft()\n        if node.left: q.append(node.left)\n        if node.right: q.append(node.right)",
        useCase: "Binary Tree level order traversal, finding shortest path in unweighted graphs.",
        timeComplexity: "O(V + E)",
        explanation: "This BFS processes one level at a time by looping over the queue length captured at the start of the level. New children are appended for the next level, not the current one. Use it for level-order traversal, minimum depth, and shortest unweighted paths. Each node and edge is processed once."
    },
    {
        id: "py-dfs-recursive",
        language: "python",
        category: "Tree and Graph Traversal",
        description: "Standard DFS Recursion",
        syntax: "def dfs(node):\n    if not node: return\n    # visit node\n    dfs(node.left)\n    dfs(node.right)",
        useCase: "Tree validations, paths, depth calculations using the call stack.",
        timeComplexity: "O(V + E)",
        explanation: "The recursive DFS base case returns on a missing node, then visits and recurses into children. The call stack tracks the path for you, which makes tree depth, validation, and path problems concise. Be mindful of Python recursion limits on very deep trees or graphs. The traversal is O(V + E)."
    },
    {
        id: "py-treenode-def",
        language: "python",
        category: "Tree and Graph Traversal",
        description: "Standard LeetCode TreeNode class",
        syntax: "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right",
        useCase: "Required for defining helper functions or mock testing locally.",
        timeComplexity: "N/A",
        explanation: "This is the standard LeetCode binary tree node shape: a value plus optional left and right child references. The default arguments make quick local tests easy. You usually do not submit this when LeetCode already provides it, but it helps for helpers and local mocks. Creating one node is O(1)."
    },
    {
        id: "py-topological-sort",
        language: "python",
        category: "Tree and Graph Traversal",
        description: "Topological sort using BFS with in-degree counting",
        syntax: "q = deque([n for n in range(num) if indegree[n] == 0])\nwhile q:\n    node = q.popleft()\n    res.append(node)\n    for nei in adj[node]:\n        indegree[nei] -= 1\n        if indegree[nei] == 0: q.append(nei)",
        useCase: "Course schedule dependencies or validating DAG structures (Kahn's Algorithm).",
        timeComplexity: "O(V + E)",
        explanation: "This is Kahn's algorithm for topological sorting. Nodes with indegree 0 enter the queue first, and removing a node reduces the indegree of its neighbors. Use it for course prerequisites and dependency ordering; if the result misses nodes, a cycle exists. It runs in O(V + E)."
    },

    // --- String Building ---
    {
        id: "py-string-builder",
        language: "python",
        category: "String Building",
        description: "Efficient string concatenation loop",
        syntax: "res = []\nfor char in string:\n    res.append(char)\nfinal = ''.join(res)",
        useCase: "Avoiding massive overhead of res += char inside a loop (which allocates a new string every time).",
        timeComplexity: "O(N)",
        explanation: "This pattern appends characters to a list and joins once at the end. It avoids creating a brand-new string on every loop iteration. Use it whenever output is assembled piece by piece, especially in parsing or backtracking. The final construction is O(N)."
    },

    // --- Math and Modulo ---
    {
        id: "py-math-int-div-mod",
        language: "python",
        category: "Math and Modulo",
        description: "Integer division and Modulo",
        syntax: "quotient = 10 // 3\nremainder = 10 % 3",
        useCase: "Extracting digits from an integer iteratively (val % 10, val // 10).",
        timeComplexity: "O(1)",
        explanation: "// gives integer floor division, and % gives the remainder. Together they are the standard way to peel digits with val % 10 and shrink the number with val // 10. Be careful with negative numbers because Python floor division rounds down. Each operation is O(1) for typical LC integer sizes."
    },
    {
        id: "py-math-abs-pow",
        language: "python",
        category: "Math and Modulo",
        description: "Absolute value and modular exponentiation",
        syntax: "val = abs(-5)\nres = pow(base, exp, mod)",
        useCase: "Handling distances or keeping large exponent calculations within integer bounds.",
        timeComplexity: "O(1), O(log exp)",
        explanation: "abs() returns distance from zero, which is useful for differences and coordinates. pow(base, exp, mod) performs modular exponentiation efficiently without building the enormous intermediate value. Use the three-argument pow for number theory or hashing problems. Modular exponentiation is O(log exp)."
    },
    {
        id: "py-math-infinity",
        language: "python",
        category: "Math and Modulo",
        description: "Max and Min values for variables",
        syntax: "pos_inf = float('inf')\nneg_inf = float('-inf')",
        useCase: "Initializing variables when looking for minimums or maximums in arrays.",
        timeComplexity: "O(1)",
        explanation: "float(\"inf\") and float(\"-inf\") give sentinel values larger or smaller than any normal finite comparison target. They are useful for initializing best minimums and maximums before scanning. This avoids special-casing the first element. Creating the sentinels is O(1)."
    },

    // --- Type Conversions ---
    {
        id: "py-type-conv-basics",
        language: "python",
        category: "Type Conversions",
        description: "Convert string to int and back",
        syntax: "num = int('42')\nchars = str(42)",
        useCase: "Dealing with string-represented numbers safely.",
        timeComplexity: "O(N)",
        explanation: "int(\"42\") parses a numeric string, and str(42) turns a number back into characters. int() raises ValueError if the string is not a valid integer, so validate when input may be dirty. Use these for string arithmetic and encoded-number problems. The conversion scans the digits, so it is O(N)."
    },
    {
        id: "py-type-conv-int-digits",
        language: "python",
        category: "Type Conversions",
        description: "Convert int to list of digits and back",
        syntax: "digits = [int(d) for d in str(num)]\nnum = int(''.join(map(str, digits)))",
        useCase: "Happy Number problem, processing each digit mathematically.",
        timeComplexity: "O(N)",
        explanation: "str(num) exposes the digits for iteration, int(d) converts each character back to a number, and join(map(str, digits)) rebuilds a numeric string. This is convenient when digit order matters more than arithmetic extraction. For very tight loops, repeated % 10 and // 10 may avoid string allocation. The conversion is O(N) in the number of digits."
    },

    // --- Backtracking ---
    {
        id: "py-backtracking-template",
        language: "python",
        category: "Backtracking",
        description: "Standard backtracking template (choose, explore, unchoose)",
        syntax: "def backtrack(start, path):\n    if base_case:\n        res.append(path[:])\n        return\n    for i in range(start, len(choices)):\n        path.append(choices[i])\n        backtrack(i + 1, path)\n        path.pop()",
        useCase: "Combinations, permutations, subsets, and puzzle solving.",
        timeComplexity: "O(2^N) or O(N!) depending on problem",
        explanation: "This is the choose, explore, unchoose pattern. path.append chooses a candidate, the recursive call explores that choice, and path.pop restores state for the next candidate. res.append(path[:]) stores a snapshot so later mutations do not corrupt the answer. The complexity depends on the search tree, commonly O(2^N) or O(N!)."
    },

    // --- Dynamic Programming ---
    {
        id: "py-dp-1d",
        language: "python",
        category: "Dynamic Programming",
        description: "1D DP array initialization and bottom-up iteration",
        syntax: "dp = [0] * (n + 1)\ndp[0] = base_val\nfor i in range(1, n + 1):\n    dp[i] = dp[i-1] + arr[i]",
        useCase: "Fibonacci sequence, climbing stairs, or 1D knapsack style problems.",
        timeComplexity: "O(N)",
        explanation: "This initializes a one-dimensional DP table with room for base cases. dp[0] stores the known starting answer, and later states build from earlier states. Use it when each state depends on a small number of previous positions, such as climbing stairs or prefix-style transitions. The loop is O(N)."
    },
    {
        id: "py-dp-2d",
        language: "python",
        category: "Dynamic Programming",
        description: "2D DP table initialization for grid or string comparison problems",
        syntax: "dp = [[0] * cols for _ in range(rows)]\nfor r in range(1, rows):\n    for c in range(1, cols):\n        dp[r][c] = dp[r-1][c] + dp[r][c-1]",
        useCase: "Unique paths, longest common subsequence, edit distance.",
        timeComplexity: "O(rows * cols)",
        explanation: "This creates a rectangular DP table with independent rows, then fills it by row and column. Each cell combines previously computed neighbor states such as top and left. Use it for grid paths, edit distance, and two-string comparisons. Filling every cell is O(rows * cols)."
    },
    {
        id: "py-dp-memoization",
        language: "python",
        category: "Dynamic Programming",
        description: "Memoization template using functools lru_cache",
        syntax: "from functools import lru_cache\n@lru_cache(None)\ndef dp(i, j):\n    if base_case: return 0\n    return max(dp(i+1, j), dp(i, j+1))",
        useCase: "Top-down dynamic programming avoiding manual visited dicts.",
        timeComplexity: "O(states)",
        explanation: "lru_cache memoizes calls to dp(i, j), so repeated states return instantly after the first computation. The function arguments must be hashable, which is why indices are usually better than mutable lists. Use this for top-down DP when the recurrence is clearer than table order. Runtime becomes proportional to the number of reachable states times transition cost."
    },

    // --- Linked List Patterns ---
    {
        id: "py-linked-list-dummy",
        language: "python",
        category: "Linked List Patterns",
        description: "Dummy node initialization pattern",
        syntax: "dummy = ListNode(0)\ndummy.next = head\ncurr = dummy\n# traverse...\nreturn dummy.next",
        useCase: "Whenever the head of a linked list might change (e.g., removing heads, merging).",
        timeComplexity: "O(1)",
        explanation: "A dummy node sits before the real head so operations at the head look like operations in the middle. curr can safely build or modify links starting from dummy, then dummy.next is the resulting head. Use this for remove, merge, and partition problems where the head may change. The setup itself is O(1)."
    },
    {
        id: "py-linked-list-reverse",
        language: "python",
        category: "Linked List Patterns",
        description: "Iterative linked list reversal template",
        syntax: "prev, curr = None, head\nwhile curr:\n    nxt = curr.next\n    curr.next = prev\n    prev = curr\n    curr = nxt\nhead = prev",
        useCase: "Reversing entire lists or sublists (Reverse Linked List II or Palindrome Linked List).",
        timeComplexity: "O(N)",
        explanation: "This reverses links one node at a time while preserving the next node before overwriting curr.next. prev trails the reversed portion, and curr walks through the unreversed portion. It is the core pattern for reverse list, palindrome list, and sublist reversal. The pass is O(N) with O(1) extra space."
    },
    {
        id: "py-linked-list-node",
        language: "python",
        category: "Linked List Patterns",
        description: "ListNode class definition matching standard LeetCode format",
        syntax: "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next",
        useCase: "Standard node structure for all LeetCode linked list problems.",
        timeComplexity: "N/A",
        explanation: "This is the standard LeetCode singly linked list node with a value and a next pointer. Defaults make it easy to create test nodes without passing every argument. The platform usually provides this class, but knowing the shape helps when writing helpers. Creating one node is O(1)."
    },

    // --- Utility ---
    {
        id: "py-util-any-all",
        language: "python",
        category: "Utility",
        description: "any() and all() with lambda examples",
        syntax: "is_valid = all(x > 0 for x in arr)\nhas_zero = any(x == 0 for x in arr)",
        useCase: "Quickly asserting facts about iterables without writing full loops.",
        timeComplexity: "O(N)",
        explanation: "all() returns True only if every generated condition is true, while any() returns True as soon as one condition is true. Both consume the generator lazily and short-circuit when the answer is known. Use them for compact validity checks when the predicate is simple. Worst-case time is O(N)."
    },
    {
        id: "py-util-recursion-limit",
        language: "python",
        category: "Utility",
        description: "sys.setrecursionlimit with standard high value for deep recursion",
        syntax: "import sys\nsys.setrecursionlimit(2000)",
        useCase: "Preventing RecursionError / Maximum recursion depth exceeded on large test cases.",
        timeComplexity: "O(1)",
        explanation: "setrecursionlimit raises Python's maximum call-stack depth for recursive solutions. It can prevent RecursionError on deep trees or DFS chains, but it does not make recursion memory-free. Use it carefully, and prefer iterative traversal if the depth may be extremely large. Setting the limit is O(1)."
    },
    {
        id: "py-util-unpacking",
        language: "python",
        category: "Utility",
        description: "Unpacking operator used to pass a list as arguments",
        syntax: "arr = [1, 2, 3]\nprint(*arr) # equivalent to print(1, 2, 3)",
        useCase: "Passing array elements as arguments to functions (like zip, max) dynamically.",
        timeComplexity: "O(N)",
        explanation: "The * operator expands a list or iterable into separate positional arguments. print(*arr) behaves like print(1, 2, 3), and the same idea works with functions like max or zip. Use it when a function expects separate arguments rather than one list. Expansion touches each element, so it is O(N)."
    },
    {
        id: "py-util-zip-longest",
        language: "python",
        category: "Utility",
        description: "zip_longest from itertools with fillvalue example",
        syntax: "from itertools import zip_longest\nfor a, b in zip_longest(l1, l2, fillvalue=0):",
        useCase: "Iterating over two lists of unequal length seamlessly.",
        timeComplexity: "O(max(N, M))",
        explanation: "zip_longest pairs items from iterables until the longest one is exhausted. Missing values from shorter iterables are replaced with fillvalue. This is useful when comparing or combining uneven sequences without losing tail elements. The loop runs O(max(N, M))."
    }
];

export const allSyntaxCards: SyntaxCard[] = [...pythonSyntaxCards, ...cppSyntaxCards];

export const syntaxCardMap = allSyntaxCards.reduce((acc, card) => {
    acc[card.id] = card;
    return acc;
}, {} as Record<string, SyntaxCard>);
