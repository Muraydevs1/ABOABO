import { imagekit } from '@/configs/imageKit';
import { prisma } from '@/lib/prisma';
import { validateCourseId } from '@/lib/utils/courseId';
import {getAuth} from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const ALLOWED_CAMPUSES = ["Nyankpala", "Dungu", "City"];

// create store

export async function POST (request){
    try{
        const {userId} = getAuth(request)

        // getting data from form
        const formData = await request.formData()

        const name = formData.get('name')
        const userName = formData.get('username')
        const description = formData.get('description')
        const email = formData.get('email')
        const contact = formData.get('contact')
        const address = formData.get('address')
        const campus = formData.get('campus')?.trim()
        const courseRaw = formData.get('course')
        const image = formData.get('image')

        const { isValid, courseId: course, error: courseIdError } = validateCourseId(courseRaw || "")

        if (!name || !userName || !description || !email || !contact || !address || !campus || !image || !courseRaw){
            return NextResponse.json({error:"Missing Store Info"}, {status:400})
        }

        if (!ALLOWED_CAMPUSES.includes(campus)) {
            return NextResponse.json({error: "Invalid campus selected"}, {status:400})
        }

        if (!isValid){
            return NextResponse.json(
                {error: courseIdError},
                {status:400}
            )
        }


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
            folder: 'logos'
        });

        const optimizedImage = response.url;

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
