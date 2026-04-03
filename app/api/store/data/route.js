import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Get store Info and products

export async function GET(request) {
    try {
        // Get store username from query params
        const {searchParams} = new URL(request.url)
        const username = searchParams.get('username').toLowerCase();

        if(!username){
            return NextResponse.json({error: 'missing username'}, {status:400})
        }

        // Get store info and instock products with rating
        const store = await prisma.store.findUnique({
            where: {username, isActive:true},
            include: {Product: {include:{rating:true}}}
        }) 

        if(!store){
            return NextResponse.json({error: "store not found"}, {status: 400})
        }
        return NextResponse.json({store})
    } catch (error) {
        console.log(error);
        NextResponse.json({error: error.code || error.message},{status:400})
        
    }
}