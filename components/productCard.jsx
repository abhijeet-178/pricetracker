"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { deleteProduct } from "@/app/action";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import PriceChart from "./PriceChart";

import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
  TrendingDown,
} from "lucide-react";

const ProductCard = ({ product }) => {
  const [showChart, setShowChart] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Remove this product from tracking?")) return;

    setDeleting(true);

    const result = await deleteProduct(product.id);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message || "Product deleted successfully");
    }

    setDeleting(false);
  };

  const currentPrice =
    product.current_price ??
    product.currency_price ??
    0;

  const cost =
    product.cost ??
    product.target_price ??
    product.targetPrice ??
    currentPrice;

  const getCurrencySymbol = (currency) => {
    switch (currency) {
      case "INR":
      case "₹":
        return "₹";
      case "USD":
      case "$":
        return "$";
      case "EUR":
      case "€":
        return "€";
      case "GBP":
      case "£":
        return "£";
      default:
        return currency || "";
    }
  };

  const currency = getCurrencySymbol(product.currency);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex gap-4">
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-28 h-28 object-cover rounded-md border"
            />
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-2xl line-clamp-2 mb-3">
              {product.name}
            </h3>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-5xl font-bold text-orange-500">
                {currency} {currentPrice}
              </span>

              <Badge variant="secondary" className="gap-1">
                <TrendingDown className="w-3 h-3" />
                Tracking
              </Badge>
            </div>

            <div className="mt-5 space-y-2 text-base">
              <div className="flex justify-between">
                <span className="text-gray-500">Current Price</span>

                <span className="font-semibold">
                  {currency} {currentPrice}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Cost</span>

                <span className="font-semibold text-green-600">
                  {currency} {cost}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChart(!showChart)}
            className="gap-1"
          >
            {showChart ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Chart
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show Chart
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" asChild className="gap-1">
            <Link
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              View Product
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Removing..." : "Remove"}
          </Button>
        </div>
      </CardContent>

      {showChart && (
        <CardFooter className="pt-0">
          <PriceChart productId={product.id} />
        </CardFooter>
      )}
    </Card>
  );
};

export default ProductCard;