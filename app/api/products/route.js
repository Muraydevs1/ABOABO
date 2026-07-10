import { prisma } from "@/lib/prisma";

export async function GET(request) {
    try{
        let products = await prisma.product.findMany({
            where: {inStock: true},
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

        // REMOVE PRODUCTS WITH STORE DISABLE FALSE
        products = products.filter(product => product.store.isActive)
        return new Response(JSON.stringify({products}), {status: 200})
    } catch (error){
        console.log(error)
        return new Response(JSON.stringify({error: error.code || error.message}), {status: 400})    
    }
}