"use server";

import { scrapeProduct } from "@/lib/firecrawl";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
/* ==================================
   SIGN OUT
================================== */

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/");
  redirect("/");
}

/* ==================================
   ADD PRODUCT
================================== */

export async function addProduct(formData) {
  const url = formData.get("url");

  if (!url) {
    return {
      error: "Product URL is required.",
    };
  }

  const supabase = await createClient();

  try {
    // Current User
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        error: "Not authenticated.",
      };
    }

    // Try scraping (don't fail if scraping fails)
    let productData = null;

    try {
      productData = await scrapeProduct(url);
    } catch (err) {
      console.warn("Scraping failed:", err.message);
    }

    const name = productData?.productName || "Unknown Product";

    const currentPrice =
      typeof productData?.currentPrice === "number"
        ? Math.round(productData.currentPrice)
        : null;

    const currency = productData?.currencyCode || "USD";

    const imageUrl = productData?.productImageUrl || null;

    // Existing Product
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id,current_price")
      .eq("user_id", user.id)
      .eq("url", url)
      .maybeSingle();

    const isUpdate = !!existingProduct;

    // Save Product
    const { data: product, error } = await supabase
      .from("products")
      .upsert(
        {
          user_id: user.id,
          url,
          name,
          current_price: currentPrice,
          currency,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,url",
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Save Price History
    if (
      currentPrice !== null &&
      (!existingProduct ||
        existingProduct.current_price !== currentPrice)
    ) {
      await supabase.from("price_history").insert({
        product_id: product.id,
        price: currentPrice,
        currency,
      });
    }

    revalidatePath("/");

    return {
      success: true,
      message: isUpdate
        ? "Product updated successfully."
        : "Product added successfully.",
      product,
    };
  } catch (error) {
    console.error("Add Product Error:", error);

    return {
      error: error.message || "Failed to add product.",
    };
  }
}

/* ==================================
   DELETE PRODUCT
================================== */

export async function deleteProduct(productId) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) throw error;

    revalidatePath("/");

    return {
      success: true,
      message: "Product removed successfully.",
    };
  } catch (error) {
    console.error(error);

    return {
      error: error.message,
    };
  }
}

/* ==================================
   GET PRODUCTS
================================== */

export async function getProducts() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error(error);

    return [];
  }
}

/* ==================================
   GET PRICE HISTORY
================================== */

export async function getPriceHistory(productId) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("price_history")
      .select("*")
      .eq("product_id", productId)
      .order("checked_at", { ascending: true });

    console.log("Price History Result:", data);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Get Price History Error:", error);
    return [];
  }
}