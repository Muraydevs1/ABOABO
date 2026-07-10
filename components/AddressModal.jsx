'use client'
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { addAddress } from "@/lib/features/address/addressSlice";
import { validateAddress } from "@/lib/validators";
import { CAMPUS_OPTIONS } from "@/lib/constants";
import { XIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { useDispatch } from "react-redux"

const AddressModal = ({ setShowAddressModal }) => {
    const campusOptions = CAMPUS_OPTIONS;

    const {getToken} = useAuth()
    const dispatch = useDispatch()

    const [address, setAddress] = useState({
        name: '',
        email: '',
        campus: '',
        hostel: '',
        course: '',
        phone: ''
    })
    const [errors, setErrors] = useState({})

    const handleAddressChange = (e) => {
        setAddress({
            ...address,
            [e.target.name]: e.target.value
        })
        // clear the field's error as soon as the user edits it
        if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: null }))
    }

    const inputClass = (field) =>
        `p-2 px-4 outline-none border rounded w-full ${errors[field] ? 'border-red-400' : 'border-slate-200'}`

    const FieldError = ({ field }) => errors[field]
        ? <p className="-mt-3 text-xs text-red-500">{errors[field]}</p>
        : null

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            // Client-side validation with inline errors — same rules the API
            // enforces. The form data is never cleared on failure.
            const result = validateAddress(address);
            if (!result.valid) {
                setErrors(result.errors);
                toast.error(result.error);
                return;
            }
            setErrors({})

            const token = await getToken()
            // send the normalized values (trimmed, phone as 0XXXXXXXXX, course ID uppercased)
            const {data} =  await axios.post('/api/address', { address: result.value }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            dispatch(addAddress(data.newAddress))
            toast.success(data.message || "Address added successfully")
            setShowAddressModal(false)
        } catch (error) {
            console.log(error);
            if (error?.response?.data?.errors) setErrors(error.response.data.errors)
            toast.error(error?.response?.data?.error || error.message)
        }
        // setShowAddressModal(false)
    }

    return (
        <form onSubmit={e => toast.promise(handleSubmit(e), { loading: 'Adding Address...' })} className="fixed inset-0 z-50 bg-white/60 backdrop-blur h-screen flex items-center justify-center">
            <div className="flex flex-col gap-5 text-slate-700 w-full max-w-sm mx-6">
                <h2 className="text-3xl ">Add New <span className="font-semibold">Address</span></h2>
                <input name="name" onChange={handleAddressChange} value={address.name} className={inputClass('name')} type="text" placeholder="Enter your name" required />
                <FieldError field="name" />
                <input name="email" onChange={handleAddressChange} value={address.email} className={inputClass('email')} type="email" placeholder="Email address" required />
                <FieldError field="email" />
                <select
                    name="campus"
                    onChange={handleAddressChange}
                    value={address.campus}
                    className={`${inputClass('campus')} bg-white text-slate-700`}
                    required
                >
                    <option value="" disabled>Select campus</option>
                    {campusOptions.map((campus) => (
                        <option key={campus} value={campus}>{campus}</option>
                    ))}
                </select>
                <FieldError field="campus" />
                <input name="hostel" onChange={handleAddressChange} value={address.hostel} className={inputClass('hostel')} type="text" placeholder="Hostel" required />
                <FieldError field="hostel" />
                <input name="course" onChange={handleAddressChange} value={address.course} className={inputClass('course')} type="text" placeholder="Course ID (e.g. DSP/0001/23)" required />
                <FieldError field="course" />
                <input name="phone" onChange={handleAddressChange} value={address.phone} className={inputClass('phone')} type="tel" placeholder="Phone (e.g. 0241234567)" required />
                <FieldError field="phone" />
                <button className="bg-slate-800 text-white text-sm font-medium py-2.5 rounded-md hover:bg-slate-900 active:scale-95 transition-all">SAVE ADDRESS</button>
            </div>
            <XIcon size={30} className="absolute top-5 right-5 text-slate-500 hover:text-slate-700 cursor-pointer" onClick={() => setShowAddressModal(false)} />
        </form>
    )
}

export default AddressModal
