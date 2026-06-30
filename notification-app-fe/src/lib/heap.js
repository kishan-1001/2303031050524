export class MinHeap {
  constructor() {
    this.heap = [];
  }

  size() {
    return this.heap.length;
  }

  peek() {
    return this.heap[0];
  }

  push(item) {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop() {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].score <= this.heap[i].score) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.heap[left].score < this.heap[smallest].score) smallest = left;
      if (right < n && this.heap[right].score < this.heap[smallest].score) smallest = right;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }

  toSortedArray() {
    return [...this.heap].sort((a, b) => b.score - a.score);
  }
}

const TYPE_SCORE = {
  Placement: 1.0,
  Result: 0.667,
  Event: 0.333,
};

export function computeScore(notification, minTs, maxTs) {
  const typeScore = TYPE_SCORE[notification.Type] ?? 0;
  const ts = new Date(notification.Timestamp).getTime();
  const recencyScore = maxTs === minTs ? 1 : (ts - minTs) / (maxTs - minTs);
  return 0.6 * typeScore + 0.4 * recencyScore;
}

export function getTopN(notifications, n) {
  if (!notifications.length) return [];

  const timestamps = notifications.map((x) => new Date(x.Timestamp).getTime());
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);

  const heap = new MinHeap();
  for (const notification of notifications) {
    const score = computeScore(notification, minTs, maxTs);
    const scored = { ...notification, score };
    if (heap.size() < n) {
      heap.push(scored);
    } else if (score > heap.peek().score) {
      heap.pop();
      heap.push(scored);
    }
  }

  return heap.toSortedArray();
}
