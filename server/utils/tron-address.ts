import { TronWeb } from "tronweb";
import { keccak256 } from "ethers";
import { logger } from "./logger";

export function publicKeyToTronAddress(ecdsaPubKeyBase64: string): string {
  let pubKeyRaw = Buffer.from(ecdsaPubKeyBase64, "base64");

  logger.info("推导Tron地址", {
    inputLen: ecdsaPubKeyBase64.length,
    rawBytes: pubKeyRaw.length,
    firstByte: "0x" + (pubKeyRaw[0]?.toString(16) ?? "??"),
  });

  // 处理不同格式的公钥
  // 65 bytes 以 04 开头 -> 非压缩格式，去掉前缀
  // 33 bytes 以 02/03 开头 -> 压缩格式，需要解压
  // 64 bytes -> 无前缀的非压缩格式，直接使用
  if (pubKeyRaw.length === 65 && pubKeyRaw[0] === 0x04) {
    pubKeyRaw = pubKeyRaw.slice(1);
  }

  // 使用 ethers 的 keccak256
  // TronWeb.sha3 会将输入当作 UTF-8 字符串处理，导致对 hex 字符串的哈希结果错误
  // ethers.keccak256 正确处理 Buffer/Uint8Array 输入
  const hashHex = keccak256(pubKeyRaw);
  const addressHex = "41" + hashHex.substring(hashHex.length - 40);
  const address = TronWeb.address.fromHex(addressHex);

  logger.info("Tron地址推导完成", { address });
  return address;
}
