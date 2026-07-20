// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxt/ui", "@vueuse/nuxt"],

  devtools: {
    enabled: true,
  },

  css: ["~/assets/css/main.css"],

  compatibilityDate: "2026-06-30",

  ui: {
    fonts: false,
  },

  runtimeConfig: {
    public: {
      tronNetwork: process.env.TRON_NETWORK || "nile",
    },
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        paths: {
          "@fystack/mpcium-ts": ["../node_modules/@fystack/mpcium-ts/dist/types/index.d.ts"],
        },
      },
    },
  },

  nitro: {
    storage: {
      users: { driver: "fs", base: "./data/users" },
      deposits: { driver: "fs", base: "./data/deposits" },
      ledger: { driver: "fs", base: "./data/ledger" },
      products: { driver: "fs", base: "./data/products" },
      orders: { driver: "fs", base: "./data/orders" },
      sweeps: { driver: "fs", base: "./data/sweeps" },
      settings: { driver: "fs", base: "./data/settings" },
      sessions: { driver: "fs", base: "./data/sessions" },
    },
    typescript: {
      tsConfig: {
        compilerOptions: {
          paths: {
            "@fystack/mpcium-ts": ["../node_modules/@fystack/mpcium-ts/dist/types/index.d.ts"],
          },
        },
      },
    },
  },
});
