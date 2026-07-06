import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { validateCart } from "@/lib/validators";

// UPDATE USER CART
export async function POST(request) {
    try {
        const {userId} = getAuth(request);
        if (!userId) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        const {cart} = await request.json()

        // Validate structure, product ids, quantities; reject malformed/oversized.
        const result = validateCart(cart)
        if (!result.valid) {
            return NextResponse.json({error: result.error}, {status: 400})
        }

        // save cart to object user
       await prisma.user.update({
        where: {id: userId},
        data: {cart: result.value}
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
        if (!userId) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

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