// Shared data layer for the training log.
// Both the Topics tracker and the Problem Log read/write through this
// object, backed by localStorage, so the two stay in sync (a problem's
// topic tag links back to the Topics list) and the homepage can show
// real counts instead of hardcoded numbers.
const AnteikuStore = (() => {
  const TOPICS_KEY = "anteiku:topics";
  const PROBLEMS_KEY = "anteiku:problems";

  // Seed data so the tool isn't empty on first load — all editable/removable.
  const seedTopics = () => [
    {
      id: "t-graphs",
      name: "Graphs",
      comfort: 3,
      notes: "Comfortable with BFS/DFS and Dijkstra. Still shaky on flow networks (max-flow/min-cut) — need to redo a few from scratch.",
    },
    {
      id: "t-dp",
      name: "Dynamic Programming",
      comfort: 3,
      notes: "Good with 1D/2D DP and knapsack variants. Digit DP and DP on trees need more reps.",
    },
    {
      id: "t-strings",
      name: "Strings",
      comfort: 2,
      notes: "Know KMP conceptually but haven't implemented Z-function or suffix arrays from memory yet.",
    },
    {
      id: "t-number-theory",
      name: "Number Theory",
      comfort: 2,
      notes: "Sieve and modular exponentiation are solid. Need to revisit CRT and extended Euclid.",
    },
  ];

  const seedProblems = () => [
    {
      id: "p-1",
      name: "Watermelon",
      link: "https://codeforces.com/problemset/problem/4/A",
      judge: "Codeforces",
      topic: "t-number-theory",
      difficulty: "Easy",
      verdict: "AC",
      notes: "Warm-up — parity check.",
      revisit: false,
      date: "",
    },
    {
      id: "p-2",
      name: "Longest Increasing Subsequence",
      link: "https://cses.fi/problemset/task/1145",
      judge: "CSES",
      topic: "t-dp",
      difficulty: "Medium",
      verdict: "WA",
      notes: "First attempt used O(n^2), TLE on the harder version. Need the O(n log n) patience-sorting approach.",
      revisit: true,
      date: "",
    },
  ];

  const load = (key, seedFn) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        const seeded = seedFn();
        localStorage.setItem(key, JSON.stringify(seeded));
        return seeded;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`Anteiku store: failed to load ${key}, resetting.`, e);
      const seeded = seedFn();
      localStorage.setItem(key, JSON.stringify(seeded));
      return seeded;
    }
  };

  const save = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const uid = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  return {
    getTopics: () => load(TOPICS_KEY, seedTopics),
    saveTopics: (topics) => save(TOPICS_KEY, topics),

    getProblems: () => load(PROBLEMS_KEY, seedProblems),
    saveProblems: (problems) => save(PROBLEMS_KEY, problems),

    newTopicId: () => uid("t"),
    newProblemId: () => uid("p"),

    // Look up a topic's display name by id, for rendering in the problem log.
    topicNameById: (topics, id) => {
      const found = topics.find((t) => t.id === id);
      return found ? found.name : "Untagged";
    },
  };
})();
