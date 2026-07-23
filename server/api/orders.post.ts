import { z } from "zod";
import { v7 } from "uuid";
import { requireUser, csrfCheck } from "../utils/auth";
import {
  getUser,
  getProduct,
  createOrder,
  createLedgerEntry,
  updateUserBalance,
} from "../utils/storage";
import { acquireUserLock } from "../utils/user-lock";
import { parseBody } from "../utils/admin-query";
import { logger } from "../utils/logger";

const orderSchema = z.object({
  productId: z.string(),
});

export default defineEventHandler(async (event) => {
  csrfCheck(event);

  const authUser = await requireUser(event);

  const { productId } = await parseBody(event, orderSchema);

  const release = await acquireUserLock(authUser.id);
  try {
    const user = await getUser(authUser.id);
    if (!user) throw createError({ statusCode: 404, message: "用户不存在" });

    const product = await getProduct(productId);
    if (!product || !product.enabled) {
      throw createError({ statusCode: 404, message: "商品不存在或已下架" });
    }

    if (user.balance < product.price) {
      throw createError({ statusCode: 400, message: "余额不足" });
    }

    const now = Date.now();
    const orderId = v7();

    // 创建订单
    await createOrder({
      id: orderId,
      userId: user.id,
      productId: product.id,
      productSnapshot: {
        name: product.name,
        description: product.description,
        price: product.price,
      },
      price: product.price,
      createdAt: now,
    });

    // 扣减余额
    const updatedUser = await updateUserBalance(user.id, -product.price);

    // 创建流水
    await createLedgerEntry({
      id: v7(),
      userId: user.id,
      type: "purchase",
      amount: -product.price,
      balanceAfter: updatedUser.balance,
      refId: orderId,
      createdAt: now,
    });

    logger.info("订单创建成功", {
      userId: user.id,
      orderId,
      productId: product.id,
      price: product.price,
      balanceAfter: updatedUser.balance,
    });

    return {
      id: orderId,
      productId: product.id,
      productSnapshot: {
        name: product.name,
        description: product.description,
        price: product.price,
      },
      price: product.price,
      createdAt: now,
    };
  } finally {
    release();
  }
});
