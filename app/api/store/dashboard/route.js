import { prisma } from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// get dashboard data for seller (total orders, total earnings, total products)

export async function GET(request) {
    try{
        const {userId} = getAuth(request);
        // const { userId } = auth();

        const storeId = await authSeller(userId)

        // get all orders from seller
        const orders = await prisma.order.findMany({
            where: {storeId}
        })

        // get all products with rating from seller
        const products = await prisma.product.findMany({where: {storeId}})

        const ratings = await prisma.rating.findMany({
            where: {productId: {in:products.map(product => product.id)}},
            include: {user: true, product: true}
        })

        const dashBoardData ={
            ratings, 
            totalOrders: orders.length, 
            totalEarnings: Math.round(orders.reduce((acc,order)=>  acc + order.total, 0)),
            totalProducts: products.length,
        }

        return NextResponse.json({dashBoardData})
    } catch(error){
        console.log(error);
        return NextResponse.json({error: error.code || error.message}, {status: 400})
    }
}