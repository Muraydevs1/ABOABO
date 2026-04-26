import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Get marketplace products (or products for a specific store).
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const storeId = searchParams.get('storeId')
        const category = searchParams.get('category')
        const campus = searchParams.get('campus')
        const search = searchParams.get('search')
        const relatedTo = searchParams.get('relatedTo')
        const sort = searchParams.get('sort') || 'newest'

        const minPriceParam = searchParams.get('minPrice')
        const maxPriceParam = searchParams.get('maxPrice')
        const minRatingParam = searchParams.get('minRating')
        const limitParam = searchParams.get('limit')

        const minPrice = minPriceParam ? Number(minPriceParam) : null
        const maxPrice = maxPriceParam ? Number(maxPriceParam) : null
        const minRating = minRatingParam ? Number(minRatingParam) : null
        const limit = limitParam ? Number(limitParam) : null

        const storeWhere = {
            status: 'approved',
            isActive: true,
            ...(campus
                ? {
                      address: {
                          contains: campus,
                          mode: 'insensitive',
                      },
                  }
                : {}),
        }

        const where = {
            ...(storeId ? { storeId } : {}),
            ...(category ? { category } : {}),
            ...(Number.isFinite(minPrice) ? { price: { gte: minPrice } } : {}),
            ...(Number.isFinite(maxPrice)
                ? {
                      price: {
                          ...(Number.isFinite(minPrice) ? { gte: minPrice } : {}),
                          lte: maxPrice,
                      },
                  }
                : {}),
            ...(search
                ? {
                      OR: [
                          { name: { contains: search, mode: 'insensitive' } },
                          { description: { contains: search, mode: 'insensitive' } },
                      ],
                  }
                : {}),
            inStock: true,
            store: storeWhere,
        }

        if (relatedTo) {
            const sourceProduct = await prisma.product.findUnique({
                where: { id: relatedTo },
                select: { id: true, category: true },
            })

            if (!sourceProduct) {
                return NextResponse.json({ products: [] })
            }

            where.id = { not: sourceProduct.id }
            if (!category && sourceProduct.category) {
                where.category = sourceProduct.category
            }
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                rating: {
                    include: { user: true },
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        logo: true,
                        address: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        const productsWithAverage = products.map((product) => {
            const totalRatings = product.rating.length
            const avgRating = totalRatings
                ? product.rating.reduce((acc, item) => acc + item.rating, 0) / totalRatings
                : 0

            return {
                ...product,
                avgRating: Number(avgRating.toFixed(2)),
            }
        })

        let filteredProducts = Number.isFinite(minRating)
            ? productsWithAverage.filter(
                  (product) => product.avgRating >= minRating
              )
            : productsWithAverage

        filteredProducts = filteredProducts.sort((a, b) => {
            if (sort === 'price_asc') return a.price - b.price
            if (sort === 'price_desc') return b.price - a.price
            if (sort === 'rating_desc') return b.avgRating - a.avgRating
            if (sort === 'rating_asc') return a.avgRating - b.avgRating
            if (sort === 'oldest')
                return new Date(a.createdAt) - new Date(b.createdAt)
            return new Date(b.createdAt) - new Date(a.createdAt)
        })

        if (Number.isFinite(limit) && limit > 0) {
            filteredProducts = filteredProducts.slice(0, limit)
        }

        return NextResponse.json({ products: filteredProducts })
    } catch (error) {
        console.log(error)
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        )
    }
}
