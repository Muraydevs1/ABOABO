'use client'
import React from 'react'
import ProductCard from '@/components/ProductCard'
import { ProductCardOne } from '@/components/commercn/product-cards/product-card-01'
import { assets } from '@/assets/assets'

// Temporary evaluation page for @commercn/product-card-01 — safe to delete.
const mockProduct = {
    id: 'demo_prod_1',
    name: 'Bluetooth Speakers',
    price: 99,
    images: [assets.product_img1.src],
    rating: [{ rating: 4 }, { rating: 5 }],
}

export default function ProductCardDemo() {
    return (
        <div className='min-h-screen px-6 py-12'>
            <h1 className='text-2xl font-semibold mb-10'>ProductCard comparison</h1>
            <div className='flex flex-wrap items-start gap-16'>
                <div>
                    <p className='text-sm text-slate-500 mb-4'>Current: components/ProductCard.jsx</p>
                    <ProductCard product={mockProduct} />
                </div>
                <div>
                    <p className='text-sm text-slate-500 mb-4'>New: @commercn/product-card-01</p>
                    <ProductCardOne />
                </div>
            </div>
        </div>
    )
}
