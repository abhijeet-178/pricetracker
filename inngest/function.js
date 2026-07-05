import { inngest } from "./client";
import { createClient } from "@supabase/supabase-js";
import { scrapeProduct } from "@/lib/firecrawl";
import { sendPriceDropAlert } from "@/lib/email";

export const checkPrices = inngest.createFunction(
  {
    id: "check-prices",
    triggers: [
      {
        cron: "0 */6 * * *",
      },
    ],
  },

  async ({ step }) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: products, error } = await supabase
      .from("products")
      .select("*");

    if (error) {
      throw error;
    }

    const results = {
      total: products.length,
      updated: 0,
      failed: 0,
      priceChanges: 0,
      alertsSent: 0,
    };

    await step.run("check-all-products", async () => {
      for (const product of products) {
        try {
          const scraped = await scrapeProduct(product.url);

          if (!scraped.currentPrice) {
            console.log(`Price not found for ${product.url}`);
            results.failed++;
            continue;
          }

          const oldPrice = Number(product.current_price);
          const newPrice = Number(scraped.currentPrice);

          await supabase
            .from("products")
            .update({
              current_price: newPrice,
              currency: scraped.currencyCode,
              name: scraped.productName,
              image_url: scraped.productImageUrl,
              updated_at: new Date().toISOString(),
            })
            .eq("id", product.id);

          results.updated++;

          if (oldPrice !== newPrice) {
            results.priceChanges++;

            await supabase
              .from("price_history")
              .insert({
                product_id: product.id,
                price: newPrice,
                currency: scraped.currencyCode,
              });

            console.log(
              `${product.name}: ${oldPrice} -> ${newPrice}`
            );

            if (newPrice < oldPrice) {
              const {
                data: { user },
              } = await supabase.auth.admin.getUserById(product.user_id);

              if (user?.email) {
                const emailResult =
                  await sendPriceDropAlert(
                    user.email,
                    {
                      ...product,
                      name: scraped.productName,
                      current_price: newPrice,
                      currency: scraped.currencyCode,
                      image_url: scraped.productImageUrl,
                    },
                    oldPrice,
                    newPrice
                  );

                if (emailResult.success) {
                  console.log(`✅ Email sent to ${user.email}`);
                  results.alertsSent++;
                } else {
                  console.error(emailResult.error);
                }
              }
            }
          }
        } catch (err) {
          console.error(
            `Error checking ${product.url}`,
            err.message
          );
          results.failed++;
        }
      }

      return results;
    });

    console.log(results);

    return results;
  }
);