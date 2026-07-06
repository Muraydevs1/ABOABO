import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import authSeller from "@/middlewares/authSeller";
import StoreAuth from "@/app/store/StoreAuth";

export const metadata = {
    title: "AboaBo - Store Dashboard",
    description: "AboaBo - Store Dashboard",
};

export default async function RootAdminLayout({ children }) {

    // Server-side authorization: enforced before any store shell renders.
    // Reuses the existing authSeller helper (returns the seller's storeId or false).
    const { userId } = await auth();
    if (!userId) redirect("/");

    const storeId = await authSeller(userId);
    if (!storeId) redirect("/");

    return (
        <>
            <StoreAuth>
                {children}
            </StoreAuth>
        </>
    );
}
