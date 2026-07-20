import { getProduct } from "../../utils/storage";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "缺少 id" });

  const product = await getProduct(id);
  if (!product || !product.enabled) {
    throw createError({ statusCode: 404, message: "商品不存在" });
  }

  return product;
});
