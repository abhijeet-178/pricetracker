import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scrapeProduct } from "@/lib/firecrawl";
import { sendPriceDropAlert } from "@/lib/email";

export async function POST(request) {
  try {
    // ----------------------------
    // Verify Cron Secret
    // ----------------------------
    const authHeader = request.headers.get("authorization");

    if (
      !process.env.CRON_SECRET ||
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ----------------------------
    // Supabase Service Client
    // ----------------------------

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // ----------------------------
    // Get Products
    // ----------------------------

    const { data: products, error } = await supabase
      .from("products")
      .select("*");

    if (error) throw error;

    const results = {
      total: products.length,
      updated: 0,
      failed: 0,
      priceChanges: 0,
      alertsSent: 0,
    };

    // ----------------------------
    // Check Each Product
    // ----------------------------

    for (const product of products) {
      try {
        const scraped = await scrapeProduct(product.url);

        if (
          scraped.currentPrice === null ||
          scraped.currentPrice === undefined
        ) {
          console.log("Price not found:", product.url);
          results.failed++;
          continue;
        }

        const oldPrice = Number(product.current_price);
        const newPrice = Number(scraped.currentPrice);

        // ----------------------------
        // Update Product
        // ----------------------------

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

        // ----------------------------
        // Price Changed?
        // ----------------------------

        if (oldPrice !== newPrice) {
          results.priceChanges++;

          await supabase.from("price_history").insert({
            product_id: product.id,
            price: newPrice,
            currency: scraped.currencyCode,
          });

          // ----------------------------
          // Price Dropped?
          // ----------------------------

          if (newPrice < oldPrice) {
            const {
              data: { user },
            } = await supabase.auth.admin.getUserById(product.user_id);

            if (user?.email) {
              const email = await sendPriceDropAlert(
                user.email,
                {
                  ...product,
                  current_price: newPrice,
                  currency: scraped.currencyCode,
                  image_url: scraped.productImageUrl,
                  name: scraped.productName,
                },
                oldPrice,
                newPrice
              );

              if (email.success) {
                results.alertsSent++;
                console.log(
                  `Price drop email sent to ${user.email}`
                );
              }
            }
          }
        }
      } catch (err) {
        console.error("Product Error:", err.message);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Cron route working",
  });
}