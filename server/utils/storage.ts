import type {
  User,
  Deposit,
  LedgerEntry,
  Product,
  Order,
  SweepTask,
  SystemSettings,
  SweepSettings,
  SessionData,
} from "../../shared/types";

// === Pagination Helpers ===

interface PaginatedResult<T> {
  items: T[];
  cursor: string | null;
}

/**
 * Generic pagination over pre-sorted keys. Handles both ID-based
 * and storage-key-based cursors.
 */
async function paginate<T>(
  keys: string[],
  fetcher: (key: string) => Promise<T | null>,
  limit: number,
  cursor?: string,
  cursorToKey?: (cursor: string) => string,
): Promise<PaginatedResult<T>> {
  const sorted = [...keys].sort().reverse();
  let startIdx = 0;
  if (cursor) {
    const key = cursorToKey ? cursorToKey(cursor) : cursor;
    const pos = sorted.indexOf(key);
    if (pos >= 0) startIdx = pos + 1;
  }
  const pageKeys = sorted.slice(startIdx, startIdx + limit);
  const items: T[] = [];
  for (const key of pageKeys) {
    const item = await fetcher(key);
    if (item) items.push(item);
  }
  return {
    items,
    cursor: sorted.length > startIdx + limit ? (pageKeys[pageKeys.length - 1] ?? null) : null,
  };
}

function us(_id: string) {
  return useStorage("users");
}
function ds(_id: string) {
  return useStorage("deposits");
}
function ls(_id: string) {
  return useStorage("ledger");
}
function ps(_id: string) {
  return useStorage("products");
}
function os(_id: string) {
  return useStorage("orders");
}
function ss(_id: string) {
  return useStorage("sweeps");
}
function sts(_id: string) {
  return useStorage("settings");
}
function ses(_id: string) {
  return useStorage("sessions");
}

// === Users ===

export async function getUser(id: string): Promise<User | null> {
  return (await us("users").getItem(`user:${id}`)) as User | null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const id = (await us("users").getItem(`user:email:${email}`)) as string | null;
  if (!id) return null;
  return getUser(id);
}

export async function getUserByAddress(address: string): Promise<User | null> {
  const id = (await us("users").getItem(`user:addr:${address}`)) as string | null;
  if (!id) return null;
  return getUser(id);
}

export async function createUser(user: User): Promise<void> {
  await us("users").setItem(`user:${user.id}`, user);
  await us("users").setItem(`user:email:${user.email}`, user.id);
}

export async function updateUser(user: User): Promise<void> {
  await us("users").setItem(`user:${user.id}`, user);
}

export async function updateUserAddress(userId: string, address: string): Promise<void> {
  const user = await getUser(userId);
  if (!user) throw new Error("User not found");
  user.depositAddress = address;
  user.updatedAt = Date.now();
  await us("users").setItem(`user:${user.id}`, user);
  await us("users").setItem(`user:addr:${address}`, user.id);
}

export async function updateUserBalance(userId: string, delta: number): Promise<User> {
  const user = await getUser(userId);
  if (!user) throw new Error("User not found");
  user.balance += delta;
  user.updatedAt = Date.now();
  await us("users").setItem(`user:${user.id}`, user);
  return user;
}

export async function listUsers(): Promise<User[]> {
  const keys = await us("users").getKeys("user:");
  const result: User[] = [];
  for (const key of keys) {
    if (key.startsWith("user:email:") || key.startsWith("user:addr:")) continue;
    const user = (await us("users").getItem(key)) as User | null;
    if (user) result.push(user);
  }
  result.sort((a, b) => b.createdAt - a.createdAt); // newest first
  return result;
}

export async function countUsers(): Promise<number> {
  const keys = await us("users").getKeys("user:");
  return keys.filter((k) => !k.includes(":email:") && !k.includes(":addr:")).length;
}

// === Deposits ===

export async function countDeposits(): Promise<number> {
  const keys = await ds("deposits").getKeys("deposit:");
  return keys.filter((k) => !k.includes(":event:") && !k.includes(":user:")).length;
}

export async function getDeposit(id: string): Promise<Deposit | null> {
  return (await ds("deposits").getItem(`deposit:${id}`)) as Deposit | null;
}

export async function getDepositByEventId(eventId: string): Promise<Deposit | null> {
  const id = (await ds("deposits").getItem(`deposit:event:${eventId}`)) as string | null;
  if (!id) return null;
  return getDeposit(id);
}

export async function createDeposit(deposit: Deposit): Promise<void> {
  await ds("deposits").setItem(`deposit:${deposit.id}`, deposit);
  await ds("deposits").setItem(`deposit:event:${deposit.eventId}`, deposit.id);

  const key = `deposit:user:${deposit.userId}`;
  const existing = ((await ds("deposits").getItem(key)) as string[]) || [];
  existing.push(deposit.id);
  existing.sort();
  await ds("deposits").setItem(key, existing);
}

export async function listDepositsByUser(
  userId: string,
  limit = 50,
  cursor?: string,
): Promise<PaginatedResult<Deposit>> {
  const ids = ((await ds("deposits").getItem(`deposit:user:${userId}`)) as string[]) || [];
  return paginate(ids, getDeposit, limit, cursor);
}

export async function listAllDeposits(
  limit = 50,
  cursor?: string,
): Promise<PaginatedResult<Deposit>> {
  const keys = await ds("deposits").getKeys("deposit:");
  const depositIds = keys
    .filter((k) => !k.includes(":event:") && !k.includes(":user:"))
    .map((k) => k.replace("deposit:", ""));
  return paginate(depositIds, getDeposit, limit, cursor);
}

// === Ledger ===

export async function getLedgerEntry(id: string): Promise<LedgerEntry | null> {
  return (await ls("ledger").getItem(`entry:${id}`)) as LedgerEntry | null;
}

export async function createLedgerEntry(entry: LedgerEntry): Promise<void> {
  await ls("ledger").setItem(`entry:${entry.id}`, entry);

  const key = `entry:user:${entry.userId}`;
  const existing = ((await ls("ledger").getItem(key)) as string[]) || [];
  existing.push(entry.id);
  existing.sort();
  await ls("ledger").setItem(key, existing);
}

export async function listLedgerByUser(
  userId: string,
  limit = 50,
  cursor?: string,
): Promise<PaginatedResult<LedgerEntry>> {
  const ids = ((await ls("ledger").getItem(`entry:user:${userId}`)) as string[]) || [];
  return paginate(ids, getLedgerEntry, limit, cursor);
}

// === Products ===

export async function getProduct(id: string): Promise<Product | null> {
  return (await ps("products").getItem(`product:${id}`)) as Product | null;
}

export async function createProduct(product: Product): Promise<void> {
  await ps("products").setItem(`product:${product.id}`, product);
}

export async function updateProduct(product: Product): Promise<void> {
  await ps("products").setItem(`product:${product.id}`, product);
}

export async function deleteProduct(id: string): Promise<void> {
  await ps("products").removeItem(`product:${id}`);
}

export async function listProducts(limit = 50, cursor?: string): Promise<PaginatedResult<Product>> {
  const keys = await ps("products").getKeys("product:");
  return paginate(
    keys,
    async (key) => (await ps("products").getItem(key)) as Product | null,
    limit,
    cursor,
    (id) => `product:${id}`,
  );
}

// === Orders ===

export async function countOrders(): Promise<number> {
  const keys = await os("orders").getKeys("order:");
  return keys.filter((k) => !k.includes(":user:")).length;
}

export async function getOrder(id: string): Promise<Order | null> {
  return (await os("orders").getItem(`order:${id}`)) as Order | null;
}

export async function createOrder(order: Order): Promise<void> {
  await os("orders").setItem(`order:${order.id}`, order);

  const key = `order:user:${order.userId}`;
  const existing = ((await os("orders").getItem(key)) as string[]) || [];
  existing.push(order.id);
  existing.sort();
  await os("orders").setItem(key, existing);
}

export async function listOrdersByUser(
  userId: string,
  limit = 50,
  cursor?: string,
): Promise<PaginatedResult<Order>> {
  const ids = ((await os("orders").getItem(`order:user:${userId}`)) as string[]) || [];
  return paginate(ids, getOrder, limit, cursor);
}

export async function listAllOrders(limit = 50, cursor?: string): Promise<PaginatedResult<Order>> {
  const keys = (await os("orders").getKeys("order:")).filter((k) => !k.includes(":user:"));
  return paginate(
    keys,
    async (key) => (await os("orders").getItem(key)) as Order | null,
    limit,
    cursor,
    (id) => `order:${id}`,
  );
}

// === Sweeps ===

export async function getSweepTask(id: string): Promise<SweepTask | null> {
  return (await ss("sweeps").getItem(`sweep:${id}`)) as SweepTask | null;
}

export async function createSweepTask(task: SweepTask): Promise<void> {
  await ss("sweeps").setItem(`sweep:${task.id}`, task);
}

export async function updateSweepTask(task: SweepTask): Promise<void> {
  await ss("sweeps").setItem(`sweep:${task.id}`, task);
}

export async function listSweepTasks(
  limit = 50,
  cursor?: string,
): Promise<PaginatedResult<SweepTask>> {
  const keys = await ss("sweeps").getKeys("sweep:");
  return paginate(
    keys,
    async (key) => (await ss("sweeps").getItem(key)) as SweepTask | null,
    limit,
    cursor,
    (id) => `sweep:${id}`,
  );
}

// === Settings ===

export async function getSystemSettings(): Promise<SystemSettings> {
  const s = (await sts("settings").getItem("system")) as SystemSettings | null;
  return s || { defaultFeeRateBps: 200 };
}

export async function setSystemSettings(settings: SystemSettings): Promise<void> {
  await sts("settings").setItem("system", settings);
}

/**
 * Effective fee rate for a user: per-user override or system default.
 */
export async function getEffectiveFeeRateBps(user: User): Promise<number> {
  if (user.feeRateBps != null) return user.feeRateBps;
  const settings = await getSystemSettings();
  return settings.defaultFeeRateBps;
}

export async function getSweepSettings(): Promise<SweepSettings> {
  const s = (await sts("settings").getItem("sweep")) as SweepSettings | null;
  return (
    s || {
      targetAddress: "",
      gasPoolPrivateKey: null,
      threshold: 100_000_000,
      gasTrxAmount: 10_000_000,
      intervalMinutes: 60,
      enabled: false,
      lastRunAt: null,
    }
  );
}

export async function setSweepSettings(settings: SweepSettings): Promise<void> {
  await sts("settings").setItem("sweep", settings);
}

// === Sessions ===

export async function getSessionData(tokenHash: string): Promise<SessionData | null> {
  return (await ses("sessions").getItem(`session:${tokenHash}`)) as SessionData | null;
}

export async function setSession(tokenHash: string, data: SessionData): Promise<void> {
  await ses("sessions").setItem(`session:${tokenHash}`, data);
}

export async function deleteSession(tokenHash: string): Promise<void> {
  await ses("sessions").removeItem(`session:${tokenHash}`);
}

export async function deleteUserSessions(userId: string): Promise<void> {
  const keys = await ses("sessions").getKeys("session:");
  for (const key of keys) {
    const s = (await ses("sessions").getItem(key)) as SessionData | null;
    if (s && s.userId === userId) {
      await ses("sessions").removeItem(key);
    }
  }
}

export async function cleanupExpiredSessions(): Promise<void> {
  const now = Date.now();
  const keys = await ses("sessions").getKeys("session:");
  for (const key of keys) {
    const s = (await ses("sessions").getItem(key)) as SessionData | null;
    if (s && s.expiresAt < now) {
      await ses("sessions").removeItem(key);
    }
  }
}

// === USDT helpers ===

export function isUsdtAsset(asset: string, network: "nile" | "mainnet"): boolean {
  const usdtContracts = {
    nile: "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf",
    mainnet: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  };
  return asset === `tron:trc20/${usdtContracts[network]}`;
}
