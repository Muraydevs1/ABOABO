import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server"
import { PaymentMethod } from "@prisma/client";

const PAYSTACK_INITIALIZE_URL = "https://api.paystack.co/transaction/initialize";

const initializeMoMoPayment = async ({ email, amount, reference, callbackUrl, metadata }) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
        throw new Error("PAYSTACK_SECRET_KEY is not configured");
    }

    const response = await fetch(PAYSTACK_INITIALIZE_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email,
            amount,
            reference,
            currency: "GHS",
            callback_url: callbackUrl,
            channels: ["mobile_money"],
            metadata,
        }),
    });

    const payload = await response.json();

    if (!response.ok || !payload?.status || !payload?.data?.authorization_url) {
        throw new Error(payload?.message || "Unable to initialize Mobile Money payment");
    }

    return payload.data;
};

export async function POST(request) {
    try {
        const {userId} = getAuth(request);
        if(!userId){
            return new Response(JSON.stringify({error: "not authorized"}), {status: 401})
        }
        
        const {addressId, items, paymentMethod} = await request.json()
        const allowedPaymentMethods = ['COD', 'MoMo']
         
    // CHECK IF REQUIRED FIELDS ARE PRESENT
        if(!addressId || !items || items.length === 0 || !paymentMethod){
            return new Response(JSON.stringify({error: "missing required fields"}), {status: 400})
        }
        if(!allowedPaymentMethods.includes(paymentMethod)){
            return new Response(JSON.stringify({error: "invalid payment method"}), {status: 400})
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
        });

        if (!user) {
            return new Response(JSON.stringify({ error: "user not found" }), { status: 404 });
        }
    
    // GROUP ORDERS BY STORE USING MAP
        const ordersbyStore = new Map()
        for(const item of items){
            const product = await prisma.product.findUnique({where: {id: item.id}})
            if (!product) {
                return new Response(JSON.stringify({ error: "product not found" }), { status: 404 });
            }
            const storeId = product.storeId
            if(!ordersbyStore.has(storeId)){
                ordersbyStore.set(storeId, [])
            }
            ordersbyStore.get(storeId).push({...item, price: product.price})
        }
        let ordersId = [];
        let fullAmount = 0;
        let momoRedirect = null;

    // CREATE SEPARATE ORDER FOR EACH STORE
    for(const [storeId, sellerItems] of ordersbyStore.entries()){
        let total = sellerItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const order = await prisma.order.create({
            data: {
                userId,
                storeId,
                addressId,
                paymentMethod,
                total: parseFloat(total.toFixed(2)),
                orderItems: {
                    create: sellerItems.map(item => ({
                        productId: item.id,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            }
        })
        ordersId.push(order.id)
        fullAmount += total;
    }

    if (paymentMethod === "MoMo") {
        try {
            const reference = `momo_${Date.now()}_${userId.slice(0, 8)}`;
            const callbackUrl = `${new URL(request.url).origin}/orders?payment=momo&reference=${reference}`;
            momoRedirect = await initializeMoMoPayment({
                email: user.email,
                amount: Math.round(fullAmount * 100),
                reference,
                callbackUrl,
                metadata: {
                    userId,
                    userName: user.name,
                    paymentMethod: "MoMo",
                    ordersId,
                },
            });
        } catch (paymentError) {
            await prisma.order.deleteMany({
                where: {
                    id: { in: ordersId },
                    userId,
                    paymentMethod: PaymentMethod.MoMo,
                    isPaid: false,
                },
            });

            throw paymentError;
        }
    }

    // CLEAR USER CART
    await prisma.user.update({
        where: {id: userId},
        data: {cart: {}}
    })

    if (momoRedirect?.authorization_url) {
        return new Response(JSON.stringify({
            message: "Redirecting to Mobile Money checkout",
            ordersId,
            fullAmount,
            reference: momoRedirect.reference,
            authorizationUrl: momoRedirect.authorization_url,
        }), {status: 200})
    }

    return new Response(JSON.stringify({message: "Order placed successfully", ordersId, fullAmount}), {status: 200})

    } catch (error) {
        console.log(error)
        return new Response(JSON.stringify({error: error.code || error.message}), {status: 400})
    }
}


// GET USER ORDERS
export async function GET(request) {
    try {
        const {userId} = getAuth(request);
        const orders = await prisma.order.findMany({
            where: {
                userId,
                OR: [
                    { paymentMethod: PaymentMethod.COD },
                    { AND: [{ paymentMethod: PaymentMethod.MoMo }, { isPaid: true }] }
                ]
            },
            include: {orderItems:{include: {product: true}},
            address: true,
        },
        orderBy: {createdAt: "desc"}})
        return new Response(JSON.stringify({orders}), {status: 200})
    } catch (error) {
        console.log(error)
        return new Response(JSON.stringify({error: error.code || error.message}), {status: 400})
    }
}
