import { imagekit, UPLOAD_PRE_TRANSFORMATION, buildImageUrl } from '@/configs/imageKit';
import { prisma } from '@/lib/prisma';
import { validateStoreSubmission } from '@/lib/validators';
import {getAuth} from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// create store

export async function POST (request){
    try{
        const {userId} = getAuth(request)
        if(!userId){
            return NextResponse.json({error:"Unauthorized"}, {status:401})
        }

        // getting data from form
        const formData = await request.formData()

        // Full validation + normalization (required fields, email, Ghana phone,
        // course ID with admission year, campus allow-list, image MIME/size).
        const result = validateStoreSubmission({
            name: formData.get('name'),
            username: formData.get('username'),
            description: formData.get('description'),
            email: formData.get('email'),
            contact: formData.get('contact'),
            address: formData.get('address'),
            campus: formData.get('campus'),
            course: formData.get('course'),
            image: formData.get('image'),
        })

        if (!result.valid){
            return NextResponse.json({error: result.error, errors: result.errors}, {status:400})
        }

        const { name, username: userName, description, email, contact, address, campus, course, image } = result.value

        // check duplicate courseID
        const existingCourseId = await prisma.store.findFirst({
            where: {courseId:course}
        })

        if (existingCourseId){
            return NextResponse.json(
            {error:"Course ID already registered to a store"}, 
            {status:400})
        }

        // check user is already a registered store

        const store = await prisma.store.findFirst({
            where:{userId: userId}
        }) 

        // if store is already registered send status

        if (store){
            return NextResponse.json({status:store.status})
        }

        // check if store name is taken already

        const isUsernameTaken = await prisma.store.findFirst({
            where:{username: userName.toLowerCase()}
        })

        if (isUsernameTaken){
            return NextResponse.json({error:"username already taken"},{status:400})
        }

        // image upload kit
        const buffer = Buffer.from(await image.arrayBuffer());

        // convert buffer to base64
        const base64File = buffer.toString('base64');

        const response = await imagekit.files.upload({
            file:base64File,
            fileName: image.name,
            folder: 'logos',
            // Same ingest optimization as product images: resize <=1600px,
            // auto quality, WebP, EXIF orientation normalized.
            transformation: { pre: UPLOAD_PRE_TRANSFORMATION },
        });

        const optimizedImage = buildImageUrl(response.filePath, response.url);

        const newStore = await prisma.store.create({
            data:{
                userId,
                name,
                username: userName.toLowerCase(),
                email,
                contact,
                address,
                campus,
                courseId: course,
                description,
                logo: optimizedImage
            }
        })

        // link store to user
        await prisma.user.update({
            where: {id: userId},
            data: {store: {connect:{id: newStore.id}}}
        })
        return NextResponse.json({message: 'applied waiting for approval'})
    } catch(error){
        console.log(error);
        return NextResponse.json({error: error.code || error.message}, {status: 400})
    }
}


// check status of store (ifRegistered) and send results

export async function GET(request) {
    try{
        const {userId} = getAuth(request);
        if(!userId){
            return NextResponse.json({error:"Unauthorized"}, {status:401})
        }

        // check user is already a registered store

        const store = await prisma.store.findFirst({
            where:{userId: userId}
        })

        // if store is already registered send status

        if (store){
            return NextResponse.json({status:store.status})
        }

        return NextResponse.json({status:"not registered"})
    }catch(error){
        console.error(error);
        return NextResponse.json({error: error.code || error.message}, {status: 400})
    }
}
