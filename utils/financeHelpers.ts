import { Settings, Entry, DailyStats, BudgetStatus } from '../types';
import { isWeekend, addDays, formatDateISO } from './dateUtils';

export const calculateStats = (
  settings: Settings,
  entries: Entry[],
  targetDateStr?: string // If provided, ensures calculation goes up to at least this date
): Record<string, DailyStats> => {
  const statsMap: Record<string, DailyStats> = {};
  
  // Sort entries just in case
  const sortedEntries = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  
  // Group entries by date
  const entriesByDate: Record<string, Entry[]> = {};
  sortedEntries.forEach(entry => {
    if (!entriesByDate[entry.date]) {
      entriesByDate[entry.date] = [];
    }
    entriesByDate[entry.date].push(entry);
  });

  let currentDateStr = settings.startDate;
  // Determine the end date for calculation: Max of (Today, TargetDate, Last Entry Date)
  const todayStr = formatDateISO(new Date());
  let endDateCalcStr = targetDateStr && targetDateStr > todayStr ? targetDateStr : todayStr;

  // If there are future entries beyond today/target, extend calculation
  const lastEntryDate = sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1].date : settings.startDate;
  if (lastEntryDate > endDateCalcStr) {
    endDateCalcStr = lastEntryDate;
  }

  let currentRollover = 0;

  // Loop until we pass the end date
  while (currentDateStr <= endDateCalcStr) {
    const isWknd = isWeekend(currentDateStr);
    
    // Determine if the budget applies for this date
    // Logic: It applies if we are >= startDate (already handled by loop start)
    // AND if we are <= endDate (if endDate exists)
    let baseBudget = 0;
    if (!settings.endDate || currentDateStr <= settings.endDate) {
        baseBudget = isWknd ? settings.weekendBudget : settings.weekdayBudget;
    }

    const dayEntries = entriesByDate[currentDateStr] || [];
    const spent = dayEntries.reduce((sum, e) => sum + e.amount, 0);
    
    const totalAvailable = baseBudget + currentRollover;
    const remaining = totalAvailable - spent;

    // Determine status
    let status = BudgetStatus.UnderAlarm;
    const alarmLimit = totalAvailable * settings.alarmThreshold;

    if (spent > totalAvailable) {
      status = BudgetStatus.OverBudget;
    } else if (spent >= alarmLimit) {
      status = BudgetStatus.Warning;
    } else {
      status = BudgetStatus.UnderAlarm;
    }

    statsMap[currentDateStr] = {
      date: currentDateStr,
      baseBudget,
      rollover: currentRollover,
      totalAvailable,
      spent,
      remaining,
      status,
      entries: dayEntries
    };

    // Logic for next day rollover
    // Rollover should only propagate if the day has fully passed.
    // If we are calculating for "Today" or a future date, the day is not over,
    // so we do not project the remaining amount to the next day yet.
    if (currentDateStr >= todayStr) {
      currentRollover = 0;
    } else {
      currentRollover = remaining;
    }
    
    currentDateStr = addDays(currentDateStr, 1);
  }

  return statsMap;
};

export const calculateStreak = (statsMap: Record<string, DailyStats>): number => {
  const today = formatDateISO(new Date());
  let streak = 0;
  let checkDate = today;

  const todayStats = statsMap[today];
  if (todayStats && todayStats.status === BudgetStatus.OverBudget) {
      return 0;
  }
  
  // Start counting backwards from yesterday
  checkDate = addDays(today, -1);
  
  while (true) {
    const stats = statsMap[checkDate];
    if (!stats) break; // No record implies start of tracking or gap
    
    if (stats.status !== BudgetStatus.OverBudget) {
      streak++;
      checkDate = addDays(checkDate, -1);
    } else {
      break;
    }
  }
  
  return streak;
};