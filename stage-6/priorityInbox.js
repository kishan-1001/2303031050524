const NOTIFICATIONS_API = "http://4.224.186.213/evaluation-service/notifications";
const AUTH_API = "http://4.224.186.213/evaluation-service/auth";

const CREDENTIALS = {
  clientID: "67980ef1-0fc0-4fa2-bcaa-7c92f96f1d40",
  clientSecret: "HAGfavCDMjhGCCvq",
  email: "2303031050524@paruluniversity.ac.in",
  name: "Kishan Roy",
  rollNo: "2303031050524",
  accessCode: "cJqaEB",
};

const TYPE_SCORE_NORMALIZED = {
  Placement: 1.0,
  Result: 0.667,
  Event: 0.333,
};

const TYPE_WEIGHT_FACTOR = 0.6;
const RECENCY_WEIGHT_FACTOR = 0.4;

class MinHeap {
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

function computeScore(notification, minTs, maxTs) {
  const typeScore = TYPE_SCORE_NORMALIZED[notification.Type] ?? 0;
  const ts = new Date(notification.Timestamp).getTime();
  const recencyScore = maxTs === minTs ? 1 : (ts - minTs) / (maxTs - minTs);
  return TYPE_WEIGHT_FACTOR * typeScore + RECENCY_WEIGHT_FACTOR * recencyScore;
}

function buildTopNHeap(notifications, n, minTs, maxTs) {
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

  return heap;
}

function ingestNewNotification(heap, notification, n, minTs, maxTs) {
  const score = computeScore(notification, minTs, maxTs);
  const scored = { ...notification, score };

  if (heap.size() < n) {
    heap.push(scored);
  } else if (score > heap.peek().score) {
    heap.pop();
    heap.push(scored);
  }

  return heap;
}

async function getAccessToken() {
  const response = await fetch(AUTH_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(CREDENTIALS),
  });

  if (!response.ok) {
    throw new Error(`Auth failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchNotifications(token) {
  const response = await fetch(NOTIFICATIONS_API, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.notifications;
}

async function main() {
  const TOP_N = 10;

  console.log("Authenticating...");
  const token = await getAccessToken();
  console.log("Token obtained.\n");

  console.log("Fetching notifications from API...\n");
  const notifications = await fetchNotifications(token);
  console.log(`Total notifications received: ${notifications.length}\n`);

  const timestamps = notifications.map((n) => new Date(n.Timestamp).getTime());
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);

  const heap = buildTopNHeap(notifications, TOP_N, minTs, maxTs);
  const topN = heap.toSortedArray();

  console.log(`Top ${TOP_N} Priority Notifications (Placement > Result > Event, combined with recency):`);
  console.log("=".repeat(80));

  topN.forEach((notification, index) => {
    const rank = String(index + 1).padStart(2);
    const type = notification.Type.padEnd(9);
    const score = notification.score.toFixed(4);
    const ts = notification.Timestamp;
    console.log(`  ${rank}. [${type}] Score: ${score} | ${ts} | ${notification.Message}`);
  });

  console.log("\n" + "=".repeat(80));
  console.log("\nDemonstrating streaming ingestion (3 new simulated notifications):");
  console.log("-".repeat(80));

  const simulatedNew = [
    { ID: "new-1", Type: "Placement", Message: "Google hiring", Timestamp: new Date().toISOString() },
    { ID: "new-2", Type: "Event", Message: "orientation-day", Timestamp: new Date(Date.now() - 1000).toISOString() },
    { ID: "new-3", Type: "Result", Message: "end-sem results", Timestamp: new Date(Date.now() - 2000).toISOString() },
  ];

  const newMaxTs = new Date(simulatedNew[0].Timestamp).getTime();
  const updatedMinTs = Math.min(minTs, new Date(simulatedNew[2].Timestamp).getTime());

  let streamingHeap = heap;
  for (const incoming of simulatedNew) {
    streamingHeap = ingestNewNotification(streamingHeap, incoming, TOP_N, updatedMinTs, newMaxTs);
    console.log(`\nIngested: [${incoming.Type}] "${incoming.Message}" — Heap size: ${streamingHeap.size()}`);
  }

  console.log("\nUpdated Top 10 after streaming ingestion:");
  console.log("=".repeat(80));
  streamingHeap.toSortedArray().forEach((notification, index) => {
    console.log(`#${index + 1} [${notification.Type.padEnd(9)}] Score: ${notification.score.toFixed(4)} | ${notification.Message}`);
  });
}

main().catch(console.error);
