import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


// ADD NEW ADDRESS
export async function POST(request) {
    try {
        const {userId} = getAuth(request);
        const {address} = await request.json();

        address.userId = userId

        const newAddress = await prisma.address.create({
            data: address
        });

        return NextResponse.json({newAddress, message: "Address added successfully"});
    } catch (error) {
        console.log(error);
        return NextResponse.json({error: error.code || error.message}, {status: 400});
    }
}

// GET USER ADDRESSES
export async function GET(request) {
    try {
        const {userId} = getAuth(request);

        const addresses = await prisma.address.findMany({
            where: {userId}
        });

        return NextResponse.json({addresses});
    } catch (error) {
        console.log(error);
        return NextResponse.json({error: error.code || error.message}, {status: 400});
    }
}

// // DELETE ADDRESS
// export async function DELETE(request) {
//     try {
//         const {userId} = getAuth(request);
//         const {addressId} = await request.json();

//         await prisma.address.deleteMany({
//             where: {id: addressId, userId}
//         });

//         return NextResponse.json({message: "Address deleted successfully"});
//     } catch (error) {
//         console.log(error);
//         return NextResponse.json({error: error.code || error.message}, {status: 400});
//     }
// }

// // UPDATE ADDRESS
// export async function PUT(request) {
//     try {
//         const {userId} = getAuth(request);
//         const {addressId, updatedAddress} = await request.json();

//         const address = await prisma.address.findFirst({
//             where: {id: addressId, userId}
//         });

//         if (!address) {
//             return NextResponse.json({error: "Address not found"}, {status: 404});
//         }

//         const newAddress = await prisma.address.update({
//             where: {id: addressId},
//             data: updatedAddress
//         });

//         return NextResponse.json({newAddress, message: "Address updated successfully"});
//     } catch (error) {
//         console.log(error);
//         return NextResponse.json({error: error.code || error.message}, {status: 400});
//     }
// }