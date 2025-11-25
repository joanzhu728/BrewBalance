
export enum BudgetStatus {
  UnderAlarm = 'GREEN',
  Warning = 'YELLOW',
  OverBudget = 'RED',
}

export interface Settings {
  weekdayBudget: number;
  weekendBudget: number;
  currency: string;
  alarmThreshold: number; // 0.0 to 1.0
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD or null
  logo: string | null; // Base64 encoded image string
  customBudgets?: Record<string, number>; // Date (YYYY-MM-DD) -> Amount
}

export interface Entry {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  note: string;
  timestamp: number;
}

export interface DailyStats {
  date: string;
  baseBudget: number;
  rollover: number;
  totalAvailable: number;
  spent: number;
  remaining: number;
  status: BudgetStatus;
  entries: Entry[];
  isCustomBudget?: boolean;
}

export type TabView = 'dashboard' | 'add' | 'calendar' | 'history' | 'settings';