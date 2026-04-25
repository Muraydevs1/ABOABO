import { prisma } from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// update seller order status
 export async function POST(request) {
    try {
        const {userId} = getAuth(request);
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({error: "not authorized"}, {status: 401})
        }

        const {orderId, status} = await request.json()
        const allowedStatuses = ["ORDER_PLACED", "PROCESSING", "DELIVERED"]

        if(!allowedStatuses.includes(status)){
            return NextResponse.json({error: "invalid order status"}, {status: 400})
        }

        await prisma.order.update({
            where: {id: orderId, storeId},
            data: {status}
        })

        return NextResponse.json({message: "Order status updated successfully"})
    } catch (error) {
        console.log(error)
        return NextResponse.json({error:error.code || error.message}, {status:400})
    }
}

// get all orders from seller

export async function GET(request) {
    try{
        const {userId} = getAuth(request);
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({error: "not authorized"}, {status: 401})
        }

        const orders = await prisma.order.findMany({
            where: {storeId},
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                },
                user: true,
                address: true
            },
            orderBy: {createdAt: 'desc'}
        })

        return NextResponse.json({orders})
    } catch(error){
        console.log(error)
        return NextResponse.json({error:error.code || error.message}, {status:400})
    }
}
