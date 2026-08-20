export interface Question {
  id: string;
  subject: string;
  topic: string;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct: 'A' | 'B' | 'C' | 'D';
  explain: string;
}

export const MOCK_QUESTIONS: Question[] = [
  // Математика
  {
    id: "m1", subject: "Математика", topic: "Алгебра",
    text: "Решите уравнение: 2x + 5 = 17. x = ?",
    options: { A: "5", B: "6", C: "7", D: "8" },
    correct: "B",
    explain: "Вычтем 5 из 17, получим 12. Разделим на 2, получим x = 6.",
  },
  {
    id: "m2", subject: "Математика", topic: "Геометрия",
    text: "Чему равна площадь квадрата со стороной 4 см?",
    options: { A: "8 кв. см", B: "12 кв. см", C: "16 кв. см", D: "20 кв. см" },
    correct: "C",
    explain: "Площадь квадрата равна квадрату его стороны: 4 * 4 = 16.",
  },
  {
    id: "m3", subject: "Математика", topic: "Алгебра",
    text: "Вычислите: 5^2 - 3^2",
    options: { A: "4", B: "16", C: "25", D: "8" },
    correct: "B",
    explain: "25 - 9 = 16.",
  },
  // Биология
  {
    id: "b1", subject: "Биология", topic: "Анатомия",
    text: "Сколько камер в сердце человека?",
    options: { A: "2", B: "3", C: "4", D: "5" },
    correct: "C",
    explain: "Сердце человека состоит из 4 камер: 2 предсердий и 2 желудочков.",
  },
  {
    id: "b2", subject: "Биология", topic: "Клетка",
    text: "Какая органелла отвечает за выработку энергии (АТФ) в клетке?",
    options: { A: "Ядро", B: "Митохондрия", C: "Рибосома", D: "Лизосома" },
    correct: "B",
    explain: "Митохондрии часто называют 'энергетическими станциями' клетки.",
  },
  // Химия
  {
    id: "c1", subject: "Химия", topic: "Неорганическая химия",
    text: "Какова химическая формула воды?",
    options: { A: "CO₂", B: "H₂O", C: "O₂", D: "NaCl" },
    correct: "B",
    explain: "Молекула воды состоит из двух атомов водорода и одного атома кислорода — H₂O.",
  },
  {
    id: "c2", subject: "Химия", topic: "Элементы",
    text: "Какой элемент имеет химический символ 'Na'?",
    options: { A: "Азот", B: "Неон", C: "Натрий", D: "Никель" },
    correct: "C",
    explain: "Символ 'Na' происходит от латинского 'Natrium', что означает натрий.",
  },
  // Физика
  {
    id: "p1", subject: "Физика", topic: "Механика",
    text: "В чем измеряется сила тока?",
    options: { A: "Вольт", B: "Ватт", C: "Ом", D: "Ампер" },
    correct: "D",
    explain: "Сила тока измеряется в Амперах.",
  },
  {
    id: "p2", subject: "Физика", topic: "Оптика",
    text: "Какая линза используется для исправления близорукости?",
    options: { A: "Выпуклая", B: "Вогнутая", C: "Цилиндрическая", D: "Плоская" },
    correct: "B",
    explain: "Рассеивающая (вогнутая) линза используется для коррекции близорукости.",
  },
  // Английский
  {
    id: "e1", subject: "Английский", topic: "Грамматика",
    text: "I ___ to the store yesterday.",
    options: { A: "go", B: "goes", C: "went", D: "gone" },
    correct: "C",
    explain: "'Yesterday' указывает на Past Simple. Вторая форма глагола 'go' — 'went'.",
  },
  {
    id: "e2", subject: "Английский", topic: "Лексика",
    text: "Как переводится слово 'Apple'?",
    options: { A: "Груша", B: "Яблоко", C: "Апельсин", D: "Банан" },
    correct: "B",
    explain: "'Apple' означает 'Яблоко'.",
  }
];

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  xp: number;
  isCurrentUser?: boolean;
}

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'u1', rank: 1, name: 'Azizbek K.', xp: 4200 },
  { id: 'u2', rank: 2, name: 'Malika R.', xp: 3950 },
  { id: 'u3', rank: 3, name: 'Sardor N.', xp: 3800 },
  { id: 'u4', rank: 4, name: 'Durdona B.', xp: 3650 },
  { id: 'u5', rank: 5, name: 'Test Student', xp: 2450, isCurrentUser: true }, // Current User
  { id: 'u6', rank: 6, name: 'Javohir O.', xp: 2100 },
  { id: 'u7', rank: 7, name: 'Zarina S.', xp: 1950 },
  { id: 'u8', rank: 8, name: 'Temur A.', xp: 1800 },
];

export interface HistoryTransaction {
  id: string;
  date: string;
  description: string;
  xpChange: number;
  type: 'quiz' | 'streak_bonus' | 'penalty';
}

export const MOCK_HISTORY: HistoryTransaction[] = [
  { id: 't1', date: 'Today, 14:30', description: 'Biology Quiz (Perfect Score)', xpChange: 50, type: 'quiz' },
  { id: 't2', date: 'Today, 10:00', description: 'Mathematics Quiz (Incorrect Answer)', xpChange: -10, type: 'penalty' },
  { id: 't3', date: 'Yesterday, 09:15', description: '5-Day Streak Bonus!', xpChange: 100, type: 'streak_bonus' },
  { id: 't4', date: 'Yesterday, 09:00', text: 'Chemistry Quiz (Passed)', xpChange: 50, type: 'quiz' } as any,
  { id: 't5', date: 'Aug 08, 16:45', description: 'English Quiz (Passed)', xpChange: 50, type: 'quiz' },
];

