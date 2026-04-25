import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { validateCourseId } from "@/lib/utils/courseId";
import { NextResponse } from "next/server";

const ALLOWED_CAMPUSES = ["Nyankpala", "Dungu", "City"];

// ADD NEW ADDRESS
export async function POST(request) {
    try {
        const {userId} = getAuth(request);
        if (!userId) {
            return NextResponse.json({error: "not authorized"}, {status: 401});
        }

        const body = await request.json();
        const address = body.address ?? body;

        const name = address?.name?.trim();
        const email = address?.email?.trim();
        const campus = address?.campus?.trim();
        const hostel = address?.hostel?.trim();
        const phone = address?.phone?.trim();
        const { isValid, courseId: course, error } = validateCourseId(address?.course || "");

        if (!name || !email || !campus || !hostel || !phone || !address?.course) {
            return NextResponse.json({error: "Missing address info"}, {status: 400});
        }

        if (!ALLOWED_CAMPUSES.includes(campus)) {
            return NextResponse.json({error: "Invalid campus selected"}, {status: 400});
        }

        if (!isValid) {
            return NextResponse.json({error}, {status: 400});
        }

        address.userId = userId;
        address.name = name;
        address.email = email;
        address.campus = campus;
        address.hostel = hostel;
        address.phone = phone;
        address.course = course;

        const newAddress = await prisma.address.create({
            data: address
        });

        return NextResponse.json({newAddress, message: "Address added successfully"});
    } catch (error) {
        console.log(error);
        return NextResponse.json({error: error.code || error.message}, {status: 400});
    }
}

// GET SIGNED-IN USER ADDRESSES
export async function GET(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({error: "not authorized"}, {status: 401});
        }

        const addresses = await prisma.address.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ addresses });
    } catch (error) {
        console.log(error);
        return NextResponse.json({error: error.code || error.message}, {status: 400});
    }
}
