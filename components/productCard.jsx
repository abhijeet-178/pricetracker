"use client"
import { deleteProduct } from '@/app/action';
import React, { useState } from 'react';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from './ui/badge';
import { ChevronDown, ChevronUp, ExternalLink, Trash2, TrendingDown } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import PriceChart from './PriceChart';

const ProductCard = ({product}) => {
    const [showChart,setShowCart]=useState(false);
    const [deleting,setDeleting]=useState(false);

    const handleDelete=async()=>{
      if(!confirm("Remove this product from tracking?"))return ;  
      setDeleting(true);
     const result= await deleteProduct(product.id)
       if(result.error){
            toast.error(result.error);

        }
        else{
            toast.success(result.message||"Product deleted successfully");
            setUrl("")
        }
        setDeleting(false);

    }
  return (
    <Card className="hover:shadow-lg transition-shadow">
  <CardHeader className={"pb-3"}>
    <div className='flex gap-4'>
        {product.image_url&&(
            <img
            src={product.image_url}
            alt={product.name}
            className='w-30 h-30 object-cover rounded-md border'
            />
        )}
        <div className='flex-1 min-w-0'>
            <h3 className='font-semibold text-gray-900 line-clamp-2 mb-2'>
                {product.name}
            </h3>
            <div className='flex item-baseline gap-2'>
               <span className='text-3xl font-bold text-orange-500'>
                 {product.currency} {product.currency_price}
               </span>
               <Badge variant="secondary" className="gap-1">
                <TrendingDown className='w-3 h-3'/>
                Tracking
               </Badge>

            </div>
        </div>

    </div>
    <CardAction>Card Action</CardAction>
  </CardHeader>
  <CardContent>
    <div className='flex flex-wrap gap-2'>
        <Button
        varient="outline"
        size="sm"
        onClick={()=>setShowCart(!showChart)}
        className="gap-1"
        >
            {showChart ?(
                <>
                <ChevronUp className='w-4 h-4'/>
                Hide Chart</>
            ):(
                <>
                <ChevronDown className='w-4 h-4'/>
                Show Chart
                </>
            )}

        </Button>
        <Button variant='outline' size="sm" asChild className="gap-1">
            <Link href={product.url} target="_black" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4"/>
            view Product
            </Link>

        </Button>
        <Button 
        variant='ghost'
        size="sm"
        onClick={handleDelete}
        disabled={deleting}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
        >
          <Trash2 className='w-4 h-4'/>
          remove
        </Button>
    </div>
  </CardContent>
  {showChart&&<CardFooter className="pt-0">
    <PriceChart productId={product.id}/>
  </CardFooter>}
</Card>
  )
}

export default ProductCard;
