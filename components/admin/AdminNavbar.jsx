'use client'
import { UserButton, useUser } from "@clerk/nextjs"
import Logo from "@/components/Logo"

const AdminNavbar = () => {

    const {user} = useUser()
    return (
        <div className="flex items-center justify-between px-4 sm:px-12 py-3 border-b border-slate-200 transition-all gap-2">
            <Logo className="gap-1.5 sm:gap-2 text-2xl sm:text-4xl" dotClassName="text-3xl sm:text-5xl" badge="Admin" />
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <p className="max-[380px]:hidden">Hi, {user?.firstName || "Admin"}</p>
                <UserButton/>
            </div>
        </div>
    )
}

export default AdminNavbar
