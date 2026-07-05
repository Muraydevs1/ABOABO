import { ABeeZee, Aldrich } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const abeezee = ABeeZee({ subsets: ["latin"], weight: "400" });
const aldrich = Aldrich({ subsets: ["latin"], weight: "400", variable: "--font-aldrich" });

export const metadata = {
    title: "ABOABO - Student Marketplace",
    description: "ABOABO is a marketplace for UDS students to buy and sell products on campus.",
    icons: {
        icon: "/favicon.png",
    },
};

export default function RootLayout({ children }) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body className={`${abeezee.className} ${aldrich.variable} antialiased`}>
                    <StoreProvider>
                        <Toaster />
                        {children}
                    </StoreProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
