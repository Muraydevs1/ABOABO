import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Get marketplace products (or products for a specific store).
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const storeId = searchParams.get('storeId')

        const products = await prisma.product.findMany({
            where: {
                ...(storeId ? { storeId } : {}),
                inStock: true,
                store: {
                    status: 'approved',
                    isActive: true,
                },
            },
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
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ products })
    } catch (error) {
        console.log(error)
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        )
    }
}
