import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/prisma";
import { validateCoupon } from "@/lib/validators";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";



// add coupon
export async function POST(request) {
    try {
        const {userId} = getAuth(request)
        const isAdmin = await authAdmin(userId)

        if (!isAdmin){
            return NextResponse.json({error:"not authorised"}, {status: 401})
        }

        const {coupon} = await request.json()

        // Validate + allow-list: only known coupon fields reach the DB
        // (code format, description, discount 0-100, future expiry).
        const result = validateCoupon(coupon)
        if (!result.valid){
            return NextResponse.json({error: result.error, errors: result.errors}, {status: 400})
        }

        await prisma.coupon.create({data: result.value}).then(async(coupon)=>{
            // Run Inngest Scheduler Function to delete coupon on expire
            await inngest.send({
                name:'app/coupon.expired',
                data:{
                    code: coupon.code,
                    expires_at:coupon.expiresAt,
                }
            })
        })

        return NextResponse.json({message: "Coupon Added Successfully"})
    } catch (error) {
        console.error(error)
        return NextResponse.json({error: error.code || error.message}, {status: 400})
    }
}

// delete coupon
export async function DELETE(request) {
    try {
        const {userId} = getAuth(request)
        const isAdmin = await authAdmin(userId)

        if (!isAdmin){
            return NextResponse.json({error:"not authorised"}, {status: 401})
        }

        const {searchParams} = request.nextUrl;
        const code = searchParams.get('code')?.trim().toUpperCase()

        if (!code){
            return NextResponse.json({error: "Coupon code is required"}, {status: 400})
        }

        await prisma.coupon.delete({where:{code}})
        return NextResponse.json({message:'Coupon deleted successfully'})
    } catch (error) {
        console.error(error)
        return NextResponse.json({error: error.code || error.message}, {status: 400})
    }
}

// get coupons
export async function GET(request) {
     try {
        const {userId} = getAuth(request)
        const isAdmin = await authAdmin(userId)

        if (!isAdmin){
            return NextResponse.json({error:"not authorised"}, {status: 401})
        }

        const coupons = await prisma.coupon.findMany({})
        return NextResponse.json({coupons})
     } catch (error) {
         console.error(error)
        return NextResponse.json({error: error.code || error.message}, {status: 400})
     }
}
