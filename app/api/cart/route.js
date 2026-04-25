import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

async function ensureLocalUser(userId) {
    const existing = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
    });

    if (existing) return true;

    const clerkUser = await currentUser();
    if (!clerkUser) return false;

    await prisma.user.create({
        data: {
            id: userId,
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || "User",
            email: clerkUser.emailAddresses?.[0]?.emailAddress || `${userId}@example.com`,
            image: clerkUser.imageUrl || "",
            cart: {},
        },
    });

    return true;
}

export async function POST(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 });
        }

        const ready = await ensureLocalUser(userId);
        if (!ready) {
            return NextResponse.json({ error: "unable to initialize user" }, { status: 400 });
        }

        const { cart } = await request.json();

        await prisma.user.update({
            where: { id: userId },
            data: { cart: cart || {} },
        });

        return NextResponse.json({ message: "cart updated successfully" });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}

export async function GET(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 });
        }

        const ready = await ensureLocalUser(userId);
        if (!ready) {
            return NextResponse.json({ cart: {} });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { cart: true },
        });

        return NextResponse.json({ cart: user?.cart || {} });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}
