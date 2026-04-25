import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentMethod } from "@prisma/client";

export const runtime = "nodejs";

const verifyPaystackSignature = (rawBody, signature, secret) => {
    const expected = crypto
        .createHmac("sha512", secret)
        .update(rawBody)
        .digest("hex");
    return expected === signature;
};

export async function POST(request) {
    try {
        const secretKey = process.env.PAYSTACK_SECRET_KEY;

        if (!secretKey) {
            return NextResponse.json(
                { error: "PAYSTACK_SECRET_KEY is not configured" },
                { status: 500 }
            );
        }

        const signature = request.headers.get("x-paystack-signature");
        const rawBody = await request.text();

        if (!signature || !verifyPaystackSignature(rawBody, signature, secretKey)) {
            return NextResponse.json({ error: "invalid signature" }, { status: 401 });
        }

        const eventPayload = JSON.parse(rawBody);

        if (eventPayload?.event !== "charge.success") {
            return NextResponse.json({ received: true });
        }

        const metadata = eventPayload?.data?.metadata || {};
        const ordersId = Array.isArray(metadata.ordersId) ? metadata.ordersId : [];

        if (!ordersId.length) {
            return NextResponse.json({ received: true });
        }

        await prisma.order.updateMany({
            where: {
                id: { in: ordersId },
                paymentMethod: PaymentMethod.MoMo,
            },
            data: {
                isPaid: true,
            },
        });

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        );
    }
}
