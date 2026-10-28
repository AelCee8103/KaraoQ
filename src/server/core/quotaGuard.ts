interface DailyQuota {
  dateStr: string;
  unitsUsed: number;
}

let quotaState: DailyQuota = {
  dateStr: new Date().toISOString().slice(0, 10),
  unitsUsed: 0,
};

const DAILY_LIMIT = 10000;
const RESTING_THRESHOLD = 9000; // 90%

export function recordQuotaUsage(units: number): void {
  const today = new Date().toISOString().slice(0, 10);
  if (quotaState.dateStr !== today) {
    quotaState = {
      dateStr: today,
      unitsUsed: units,
    };
  } else {
    quotaState.unitsUsed += units;
  }
}

export function isQuotaResting(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (quotaState.dateStr !== today) {
    return false;
  }
  return quotaState.unitsUsed >= RESTING_THRESHOLD;
}

export function getQuotaStats(): { date: string; unitsUsed: number; maxUnits: number; isResting: boolean } {
  return {
    date: quotaState.dateStr,
    unitsUsed: quotaState.unitsUsed,
    maxUnits: DAILY_LIMIT,
    isResting: isQuotaResting(),
  };
}
