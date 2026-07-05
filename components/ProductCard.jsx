'use client'
import { StarIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart } from '@/lib/features/cart/cartSlice'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const ProductCard = ({ product }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'GH₵'

    const dispatch = useDispatch()
    const router = useRouter()
    const cart = useSelector(state => state.cart.cartItems)
    const inCart = Boolean(cart[product.id])

    // calculate the average rating of the product
    const rating = product.rating.length
        ? Math.round(
              product.rating.reduce((acc, curr) => acc + curr.rating, 0) /
                  product.rating.length
          )
        : 0

    // card is wrapped in a Link, so keep the button from navigating
    const handleAddToCart = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (inCart) {
            router.push('/cart')
            return
        }
        dispatch(addToCart({ productId: product.id }))
        toast.success('Added to cart')
    }

    return (
        <Link href={`/product/${product.id}`} className='group max-xl:mx-auto block'>
            <Card className='w-full max-w-[320px] sm:w-60 gap-0 py-4 border-green-500 hover:shadow-md transition-shadow duration-300'>
                <CardContent className='px-4'>
                    {/* Product Image */}
                    <div className='bg-[#F5F5F5] rounded-2xl flex items-center justify-center h-40 sm:h-56 relative overflow-hidden mb-4'>
                        <Image
                            width={500}
                            height={500}
                            className='max-h-32 sm:max-h-44 w-auto object-contain group-hover:scale-110 transition duration-300'
                            src={product.images[0]}
                            alt={product.name}
                        />
                    </div>

                    {/* Product Info */}
                    <div className='mb-3'>
                        <CardTitle className='text-base leading-tight mb-1'>
                            {product.name}
                        </CardTitle>
                        {product.description && (
                            <CardDescription className='text-sm line-clamp-2'>
                                {product.description}
                            </CardDescription>
                        )}
                        <div className='flex mt-1.5'>
                            {Array(5).fill('').map((_, index) => (
                                <StarIcon key={index} size={14} className='text-transparent mt-0.5' fill={rating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                            ))}
                        </div>
                    </div>

                    <div className='flex flex-wrap items-center justify-between gap-2'>
                        <p className='text-lg font-bold whitespace-nowrap font-price'>{currency}{product.price}</p>

                        <Button size='sm' className='bg-green-500 hover:bg-green-600' onClick={handleAddToCart}>
                            {inCart ? 'View Cart' : 'Add to Cart'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}

export default ProductCard
