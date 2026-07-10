'use client'
import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import ProductCard from "@/components/ProductCard"
import ShopFilters from "@/components/shop/ShopFilters"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { Loader2Icon, MoveLeftIcon, PackageSearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSelector } from "react-redux"
import axios from "axios"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'GH₵'

const defaultCategoryOptions = [
    'Electronics',
    'Clothing',
    'Home & Kitchen',
    'Beauty & Health',
    'Toys & Games',
    'Sports & Outdoors',
    'Books & Media',
    'Food & Drink',
    'Hobbies & Crafts',
    'Services',
    'Books',
    'Others',
]

const campusOptions = ["Nyankpala", "Dungu", "City"]

const baseSortOptions = [
    { key: 'newest', name: 'Newest' },
    { key: 'oldest', name: 'Oldest' },
    { key: 'price_asc', name: 'Price: Low to High' },
    { key: 'price_desc', name: 'Price: High to Low' },
    { key: 'rating_desc', name: 'Top Rated' },
    { key: 'rating_asc', name: 'Lowest Rated' },
]

const emptyFilters = {
    search: '',
    category: '',
    campus: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
}

const averageRating = (product) => product.rating?.length
    ? product.rating.reduce((acc, curr) => acc + curr.rating, 0) / product.rating.length
    : 0

const ProductGridSkeleton = () => (
    <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="w-full max-w-[320px] animate-pulse rounded-xl border border-slate-100 p-4 max-xl:mx-auto sm:w-60">
                <div className="h-40 rounded-2xl bg-slate-100 sm:h-56" />
                <div className="mt-4 h-4 w-3/4 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
                <div className="mt-4 flex items-center justify-between">
                    <div className="h-5 w-14 rounded bg-slate-100" />
                    <div className="h-8 w-20 rounded-md bg-slate-100" />
                </div>
            </div>
        ))}
    </div>
)

function ShopContent() {

    // get query params ?search=abc
    const searchParams = useSearchParams()
    const initialSearch = searchParams.get('search') || ''
    const router = useRouter()
    const allProducts = useSelector(state => state.product.list)

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searching, setSearching] = useState(false)
    const [sort, setSort] = useState(initialSearch ? 'relevance' : 'newest')
    const [filters, setFilters] = useState({ ...emptyFilters, search: initialSearch })

    const debouncedSearch = useDebounce(filters.search.trim(), 300)
    const hasSearch = Boolean(debouncedSearch)
    // Tracks the last search value that came from (or was written to) the URL,
    // so back/forward navigation is never overwritten by a stale debounce.
    const urlSearchRef = useRef(initialSearch)

    // Search runs server-side (ranked in /api/products); refetch per query.
    useEffect(() => {
        const controller = new AbortController()
        const fetchProducts = async () => {
            try {
                setSearching(true)
                const query = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''
                const { data } = await axios.get(`/api/products${query}`, { signal: controller.signal })
                setProducts(data.products || [])
            } catch (error) {
                if (axios.isCancel(error)) return
                console.log(error)
                setProducts([])
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                    setSearching(false)
                }
            }
        }
        fetchProducts()
        return () => controller.abort()
    }, [debouncedSearch])

    // URL -> input (navbar searches, back/forward navigation)
    useEffect(() => {
        urlSearchRef.current = initialSearch
        setFilters((prev) => prev.search === initialSearch ? prev : { ...prev, search: initialSearch })
    }, [initialSearch])

    // input -> URL, so searches are shareable and survive back-navigation
    useEffect(() => {
        if (debouncedSearch === urlSearchRef.current) return
        urlSearchRef.current = debouncedSearch
        router.replace(debouncedSearch ? `/shop?search=${encodeURIComponent(debouncedSearch)}` : '/shop', { scroll: false })
    }, [debouncedSearch, router])

    // Searches default to relevance order (the API's ranking); restore
    // "newest" when the search is cleared. Explicit user choices are kept.
    useEffect(() => {
        setSort((prev) => {
            if (hasSearch && prev === 'newest') return 'relevance'
            if (!hasSearch && prev === 'relevance') return 'newest'
            return prev
        })
    }, [hasSearch])

    const onFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const resetFilters = () => {
        setFilters({ ...emptyFilters })
        setSort('newest')
    }

    const categoryOptions = useMemo(() => {
        const source = allProducts.length ? allProducts : products
        const dynamicCategories = source.map((item) => item.category).filter(Boolean)
        return [...new Set([...defaultCategoryOptions, ...dynamicCategories])]
    }, [allProducts, products])

    const categoryCounts = useMemo(() => {
        return products.reduce((acc, product) => {
            if (product.category) acc[product.category] = (acc[product.category] || 0) + 1
            return acc
        }, {})
    }, [products])

    const priceBounds = useMemo(() => {
        if (!products.length) return [0, 1000]
        const max = Math.max(...products.map((product) => product.price))
        return [0, Math.max(50, Math.ceil(max / 50) * 50)]
    }, [products])

    const sortOptions = useMemo(
        () => hasSearch ? [{ key: 'relevance', name: 'Relevance' }, ...baseSortOptions] : baseSortOptions,
        [hasSearch]
    )

    const filteredProducts = useMemo(() => {
        let list = [...products]

        if (filters.category) {
            list = list.filter((product) => product.category === filters.category)
        }
        if (filters.campus) {
            const campus = filters.campus.toLowerCase()
            list = list.filter((product) =>
                (product.store?.campus || '').toLowerCase().includes(campus) ||
                (product.store?.address || '').toLowerCase().includes(campus)
            )
        }
        if (filters.minPrice !== '') {
            list = list.filter((product) => product.price >= Number(filters.minPrice))
        }
        if (filters.maxPrice !== '') {
            list = list.filter((product) => product.price <= Number(filters.maxPrice))
        }
        if (filters.minRating !== '') {
            list = list.filter((product) => averageRating(product) >= Number(filters.minRating))
        }

        switch (sort) {
            case 'relevance':
                break // server already returns results in relevance order
            case 'oldest':
                list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break
            case 'price_asc':
                list.sort((a, b) => a.price - b.price); break
            case 'price_desc':
                list.sort((a, b) => b.price - a.price); break
            case 'rating_desc':
                list.sort((a, b) => averageRating(b) - averageRating(a)); break
            case 'rating_asc':
                list.sort((a, b) => averageRating(a) - averageRating(b)); break
            default:
                list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        }
        return list
        // search is intentionally absent: it's applied server-side via debouncedSearch
    }, [products, filters.category, filters.campus, filters.minPrice, filters.maxPrice, filters.minRating, sort])

    const activeChips = useMemo(() => {
        const chips = []
        if (filters.search.trim()) chips.push({ key: 'search', label: `"${filters.search.trim()}"` })
        if (filters.category) chips.push({ key: 'category', label: filters.category })
        if (filters.campus) chips.push({ key: 'campus', label: filters.campus })
        if (filters.minPrice !== '' || filters.maxPrice !== '') {
            chips.push({
                key: 'price',
                label: `${currency}${filters.minPrice || 0} – ${filters.maxPrice !== '' ? currency + filters.maxPrice : 'any'}`,
            })
        }
        if (filters.minRating !== '') chips.push({ key: 'rating', label: `${filters.minRating}+ stars` })
        return chips
    }, [filters])

    const clearChip = (key) => {
        if (key === 'price') {
            setFilters((prev) => ({ ...prev, minPrice: '', maxPrice: '' }))
        } else if (key === 'rating') {
            onFilterChange('minRating', '')
        } else if (key === 'search') {
            onFilterChange('search', '')
        } else {
            onFilterChange(key, '')
        }
    }

    const hasActiveFilters = activeChips.length > 0

    const filterPanelProps = {
        filters,
        onFilterChange,
        onReset: resetFilters,
        categoryOptions,
        categoryCounts,
        campusOptions,
        priceBounds,
        hasActiveFilters,
    }

    return (
        <div className="mx-4 min-h-[70vh] sm:mx-6">
            <div className="mx-auto max-w-7xl">

                {/* Header: title, mobile filter trigger, sort */}
                <div className="my-6 flex flex-wrap items-center justify-between gap-3">
                    <h1
                        onClick={() => initialSearch && router.push('/shop')}
                        className={`flex items-center gap-2 text-2xl text-slate-500 ${initialSearch ? 'cursor-pointer' : ''}`}
                    >
                        {initialSearch && <MoveLeftIcon size={20} />}
                        All <span className="font-medium text-slate-700">Products</span>
                    </h1>

                    <div className="flex items-center gap-2">
                        {/* Mobile filters drawer */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="relative lg:hidden">
                                    <SlidersHorizontalIcon className="size-4" />
                                    Filters
                                    {hasActiveFilters && (
                                        <span className="absolute -right-1.5 -top-1.5 flex size-4.5 items-center justify-center rounded-full bg-green-500 text-[10px] font-semibold text-white">
                                            {activeChips.length}
                                        </span>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-80 max-w-[85vw] overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>Filters</SheetTitle>
                                </SheetHeader>
                                <div className="px-4 pb-8">
                                    <ShopFilters {...filterPanelProps} idPrefix="mobile-filters" />
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Select value={sort} onValueChange={setSort}>
                            <SelectTrigger className="min-w-40" aria-label="Sort products">
                                <span className="text-muted-foreground max-sm:hidden text-sm">Sort by</span>
                                <SelectValue placeholder="Sort" />
                            </SelectTrigger>
                            <SelectContent>
                                {sortOptions.map((option) => (
                                    <SelectItem key={option.key} value={option.key}>
                                        {option.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="lg:grid lg:grid-cols-[240px_1fr] lg:items-start lg:gap-10">

                    {/* Desktop sidebar */}
                    <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto pb-8 pr-1 lg:block">
                        <ShopFilters {...filterPanelProps} />
                    </aside>

                    <section className="mb-32 min-w-0">

                        {/* Active filter chips + result count */}
                        {!loading && (
                            <div className="mb-5 flex flex-wrap items-center gap-2">
                                <p className="flex items-center gap-1.5 text-sm text-slate-500">
                                    {searching && <Loader2Icon className="size-3.5 animate-spin text-green-500" aria-hidden="true" />}
                                    {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                                </p>
                                {activeChips.map((chip) => (
                                    <Badge
                                        key={chip.key}
                                        variant="secondary"
                                        className="gap-1 rounded-full py-1 pl-3 pr-1.5 font-normal text-slate-600"
                                    >
                                        {chip.label}
                                        <button
                                            onClick={() => clearChip(chip.key)}
                                            aria-label={`Remove ${chip.key} filter`}
                                            className="rounded-full p-0.5 transition-colors hover:bg-slate-300/60"
                                        >
                                            <XIcon className="size-3" />
                                        </button>
                                    </Badge>
                                ))}
                                {hasActiveFilters && (
                                    <button onClick={resetFilters} className="text-xs text-slate-400 underline-offset-2 transition-colors hover:text-slate-600 hover:underline">
                                        Clear all
                                    </button>
                                )}
                            </div>
                        )}

                        {loading ? (
                            <ProductGridSkeleton />
                        ) : filteredProducts.length ? (
                            <div className={`grid grid-cols-2 gap-3 transition-opacity duration-200 sm:flex sm:flex-wrap sm:gap-6 ${searching ? 'opacity-60' : ''}`}>
                                {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-6 py-20 text-center">
                                <PackageSearchIcon className="size-10 text-slate-300" />
                                <p className="mt-4 font-medium text-slate-700">No products found</p>
                                <p className="mt-1 max-w-xs text-sm text-slate-500">
                                    Try adjusting your search or filters to find what you&apos;re looking for.
                                </p>
                                {hasActiveFilters && (
                                    <Button variant="outline" onClick={resetFilters} className="mt-5">
                                        Reset all filters
                                    </Button>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    )
}


export default function Shop() {
    return (
        <Suspense fallback={<div>Loading shop...</div>}>
            <ShopContent />
        </Suspense>
    );
}
