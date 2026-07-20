try {
  process.loadEnvFile?.();
} catch {}

export const serverConfig = {
  tronechoNatsUrl: process.env.TRONECHO_NATS_URL || "nats://127.0.0.1:4222",
  tronechoPrefix: process.env.TRONECHO_PREFIX || "tronecho",
  mpcNatsUrl: process.env.MPC_NATS_URL || "nats://127.0.0.1:4222",
  mpcKeyPath: process.env.MPC_KEY_PATH || "./event_initiator.key",
  tronNetwork: (process.env.TRON_NETWORK || "nile") as "nile" | "mainnet",
  trongridApiKey: process.env.TRONGRID_API_KEY || "",
  gasPoolPrivateKey: process.env.GAS_POOL_PRIVATE_KEY || "",
};
