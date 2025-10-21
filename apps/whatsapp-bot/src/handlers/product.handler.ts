import { api } from "../services/whatsapp.service";

export async function handleProduct(ctx: any, text: string) {
  const products = await api.getAllProducts();
  const index = parseInt(text) - 1;
  const product = products[index];

  if (!product) {
    return "Número de producto inválido. Intenta nuevamente o escribe 'menu' para volver.";
  }

  ctx.selectedProduct = product;
  ctx.step = "quantity_selection";

  const caption = `Has seleccionado *${product.name}* 💰 S/.${product.price}\n\nIndica la cantidad que deseas agregar:`;

  // Si el producto tiene imagen (URL), devolvemos un objeto tipo media para que el router lo envíe
  if (product.imageUrl) {
    return { type: "media", mediaUrl: product.imageUrl, caption };
  }

  return caption;
}