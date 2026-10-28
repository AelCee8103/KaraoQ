interface DailyQuota {
  dateStr: string;
  unitsUsed: number;
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const DAILY_LIMIT = 10000;
const RESTING_THRESHOLD = 9000; // 90%

let quotaState: DailyQuota = {
  dateStr: new Date().toISOString().slice(0, 10),
  unitsUsed: 0,
};

function getQuotaKey(): string {
  return `karaoq:youtube-quota:${new Date().toISOString().slice(0, 10)}`;
}

async function upstashCommand<T>(command: string[]): Promise<T> {
  const response = await fetch(UPSTASH_URL as string, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error(`Upstash quota request failed with status ${response.status}`);
  }

  const data = (await response.json()) as { result: T };
  return data.result;
}

export async function recordQuotaUsage(units: number): Promise<void> {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    const key = getQuotaKey();
    await upstashCommand<number>(["incrby", key, String(units)]);
    await upstashCommand<number>(["expire", key, "172800"]);
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  if (quotaState.dateStr !== today) {
    quotaState = { dateStr: today, unitsUsed: units };
  } else {
    quotaState.unitsUsed += units;
  }
}

export async function isQuotaResting(): Promise<boolean> {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    const unitsUsed = await upstashCommand<number>(["get", getQuotaKey()]);
    return (unitsUsed || 0) >= RESTING_THRESHOLD;
  }

  const today = new Date().toISOString().slice(0, 10);
  return quotaState.dateStr === today && quotaState.unitsUsed >= RESTING_THRESHOLD;
}

export async function getQuotaStats(): Promise<{
  date: string;
  unitsUsed: number;
  maxUnits: number;
  isResting: boolean;
}> {
  const date = new Date().toISOString().slice(0, 10);
  const unitsUsed =
    UPSTASH_URL && UPSTASH_TOKEN
      ? (await upstashCommand<number>(["get", getQuotaKey()])) || 0
      : quotaState.dateStr === date
        ? quotaState.unitsUsed
        : 0;

  return {
    date,
    unitsUsed,
    maxUnits: DAILY_LIMIT,
    isResting: unitsUsed >= RESTING_THRESHOLD,
  };
}
