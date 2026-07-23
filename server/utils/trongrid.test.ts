import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildTronGridHeaders, fetchTronGridTransactions } from "./trongrid";

// Mock dependencies
vi.mock("./runtime-config", () => ({
  serverConfig: {
    tronNetwork: "nile",
    trongridApiKey: "test-api-key",
  },
}));

vi.mock("./logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock $fetch globally
const mockFetch = vi.fn();
(globalThis as any).$fetch = mockFetch;

describe("buildTronGridHeaders", () => {
  it("should return headers with API key when provided", () => {
    const headers = buildTronGridHeaders("my-api-key");
    expect(headers).toEqual({ "TRON-PRO-API-KEY": "my-api-key" });
  });

  it("should return empty headers when API key is empty", () => {
    const headers = buildTronGridHeaders("");
    expect(headers).toEqual({});
  });
});

describe("fetchTronGridTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch transactions successfully", async () => {
    const mockResponse = {
      data: [
        {
          transaction_id: "tx123",
          from: "TFrom123",
          to: "TTo456",
          value: "1000000",
          token_info: { token_name: "USDT", token_symbol: "USDT" },
          block_timestamp: 1234567890,
          type: "Transfer",
        },
      ],
      meta: { fingerprint: "fp123" },
    };

    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await fetchTronGridTransactions("TTestAddress", 20);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/accounts/TTestAddress/transactions/trc20"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "TRON-PRO-API-KEY": "test-api-key",
        }),
      }),
    );

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]).toEqual({
      txId: "tx123",
      from: "TFrom123",
      to: "TTo456",
      value: "1000000",
      tokenName: "USDT",
      tokenSymbol: "USDT",
      blockTimestamp: 1234567890,
      type: "Transfer",
    });
    expect(result.fingerprint).toBe("fp123");
  });

  it("should include fingerprint in URL when provided", async () => {
    mockFetch.mockResolvedValueOnce({ data: [], meta: {} });

    await fetchTronGridTransactions("TTestAddress", 20, "existing-fp");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("fingerprint=existing-fp"),
      expect.any(Object),
    );
  });

  it("should not include fingerprint in URL when not provided", async () => {
    mockFetch.mockResolvedValueOnce({ data: [], meta: {} });

    await fetchTronGridTransactions("TTestAddress", 20);

    const calledUrl = mockFetch.mock.calls[0]?.[0];
    expect(calledUrl).not.toContain("fingerprint=");
  });

  it("should handle missing token_info gracefully", async () => {
    const mockResponse = {
      data: [
        {
          transaction_id: "tx456",
          from: "TFrom",
          to: "TTo",
          value: "2000000",
          block_timestamp: 1234567890,
          type: "Transfer",
        },
      ],
      meta: {},
    };

    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await fetchTronGridTransactions("TTestAddress", 20);

    expect(result.transactions[0].tokenName).toBe("USDT");
    expect(result.transactions[0].tokenSymbol).toBe("USDT");
  });

  it("should return null fingerprint when not in response", async () => {
    mockFetch.mockResolvedValueOnce({ data: [], meta: {} });

    const result = await fetchTronGridTransactions("TTestAddress", 20);

    expect(result.fingerprint).toBeNull();
  });

  it("should throw error when fetch fails", async () => {
    const error = new Error("Network error");
    mockFetch.mockRejectedValueOnce(error);

    await expect(fetchTronGridTransactions("TTestAddress", 20)).rejects.toThrow("Network error");
  });

  it("should handle empty data array", async () => {
    mockFetch.mockResolvedValueOnce({ data: null, meta: {} });

    const result = await fetchTronGridTransactions("TTestAddress", 20);

    expect(result.transactions).toEqual([]);
  });

  it("should handle multiple transactions", async () => {
    const mockResponse = {
      data: [
        {
          transaction_id: "tx1",
          from: "TFrom1",
          to: "TTo1",
          value: "1000000",
          token_info: { token_name: "USDT", token_symbol: "USDT" },
          block_timestamp: 1000000,
          type: "Transfer",
        },
        {
          transaction_id: "tx2",
          from: "TFrom2",
          to: "TTo2",
          value: "2000000",
          token_info: { token_name: "USDT", token_symbol: "USDT" },
          block_timestamp: 2000000,
          type: "Transfer",
        },
      ],
      meta: { fingerprint: "fp456" },
    };

    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await fetchTronGridTransactions("TTestAddress", 50);

    expect(result.transactions).toHaveLength(2);
    expect(result.fingerprint).toBe("fp456");
  });

  it("should use correct limit in URL", async () => {
    mockFetch.mockResolvedValueOnce({ data: [], meta: {} });

    await fetchTronGridTransactions("TTestAddress", 50);

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("limit=50"), expect.any(Object));
  });

  it("should use correct order_by in URL", async () => {
    mockFetch.mockResolvedValueOnce({ data: [], meta: {} });

    await fetchTronGridTransactions("TTestAddress", 20);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("order_by=block_timestamp,desc"),
      expect.any(Object),
    );
  });
});
