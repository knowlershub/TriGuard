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

export type TelegramConnectionStatus = {
  connected: boolean;
  telegramId?: string | null;
};

export type TelegramLinkResponse = {
  connected: boolean;
  code?: string;
  expiresAt?: string;
  url: string | null;
};

type DashboardCache = {
  data: DashboardData;
  expiresAt: number;
};

type GmailStatusCache = {
  data: GmailConnectionStatus;
  expiresAt: number;
};

let dashboardDataPromise: Promise<DashboardData> | null = null;

let dashboardDataCache: DashboardCache | null = null;

let gmailStatusPromise: Promise<GmailConnectionStatus> | null = null;

let gmailStatusCache: GmailStatusCache | null = null;

function invalidateDashboardCache(): void {
  dashboardDataCache = null;
}

async function parseJsonResponse(
  response: Response,
  apiName: string
): Promise<unknown> {
  const contentType =
    response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();

    throw new Error(
      `${apiName} returned ${response.status} ${response.statusText}. Response starts with: ${text.slice(
        0,
        120
      )}`
    );
  }

  const data: unknown = await response.json();

  if (!response.ok) {
    const errorMessage =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : `${apiName} request failed.`;

    throw new Error(errorMessage);
  }

  return data;
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = Date.now();

  if (
    dashboardDataCache &&
    dashboardDataCache.expiresAt > now
  ) {
    return dashboardDataCache.data;
  }

  if (dashboardDataPromise) {
    return dashboardDataPromise;
  }

  dashboardDataPromise = (async () => {
    try {
      const response = await fetch("/api/dashboard", {
        cache: "no-store",
      });

      const data = await parseJsonResponse(
        response,
        "Dashboard API"
      );

      if (!isRecord(data)) {
        throw new Error(
          "Dashboard API returned an invalid response."
        );
      }

      const result = data as unknown as DashboardData;

      dashboardDataCache = {
        data: result,
        expiresAt: Date.now() + 5_000,
      };

      return result;
    } finally {
      dashboardDataPromise = null;
    }
  })();

  return dashboardDataPromise;
}

export async function sendCommand(
  text: string
): Promise<{ reply: string }> {
  const response = await fetch("/api/command", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
    }),
  });

  const data = await parseJsonResponse(
    response,
    "Command API"
  );

  if (
    !isRecord(data) ||
    typeof data.reply !== "string"
  ) {
    throw new Error(
      "Command API returned an invalid response."
    );
  }

  invalidateDashboardCache();

  return {
    reply: data.reply,
  };
}

export async function saveReceiptExpense(
  input: SaveReceiptExpenseInput
): Promise<unknown> {
  const response = await fetch(
    "/api/expenses/from-receipt",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }
  );

  const data = await parseJsonResponse(
    response,
    "Receipt API"
  );

  invalidateDashboardCache();

  return data;
}

export async function updateProfile(
  displayName: string
): Promise<{
  success: boolean;
  user: {
    id: string;
    displayName: string | null;
  };
}> {
  const response = await fetch("/api/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      displayName,
    }),
  });

  const data = await parseJsonResponse(
    response,
    "Profile API"
  );

  if (
    !isRecord(data) ||
    typeof data.success !== "boolean" ||
    !isRecord(data.user) ||
    typeof data.user.id !== "string" ||
    !(
      typeof data.user.displayName === "string" ||
      data.user.displayName === null
    )
  ) {
    throw new Error(
      "Profile API returned an invalid response."
    );
  }

  invalidateDashboardCache();

  return {
    success: data.success,
    user: {
      id: data.user.id,
      displayName: data.user.displayName,
    },
  };
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const response = await fetch(
    "/api/settings/notifications",
    {
      cache: "no-store",
    }
  );

  const data = await parseJsonResponse(
    response,
    "Notification API"
  );

  if (
    !isRecord(data) ||
    !isRecord(data.preferences)
  ) {
    throw new Error(
      "Notification API returned an invalid response."
    );
  }

  return data.preferences as unknown as NotificationPreferences;
}

export async function updateNotificationPreferences(
  preferences: NotificationPreferences
): Promise<NotificationPreferences> {
  const response = await fetch(
    "/api/settings/notifications",
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferences),
    }
  );

  const data = await parseJsonResponse(
    response,
    "Notification API"
  );

  if (
    !isRecord(data) ||
    !isRecord(data.preferences)
  ) {
    throw new Error(
      "Notification API returned an invalid response."
    );
  }

  return data.preferences as unknown as NotificationPreferences;
}

export async function getGmailConnectionStatus(): Promise<GmailConnectionStatus> {
  const now = Date.now();

  if (
    gmailStatusCache &&
    gmailStatusCache.expiresAt > now
  ) {
    return gmailStatusCache.data;
  }

  if (gmailStatusPromise) {
    return gmailStatusPromise;
  }

  gmailStatusPromise = (async () => {
    try {
      const response = await fetch(
        "/api/settings/connections/gmail",
        {
          cache: "no-store",
        }
      );

      const data = await parseJsonResponse(
        response,
        "Gmail status API"
      );

      if (!isRecord(data)) {
        throw new Error(
          "Gmail status API returned an invalid response."
        );
      }

      const result =
        data as unknown as GmailConnectionStatus;

      gmailStatusCache = {
        data: result,
        expiresAt: Date.now() + 10_000,
      };

      return result;
    } finally {
      gmailStatusPromise = null;
    }
  })();

  return gmailStatusPromise;
}

export async function createTelegramLink(): Promise<TelegramLinkResponse> {
  const response = await fetch(
    "/api/settings/connections/telegram",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      cache: "no-store",
    }
  );

  const data = await parseJsonResponse(
    response,
    "Telegram link API"
  );

  if (!isRecord(data)) {
    throw new Error(
      "Telegram link API returned an invalid response."
    );
  }

  return data as unknown as TelegramLinkResponse;
}

export async function getTelegramConnectionStatus(): Promise<TelegramConnectionStatus> {
  const response = await fetch(
    "/api/settings/connections/telegram",
    {
      cache: "no-store",
    }
  );

  const data = await parseJsonResponse(
    response,
    "Telegram status API"
  );

  if (!isRecord(data)) {
    throw new Error(
      "Telegram status API returned an invalid response."
    );
  }

  return data as unknown as TelegramConnectionStatus;
}