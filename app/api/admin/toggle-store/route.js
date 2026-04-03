import { prisma } from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Toggle store isActive
export async function POST(request) {
    try{
        const {userId} = getAuth(request);
        const isAdmin = await authAdmin(userId);

        if(!isAdmin){
            return NextResponse.json({error:"not authorized"}, {status:401})
        }

        const {storeId}= await request.json();
        if(!storeId){
            return NextResponse.json({error:"missing store ID"}, {status:400})
        }

        // Find store
        const store = await prisma.store.findUnique({
            where:{id: storeId}
        })

        if(!store){
            return NextResponse.json({error:"store not found"}, {status:400});
        }

        await prisma.store.update({
            where: {id: storeId},
            data: {isActive: !store.isActive}
        })

        return NextResponse.json({
            message: "store updated successfully"
        })
    } catch(error){
        console.log(error);
        return NextResponse.json({error:error.message || error.code}, {status:400})
    }
}