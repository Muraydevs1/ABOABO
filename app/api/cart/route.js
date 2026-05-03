import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// UPDATE USER CART
export async function POST(request) {
    try {
        const {userId} = getAuth(request);
        const {cart} = await request.json()

        // save cart to object user
       await prisma.user.update({
        where: {id: userId},
        data: {cart: cart}
       })
       return NextResponse.json({message: "Cart updated successfully"})
        } catch (error) {
        console.log(error)
        return new Response(JSON.stringify({error: error.code || error.message}), {status: 400})
    }
}     

// GET USER CART
export async function GET(request) {
    try {
        const {userId} = getAuth(request);
        const user = await prisma.user.findUnique({
            where: {id: userId},
            select: {cart: true}
        })
        return NextResponse.json({cart: user.cart})
    } catch (error) {
        console.log(error)
        return new Response(JSON.stringify({error: error.code || error.message}), {status: 400})
    }
}