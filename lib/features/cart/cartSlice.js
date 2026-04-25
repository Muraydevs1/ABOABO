import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

export const uploadCart = createAsyncThunk('cart/uploadCart',
    async ({getToken}, thunkAPI)=>{
        try{
            const {cartItems} = thunkAPI.getState().cart
            const token = await getToken();
            await axios.post('/api/cart', {cart: cartItems}, {headers:{
                Authorization: `Bearer ${token}`
            }})
        } catch(error){
            return thunkAPI.rejectWithValue(error?.response?.data || { error: 'Failed to upload cart' })
        }
    }
)

export const fetchCart = createAsyncThunk('cart/fetchCart',
    async ({getToken}, thunkAPI)=>{
        try{
            const token = await getToken()
            const {data} = await axios.get('/api/cart',{headers:{
                Authorization:`Bearer ${token}`
            }})
            return data
        } catch(error){
            return thunkAPI.rejectWithValue(error?.response?.data || { error: 'Failed to fetch cart' })
        }
    }
)

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        total: 0,
        cartItems: {},
        hasFetchedCart: false,
    },
    reducers: {
        addToCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                state.cartItems[productId]++
            } else {
                state.cartItems[productId] = 1
            }
            state.total += 1
        },
        removeFromCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                state.cartItems[productId]--
                if (state.cartItems[productId] === 0) {
                    delete state.cartItems[productId]
                }
            }
            state.total -= 1
        },
        deleteItemFromCart: (state, action) => {
            const { productId } = action.payload
            state.total -= state.cartItems[productId] ? state.cartItems[productId] : 0
            delete state.cartItems[productId]
        },
        clearCart: (state) => {
            state.cartItems = {}
            state.total = 0
        },
    },
    extraReducers: (builder)=>{
        builder.addCase(fetchCart.fulfilled, (state, action)=>{
            const cart = action.payload?.cart
            state.cartItems = cart && !Array.isArray(cart) ? cart : {}
            state.total = Object.values(state.cartItems).reduce((acc, item)=>
                acc + item, 0)
            state.hasFetchedCart = true
        })
        builder.addCase(fetchCart.rejected, (state) => {
            state.hasFetchedCart = true
        })
    }
})

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart } = cartSlice.actions

export default cartSlice.reducer
