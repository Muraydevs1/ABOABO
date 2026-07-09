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

        const eventData = eventPayload?.data || {};
        const metadata = eventData.metadata || {};
        const ordersId = Array.isArray(metadata.ordersId) ? metadata.ordersId : [];
        const reference = eventData.reference || null;

        if (!ordersId.length) {
            return NextResponse.json({ received: true });
        }

        // Verify the referenced MoMo orders actually exist
        const orders = await prisma.order.findMany({
            where: { id: { in: ordersId }, paymentMethod: PaymentMethod.MoMo },
        });

        if (orders.length !== ordersId.length) {
            return NextResponse.json(
                { error: "referenced orders not found" },
                { status: 404 }
            );
        }

        // Idempotency: if these orders are already paid, this is a duplicate/replayed
        // event — acknowledge without reprocessing.
        if (orders.every((order) => order.isPaid)) {
            return NextResponse.json({ received: true, status: "already processed", reference });
        }

        // Reconcile the charged amount against the server-calculated order total.
        // Paystack sends `amount` in the smallest currency unit (pesewas for GHS),
        // matching how the payment was initialized (Math.round(total * 100)).
        const expectedAmount = Math.round(
            orders.reduce((sum, order) => sum + order.total, 0) * 100
        );

        if (typeof eventData.amount !== "number" || eventData.amount !== expectedAmount) {
            return NextResponse.json({ error: "amount mismatch" }, { status: 400 });
        }

        // Mark as paid. Scoping to isPaid:false keeps this write idempotent even
        // under concurrent/duplicate delivery.
        await prisma.order.updateMany({
            where: {
                id: { in: ordersId },
                paymentMethod: PaymentMethod.MoMo,
                isPaid: false,
            },
            data: {
                isPaid: true,
            },
        });

        return NextResponse.json({ received: true, reference });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        );
    }
}
