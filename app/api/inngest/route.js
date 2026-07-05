import { serve } from "inngest/next";
import { checkPrices } from "@/inngest/function";
import { inngest } from "@/inngest/client";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [checkPrices],
});