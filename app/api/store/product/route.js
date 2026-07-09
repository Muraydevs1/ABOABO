import { imagekit, UPLOAD_PRE_TRANSFORMATION, buildImageUrl } from '@/configs/imageKit';
import { prisma } from '@/lib/prisma';
import authSeller from '@/middlewares/authSeller';
import {getAuth} from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';


// Add new product

export async function POST(request) {
    try{
        const {userId} = getAuth(request);
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({error: "not authorized"}, {status: 401})
        }

        // get data from the form
        const formData = await request.formData();
        const name = formData.get('name')
        const description = formData.get('description')
        const mrp = Number(formData.get('mrp'))
        const price = Number(formData.get('price'))
        const images = formData.getAll('images').filter((image) => image instanceof File && image.size > 0)
        const category = formData.get('category')

        if(!name || !description || Number.isNaN(mrp) || Number.isNaN(price) || images.length < 1 || !category){
            return NextResponse.json({error: 'Missing product info or image file'}, {status:400})
        }

        // Uploading Images to Imagekit
            const imagesUrl = await Promise.all(images.map(async(image, index) => {
            const buffer = Buffer.from(await image.arrayBuffer());
            const base64File = buffer.toString('base64');
            const response = await imagekit.files.upload({
                file: base64File,
                fileName: image.name || `${name}-${index + 1}`,
                folder: "products",
                // Optimize at ingest: resize to <=1600px, auto quality, WebP,
                // EXIF orientation normalized. Shared strategy from configs/imageKit.
                transformation: { pre: UPLOAD_PRE_TRANSFORMATION },
            })
            const url = buildImageUrl(response.filePath, response.url)
            return url
        }))

        await prisma.product.create({
            data:{
                name,
                description,
                mrp,
                price,
                category,
                images: imagesUrl,
                storeId
            }
        })

        return NextResponse.json({message: "Product added sucessfully"})

    } catch (error) {
        console.log(error)
        return NextResponse.json({error:error.code || error.message}, {status:400})

    }
}

// get all products from seller

export async function GET(request) {
    try{
        const {userId} = getAuth(request);
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({error: "not authorized"}, {status: 401})
        } 
        const products = await prisma.product.findMany({where: {storeId}})
        return NextResponse.json({products})
    } catch(error){
        console.log(error)
        return NextResponse.json({error:error.code || error.message}, {status:400})
    }
}
