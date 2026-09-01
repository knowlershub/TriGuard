export type DashboardExpense = {
  id: string;
  amount: number;
  currency: string;
  category: string | null;
  merchant: string | null;
  source: string;
  rawInput: string | null;
  occurredAt: string;
  createdAt: string;
};

export type DashboardTask = {
  id: string;
  title: string;
  priority: string;
  dueAt: string | null;
  source: string | null;
  isDone: boolean;
  createdAt: string;
};

export type DashboardEmail = {
  id: string;
  subject: string | null;
  summary: string | null;
  detectedType: string | null;
  routedTo: string | null;
  createdAt: string;
};

export type DashboardLeak = {
  category: string;
  currentAmount: number;
  previousAmount: number;
  percentage: number;
};

export type DashboardActivity = {
  id: string;
  time: string;
  title: string;
  description: string;
  type: "expense" | "task" | "email";
};

export type DashboardData = {
  user: {
    id: string;
    displayName: string | null;
  };

  summary: {
    monthTotal: number;
    previousMonthTotal: number;
    weekTotal: number;
    monthChange: number;
    transactionCount: number;
    activeTaskCount: number;
    dueSoonTaskCount: number;
    todayTaskCount: number;
    emailProcessedToday: number;
    actionRequiredEmails: number;
    subscriptions: number;
  };

  expenses: DashboardExpense[];
  tasks: DashboardTask[];
  emails: DashboardEmail[];
  leaks: DashboardLeak[];
  activities: DashboardActivity[];
};

export type NotificationPreferences = {
  emailNotifications: boolean;
  leakAlerts: boolean;
  taskReminders: boolean;
  subscriptionAlerts: boolean;
  dailyDigest: boolean;
};

export type SaveReceiptExpenseInput = {
  testUserId?: string;
  merchant: string;
  amount: number;
  currency: string;
  category: string;
  occurredAt: string;
  rawText: string;
};

export type GmailConnectionStatus = {
  connected: boolean;
  emailAddress: string | null;
  provider: string | null;
  expired: boolean;
  needsReauth: boolean;
};

/*
 * Frontend request deduplication.
 *
 * These short-lived caches prevent multiple dashboard components
 * from making duplicate requests when they mount together.
 *
 * The cache key is based on the optional testUserId used only
 * by the development fallback. Authenticated production requests
 * use an empty key and rely on the server session.
 */

let dashboardDataPromise: Promise<DashboardData> | null = null;

let dashboardDataCache:
  | {
      testUserId: string;
      data: DashboardData;
      expiresAt: number;
    }
  | null = null;

let gmailStatusPromise:
  | Promise<GmailConnectionStatus>
  | null = null;

let gmailStatusCache:
  | {
      testUserId: string;
      data: GmailConnectionStatus;
      expiresAt: number;
    }
  | null = null;

function buildQuery(testUserId?: string) {
  return testUserId
    ? `?testUserId=${encodeURIComponent(
        testUserId
      )}`
    : "";
}

export async function getDashboardData(
  testUserId?: string
): Promise<DashboardData> {
  const cacheKey = testUserId ?? "";
  const now = Date.now();

  if (
    dashboardDataCache &&
    dashboardDataCache.testUserId ===
      cacheKey &&
    dashboardDataCache.expiresAt > now
  ) {
    return dashboardDataCache.data;
  }

  if (dashboardDataPromise) {
    return dashboardDataPromise;
  }

  dashboardDataPromise =
    (async () => {
      try {
        const response =
          await fetch(
            `/api/dashboard${buildQuery(
              testUserId
            )}`,
            {
              cache: "no-store",
            }
          );

        const contentType =
          response.headers.get(
            "content-type"
          ) ?? "";

        if (
          !contentType.includes(
            "application/json"
          )
        ) {
          const text =
            await response.text();

          throw new Error(
            `Dashboard API returned ${response.status} ${response.statusText}. Response starts with: ${text.slice(
              0,
              120
            )}`
          );
        }

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to load dashboard"
          );
        }

        const result =
          data as DashboardData;

        dashboardDataCache = {
          testUserId: cacheKey,
          data: result,
          expiresAt:
            Date.now() + 5_000,
        };

        return result;
      } finally {
        dashboardDataPromise = null;
      }
    })();

  return dashboardDataPromise;
}

export async function sendCommand(
  testUserId: string | undefined,
  text: string
): Promise<{ reply: string }> {
  const response = await fetch(
    "/api/command",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        ...(testUserId
          ? { testUserId }
          : {}),
        text,
      }),
    }
  );

  const contentType =
    response.headers.get(
      "content-type"
    ) ?? "";

  if (
    !contentType.includes(
      "application/json"
    )
  ) {
    const responseText =
      await response.text();

    throw new Error(
      `Command API returned ${response.status} ${response.statusText}. Response starts with: ${responseText.slice(
        0,
        120
      )}`
    );
  }

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ||
        "Command failed"
    );
  }

  dashboardDataCache = null;

  return data;
}

export async function saveReceiptExpense(
  input: SaveReceiptExpenseInput
) {
  const response = await fetch(
    "/api/expenses/from-receipt",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(input),
    }
  );

  const contentType =
    response.headers.get(
      "content-type"
    ) ?? "";

  if (
    !contentType.includes(
      "application/json"
    )
  ) {
    const responseText =
      await response.text();

    throw new Error(
      `Receipt API returned ${response.status} ${response.statusText}. Response starts with: ${responseText.slice(
        0,
        120
      )}`
    );
  }

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ||
        "Failed to save receipt expense."
    );
  }

  dashboardDataCache = null;

  return data;
}

export async function updateProfile(
  testUserId: string | undefined,
  displayName: string
): Promise<{
  success: boolean;
  user: {
    id: string;
    displayName: string | null;
  };
}> {
  const response = await fetch(
    "/api/profile",
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        ...(testUserId
          ? { testUserId }
          : {}),
        displayName,
      }),
    }
  );

  const contentType =
    response.headers.get(
      "content-type"
    ) ?? "";

  if (
    !contentType.includes(
      "application/json"
    )
  ) {
    const responseText =
      await response.text();

    throw new Error(
      `Profile API returned ${response.status} ${response.statusText}. Response starts with: ${responseText.slice(
        0,
        120
      )}`
    );
  }

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ||
        "Failed to update profile."
    );
  }

  dashboardDataCache = null;

  return data;
}

export async function getNotificationPreferences(
  testUserId?: string
): Promise<NotificationPreferences> {
  const response = await fetch(
    `/api/settings/notifications${buildQuery(
      testUserId
    )}`,
    {
      cache: "no-store",
    }
  );

  const contentType =
    response.headers.get(
      "content-type"
    ) ?? "";

  if (
    !contentType.includes(
      "application/json"
    )
  ) {
    const text =
      await response.text();

    throw new Error(
      `Notification API returned ${response.status} ${response.statusText}, not JSON. Response starts with: ${text.slice(
        0,
        120
      )}`
    );
  }

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ||
        "Failed to load notification settings."
    );
  }

  return data.preferences as NotificationPreferences;
}

export async function updateNotificationPreferences(
  testUserId: string | undefined,
  preferences: NotificationPreferences
): Promise<NotificationPreferences> {
  const response = await fetch(
    "/api/settings/notifications",
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        ...(testUserId
          ? { testUserId }
          : {}),
        ...preferences,
      }),
    }
  );

  const contentType =
    response.headers.get(
      "content-type"
    ) ?? "";

  if (
    !contentType.includes(
      "application/json"
    )
  ) {
    const text =
      await response.text();

    throw new Error(
      `Notification API returned ${response.status} ${response.statusText}, not JSON. Response starts with: ${text.slice(
        0,
        120
      )}`
    );
  }

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ||
        "Failed to save notification settings."
    );
  }

  return data.preferences as NotificationPreferences;
}

export async function getGmailConnectionStatus(
  testUserId?: string
): Promise<GmailConnectionStatus> {
  const cacheKey = testUserId ?? "";
  const now = Date.now();

  if (
    gmailStatusCache &&
    gmailStatusCache.testUserId ===
      cacheKey &&
    gmailStatusCache.expiresAt > now
  ) {
    return gmailStatusCache.data;
  }

  if (gmailStatusPromise) {
    return gmailStatusPromise;
  }

  gmailStatusPromise =
    (async () => {
      try {
        const response =
          await fetch(
            `/api/settings/connections/gmail${buildQuery(
              testUserId
            )}`,
            {
              cache: "no-store",
            }
          );

        const contentType =
          response.headers.get(
            "content-type"
          ) ?? "";

        if (
          !contentType.includes(
            "application/json"
          )
        ) {
          const text =
            await response.text();

          throw new Error(
            `Gmail status API returned ${response.status} ${response.statusText}. Response starts with: ${text.slice(
              0,
              120
            )}`
          );
        }

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to check Gmail connection."
          );
        }

        const result =
          data as GmailConnectionStatus;

        gmailStatusCache = {
          testUserId: cacheKey,
          data: result,
          expiresAt:
            Date.now() + 10_000,
        };

        return result;
      } finally {
        gmailStatusPromise = null;
      }
    })();

  return gmailStatusPromise;
}