'use client'
import ProductCard from "@/components/ProductCard"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { MailIcon, MapPinIcon, MessageCircleIcon, PhoneCallIcon, PhoneIcon } from "lucide-react"
import Loading from "@/components/Loading"
import Image from "next/image"
import toast from "react-hot-toast"
import axios from "axios"


export default function StoreShop() {

    const { username } = useParams()
    const [products, setProducts] = useState([])
    const [storeInfo, setStoreInfo] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchStoreData = async () => {
       try {
        const {data} = await axios.get(`/api/store/data?username=${username}`)
        setStoreInfo(data.store)
        setProducts(data.store.products)
       } catch (error) {
        toast.error(error.response?.data?.error || error.message || "Failed to fetch store data")
       } finally {
        setLoading(false)
       }
    }

    useEffect(() => {
        fetchStoreData()
    }, [])

    const rawContact = storeInfo?.contact?.trim() || ""
    const telContact = rawContact.replace(/[^\d+]/g, "")
    const whatsappContact = rawContact
        .replace(/[^\d+]/g, "")
        .replace(/^\+/, "")
        .replace(/^00/, "")

    return !loading ? (
        <div className="min-h-[70vh] mx-6">

            {/* Store Info Banner */}
            {storeInfo && (
                <div className="max-w-7xl mx-auto bg-slate-50 rounded-xl p-6 md:p-10 mt-6 flex flex-col md:flex-row items-center gap-6 shadow-xs">
                    <Image
                        src={storeInfo.logo}
                        alt={storeInfo.name}
                        className="size-32 sm:size-38 object-cover border-2 border-slate-100 rounded-md"
                        width={200}
                        height={200}
                    />
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-semibold text-slate-800">{storeInfo.name}</h1>
                        <p className="text-sm text-slate-600 mt-2 max-w-lg">{storeInfo.description}</p>
                        <div className="text-xs text-slate-500 mt-4 space-y-1"></div>
                        <div className="space-y-2 text-sm text-slate-500">
                            <div className="flex items-center">
                                <MapPinIcon className="w-4 h-4 text-gray-500 mr-2" />
                                <span>{storeInfo.address}</span>
                            </div>
                            <div className="flex items-center">
                                <MailIcon className="w-4 h-4 text-gray-500 mr-2" />
                                <span>{storeInfo.email}</span>
                            </div>
                            {rawContact && (
                                <div className="flex items-center">
                                    <PhoneIcon className="w-4 h-4 text-gray-500 mr-2" />
                                    <span>{rawContact}</span>
                                </div>
                            )}
                        </div>
                        {rawContact && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                <a
                                    href={`tel:${telContact}`}
                                    className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700"
                                >
                                    <PhoneCallIcon size={14} />
                                    Call Store
                                </a>
                                <a
                                    href={`https://wa.me/${whatsappContact}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-500"
                                >
                                    <MessageCircleIcon size={14} />
                                    WhatsApp
                                </a>
                            </div>
                        )}
                        </div>
                </div>
            )}

            {/* Products */}
            <div className=" max-w-7xl mx-auto mb-40">
                <h1 className="text-2xl mt-12">Shop <span className="text-slate-800 font-medium">Products</span></h1>
                <div className="mt-5 grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12 mx-auto">
                    {products.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
            </div>
        </div>
    ) : <Loading />
}
