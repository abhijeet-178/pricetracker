"use client";
import React, { useState } from 'react'
import { Input } from './input'
import { Button } from './button';
import { Loader2 } from 'lucide-react';
import { AuthModel } from '../AuthModel';
import { toast } from 'sonner';
import { addProduct } from '@/app/action';

const AddProductForm = ({user}) => {
    const [url,setUrl]=useState("");
    const [loading,setLoading]=useState(false);
    const[showAuthModel,setShowAuthModel]=useState(false);
    const handleSubmit=async(e)=>{
        e.preventDefault();
        if(!user){
            setShowAuthModel(true);
            return;
        }
        setLoading(true);

        const formData=new FormData();
        formData.append("url",url);
        const result=await addProduct(formData)

        if(result.error){
            toast.error(result.error);

        }
        else{
            toast.success(result.message||"Product tracked successfully");
            setUrl("")
        }
        setLoading(false);



    }

  return (
    <>
    <form onSubmit ={handleSubmit} className='w-full max-w-2xl mx-auto'>
        <div className='flex flex-col sm:flex-row gap-2'>
            <Input type="url"
            value={url}
            onChange={(e)=>setUrl(e.target.value)}
            placeholder="Paste product URL (Amazon,Walmart,etc)"
            className="h-12 text-base"
            required
            disabled={loading}
            />
            <Button className="bg-orange-500 hover:bg-orange-600 h-10 sm:h-12 px-8"
            type="submit"
            disabled={loading}
            size={"lg"} >
                {loading?(
                    <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin'/></>
                ):(
                    "Track price"
                )}
            </Button>
        </div>
    </form>
     <AuthModel
            isOpen={showAuthModel}
            onClose={() => setShowAuthModel(false)}
          />
    
    </>
  )
}

export default AddProductForm
