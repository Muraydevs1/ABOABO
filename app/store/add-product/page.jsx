'use client'
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { useEffect, useRef, useState } from "react"
import { toast } from "react-hot-toast"
import ProductImageGrid from "@/components/store/ProductImageGrid"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { validateProductSubmission } from "@/lib/validators"
import { validateImageFile } from "@/lib/utils/fieldValidation"
import { prepareImageForUpload, isHeicFile } from "@/lib/utils/imageUpload"
import { PRODUCT_CATEGORIES } from "@/lib/constants"

export default function StoreAddProduct() {

    const categories = PRODUCT_CATEGORIES

    const MAX_IMAGES = 4
    const [images, setImages] = useState([])
    const [productInfo, setProductInfo] = useState({
        name: "",
        description: "",
        mrp: 0,
        price: 0,
        category: "",
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    // AI ownership tracking: once the seller types in name or description,
    // AI never overwrites them. Refs (not state) so in-flight AI responses
    // always see the latest value.
    const manualEditRef = useRef(false)
    // The cover File the current AI text was generated from (or requested
    // for) — prevents duplicate requests for the same cover.
    const lastAiCoverRef = useRef(null)

    const {getToken} = useAuth()


    const onChangeHandler = (e) => {
        setProductInfo({ ...productInfo, [e.target.name]: e.target.value })
        // Typing in name/description hands ownership to the seller — AI
        // regeneration is disabled from here on.
        if (e.target.name === 'name' || e.target.name === 'description') {
            manualEditRef.current = true
        }
        // clear the field's error as soon as the user edits it
        if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: null }))
    }

    const inputClass = (field, base) =>
        `${base} outline-none border rounded ${errors[field] ? 'border-red-400' : 'border-slate-200'}`

    const FieldError = ({ field }) => errors[field]
        ? <p className="text-xs text-red-500 mt-1">{errors[field]}</p>
        : null

    // Grid callbacks — presentation only; all file handling stays here.
    const handleRemoveImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index))
    }

    const handleReorderImages = (from, to) => {
        setImages((prev) => {
            const next = [...prev]
            const [moved] = next.splice(from, 1)
            next.splice(to, 0, moved)
            return next
        })
    }

    const handleFilesSelected = async (fileList) => {
        const incoming = Array.from(fileList || [])
        if (!incoming.length) return

        const room = MAX_IMAGES - images.length
        if (incoming.length > room) {
            toast.error(`You can upload at most ${MAX_IMAGES} images`)
        }

        // Convert iPhone HEIC photos to JPEG and shrink oversized files
        // first, then reject anything still unsupported with a friendly
        // message instead of a server error after upload.
        const accepted = []
        for (const raw of incoming.slice(0, Math.max(room, 0))) {
            try {
                const file = await prepareImageForUpload(raw)
                const check = validateImageFile(file, { label: 'Product image' })
                if (!check.isValid) {
                    toast.error(check.error)
                    continue
                }
                accepted.push(file)
            } catch (error) {
                toast.error(error.message)
            }
        }
        if (!accepted.length) return

        setImages((prev) => [...prev, ...accepted].slice(0, MAX_IMAGES))
        if (errors.images) setErrors((prev) => ({ ...prev, images: null }))
    }

    // Cover-driven AI generation: whenever the cover image (index 0) settles
    // on a new file — first upload, removal of the old cover, or a reorder —
    // regenerate the details, unless the seller has taken ownership of the
    // text. The 600ms debounce means rapid reordering/removal fires a single
    // request for the final cover only.
    const coverImage = images[0] ?? null
    const debouncedCover = useDebounce(coverImage, 600)

    useEffect(() => {
        if (!debouncedCover) return
        if (manualEditRef.current) return
        if (lastAiCoverRef.current === debouncedCover) return

        // Claim this cover before the request so re-renders don't re-fire.
        lastAiCoverRef.current = debouncedCover

        // Files still in HEIC form can't be analyzed locally — skip AI
        // gracefully (once per cover), never block the upload.
        if (isHeicFile(debouncedCover)) {
            toast("Automatic description isn't available for this photo in your current browser — you can fill in the details manually.", { icon: 'ℹ️' })
            return
        }
        generateDetailsWithAI(debouncedCover)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedCover])

    const generateDetailsWithAI = async (file) => {
        if(file){
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = async () => {
                const base64Image = reader.result.split(',')[1];
                const mimeType = file.type;
                const token = await getToken()
                try{
                    await toast.promise(axios.post('/api/store/ai', {base64Image, mimeType}, {
                        headers: {Authorization: `Bearer ${token}`}
                    }), {
                        loading: 'Generating product details...',
                        success: (res)=>{
                            // Stale-response guard: apply only if this file is
                            // still the cover and the seller hasn't started
                            // editing while the request was in flight.
                            if (manualEditRef.current) return 'Keeping your edits'
                            if (lastAiCoverRef.current !== file) return 'Cover changed — details updated separately'
                            const data = res.data
                            if(data.name && data.description){
                                setProductInfo(prev => ({...prev, name: data.name, description: data.description}))
                                return data.message || 'Product details generated from your cover image'
                            }
                            return 'Failed to generate product details, please try again'
                        },
                        error: (err)=> err?.response?.data?.error || err.message || 'Failed to generate product details'
                    })
                }catch(error){
                    console.error(error);
                    // Allow a retry for this cover on the next cover change.
                    if (lastAiCoverRef.current === file) lastAiCoverRef.current = null
                }
            };
        }
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        // Logic to add a product

        // Client-side validation with inline errors — same rules the API
        // enforces. The form data is never cleared on failure.
        const result = validateProductSubmission({ ...productInfo, images })
        if (!result.valid) {
            setErrors(result.errors)
            toast.error(result.error)
            return
        }
        setErrors({})

        try {
            setLoading(true)
            const formData = new FormData()
            formData.append('name', result.value.name)
            formData.append('description', result.value.description)
            formData.append('mrp', result.value.mrp)
            formData.append('price', result.value.price)
            formData.append('category', result.value.category)

            // adding images to formData
            result.value.images.forEach(image => formData.append('images', image))

            const token = await getToken()
            const { data } = await axios.post('/api/store/product', formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }})
            toast.success(data.message)

            // Reset Form
            setProductInfo({
                name: "",
                description: "",
                mrp: 0,
                price: 0,
                category: "",
            })

            // Reset Images + AI ownership for the next product
            setImages([])
            manualEditRef.current = false
            lastAiCoverRef.current = null
        } catch (error) {
            if (error?.response?.data?.errors) setErrors(error.response.data.errors)
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }


    return (
        <form onSubmit={e => toast.promise(onSubmitHandler(e), { loading: "Adding Product..." })} className="text-slate-500 mb-28">
            <h1 className="text-2xl">Add New <span className="text-slate-800 font-medium">Products</span></h1>
            <p className="mt-7">Product Images</p>

            <div className="mt-4">
                <ProductImageGrid
                    images={images}
                    onFilesSelected={handleFilesSelected}
                    onRemove={handleRemoveImage}
                    onReorder={handleReorderImages}
                    maxImages={MAX_IMAGES}
                />
            </div>
            <FieldError field="images" />

            <label htmlFor="" className="flex flex-col gap-2 my-6 ">
                Name
                <input type="text" name="name" onChange={onChangeHandler} value={productInfo.name} placeholder="Enter product name" className={inputClass('name', 'w-full max-w-sm p-2 px-4')} required />
                <FieldError field="name" />
            </label>

            <label htmlFor="" className="flex flex-col gap-2 my-6 ">
                Description
                <textarea name="description" onChange={onChangeHandler} value={productInfo.description} placeholder="Enter product description" rows={5} className={inputClass('description', 'w-full max-w-sm p-2 px-4 resize-none')} required />
                <FieldError field="description" />
            </label>

            <div className="flex gap-5">
                <label htmlFor="" className="flex flex-col gap-2 ">
                    Actual Price (GH₵)
                    <input type="number" name="mrp" onChange={onChangeHandler} value={productInfo.mrp} placeholder="0" min="0" step="0.01" className={inputClass('mrp', 'w-full max-w-45 p-2 px-4')} required />
                    <FieldError field="mrp" />
                </label>
                <label htmlFor="" className="flex flex-col gap-2 ">
                    Offer Price (GH₵)
                    <input type="number" name="price" onChange={onChangeHandler} value={productInfo.price} placeholder="0" min="0" step="0.01" className={inputClass('price', 'w-full max-w-45 p-2 px-4')} required />
                    <FieldError field="price" />
                </label>
            </div>

            <select onChange={e => { setProductInfo({ ...productInfo, category: e.target.value }); if (errors.category) setErrors((prev) => ({ ...prev, category: null })) }} value={productInfo.category} className={inputClass('category', 'w-full max-w-sm p-2 px-4 mt-6')} required>
                <option value="">Select a category</option>
                {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                ))}
            </select>
            <FieldError field="category" />

            <br />

            <button disabled={loading} className="bg-slate-800 text-white px-6 mt-7 py-2 hover:bg-slate-900 rounded transition">Add Product</button>
        </form>
    )
}
