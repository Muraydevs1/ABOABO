'use client'
import { Suspense, useEffect, useMemo, useState } from "react"
import ProductCard from "@/components/ProductCard"
import { MoveLeftIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSelector } from "react-redux"
import axios from "axios"
import Loading from "@/components/Loading"

function ShopContent() {

    // get query params ?search=abc
    const searchParams = useSearchParams()
    const initialSearch = searchParams.get('search') || ''
    const router = useRouter()
    const allProducts = useSelector(state => state.product.list)

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        search: initialSearch,
        category: '',
        campus: '',
        minPrice: '',
        maxPrice: '',
        minRating: '',
        sort: 'newest',
    })
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

    const categoryOptions = useMemo(() => {
        const source = allProducts.length ? allProducts : products
        const dynamicCategories = source.map((item) => item.category).filter(Boolean)
        return [...new Set([...defaultCategoryOptions, ...dynamicCategories])]
    }, [allProducts, products])

    const campusOptions = ["Nyankpala", "Dungu", "City"]

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const query = new URLSearchParams()

            Object.entries(filters).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    query.set(key, value)
                }
            })

            const { data } = await axios.get(`/api/products?${query.toString()}`)
            setProducts(data.products || [])
        } catch (error) {
            console.log(error)
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setFilters((prev) => ({ ...prev, search: initialSearch }))
    }, [initialSearch])

    useEffect(() => {
        fetchProducts()
    }, [filters])

    const onFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const resetFilters = () => {
        setFilters({
            search: '',
            category: '',
            campus: '',
            minPrice: '',
            maxPrice: '',
            minRating: '',
            sort: 'newest',
        })
        router.push('/shop')
    }

    return (
        <div className="min-h-[70vh] mx-6">
            <div className=" max-w-7xl mx-auto">
                <h1 onClick={() => router.push('/shop')} className="text-2xl text-slate-500 my-6 flex items-center gap-2 cursor-pointer"> {filters.search && <MoveLeftIcon size={20} />}  All <span className="text-slate-700 font-medium">Products</span></h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-7">
                    <select value={filters.category} onChange={(e) => onFilterChange('category', e.target.value)} className="border border-slate-300 rounded p-2 text-sm outline-none">
                        <option value="">All Categories</option>
                        {categoryOptions.map((category) => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>

                    <select value={filters.campus} onChange={(e) => onFilterChange('campus', e.target.value)} className="border border-slate-300 rounded p-2 text-sm outline-none">
                        <option value="">All Campuses</option>
                        {campusOptions.map((campus) => (
                            <option key={campus} value={campus}>{campus}</option>
                        ))}
                    </select>

                    <select value={filters.minRating} onChange={(e) => onFilterChange('minRating', e.target.value)} className="border border-slate-300 rounded p-2 text-sm outline-none">
                        <option value="">Any Rating</option>
                        <option value="1">1+ stars</option>
                        <option value="2">2+ stars</option>
                        <option value="3">3+ stars</option>
                        <option value="4">4+ stars</option>
                    </select>

                    <select value={filters.sort} onChange={(e) => onFilterChange('sort', e.target.value)} className="border border-slate-300 rounded p-2 text-sm outline-none">
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="rating_desc">Top Rated</option>
                        <option value="rating_asc">Lowest Rated</option>
                    </select>

                    <input
                        type="number"
                        min={0}
                        placeholder="Min Price"
                        value={filters.minPrice}
                        onChange={(e) => onFilterChange('minPrice', e.target.value)}
                        className="border border-slate-300 rounded p-2 text-sm outline-none"
                    />
                    <input
                        type="number"
                        min={0}
                        placeholder="Max Price"
                        value={filters.maxPrice}
                        onChange={(e) => onFilterChange('maxPrice', e.target.value)}
                        className="border border-slate-300 rounded p-2 text-sm outline-none"
                    />
                    <input
                        type="text"
                        placeholder="Search products"
                        value={filters.search}
                        onChange={(e) => onFilterChange('search', e.target.value)}
                        className="border border-slate-300 rounded p-2 text-sm outline-none sm:col-span-2"
                    />
                    <button onClick={resetFilters} className="bg-slate-700 text-white rounded p-2 text-sm hover:bg-slate-900 transition">
                        Reset Filters
                    </button>
                </div>

                {loading ? (
                    <Loading />
                ) : (
                    <div className="grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12 mx-auto mb-32">
                        {products.map((product) => <ProductCard key={product.id} product={product} />)}
                    </div>
                )}
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
