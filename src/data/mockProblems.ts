export interface MockInterviewContent {
    statement: string;
    examples: string;
    constraints: string;
    optimalSolution: string;
    explanation: string;
}

export const mockProblemContent: Record<string, MockInterviewContent> = {
    'two-sum': {
        statement: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
        examples: 'Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].',
        constraints: '- 2 <= nums.length <= 10^4\n- -10^9 <= nums[i] <= 10^9\n- -10^9 <= target <= 10^9\n- Only one valid answer exists.',
        optimalSolution: `def twoSum(self, nums: List[int], target: int) -> List[int]:
    prevMap = {} # val -> index

    for i, n in enumerate(nums):
        diff = target - n
        if diff in prevMap:
            return [prevMap[diff], i]
        prevMap[n] = i`,
        explanation: 'This uses a hash map for O(1) lookup. As we iterate through the array, we check if the difference between the target and the current number exists in our hash map. If it does, we found our pair. If not, we add the current number and its index to the map. The time complexity is O(N) and space complexity is O(N).',
    },
    'contains-duplicate': {
        statement: 'Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.',
        examples: 'Input: nums = [1,2,3,1]\nOutput: true\n\nInput: nums = [1,2,3,4]\nOutput: false',
        constraints: '- 1 <= nums.length <= 10^5\n- -10^9 <= nums[i] <= 10^9',
        optimalSolution: `def containsDuplicate(self, nums: List[int]) -> bool:
    hashset = set()

    for n in nums:
        if n in hashset:
            return True
        hashset.add(n)
        
    return False`,
        explanation: 'This uses a hash set to track seen elements. We iterate through the array and check if the current number is already in the set. If it is, we found a duplicate and return true. If we finish the loop without finding duplicates, we return false. The time complexity is O(N) and space complexity is O(N).',
    },
    'valid-anagram': {
        statement: 'Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.',
        examples: 'Input: s = "anagram", t = "nagaram"\nOutput: true\n\nInput: s = "rat", t = "car"\nOutput: false',
        constraints: '- 1 <= s.length, t.length <= 5 * 10^4\n- s and t consist of lowercase English letters.',
        optimalSolution: `def isAnagram(self, s: str, t: str) -> bool:
    if len(s) != len(t):
        return False

    countS, countT = {}, {}

    for i in range(len(s)):
        countS[s[i]] = 1 + countS.get(s[i], 0)
        countT[t[i]] = 1 + countT.get(t[i], 0)

    for c in countS:
        if countS[c] != countT.get(c, 0):
            return False

    return True`,
        explanation: 'This uses a hash map to count character frequencies. We first check if the lengths are equal; if not, they cannot be anagrams. Then, we build frequency maps for both strings and compare them. Alternatively, an array of size 26 can be used. Time complexity is O(N+M) and space complexity is O(1) since the alphabet size is constant.',
    },
    'group-anagrams': {
        statement: 'Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.',
        examples: 'Input: strs = ["eat","tea","tan","ate","nat","bat"]\nOutput: [["bat"],["nat","tan"],["ate","eat","tea"]]',
        constraints: '- 1 <= strs.length <= 10^4\n- 0 <= strs[i].length <= 100\n- strs[i] consists of lowercase English letters.',
        optimalSolution: `import collections

def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
    res = collections.defaultdict(list)

    for s in strs:
        count = [0] * 26
        for c in s:
            count[ord(c) - ord("a")] += 1
            
        res[tuple(count)].append(s)

    return list(res.values())`,
        explanation: 'This uses a hash map where the key is the character frequency array (converted to a tuple) and the value is a list of anagrams. We count the occurrences of each character in a string and use that count tuple as the key to group identical anagram signatures. Time complexity is O(M * N) where M is the number of strings and N is the average length, space complexity is O(M * N).',
    },
    'top-k-frequent-elements': {
        statement: 'Given an integer array `nums` and an integer `k`, return the `k` most frequent elements. You may return the answer in any order.',
        examples: 'Input: nums = [1,1,1,2,2,3], k = 2\nOutput: [1,2]',
        constraints: '- 1 <= nums.length <= 10^5\n- -10^4 <= nums[i] <= 10^4\n- k is in the range [1, the number of unique elements in the array].\n- It is guaranteed that the answer is unique.',
        optimalSolution: `def topKFrequent(self, nums: List[int], k: int) -> List[int]:
    count = {}
    freq = [[] for i in range(len(nums) + 1)]

    for n in nums:
        count[n] = 1 + count.get(n, 0)
    for n, c in count.items():
        freq[c].append(n)

    res = []
    for i in range(len(freq) - 1, 0, -1):
        for n in freq[i]:
            res.append(n)
            if len(res) == k:
                return res`,
        explanation: 'This uses the bucket sort pattern. First, we count the frequency of each number using a hash map. Then, we place numbers into an array of buckets where the index represents the frequency. Finally, we iterate backwards from the highest frequency bucket to gather the top k elements. Time complexity is O(N) and space complexity is O(N).',
    },
    'valid-palindrome': {
        statement: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string `s`, return `true` if it is a palindrome, or `false` otherwise.',
        examples: 'Input: s = "A man, a plan, a canal: Panama"\nOutput: true\nExplanation: "amanaplanacanalpanama" is a palindrome.',
        constraints: '- 1 <= s.length <= 2 * 10^5\n- s consists only of printable ASCII characters.',
        optimalSolution: `def isPalindrome(self, s: str) -> bool:
    l, r = 0, len(s) - 1

    while l < r:
        while l < r and not self.alphaNum(s[l]):
            l += 1
        while r > l and not self.alphaNum(s[r]):
            r -= 1
            
        if s[l].lower() != s[r].lower():
            return False
            
        l, r = l + 1, r - 1
        
    return True

def alphaNum(self, c):
    return (ord('A') <= ord(c) <= ord('Z') or 
            ord('a') <= ord(c) <= ord('z') or 
            ord('0') <= ord(c) <= ord('9'))`,
        explanation: 'This uses the two pointer pattern. We place one pointer at the start and one at the end of the string. We move them towards the center, skipping non-alphanumeric characters, and compare the characters at both pointers. If a mismatch is found, it is not a palindrome. Time complexity is O(N) and space complexity is O(1).',
    },
    '3sum': {
        statement: 'Given an integer array nums, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.\n\nNotice that the solution set must not contain duplicate triplets.',
        examples: 'Input: nums = [-1,0,1,2,-1,-4]\nOutput: [[-1,-1,2],[-1,0,1]]',
        constraints: '- 3 <= nums.length <= 3000\n- -10^5 <= nums[i] <= 10^5',
        optimalSolution: `def threeSum(self, nums: List[int]) -> List[List[int]]:
    res = []
    nums.sort()

    for i, a in enumerate(nums):
        if i > 0 and a == nums[i - 1]:
            continue
            
        l, r = i + 1, len(nums) - 1
        while l < r:
            threeSum = a + nums[l] + nums[r]
            
            if threeSum > 0:
                r -= 1
            elif threeSum < 0:
                l += 1
            else:
                res.append([a, nums[l], nums[r]])
                l += 1
                while nums[l] == nums[l - 1] and l < r:
                    l += 1
    return res`,
        explanation: 'This uses sorting with the two pointer pattern. After sorting the array, we iterate through it, using the current number as the first element of the triplet. Then, we use two pointers on the remaining subarray to find pairs that sum to the negated first element. Sorting helps easily avoid duplicates. Time complexity is O(N^2) and space complexity is O(1) or O(N) depending on the sorting algorithm.',
    },
    'container-with-most-water': {
        statement: 'You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`th line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.',
        examples: 'Input: height = [1,8,6,2,5,4,8,3,7]\nOutput: 49\nExplanation: The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water the container can contain is 49.',
        constraints: '- n == height.length\n- 2 <= n <= 10^5\n- 0 <= height[i] <= 10^4',
        optimalSolution: `def maxArea(self, height: List[int]) -> int:
    res = 0
    l, r = 0, len(height) - 1

    while l < r:
        area = (r - l) * min(height[l], height[r])
        res = max(res, area)

        if height[l] < height[r]:
            l += 1
        else:
            r -= 1
            
    return res`,
        explanation: 'This uses the two pointer pattern. We start with pointers at the very left and right edges to maximize the width. We calculate the area, update our max, and then move the pointer that has the shorter height inwards, as that is the only way we could potentially increase the area. Time complexity is O(N) and space complexity is O(1).',
    },
    'longest-substring-without-repeating-characters': {
        statement: 'Given a string `s`, find the length of the longest substring without repeating characters.',
        examples: 'Input: s = "abcabcbb"\nOutput: 3\nExplanation: The answer is "abc", with the length of 3.',
        constraints: '- 0 <= s.length <= 5 * 10^4\n- s consists of English letters, digits, symbols and spaces.',
        optimalSolution: `def lengthOfLongestSubstring(self, s: str) -> int:
    charSet = set()
    l = 0
    res = 0

    for r in range(len(s)):
        while s[r] in charSet:
            charSet.remove(s[l])
            l += 1
        charSet.add(s[r])
        res = max(res, r - l + 1)
        
    return res`,
        explanation: 'This uses the sliding window pattern with a hash set. We expand our window precisely by moving the right pointer and adding characters to our set. If we encounter a duplicate, we shrink the window from the left until the duplicate is removed, ensuring the window always contains unique characters. Time complexity is O(N) and space complexity is O(N).',
    },
    'minimum-window-substring': {
        statement: 'Given two strings `s` and `t` of lengths `m` and `n` respectively, return the minimum window substring of `s` such that every character in `t` (including duplicates) is included in the window.\n\nIf there is no such substring, return the empty string `""`.\n\nThe testcases will be generated such that the answer is unique.',
        examples: 'Input: s = "ADOBECODEBANC", t = "ABC"\nOutput: "BANC"\nExplanation: The minimum window substring "BANC" includes a, b, and c from string t.',
        constraints: '- m == s.length\n- n == t.length\n- 1 <= m, n <= 10^5\n- s and t consist of uppercase and lowercase English letters.',
        optimalSolution: `def minWindow(self, s: str, t: str) -> str:
    if t == "": return ""

    countT, window = {}, {}
    for c in t: countT[c] = 1 + countT.get(c, 0)
    
    have, need = 0, len(countT)
    res, resLen = [-1, -1], float("infinity")
    l = 0

    for r in range(len(s)):
        c = s[r]
        window[c] = 1 + window.get(c, 0)

        if c in countT and window[c] == countT[c]:
            have += 1

        while have == need:
            if (r - l + 1) < resLen:
                res = [l, r]
                resLen = (r - l + 1)
            
            window[s[l]] -= 1
            if s[l] in countT and window[s[l]] < countT[s[l]]:
                have -= 1
            l += 1
            
    l, r = res
    return s[l:r+1] if resLen != float("infinity") else ""`,
        explanation: 'This uses the sliding window pattern. We use hash maps to track character counts needed and currently in the window. We expand the window by moving the right pointer until all required characters are satisfied. Then, we shrink the window from the left to find the minimum valid length, updating our result. Time complexity is O(N) and space complexity is O(1) assuming a limited charset.',
    },
    'reverse-linked-list': {
        statement: 'Given the `head` of a singly linked list, reverse the list, and return the reversed list.',
        examples: 'Input: head = [1,2,3,4,5]\nOutput: [5,4,3,2,1]',
        constraints: '- The number of nodes in the list is the range [0, 5000].\n- -5000 <= Node.val <= 5000',
        optimalSolution: `def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
    prev, curr = None, head

    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
        
    return prev`,
        explanation: 'This uses standard linked list iteration. We maintain two pointers, prev and curr. As we iterate through the list, we store the next node temporarily, reverse the curr node\'s pointer to point to prev, and then shift both pointers forward. Time complexity is O(N) and space complexity is O(1).',
    },
    'merge-two-sorted-lists': {
        statement: 'You are given the heads of two sorted linked lists `list1` and `list2`.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.',
        examples: 'Input: list1 = [1,2,4], list2 = [1,3,4]\nOutput: [1,1,2,3,4,4]',
        constraints: '- The number of nodes in both lists is in the range [0, 50].\n- -100 <= Node.val <= 100\n- Both list1 and list2 are sorted in non-decreasing order.',
        optimalSolution: `def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
    dummy = ListNode()
    tail = dummy

    while list1 and list2:
        if list1.val < list2.val:
            tail.next = list1
            list1 = list1.next
        else:
            tail.next = list2
            list2 = list2.next
        tail = tail.next

    if list1:
        tail.next = list1
    elif list2:
        tail.next = list2

    return dummy.next`,
        explanation: 'This uses a dummy node to simplify edge cases when building a new list. We compare the heads of both lists, attach the smaller node to our tail, and advance the chosen list\'s pointer. Once one list is exhausted, we attach the remaining part of the other list. Time complexity is O(N+M) and space complexity is O(1).',
    },
    'reorder-list': {
        statement: 'You are given the head of a singly linked-list. The list can be represented as:\n\nL0 → L1 → … → Ln - 1 → Ln\n\nReorder the list to be on the following form:\n\nL0 → Ln → L1 → Ln - 1 → L2 → Ln - 2 → …\n\nYou may not modify the values in the list\'s nodes. Only nodes themselves may be changed.',
        examples: 'Input: head = [1,2,3,4]\nOutput: [1,4,2,3]',
        constraints: '- The number of nodes in the list is in the range [1, 5 * 10^4].\n- 1 <= Node.val <= 1000',
        optimalSolution: `def reorderList(self, head: Optional[ListNode]) -> None:
    # find middle
    slow, fast = head, head.next
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next

    # reverse second half
    second = slow.next
    prev = slow.next = None
    while second:
        tmp = second.next
        second.next = prev
        prev = second
        second = tmp

    # merge two halfs
    first, second = head, prev
    while second:
        tmp1, tmp2 = first.next, second.next
        first.next = second
        second.next = tmp1
        first = tmp1
        second = tmp2`,
        explanation: 'This uses three distinct patterns: fast/slow pointers to find the middle, reversing a linked list for the second half, and merging two lists. First, we split the list in half. Next, we reverse the second half completely in place. Lastly, we interleave the two halves together node by node. Time complexity is O(N) and space complexity is O(1).',
    },
    'invert-binary-tree': {
        statement: 'Given the `root` of a binary tree, invert the tree, and return its root.',
        examples: 'Input: root = [4,2,7,1,3,6,9]\nOutput: [4,7,2,9,6,3,1]',
        constraints: '- The number of nodes in the tree is in the range [0, 100].\n- -100 <= Node.val <= 100',
        optimalSolution: `def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
    if not root:
        return None

    # swap the children
    tmp = root.left
    root.left = root.right
    root.right = tmp

    self.invertTree(root.left)
    self.invertTree(root.right)

    return root`,
        explanation: 'This uses a recursive Depth-First Search approach. We recursively visit each node, swapping its left and right children. The base case is when root is null. The tree is fully inverted once all subtrees have their children swapped. Time complexity is O(N) and space complexity is O(H) where H is the height of the tree.',
    },
    'maximum-depth-of-binary-tree': {
        statement: 'Given the `root` of a binary tree, return its maximum depth.\n\nA binary tree\'s maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.',
        examples: 'Input: root = [3,9,20,null,null,15,7]\nOutput: 3',
        constraints: '- The number of nodes in the tree is in the range [0, 10^4].\n- -100 <= Node.val <= 100',
        optimalSolution: `def maxDepth(self, root: Optional[TreeNode]) -> int:
    if not root:
        return 0
        
    return 1 + max(self.maxDepth(root.left), self.maxDepth(root.right))`,
        explanation: 'This uses a recursive post-order traversal pattern. For any node, the maximum depth is 1 plus the maximum depth of its left and right subtrees. The base case is recognizing that an empty tree has a depth of 0. Time complexity is O(N) and space complexity is O(H) for the call stack.',
    },
    'validate-binary-search-tree': {
        statement: 'Given the `root` of a binary tree, determine if it is a valid binary search tree (BST).\n\nA valid BST is defined as follows:\n- The left subtree of a node contains only nodes with keys less than the node\'s key.\n- The right subtree of a node contains only nodes with keys greater than the node\'s key.\n- Both the left and right subtrees must also be binary search trees.',
        examples: 'Input: root = [2,1,3]\nOutput: true\n\nInput: root = [5,1,4,null,null,3,6]\nOutput: false',
        constraints: '- The number of nodes in the tree is in the range [1, 10^4].\n- -2^31 <= Node.val <= 2^31 - 1',
        optimalSolution: `def isValidBST(self, root: Optional[TreeNode]) -> bool:
    def valid(node, left, right):
        if not node:
            return True
        if not (node.val < right and node.val > left):
            return False
            
        return valid(node.left, left, node.val) and valid(node.right, node.val, right)
        
    return valid(root, float("-inf"), float("inf"))`,
        explanation: 'This uses a top-down DFS approach. We recursively validate the tree by passing down strict upper and lower boundaries that each node must satisfy. Every time we traverse left, the current node\'s value becomes the new upper bound; when going right, it becomes the new lower bound. Time complexity is O(N) and space complexity O(H).',
    },
    'binary-tree-level-order-traversal': {
        statement: 'Given the `root` of a binary tree, return the level order traversal of its nodes\' values. (i.e., from left to right, level by level).',
        examples: 'Input: root = [3,9,20,null,null,15,7]\nOutput: [[3],[9,20],[15,7]]',
        constraints: '- The number of nodes in the tree is in the range [0, 2000].\n- -1000 <= Node.val <= 1000',
        optimalSolution: `import collections

def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:
    res = []
    q = collections.deque()
    if root:
        q.append(root)

    while q:
        level = []
        for i in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        res.append(level)
        
    return res`,
        explanation: 'This uses the Breadth-First Search queue pattern. We initialize a queue with the root node. In each iteration, we process all elements currently in the queue, representing a single level, and add their children to the queue for the next level. Time complexity is O(N) and space complexity is O(N).',
    },
    'valid-parentheses': {
        statement: 'Given a string `s` containing just the characters `\'(\'`, `\')\'`, `\'{\'`, `\'}\'`, `\'[\'` and `\']\'`, determine if the input string is valid.\n\nAn input string is valid if:\n- Open brackets must be closed by the same type of brackets.\n- Open brackets must be closed in the correct order.\n- Every close bracket has a corresponding open bracket of the same type.',
        examples: 'Input: s = "()"\nOutput: true\n\nInput: s = "()[]{}"\nOutput: true',
        constraints: '- 1 <= s.length <= 10^4\n- s consists of parentheses only.',
        optimalSolution: `def isValid(self, s: str) -> bool:
    Map = {")": "(", "]": "[", "}": "{"}
    stack = []

    for c in s:
        if c not in Map:
            stack.append(c)
            continue
        if not stack or stack[-1] != Map[c]:
            return False
        stack.pop()

    return not stack`,
        explanation: 'This uses a stack data structure with a hash map. As we iterate through the characters, we push opening brackets onto the stack. When we find a closing bracket, we check if the stack is non-empty and the top element is its matching opening bracket. If not, the string is invalid. Time complexity is O(N) and space complexity is O(N).',
    },
    'daily-temperatures': {
        statement: 'Given an array of integers `temperatures` represents the daily temperatures, return an array `answer` such that `answer[i]` is the number of days you have to wait after the `i`th day to get a warmer temperature. If there is no future day for which this is possible, keep `answer[i] == 0` instead.',
        examples: 'Input: temperatures = [73,74,75,71,69,72,76,73]\nOutput: [1,1,4,2,1,1,0,0]',
        constraints: '- 1 <= temperatures.length <= 10^5\n- 30 <= temperatures[i] <= 100',
        optimalSolution: `def dailyTemperatures(self, temperatures: List[int]) -> List[int]:
    res = [0] * len(temperatures)
    stack = []  # pair: [temp, index]

    for i, t in enumerate(temperatures):
        while stack and t > stack[-1][0]:
            stackT, stackInd = stack.pop()
            res[stackInd] = i - stackInd
        stack.append((t, i))
        
    return res`,
        explanation: 'This uses the monotonic decreasing stack pattern. We iterate through temperatures, and while the current temperature is greater than the temperature at the top of the stack, we pop the stack and calculate the difference in indices. We then push the current temperature and index onto the stack. Time complexity is O(N) and space complexity is O(N).',
    },
    'min-stack': {
        statement: 'Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.',
        examples: 'Input\n["MinStack","push","push","push","getMin","pop","top","getMin"]\n[[],[-2],[0],[-3],[],[],[],[]]\n\nOutput\n[null,null,null,null,-3,null,0,-2]',
        constraints: '- -2^31 <= val <= 2^31 - 1\n- Methods pop, top and getMin operations will always be called on non-empty stacks.\n- At most 3 * 10^4 calls will be made to methods.',
        optimalSolution: `class MinStack:
    def __init__(self):
        self.stack = []
        self.minStack = []

    def push(self, val: int) -> None:
        self.stack.append(val)
        val = min(val, self.minStack[-1] if self.minStack else val)
        self.minStack.append(val)

    def pop(self) -> None:
        self.stack.pop()
        self.minStack.pop()

    def top(self) -> int:
        return self.stack[-1]

    def getMin(self) -> int:
        return self.minStack[-1]`,
        explanation: 'This uses two standard stacks. The primary stack functions normally, while the secondary \'minStack\' reliably tracks the minimum value up to the corresponding height of the stack. Every time we push a value, we push the minimum of that value and the current minimum. This allows O(1) retrieval of the absolute minimum anywhere in the stack. Time and space O(N).',
    },
    'binary-search': {
        statement: 'Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.',
        examples: 'Input: nums = [-1,0,3,5,9,12], target = 9\nOutput: 4\nExplanation: 9 exists in nums and its index is 4',
        constraints: '- 1 <= nums.length <= 10^4\n- -10^4 < nums[i], target < 10^4\n- All the integers in nums are unique.\n- nums is sorted in ascending order.',
        optimalSolution: `def search(self, nums: List[int], target: int) -> int:
    l, r = 0, len(nums) - 1

    while l <= r:
        m = l + ((r - l) // 2)
        if nums[m] > target:
            r = m - 1
        elif nums[m] < target:
            l = m + 1
        else:
            return m
            
    return -1`,
        explanation: 'This explicitly uses the binary search pattern. We maintain a left and right boundary pointer. By identifying the middle element at each step, we can eliminate half the search space depending on whether the target is larger or smaller than the middle element. Time complexity is O(log N) and space complexity is O(1).',
    },
    'find-minimum-in-rotated-sorted-array': {
        statement: 'Suppose an array of length `n` sorted in ascending order is rotated between `1` and `n` times. Given the sorted rotated array `nums` of unique elements, return the minimum element of this array.\n\nYou must write an algorithm that runs in `O(log n)` time.',
        examples: 'Input: nums = [3,4,5,1,2]\nOutput: 1\nExplanation: The original array was [1,2,3,4,5] rotated 3 times.',
        constraints: '- n == nums.length\n- 1 <= n <= 5000\n- -5000 <= nums[i] <= 5000\n- All the integers of nums are unique.\n- nums is sorted and rotated between 1 and n times.',
        optimalSolution: `def findMin(self, nums: List[int]) -> int:
    res = nums[0]
    l, r = 0, len(nums) - 1

    while l <= r:
        if nums[l] < nums[r]:
            res = min(res, nums[l])
            break
            
        m = (l + r) // 2
        res = min(res, nums[m])
        
        if nums[m] >= nums[l]:
            l = m + 1
        else:
            r = m - 1
            
    return res`,
        explanation: 'This uses a modified binary search. In a rotated sorted array, one half is always perfectly sorted. By comparing our middle element to the leftmost element, we can determine which half represents the sorted, continuous section, allowing us to accurately traverse towards the discontinuity where the minimum is hidden. Time complexity is O(log N) and space is O(1).',
    },
    'kth-largest-element-in-an-array': {
        statement: 'Given an integer array `nums` and an integer `k`, return the `k`th largest element in the array.\n\nNote that it is the `k`th largest element in the sorted order, not the `k`th distinct element.',
        examples: 'Input: nums = [3,2,1,5,6,4], k = 2\nOutput: 5',
        constraints: '- 1 <= k <= nums.length <= 10^5\n- -10^4 <= nums[i] <= 10^4',
        optimalSolution: `import heapq

def findKthLargest(self, nums: List[int], k: int) -> int:
    minHeap = nums[:k]
    heapq.heapify(minHeap)
    
    for num in nums[k:]:
        if num > minHeap[0]:
            heapq.heappushpop(minHeap, num)
            
    return minHeap[0]`,
        explanation: 'This uses a Min-Heap of size K. We maintain a heap consisting of exactly the K largest elements seen so far. As we process elements, if a number is larger than the root of our min-heap (the smallest of the K largest), we pop the root and push the new number. By the end, the root is the Kth largest element. Time complexity is O(N log K) and space O(K).',
    },
    'find-median-from-data-stream': {
        statement: 'The median is the middle value in an ordered integer list. If the size of the list is even, there is no middle value, and the median is the mean of the two middle values.\n\nImplement the MedianFinder class:\n- `MedianFinder()` initializes the object.\n- `addNum(int num)` adds the integer `num` to the data structure.\n- `findMedian()` returns the median of all elements so far.',
        examples: 'Input\n["MedianFinder", "addNum", "addNum", "findMedian", "addNum", "findMedian"]\n[[], [1], [2], [], [3], []]\nOutput\n[null, null, null, 1.5, null, 2.0]',
        constraints: '- -10^5 <= num <= 10^5\n- There will be at least one element in the data structure before calling findMedian.\n- At most 5 * 10^4 calls will be made to addNum and findMedian.',
        optimalSolution: `import heapq

class MedianFinder:
    def __init__(self):
        # two heaps, large, small, minheap, maxheap
        # heaps should be equal size
        self.small, self.large = [], []

    def addNum(self, num: int) -> None:
        if self.large and num > self.large[0]:
            heapq.heappush(self.large, num)
        else:
            heapq.heappush(self.small, -1 * num)

        if len(self.small) > len(self.large) + 1:
            val = -1 * heapq.heappop(self.small)
            heapq.heappush(self.large, val)
        if len(self.large) > len(self.small) + 1:
            val = heapq.heappop(self.large)
            heapq.heappush(self.small, -1 * val)

    def findMedian(self) -> float:
        if len(self.small) > len(self.large):
            return -1 * self.small[0]
        elif len(self.large) > len(self.small):
            return self.large[0]
        return (-1 * self.small[0] + self.large[0]) / 2.0`,
        explanation: 'This uses the Two Heaps pattern. We maintain a max-heap of the smaller half of numbers and a min-heap of the larger half. We balance them so their sizes differ by at most 1. The median is either the root of the larger heap, or the average of both roots if sizes are equal. Time complexity is O(log N) for add and O(1) for finding median.',
    }
};
