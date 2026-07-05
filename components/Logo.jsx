import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

// Shared brand logo: reuses the favicon asset (public/favicon.png) as the
// brand icon beside the "AboaBo." wordmark so the browser tab and the app
// share one identity.
// - className: text size / gap / positioning per call site (e.g. "text-4xl gap-2")
// - dotClassName: size of the trailing green dot
// - badge: optional pill text ("UDS", "Admin", "Store")
// - floatingBadge: absolute-positioned badge (storefront navbar style); pass
//   "relative" in className when using it
const Logo = ({ className = '', dotClassName = 'text-5xl', badge, floatingBadge = false }) => {
    return (
        <Link href="/" className={`flex items-center font-semibold text-slate-700 ${className}`}>
            <Image
                src="/favicon.png"
                alt="ABOABO logo"
                width={48}
                height={48}
                priority
                className='w-[1.15em] h-[1.15em] object-contain shrink-0'
            />
            <span className='leading-none'>
                <span className='text-green-600'>Aboa</span>Bo<span className={`text-green-600 leading-0 ${dotClassName}`}>.</span>
            </span>
            {badge && (
                floatingBadge ? (
                    <p className='absolute text-[10px] sm:text-xs font-semibold -top-1 -right-5 sm:-right-8 px-2 sm:px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500'>
                        {badge}
                    </p>
                ) : (
                    <p className='self-start text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 rounded-full text-white bg-green-500'>
                        {badge}
                    </p>
                )
            )}
        </Link>
    )
}

export default Logo
