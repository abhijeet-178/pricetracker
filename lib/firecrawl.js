import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeProduct(url) {
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    timeout: 30000,
  });

  const $ = cheerio.load(data);

  /* -------------------------
      PRODUCT NAME
  ------------------------- */

  const productName =
    $("meta[property='og:title']").attr("content") ||
    $("meta[name='twitter:title']").attr("content") ||
    $("meta[name='title']").attr("content") ||
    $("meta[itemprop='name']").attr("content") ||
    $("h1").first().text() ||
    $("title").text();

  /* -------------------------
      IMAGE
  ------------------------- */

  let productImageUrl =
    $("meta[property='og:image']").attr("content") ||
    $("meta[name='twitter:image']").attr("content") ||
    $("meta[itemprop='image']").attr("content") ||
    $("img").first().attr("src") ||
    null;

  if (productImageUrl && productImageUrl.startsWith("//")) {
    productImageUrl = "https:" + productImageUrl;
  }

  /* -------------------------
      PRICE
  ------------------------- */

  const selectors = [
    "meta[property='product:price:amount']",
    "meta[itemprop='price']",

    ".a-price .a-offscreen", // Amazon
    ".a-price-whole",

    "._30jeq3", // Flipkart

    ".pdp-price", // Myntra

    ".price",
    ".product-price",
    ".sale-price",
    ".current-price",
    ".special-price",
    ".price-current",
    ".final-price",
    ".money",
    ".amount",

    "[itemprop='price']",
    "[class*=price]",
    "[id*=price]",
  ];

  let priceText = "";

  for (const selector of selectors) {
    if (selector.startsWith("meta")) {
      priceText = $(selector).attr("content") || "";
    } else {
      priceText = $(selector).first().text().trim();
    }

    if (priceText) break;
  }

  /* -------------------------
      PRICE PARSING
  ------------------------- */

  const match = String(priceText).match(/[\d,]+(?:\.\d{1,2})?/);

  const currentPrice = match
    ? parseFloat(match[0].replace(/,/g, ""))
    : null;

  /* -------------------------
      CURRENCY
  ------------------------- */

  let currencyCode =
    $("meta[property='product:price:currency']").attr("content") ||
    $("meta[itemprop='priceCurrency']").attr("content");

  if (!currencyCode) {
    if (priceText.includes("₹")) currencyCode = "INR";
    else if (priceText.includes("$")) currencyCode = "USD";
    else if (priceText.includes("€")) currencyCode = "EUR";
    else if (priceText.includes("£")) currencyCode = "GBP";
    else currencyCode = "USD";
  }

  /* -------------------------
      DEBUG
  ------------------------- */

  console.log("====================================");
  console.log("URL:", url);
  console.log("Title:", productName);
  console.log("Price Text:", priceText);
  console.log("Parsed Price:", currentPrice);
  console.log("Currency:", currencyCode);
  console.log("Image:", productImageUrl);
  console.log("====================================");

  return {
    productName: productName?.trim() || "Unknown Product",
    currentPrice,
    currencyCode,
    productImageUrl,
  };
}