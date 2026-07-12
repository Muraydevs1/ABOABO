'use client'
import { useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import { useClerk, useUser } from '@clerk/nextjs'
import { HomeIcon, ShoppingBagIcon, ShoppingCartIcon, UserIcon } from 'lucide-react'

// Floating mobile navigation dock (hidden at md+). The sliding "limelight"
// indicator is adapted from shadcn.io's Limelight Nav: the active item's
// offset is measured and the bar slides to it via a CSS left transition,
// with a soft light beam underneath. Navigation here is route-driven
// (usePathname) with real links, and cart/auth state is reused from the
// existing Redux store and Clerk — no duplicated logic.

const NAV_TABS = [
    { key: 'home', label: 'Home', href: '/', icon: HomeIcon, isActive: (path) => path === '/' },
    { key: 'shop', label: 'Shop', href: '/shop', icon: ShoppingBagIcon, isActive: (path) => path.startsWith('/shop') || path.startsWith('/product') },
    { key: 'cart', label: 'Cart', href: '/cart', icon: ShoppingCartIcon, isActive: (path) => path.startsWith('/cart') },
]

const MobileDock = () => {

    const pathname = usePathname()
    const cartCount = useSelector((state) => state.cart.total)
    const { isSignedIn, user } = useUser()
    const { openSignIn, openUserProfile } = useClerk()

    const itemRefs = useRef([])
    const limelightRef = useRef(null)
    const [isReady, setIsReady] = useState(false)

    // Profile occupies index 3; it highlights on the buyer's account page.
    const tabIndex = NAV_TABS.findIndex((tab) => tab.isActive(pathname))
    const activeIndex = tabIndex !== -1 ? tabIndex : (pathname.startsWith('/orders') ? 3 : -1)

    useLayoutEffect(() => {
        const limelight = limelightRef.current
        if (!limelight) return
        const activeItem = activeIndex >= 0 ? itemRefs.current[activeIndex] : null
        if (activeItem) {
            limelight.style.left = `${activeItem.offsetLeft + activeItem.offsetWidth / 2 - limelight.offsetWidth / 2}px`
            limelight.style.opacity = '1'
            // Skip the transition on first paint so the bar doesn't fly in.
            if (!isReady) setTimeout(() => setIsReady(true), 50)
        } else {
            limelight.style.opacity = '0'
        }
    }, [activeIndex, isReady])

    const itemClass = (active) =>
        `relative z-20 flex h-full w-16 flex-col items-center justify-center gap-0.5 rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-green-500/60 active:scale-95 ${
            active ? 'text-slate-900' : 'text-slate-500'
        }`

    const labelClass = 'text-[10px] leading-none'

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[calc(env(safe-area-inset-bottom)+12px)] md:hidden">
            <nav
                aria-label="Primary"
                className="pointer-events-auto relative inline-flex h-16 items-center overflow-hidden rounded-full border border-slate-200 bg-white/90 px-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md"
            >
                {NAV_TABS.map((tab, index) => {
                    const active = activeIndex === index
                    const Icon = tab.icon
                    return (
                        <Link
                            key={tab.key}
                            href={tab.href}
                            ref={(el) => { itemRefs.current[index] = el }}
                            aria-label={tab.label}
                            aria-current={active ? 'page' : undefined}
                            className={itemClass(active)}
                        >
                            <span className="relative">
                                <Icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                                {tab.key === 'cart' && cartCount > 0 && (
                                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-500 px-1 text-[9px] font-semibold text-white">
                                        {cartCount}
                                    </span>
                                )}
                            </span>
                            <span className={labelClass}>{tab.label}</span>
                        </Link>
                    )
                })}

                <button
                    type="button"
                    ref={(el) => { itemRefs.current[3] = el }}
                    onClick={() => (isSignedIn ? openUserProfile() : openSignIn())}
                    aria-label={isSignedIn ? 'Open your profile' : 'Sign in'}
                    className={itemClass(activeIndex === 3)}
                >
                    {isSignedIn && user?.imageUrl ? (
                        <Image
                            src={user.imageUrl}
                            alt=""
                            width={24}
                            height={24}
                            className={`size-6 rounded-full object-cover ring-2 ${activeIndex === 3 ? 'ring-green-500' : 'ring-transparent'}`}
                        />
                    ) : (
                        <UserIcon className="size-[22px]" strokeWidth={1.8} aria-hidden="true" />
                    )}
                    <span className={labelClass}>{isSignedIn ? 'Profile' : 'Sign in'}</span>
                </button>

                {/* Limelight indicator: bar + soft beam, slides to the active item. */}
                <div
                    ref={limelightRef}
                    aria-hidden="true"
                    className={`absolute top-0 z-10 h-1 w-10 rounded-full bg-green-500 ${isReady ? 'transition-[left,opacity] duration-[400ms] ease-in-out' : ''}`}
                    style={{ left: '-999px', opacity: 0 }}
                >
                    <div className="pointer-events-none absolute left-[-30%] top-1 h-12 w-[160%] bg-gradient-to-b from-green-500/25 to-transparent [clip-path:polygon(5%_100%,25%_0,75%_0,95%_100%)]" />
                </div>
            </nav>
        </div>
    )
}

export default MobileDock
