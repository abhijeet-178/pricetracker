"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";
import { getPriceHistory } from "@/app/action";

export default function PriceChart({ productId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        console.log("Product ID:", productId);

        const history = await getPriceHistory(productId);

        console.log("Price History:", history);

        const chartData = history.map((item) => ({
          date: new Date(
            item.checked_at || item.created_at
          ).toLocaleDateString(),
          price: Number(item.price),
        }));

        console.log("Chart Data:", chartData);

        setData(chartData);
      } catch (err) {
        console.error("Chart Error:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 w-full">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading chart...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full rounded-md border p-6 text-center text-gray-500">
        No price history available for this product.
      </div>
    );
  }

  return (
    <div className="w-full mt-4">
      <h4 className="font-semibold mb-3">Price History</h4>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="date" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="price"
            stroke="#f97316"
            strokeWidth={3}
            dot
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}