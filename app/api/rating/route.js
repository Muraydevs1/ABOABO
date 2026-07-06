import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ADD NEW RATING
export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const { orderId, productId, rating, review } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Validate rating is an integer between 1 and 5
        const numericRating = Number(rating);
        if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
            return NextResponse.json(
                { error: "Rating must be an integer between 1 and 5" },
                { status: 400 }
            );
        }

        // Validate review type and length
        const MAX_REVIEW_LENGTH = 1000;
        if (typeof review !== "string") {
            return NextResponse.json({ error: "Review must be text" }, { status: 400 });
        }
        if (review.length > MAX_REVIEW_LENGTH) {
            return NextResponse.json(
                { error: `Review must be ${MAX_REVIEW_LENGTH} characters or fewer` },
                { status: 400 }
            );
        }

        const order = await prisma.order.findFirst({
            where: { id: orderId, userId },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Ensure the rated product was actually part of this order
        const orderItem = await prisma.orderItem.findFirst({
            where: { orderId, productId },
        });

        if (!orderItem) {
            return NextResponse.json(
                { error: "Product is not part of this order" },
                { status: 400 }
            );
        }

        const isAlreadyRated = await prisma.rating.findFirst({
            where: { productId, orderId, userId },
        });

        if (isAlreadyRated) {
            return NextResponse.json({ error: "Order already rated" }, { status: 400 });
        }

        const response = await prisma.rating.create({
            data: { userId, productId, rating: numericRating, review, orderId },
        });

        return NextResponse.json({ message: "Rating added successfully", rating: response });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}

// GET ALL RATING FOR A USER
export async function GET(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const ratings = await prisma.rating.findMany({
            where: { userId },
        });

        return NextResponse.json({ ratings });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}
