import { createClient } from "@/utils/supabase/server";
import { scrapeProduct } from "./firecrawl";
import { sendPriceDropAlert } from "./email";

export async function checkPrices() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      profiles (
        email
      )
    `);

  for (const product of products) {
    try {
      const latest = await scrapeProduct(product.url);

      if (!latest.currentPrice) continue;

      const oldPrice = Number(product.current_price);
      const newPrice = Number(latest.currentPrice);

      if (newPrice < oldPrice) {
        await sendPriceDropAlert(
          product.profiles.email,
          product,
          oldPrice,
          newPrice
        );
      }

      await supabase
        .from("products")
        .update({
          current_price: newPrice,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id);

      await supabase.from("price_history").insert({
        product_id: product.id,
        price: newPrice,
        currency: product.currency,
      });
    } catch (err) {
      console.error(`Failed to update ${product.name}`, err);
    }
  }
}