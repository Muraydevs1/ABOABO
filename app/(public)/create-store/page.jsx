'use client'
import { assets } from "@/assets/assets"
import { useEffect, useState } from "react"
import Image from "next/image"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import { useRouter } from "next/navigation"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import { validateStoreSubmission } from "@/lib/validators"
import { CAMPUS_OPTIONS } from "@/lib/constants"

export default function CreateStore() {
    const campusOptions = CAMPUS_OPTIONS
    const {user} =useUser();
    const router = useRouter()
    const {getToken} = useAuth()
    const [alreadySubmitted, setAlreadySubmitted] = useState(false)
    const [status, setStatus] = useState("")
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState("")

    const [storeInfo, setStoreInfo] = useState({
        name: "",
        username: "",
        description: "",
        email: "",
        contact: "",
        address: "",
        campus: "",
        image: "",
        course: ""
    })
    const [errors, setErrors] = useState({})

    const onChangeHandler = (e) => {
        setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value })
        // clear the field's error as soon as the user edits it
        if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: null }))
    }

    const inputClass = (field) =>
        `border outline-slate-400 w-full max-w-lg p-2 rounded ${errors[field] ? 'border-red-400' : 'border-slate-300'}`

    const FieldError = ({ field }) => errors[field]
        ? <p className="text-xs text-red-500">{errors[field]}</p>
        : null

    const fetchSellerStatus = async () => {
        // Logic to check if the store is already submitted
        const token = await getToken();
        try{
            const {data} = await axios.get('/api/store/create', {
                headers: {Authorization: `Bearer ${token}`}
            })
            if(['approved', 'rejected', 'pending'].includes(data.status)){
                setStatus(data.status)
                setAlreadySubmitted(true)
                switch (data.status) {
                    case "approved":
                        setMessage("Your Store has been approved, you can now add products to your store from dashboard")
                        setTimeout(() => router.push('/store'), 5000);
                        break;

                    case "rejected":
                        setMessage("Your Store request has been rejected, contact Admin for details")
                        break;
                    
                    case "pending":
                        setMessage("Your Store request has been pending, please wait for Admin's approval")
                        break;    
                
                    default:
                        break;
                }
            } else{
                setAlreadySubmitted(false)
            }
        } catch(error){
            toast.error(error?.response?.data?.error || error.message)
        }

        setLoading(false)
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        // Logic to submit the store details
        if(!user){
            return toast("please login to continue")
        }

        // Client-side validation with inline errors — same rules the API
        // enforces. The form data is never cleared on failure.
        const result = validateStoreSubmission(storeInfo)
        if (!result.valid) {
            setErrors(result.errors)
            toast.error(result.error)
            return
        }
        setErrors({})

        try {
            const token = await getToken();
            const formData = new FormData();
            // send the normalized values (trimmed, phone as 0XXXXXXXXX, course ID uppercased)
            formData.append("name", result.value.name)
            formData.append("description", result.value.description)
            formData.append("username", result.value.username)
            formData.append("email", result.value.email)
            formData.append("address", result.value.address)
            formData.append("campus", result.value.campus)
            formData.append("contact", result.value.contact)
            formData.append("image", result.value.image)
            formData.append("course", result.value.course)

            const {data} = await axios.post('/api/store/create', formData,
                {headers: {Authorization: `Bearer ${token}`}})
            toast.success(data.message)
            await fetchSellerStatus()
        } catch (error) {
            if (error?.response?.data?.errors) setErrors(error.response.data.errors)
            toast.error(error?.response?.data?.error || error.message)
        }

    }

    useEffect(() => {
        if (user){
            fetchSellerStatus()
        }
    }, [user])

    if(!user){
        return(
            <div className="min-h-[80h] mx-6 flex items-center justify-center">
                <h1 className="text-2xl sm:text-4xl font-semibold">Please  <span className="text-slate-500">Login</span> to Continue</h1>
            </div>
        )
    }

    return !loading ? (
        <>
            {!alreadySubmitted ? (
                <div className="mx-6 min-h-[70vh] my-16">
                    <form onSubmit={e => toast.promise(onSubmitHandler(e), { loading: "Submitting data..." })} className="max-w-7xl mx-auto flex flex-col items-start gap-3 text-slate-500">
                        {/* Title */}
                        <div>
                            <h1 className="text-3xl ">Add Your <span className="text-slate-800 font-medium">Store</span></h1>
                            <p className="max-w-lg">To become a seller on AboaBo, submit your store details for review. Your store will be activated after admin verification.</p>
                        </div>

                        <label className="mt-10 cursor-pointer">
                            Store Logo
                            <Image src={storeInfo.image ? URL.createObjectURL(storeInfo.image) : assets.upload_area} className="rounded-lg mt-2 h-16 w-auto" alt="" width={150} height={100} />
                            <input type="file" accept="image/*" onChange={(e) => { setStoreInfo({ ...storeInfo, image: e.target.files[0] }); if (errors.image) setErrors((prev) => ({ ...prev, image: null })) }} hidden />
                        </label>
                        <FieldError field="image" />

                        <p>Username</p>
                        <input name="username" onChange={onChangeHandler} value={storeInfo.username} type="text" placeholder="Enter your store username" className={inputClass('username')} />
                        <FieldError field="username" />

                        <p>Name</p>
                        <input name="name" onChange={onChangeHandler} value={storeInfo.name} type="text" placeholder="Enter your store name" className={inputClass('name')} />
                        <FieldError field="name" />

                        <p>Course ID</p>
                        <input name="course" onChange={onChangeHandler} value={storeInfo.course} type="text" placeholder="Enter your Course ID (e.g. CSC/0012/23)" className={inputClass('course')} />
                        <FieldError field="course" />

                        <p>Description</p>
                        <textarea name="description" onChange={onChangeHandler} value={storeInfo.description} rows={5} placeholder="Enter your store description" className={`${inputClass('description')} resize-none`} />
                        <FieldError field="description" />

                        <p>Email</p>
                        <input name="email" onChange={onChangeHandler} value={storeInfo.email} type="email" placeholder="Enter your email" className={inputClass('email')} />
                        <FieldError field="email" />

                        <p>Contact Number</p>
                        <input name="contact" onChange={onChangeHandler} value={storeInfo.contact} type="tel" placeholder="e.g. 0241234567" className={inputClass('contact')} />
                        <FieldError field="contact" />

                        <p>Campus</p>
                        <select name="campus" onChange={onChangeHandler} value={storeInfo.campus} className={`${inputClass('campus')} bg-white`} required>
                            <option value="" disabled>Select campus</option>
                            {campusOptions.map((campus) => (
                                <option key={campus} value={campus}>{campus}</option>
                            ))}
                        </select>
                        <FieldError field="campus" />

                        <p>Address</p>
                        <textarea name="address" onChange={onChangeHandler} value={storeInfo.address} rows={5} placeholder="Enter your address/Location" className={`${inputClass('address')} resize-none`} />
                        <FieldError field="address" />

                        <button className="bg-slate-800 text-white px-12 py-2 rounded mt-10 mb-40 active:scale-95 hover:bg-slate-900 transition ">Submit</button>
                    </form>
                </div>
            ) : (
                <div className="min-h-[80vh] flex flex-col items-center justify-center">
                    <p className="sm:text-2xl lg:text-3xl mx-5 font-semibold text-slate-500 text-center max-w-2xl">{message}</p>
                    {status === "approved" && <p className="mt-5 text-slate-400">redirecting to dashboard in <span className="font-semibold">5 seconds</span></p>}
                </div>
            )}
        </>
    ) : (<Loading />)
}
