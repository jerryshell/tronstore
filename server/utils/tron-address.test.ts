import { describe, it, expect } from "vitest";
import { publicKeyToTronAddress } from "./tron-address";

describe("publicKeyToTronAddress", () => {
  it("should derive correct address from user 1 ecdsaPubKey", () => {
    const ecdsaPubKey =
      "NAqdyUt9nDsCNlNFb++nKxNfcbm+WivCS3h2neGl8U77AcUMbTNizwjdiV85KrvnbuY7RYEjsCwAxUbY8f5XCw==";
    const expectedAddress = "TAq8iZkpeCddzckwWA3FU6ZU1eH9YTTn9r";
    expect(publicKeyToTronAddress(ecdsaPubKey)).toBe(expectedAddress);
  });

  it("should derive correct address from user 2 ecdsaPubKey", () => {
    const ecdsaPubKey =
      "SS5Zvk1NMUcUlffaxX9K8ElIH1B4EqQt9qTv1PoGMnYha47YDCo+LDBb3oTGlMHgrmrjBkJXtJeGygx6WRfLZA==";
    const expectedAddress = "TLBqSe6jZySm5reFE1ZPQdVojuM6vXK4pM";
    expect(publicKeyToTronAddress(ecdsaPubKey)).toBe(expectedAddress);
  });

  it("should handle 65-byte uncompressed public key with 0x04 prefix", () => {
    // 65 bytes: 04 prefix + 64 bytes of x+y coordinates
    const prefix = Buffer.from([0x04]);
    const pubKeyBody = Buffer.from(
      "NAqdyUt9nDsCNlNFb++nKxNfcbm+WivCS3h2neGl8U77AcUMbTNizwjdiV85KrvnbuY7RYEjsCwAxUbY8f5XCw==",
      "base64",
    );
    const fullPubKey = Buffer.concat([prefix, pubKeyBody]);
    const base64 = fullPubKey.toString("base64");

    const expectedAddress = "TAq8iZkpeCddzckwWA3FU6ZU1eH9YTTn9r";
    expect(publicKeyToTronAddress(base64)).toBe(expectedAddress);
  });

  it("should return a valid Tron address starting with T", () => {
    const ecdsaPubKey =
      "NAqdyUt9nDsCNlNFb++nKxNfcbm+WivCS3h2neGl8U77AcUMbTNizwjdiV85KrvnbuY7RYEjsCwAxUbY8f5XCw==";
    const address = publicKeyToTronAddress(ecdsaPubKey);
    expect(address).toMatch(/^T/);
    expect(address.length).toBe(34);
  });
});
