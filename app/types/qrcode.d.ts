declare module "qrcode" {
  export function toString(
    text: string,
    options?: {
      type?: "svg" | "terminal" | "utf8";
      width?: number;
      margin?: number;
      color?: { dark?: string; light?: string };
    },
  ): Promise<string>;
  export function toDataURL(
    text: string,
    options?: { width?: number; margin?: number; color?: { dark?: string; light?: string } },
  ): Promise<string>;
}
