'use client'
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { addAddress } from "@/lib/features/address/addressSlice";
import { validateCourseId } from "@/lib/utils/courseId";
import { XIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { useDispatch } from "react-redux"

const AddressModal = ({ setShowAddressModal }) => {
    const campusOptions = ["Nyankpala", "Dungu", "City"];

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

    const handleAddressChange = (e) => {
        setAddress({
            ...address,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const { isValid, courseId, error } = validateCourseId(address.course);
            if (!isValid) {
                toast.error(error);
                return;
            }

            const token = await getToken()
            const payload = { ...address, course: courseId };
            const {data} =  await axios.post('/api/address', { address: payload }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            dispatch(addAddress(data.newAddress))
            toast.success(data.message || "Address added successfully")
            setShowAddressModal(false) 
        } catch (error) {
            console.log(error);
            
            toast.error(error?.response?.data?.error || error.message)
        }
        // setShowAddressModal(false)
    }

    return (
        <form onSubmit={e => toast.promise(handleSubmit(e), { loading: 'Adding Address...' })} className="fixed inset-0 z-50 bg-white/60 backdrop-blur h-screen flex items-center justify-center">
            <div className="flex flex-col gap-5 text-slate-700 w-full max-w-sm mx-6">
                <h2 className="text-3xl ">Add New <span className="font-semibold">Address</span></h2>
                <input name="name" onChange={handleAddressChange} value={address.name} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="Enter your name" required />
                <input name="email" onChange={handleAddressChange} value={address.email} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="email" placeholder="Email address" required />
                <select
                    name="campus"
                    onChange={handleAddressChange}
                    value={address.campus}
                    className="p-2 px-4 outline-none border border-slate-200 rounded w-full bg-white text-slate-700"
                    required
                >
                    <option value="" disabled>Select campus</option>
                    {campusOptions.map((campus) => (
                        <option key={campus} value={campus}>{campus}</option>
                    ))}
                </select>
                <input name="hostel" onChange={handleAddressChange} value={address.hostel} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="Hostel" required />
                <input name="course" onChange={handleAddressChange} value={address.course} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="Course ID (e.g. DSP/0001/23)" required />
                <input name="phone" onChange={handleAddressChange} value={address.phone} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="Phone" required />
                <button className="bg-slate-800 text-white text-sm font-medium py-2.5 rounded-md hover:bg-slate-900 active:scale-95 transition-all">SAVE ADDRESS</button>
            </div>
            <XIcon size={30} className="absolute top-5 right-5 text-slate-500 hover:text-slate-700 cursor-pointer" onClick={() => setShowAddressModal(false)} />
        </form>
    )
}

export default AddressModal
