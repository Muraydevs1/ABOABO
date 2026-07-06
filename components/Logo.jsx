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
            <span className='relative leading-none'>
                <span className='text-green-600'>Aboa</span>Bo<span className={`text-green-600 leading-0 ${dotClassName}`}>.</span>
                {badge && floatingBadge && (
                    /* em-based offsets keep the superscript visually attached to
                       the wordmark at every text size, unlike fixed px offsets */
                    <span className='absolute left-full -top-[0.45em] ml-[0.1em] text-[10px] sm:text-xs leading-none font-semibold px-2 sm:px-3 py-1 rounded-full text-white bg-green-500 whitespace-nowrap'>
                        {badge}
                    </span>
                )}
            </span>
            {badge && !floatingBadge && (
                <p className='self-start text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 rounded-full text-white bg-green-500'>
                    {badge}
                </p>
            )}
        </Link>
    )
}

export default Logo
