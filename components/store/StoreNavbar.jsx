'use client'
import { useUser, UserButton } from "@clerk/nextjs"
import Link from "next/link"

const StoreNavbar = () => {
    const {user} = useUser()

    return (
        <div className="flex items-center justify-between px-4 sm:px-12 py-3 border-b border-slate-200 transition-all gap-2">
            <Link href="/" className="flex items-start gap-1.5 sm:gap-2 text-2xl sm:text-4xl font-semibold text-slate-700 leading-none">
                <span>
                    <span className="text-green-600">Aboa</span>Bo<span className="text-green-600 text-3xl sm:text-5xl leading-0">.</span>
                </span>
                <p className="text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 rounded-full text-white bg-green-500">
                    Store
                </p>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <p className="max-[380px]:hidden">Hi, {user?.firstName || "Seller"}</p>
                <UserButton />
            </div>
        </div>
    )
}

export default StoreNavbar
