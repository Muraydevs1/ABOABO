'use client'
import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "@/lib/features/product/productSlice";
import { useAuth, useUser } from "@clerk/nextjs";
import { fetchCart, uploadCart } from "@/lib/features/cart/cartSlice";
import { fetchAddress } from "@/lib/features/address/addressSlice";
import { fetchUserRatings } from "@/lib/features/rating/ratingSlice";

export default function PublicLayout({ children }) {

    const dispatch = useDispatch()
    const { isSignedIn } = useUser()
    const {getToken} = useAuth()

    const {cartItems, hasFetchedCart} = useSelector((state)=>state.cart)

    useEffect(() => {
        dispatch(fetchProducts({}))
    }, []);

    useEffect(() => {
        if(isSignedIn){
            dispatch(fetchCart({getToken}))
            dispatch(fetchAddress({getToken}))
            dispatch(fetchUserRatings({getToken}))
        }
    }, [dispatch, getToken, isSignedIn]);

    useEffect(() => {
        if(isSignedIn && hasFetchedCart){
            dispatch(uploadCart({getToken}))
        }
    }, [cartItems, dispatch, getToken, hasFetchedCart, isSignedIn]);


    return (
        <>
            <Banner />
            <Navbar />
            {children}
            <Footer />
        </>
    );
}
