import { prisma } from "@/lib/prisma";
import { normalizeSearchQuery, buildSearchWhere, rankSearchResults } from "@/lib/search";

export async function GET(request) {
    try{
        const { searchParams } = new URL(request.url)
        const search = normalizeSearchQuery(searchParams.get('search'))

        const products = await prisma.product.findMany({
            where: {
                inStock: true,
                store: { isActive: true },
                ...(search.stems.length ? { AND: buildSearchWhere(search.stems) } : {}),
            },
            include: {
                rating:{
                    select:{
                        createdAt:true, rating: true, review:true,
                        user: {select:{name:true, image:true}}
                    }
                },
                // Public route: expose only non-sensitive store fields.
                // Never leak userId (Clerk ID), courseId (student ID), email, or contact here.
                store: {
                    select: { name: true, username: true, logo: true, isActive: true, campus: true, address: true }
                },
            },
            orderBy: {createdAt: "desc"}
        })

        return new Response(JSON.stringify({
            products: search.stems.length ? rankSearchResults(products, search) : products
        }), {status: 200})
    } catch (error){
        console.log(error)
        return new Response(JSON.stringify({error: error.code || error.message}), {status: 400})
    }
}
