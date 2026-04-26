'use client'
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import ProductCard from "@/components/ProductCard";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

export default function Product() {

    const { productId } = useParams();
    const [product, setProduct] = useState();
    const products = useSelector(state => state.product.list);
    const relatedProducts = useMemo(() => {
        if (!product) return [];
        return products
            .filter((item) => item.id !== product.id)
            .filter(
                (item) =>
                    item.category === product.category ||
                    item.storeId === product.storeId
            )
            .slice(0, 4);
    }, [product, products]);

    const fetchProduct = async () => {
        const product = products.find((product) => product.id === productId);
        setProduct(product);
    }

    useEffect(() => {
        if (products.length > 0) {
            fetchProduct()
        }
        scrollTo(0, 0)
    }, [productId,products]);

    return (
        <div className="mx-6">
            <div className="max-w-7xl mx-auto">

                {/* Breadcrums */}
                <div className="  text-gray-600 text-sm mt-8 mb-5">
                    Home / Products / {product?.category}
                </div>

                {/* Product Details */}
                {product && (<ProductDetails product={product} />)}

                {/* Description & Reviews */}
                {product && (<ProductDescription product={product} />)}

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="my-14">
                        <h2 className="text-2xl text-slate-800 font-medium mb-5">Related Products</h2>
                        <div className="grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12">
                            {relatedProducts.map((relatedProduct) => (
                                <ProductCard key={relatedProduct.id} product={relatedProduct} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
