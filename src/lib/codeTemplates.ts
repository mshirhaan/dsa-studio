// Code templates for DSA Teaching Studio
// Simplified version without complex template literals

export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  language: 'javascript' | 'python' | 'cpp' | 'java' | 'typescript';
  category: 'array' | 'linked-list' | 'tree' | 'graph' | 'sorting' | 'searching' | 'dp' | 'other';
  code: string;
}

export const codeTemplates: CodeTemplate[] = [
  {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    description: 'Classic bubble sort algorithm',
    language: 'javascript',
    category: 'sorting',
    code: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}

const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log("Sorted:", bubbleSort([...numbers]));`
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    description: 'Binary search on sorted array',
    language: 'javascript',
    category: 'searching',
    code: `function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

const arr = [1, 3, 5, 7, 9, 11, 13, 15];
console.log("Found at:", binarySearch(arr, 7));`
  },
  {
    id: 'linked-list',
    name: 'Linked List',
    description: 'Basic linked list implementation',
    language: 'javascript',
    category: 'linked-list',
    code: `class Node {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
  }
  
  append(data) {
    const newNode = new Node(data);
    if (!this.head) {
      this.head = newNode;
      return;
    }
    let current = this.head;
    while (current.next) {
      current = current.next;
    }
    current.next = newNode;
  }
  
  display() {
    let current = this.head;
    let result = [];
    while (current) {
      result.push(current.data);
      current = current.next;
    }
    console.log(result.join(" -> "));
  }
}

const list = new LinkedList();
list.append(1);
list.append(2);
list.append(3);
list.display();`
  },
  {
    id: 'binary-tree',
    name: 'Binary Search Tree',
    description: 'BST with insert and search',
    language: 'javascript',
    category: 'tree',
    code: `class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

class BST {
  constructor() {
    this.root = null;
  }
  
  insert(value) {
    const newNode = new TreeNode(value);
    if (!this.root) {
      this.root = newNode;
      return;
    }
    let current = this.root;
    while (true) {
      if (value < current.value) {
        if (!current.left) {
          current.left = newNode;
          return;
        }
        current = current.left;
      } else {
        if (!current.right) {
          current.right = newNode;
          return;
        }
        current = current.right;
      }
    }
  }
  
  inorder(node = this.root, result = []) {
    if (node) {
      this.inorder(node.left, result);
      result.push(node.value);
      this.inorder(node.right, result);
    }
    return result;
  }
}

const bst = new BST();
[50, 30, 70, 20, 40, 60, 80].forEach(v => bst.insert(v));
console.log("Inorder:", bst.inorder());`
  },
  {
    id: 'dfs-bfs',
    name: 'Graph Traversal',
    description: 'DFS and BFS on graph',
    language: 'javascript',
    category: 'graph',
    code: `class Graph {
  constructor() {
    this.adjacencyList = {};
  }
  
  addVertex(vertex) {
    if (!this.adjacencyList[vertex]) {
      this.adjacencyList[vertex] = [];
    }
  }
  
  addEdge(v1, v2) {
    this.adjacencyList[v1].push(v2);
    this.adjacencyList[v2].push(v1);
  }
  
  dfs(start) {
    const result = [];
    const visited = {};
    const dfsHelper = (vertex) => {
      visited[vertex] = true;
      result.push(vertex);
      this.adjacencyList[vertex].forEach(neighbor => {
        if (!visited[neighbor]) dfsHelper(neighbor);
      });
    };
    dfsHelper(start);
    return result;
  }
  
  bfs(start) {
    const queue = [start];
    const result = [];
    const visited = {[start]: true};
    
    while (queue.length) {
      const vertex = queue.shift();
      result.push(vertex);
      this.adjacencyList[vertex].forEach(neighbor => {
        if (!visited[neighbor]) {
          visited[neighbor] = true;
          queue.push(neighbor);
        }
      });
    }
    return result;
  }
}

const g = new Graph();
['A','B','C','D'].forEach(v => g.addVertex(v));
g.addEdge('A','B');
g.addEdge('A','C');
g.addEdge('B','D');
console.log("DFS:", g.dfs('A'));
console.log("BFS:", g.bfs('A'));`
  },
  {
    id: 'quick-sort',
    name: 'Quick Sort',
    description: 'Quick sort with partition',
    language: 'javascript',
    category: 'sorting',
    code: `function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  
  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}

const numbers = [10, 7, 8, 9, 1, 5];
console.log("Sorted:", quickSort([...numbers]));`
  },
  {
    id: 'merge-sort',
    name: 'Merge Sort',
    description: 'Merge sort algorithm',
    language: 'javascript',
    category: 'sorting',
    code: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  
  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  
  while (i < left.length && j < right.length) {
    if (left[i] < right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }
  
  return result.concat(left.slice(i), right.slice(j));
}

const numbers = [38, 27, 43, 3, 9, 82, 10];
console.log("Sorted:", mergeSort(numbers));`
  },
  {
    id: 'stack-impl',
    name: 'Stack Implementation',
    description: 'Stack with LIFO operations',
    language: 'javascript',
    category: 'other',
    code: `class Stack {
  constructor() {
    this.items = [];
  }
  
  push(element) {
    this.items.push(element);
    console.log("Pushed:", element);
  }
  
  pop() {
    if (this.isEmpty()) {
      console.log("Stack Underflow!");
      return null;
    }
    return this.items.pop();
  }
  
  peek() {
    return this.items[this.items.length - 1];
  }
  
  isEmpty() {
    return this.items.length === 0;
  }
  
  size() {
    return this.items.length;
  }
  
  display() {
    console.log("Stack:", this.items);
  }
}

const stack = new Stack();
stack.push(10);
stack.push(20);
stack.push(30);
stack.display();
console.log("Top:", stack.peek());
console.log("Popped:", stack.pop());
stack.display();`
  },
  {
    id: 'queue-impl',
    name: 'Queue Implementation',
    description: 'Queue with FIFO operations',
    language: 'javascript',
    category: 'other',
    code: `class Queue {
  constructor() {
    this.items = [];
  }
  
  enqueue(element) {
    this.items.push(element);
    console.log("Enqueued:", element);
  }
  
  dequeue() {
    if (this.isEmpty()) {
      console.log("Queue Underflow!");
      return null;
    }
    return this.items.shift();
  }
  
  front() {
    return this.items[0];
  }
  
  isEmpty() {
    return this.items.length === 0;
  }
  
  size() {
    return this.items.length;
  }
  
  display() {
    console.log("Queue:", this.items);
  }
}

const queue = new Queue();
queue.enqueue(10);
queue.enqueue(20);
queue.enqueue(30);
queue.display();
console.log("Front:", queue.front());
console.log("Dequeued:", queue.dequeue());
queue.display();`
  },
  {
    id: 'fibonacci-dp',
    name: 'Fibonacci (DP)',
    description: 'Fibonacci with dynamic programming',
    language: 'javascript',
    category: 'dp',
    code: `// Memoization (Top-Down)
function fibMemo(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  return memo[n];
}

// Tabulation (Bottom-Up)
function fibTab(n) {
  if (n <= 1) return n;
  const dp = [0, 1];
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}

console.log("fib(10) memoization:", fibMemo(10));
console.log("fib(10) tabulation:", fibTab(10));
console.log("fib(40) memoization:", fibMemo(40));`
  },
];

export function getTemplatesByCategory(category: CodeTemplate['category']): CodeTemplate[] {
  return codeTemplates.filter(t => t.category === category);
}

export function getTemplateById(id: string): CodeTemplate | undefined {
  return codeTemplates.find(t => t.id === id);
}

