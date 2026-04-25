import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Get store Info and products
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const rawUsername = searchParams.get("username");

        if (!rawUsername) {
            return NextResponse.json({ error: "missing username" }, { status: 400 });
        }

        const username = rawUsername.toLowerCase();

        // Get approved + active store info and in-stock products with ratings.
        const store = await prisma.store.findFirst({
            where: {
                username,
                isActive: true,
                status: "approved",
            },
            include: {
                Product: {
                    where: { inStock: true },
                    include: { rating: true },
                },
            },
        });

        if (!store) {
            return NextResponse.json({ error: "store not found" }, { status: 404 });
        }

        const { Product, ...storeInfo } = store;
        return NextResponse.json({ store: { ...storeInfo, products: Product } });
    } catch (error) {
        console.log(error);
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        );
    }
}
