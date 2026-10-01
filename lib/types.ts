export const CHOICE_TAGS = ["need", "want", "save", "spend"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const ENGINES = ["choices", "lemonade"] as const;

export type ChoiceTag = (typeof CHOICE_TAGS)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type Engine = (typeof ENGINES)[number];
export type Stars = 1 | 2 | 3;

export type ChoiceOption = {
  id: string;
  label: string;
  detail: string;
  coinDelta: number;
  bonusCoins: number;
  tag: ChoiceTag;
  meetsNeed: boolean;
  feedbackTitle: string;
  feedbackBody: string;
};

export type MissionStep = {
  id: string;
  title: string;
  prompt: string;
  income: number;
  incomeLabel: string;
  choices: ChoiceOption[];
};

export type SupplyOption = {
  id: string;
  name: string;
  detail: string;
  cost: number;
  cups: number;
};

export type PriceOption = {
  price: number;
  customers: number;
  note: string;
};

export type QuizChoice = {
  id: string;
  label: string;
  correct: boolean;
  explanation: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: QuizChoice[];
};

export type Rewards = {
  xp: number;
  coins: number;
  badgeId: string;
  badgeName: string;
  badgeDescription: string;
};

export type Mission = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  story: string;
  learningGoal: string;
  ageMin: number;
  ageMax: number;
  difficulty: Difficulty;
  topic: string;
  order: number;
  engine: Engine;
  startingCoins: number;
  goalAmount: number | null;
  needsRequired: number;
  successHeadline: string;
  practiceHeadline: string;
  steps: MissionStep[];
  supplies: SupplyOption[];
  prices: PriceOption[];
  lemonadeIntro: string;
  quiz: QuizQuestion[];
  rewards: Rewards;
};

export type Lesson = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  topic: string;
  ageMin: number;
  ageMax: number;
  order: number;
};

export type ContentSource = "sanity" | "demo" | "unavailable";

export type ContentBundle = {
  source: ContentSource;
  reason: string | null;
  missions: Mission[];
  lessons: Lesson[];
};

export type ChoiceHistoryEntry = {
  stepId: string;
  choiceId: string;
  label: string;
  coinDelta: number;
  bonusCoins: number;
  balanceAfter: number;
  tag: ChoiceTag;
  meetsNeed: boolean;
  feedbackTitle: string;
  feedbackBody: string;
};

export type ChoiceSession = {
  balance: number;
  stepIndex: number;
  history: ChoiceHistoryEntry[];
  needsMet: number;
  wantsChosen: number;
  phase: "playing" | "feedback" | "results";
  pending: ChoiceHistoryEntry | null;
};

export type LemonadeResult = {
  supplyId: string;
  supplyName: string;
  price: number;
  customers: number;
  cupsAvailable: number;
  cupsSold: number;
  revenue: number;
  expenses: number;
  profit: number;
  endingCoins: number;
};

export type Stat = {
  label: string;
  value: string;
  hint?: string;
};

export type MissionOutcome = {
  stars: Stars;
  succeeded: boolean;
  headline: string;
  lesson: string;
  stats: Stat[];
};

export type LedgerKind = "welcome" | "mission-reward" | "savings-transfer";

export type LedgerEntry = {
  id: string;
  at: string;
  label: string;
  amount: number;
  balanceAfter: number;
  kind: LedgerKind;
};

export type MissionRecord = {
  completions: number;
  bestStars: Stars;
  lastQuizCorrect: number;
  lastPlayedAt: string;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
};

export type PlayerProgress = {
  version: 1;
  coins: number;
  xp: number;
  savings: number;
  savingsGoalName: string;
  savingsGoalTarget: number;
  badges: Badge[];
  missions: Record<string, MissionRecord>;
  ledger: LedgerEntry[];
};
