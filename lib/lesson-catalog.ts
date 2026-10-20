export type Lesson = {
  id: string;
  number: number;
  title: string;
  phase: number;
  phaseTitle: string;
};

const PHASES = [
  { phase: 1, title: "Foundation", start: 1, count: 10 },
  { phase: 2, title: "Connectivity & data", start: 11, count: 10 },
  { phase: 3, title: "Pricing & signals", start: 21, count: 10 },
  { phase: 4, title: "Execution & routing", start: 31, count: 10 },
  { phase: 5, title: "Market making deep dive", start: 41, count: 10 },
] as const;

const LESSON_TITLES: Record<number, string> = {
  1: "Opening (talk)",
  2: "Opening (talk)",
  3: "Opening (talk)",
  4: "Opening (talk)",
  5: "Opening (talk)",
  6: "Opening (talk)",
  7: "Async HTTP",
  8: "Talk — HTTP → Binance",
  9: "Binance bookTicker",
  10: "Read CLOB SDKs",
  11: "Faster EIP-712",
  12: "Faster order hash",
  13: "Sign benchmark",
  14: "L1 auth",
  15: "API keys + WS",
  16: "Tick / fee / neg-risk",
  17: "Order builder + HMAC",
  18: "Post / cancel REST",
  19: "limit_helper",
  20: "Order smoke test",
  21: "Latency probes",
  22: "Binance vs CLOB lag",
  23: "Gamma catalog",
  24: "Talk — design",
  25: "Talk — design",
  26: "Talk — design",
  27: "Talk — design",
  28: "Talk — design",
  29: "Strategy scaffold",
  30: "Volatility",
  31: "Strike K + book",
  32: "Lead price Ŝ",
  33: "Talk — Ŝ → GTR",
  34: "GTR bands + nd2",
  35: "check_trade",
  36: "Fills + canary",
  37: "Hedge loop",
  38: "First gateway",
  39: "Talk — gateway",
  40: "Gateway client",
  41: "Cancel timing",
  42: "fast_cancel",
  43: "Taker sends",
  44: "Taker 500ms cancel",
  45: "Talk — taker → maker",
  46: "Maker ladder",
  47: "Final code",
  48: "Talk — wrap-up",
  49: "Talk — wrap-up",
  50: "Talk — wrap-up",
};

export const PRO_ONLY_LESSONS = [9, 21, 31, 32, 34, 35, 37, 43, 44, 46];

export function isProOnlyLesson(number: number) {
  return PRO_ONLY_LESSONS.includes(number);
}

export function lessonLabel(lesson: Pick<Lesson, "id" | "title">) {
  return `${lesson.id} · ${lesson.title}`;
}

export const lessons: Lesson[] = PHASES.flatMap(({ phase, title, start, count }) =>
  Array.from({ length: count }, (_, index) => {
    const number = start + index;
    const id = String(number).padStart(2, "0");
    return {
      id,
      number,
      title: LESSON_TITLES[number] ?? `Lesson ${id}`,
      phase,
      phaseTitle: title,
    };
  }),
);

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id || lesson.number === Number(id));
}
