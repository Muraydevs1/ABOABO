'use client'
import { SearchIcon, StarIcon, XIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'GH₵'

const ratingOptions = ['4', '3', '2', '1']

const FilterSection = ({ title, aside, children }) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                {title}
            </span>
            {aside}
        </div>
        {children}
    </div>
)

const ShopFilters = ({
    filters,
    onFilterChange,
    onReset,
    categoryOptions,
    categoryCounts,
    campusOptions,
    priceBounds,
    hasActiveFilters,
    idPrefix = 'filters',
}) => {

    const [minBound, maxBound] = priceBounds
    const sliderValue = [
        filters.minPrice === '' ? minBound : Number(filters.minPrice),
        filters.maxPrice === '' ? maxBound : Number(filters.maxPrice),
    ]

    const onPriceChange = ([low, high]) => {
        onFilterChange('minPrice', low <= minBound ? '' : low)
        onFilterChange('maxPrice', high >= maxBound ? '' : high)
    }

    return (
        <div className="space-y-8">

            {/* Keywords */}
            <FilterSection title="Keywords">
                <div className="relative">
                    <SearchIcon className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                    <Input
                        type="text"
                        placeholder="Search products..."
                        value={filters.search}
                        onChange={(e) => onFilterChange('search', e.target.value)}
                        className="px-9"
                        aria-label="Search products"
                    />
                    {filters.search && (
                        <button
                            onClick={() => onFilterChange('search', '')}
                            aria-label="Clear search"
                            className="text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        >
                            <XIcon className="size-3.5" />
                        </button>
                    )}
                </div>
            </FilterSection>

            {/* Price */}
            <FilterSection
                title="Price"
                aside={
                    <Label className="text-muted-foreground text-xs font-normal">
                        {currency}{sliderValue[0].toLocaleString()} – {currency}{sliderValue[1].toLocaleString()}{sliderValue[1] >= maxBound ? '+' : ''}
                    </Label>
                }
            >
                <Slider
                    value={sliderValue}
                    onValueChange={onPriceChange}
                    min={minBound}
                    max={maxBound}
                    aria-label="Price range"
                    className="[&_[data-slot=slider-range]]:bg-green-500 [&_[data-slot=slider-thumb]]:border-green-500"
                />
            </FilterSection>

            {/* Categories */}
            <FilterSection title="Categories">
                <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                    {categoryOptions.map((category) => {
                        const id = `${idPrefix}-category-${category.replace(/\W+/g, '-')}`
                        const count = categoryCounts?.[category]
                        return (
                            <div key={category} className="flex items-center gap-2">
                                <Checkbox
                                    id={id}
                                    checked={filters.category === category}
                                    onCheckedChange={(checked) => onFilterChange('category', checked ? category : '')}
                                    className="data-[state=checked]:border-green-500 data-[state=checked]:bg-green-500"
                                />
                                <Label htmlFor={id} className="text-muted-foreground grow cursor-pointer font-normal">
                                    {category}
                                </Label>
                                {count ? <span className="text-muted-foreground/70 text-xs tabular-nums">{count}</span> : null}
                            </div>
                        )
                    })}
                </div>
            </FilterSection>

            {/* Campus */}
            <FilterSection title="Campus">
                <RadioGroup
                    className="gap-3"
                    value={filters.campus || 'all'}
                    onValueChange={(value) => onFilterChange('campus', value === 'all' ? '' : value)}
                >
                    {['all', ...campusOptions].map((campus) => {
                        const id = `${idPrefix}-campus-${campus.replace(/\W+/g, '-')}`
                        return (
                            <div key={campus} className="flex items-center gap-2">
                                <RadioGroupItem
                                    id={id}
                                    value={campus}
                                    className="data-[state=checked]:border-green-500 [&_svg]:fill-green-500 [&_svg]:text-green-500"
                                />
                                <Label htmlFor={id} className="text-muted-foreground cursor-pointer font-normal">
                                    {campus === 'all' ? 'All Campuses' : campus}
                                </Label>
                            </div>
                        )
                    })}
                </RadioGroup>
            </FilterSection>

            {/* Rating */}
            <FilterSection title="Rating">
                <RadioGroup
                    className="gap-3"
                    value={filters.minRating || 'any'}
                    onValueChange={(value) => onFilterChange('minRating', value === 'any' ? '' : value)}
                >
                    <div className="flex items-center gap-2">
                        <RadioGroupItem
                            id={`${idPrefix}-rating-any`}
                            value="any"
                            className="data-[state=checked]:border-green-500 [&_svg]:fill-green-500 [&_svg]:text-green-500"
                        />
                        <Label htmlFor={`${idPrefix}-rating-any`} className="text-muted-foreground cursor-pointer font-normal">
                            Any Rating
                        </Label>
                    </div>
                    {ratingOptions.map((rating) => {
                        const id = `${idPrefix}-rating-${rating}`
                        return (
                            <div key={rating} className="flex items-center gap-2">
                                <RadioGroupItem
                                    id={id}
                                    value={rating}
                                    className="data-[state=checked]:border-green-500 [&_svg]:fill-green-500 [&_svg]:text-green-500"
                                />
                                <Label htmlFor={id} className="text-muted-foreground flex cursor-pointer items-center gap-1.5 font-normal">
                                    <span className="flex" aria-hidden="true">
                                        {Array(5).fill('').map((_, index) => (
                                            <StarIcon key={index} size={13} className="text-transparent" fill={index < Number(rating) ? "#00C950" : "#D1D5DB"} />
                                        ))}
                                    </span>
                                    &amp; up
                                </Label>
                            </div>
                        )
                    })}
                </RadioGroup>
            </FilterSection>

            {hasActiveFilters && (
                <button
                    onClick={onReset}
                    className="text-muted-foreground w-full rounded-md border border-slate-200 py-2 text-sm transition-colors hover:border-slate-300 hover:text-slate-700"
                >
                    Reset all filters
                </button>
            )}
        </div>
    )
}

export default ShopFilters
