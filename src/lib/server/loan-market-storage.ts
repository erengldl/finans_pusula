import "server-only";

import { Redis } from "@upstash/redis";

import { getSeedLoanMarketSnapshot, type LoanMarketSnapshot } from "@/lib/loan-market-data";

export type LoanMarketStorageMode = "memory" | "redis" | "seed_read_only";

export type LoanMarketStorageReadResult = {
  snapshot: LoanMarketSnapshot;
  warning?: string;
};

export type LoanMarketStorageSaveResult = {
  persisted: boolean;
  warning?: string;
};

export interface LoanMarketStorage {
  mode: LoanMarketStorageMode;
  getLatest(): Promise<LoanMarketStorageReadResult>;
  save(snapshot: LoanMarketSnapshot): Promise<LoanMarketStorageSaveResult>;
}

const storageKey = "loan-market:snapshot";

let redisClient: Redis | null = null;
let storageInstance: LoanMarketStorage | null = null;

function getSeedSnapshotWithWarning(warning: string) {
  const snapshot = getSeedLoanMarketSnapshot();

  return {
    ...snapshot,
    snapshotLabel: "Read-only seed snapshot",
    liveIntegrationStatus: `${snapshot.liveIntegrationStatus} ${warning}`,
    caveats: [...snapshot.caveats, warning],
  };
}

function hasRedisCredentials() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL ?? "",
      token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
    });
  }

  return redisClient;
}

function createMemoryStorage(): LoanMarketStorage {
  let snapshot = getSeedLoanMarketSnapshot();

  return {
    mode: "memory",
    async getLatest() {
      return {
        snapshot,
      };
    },
    async save(nextSnapshot) {
      snapshot = nextSnapshot;

      return {
        persisted: true,
      };
    },
  };
}

function createReadOnlySeedStorage(): LoanMarketStorage {
  const warning =
    "Production ortamında Upstash Redis bağlantısı yok; read-only seed snapshot kullanılıyor.";

  console.warn(`[loan-market] ${warning}`);

  return {
    mode: "seed_read_only",
    async getLatest() {
      return {
        snapshot: getSeedSnapshotWithWarning(warning),
        warning,
      };
    },
    async save() {
      return {
        persisted: false,
        warning,
      };
    },
  };
}

function createRedisStorage(): LoanMarketStorage {
  return {
    mode: "redis",
    async getLatest() {
      try {
        const rawValue = await getRedisClient().get<LoanMarketSnapshot | string>(storageKey);

        if (!rawValue) {
          return {
            snapshot: getSeedLoanMarketSnapshot(),
          };
        }

        const parsed =
          typeof rawValue === "string" ? (JSON.parse(rawValue) as LoanMarketSnapshot) : rawValue;

        return {
          snapshot: parsed,
        };
      } catch (error) {
        const warning =
          "Upstash Redis okunamadı; geçici olarak read-only seed snapshot kullanılıyor.";
        console.warn("[loan-market] Redis read failed, serving seed snapshot.", error);

        return {
          snapshot: getSeedSnapshotWithWarning(warning),
          warning,
        };
      }
    },
    async save(nextSnapshot) {
      try {
        await getRedisClient().set(storageKey, JSON.stringify(nextSnapshot));

        return {
          persisted: true,
        };
      } catch (error) {
        const warning =
          "Upstash Redis yazılamadı; snapshot bu istekte döndürülür fakat kalıcı olarak saklanmadı.";
        console.warn("[loan-market] Redis write failed, snapshot not persisted.", error);

        return {
          persisted: false,
          warning,
        };
      }
    },
  };
}

export function getLoanMarketStorage() {
  if (!storageInstance) {
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
      storageInstance = createMemoryStorage();
    } else if (hasRedisCredentials()) {
      storageInstance = createRedisStorage();
    } else {
      storageInstance = createReadOnlySeedStorage();
    }
  }

  return storageInstance;
}
