import { openai } from "@/configs/openAi";
import { AI_SAFE_IMAGE_TYPES } from "@/lib/utils/fieldValidation";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { rateLimit, tooManyRequestsResponse } from "@/lib/rateLimit";

async function main(base64Image, mimeType) {
     const messages = [
    {
      "role": "system",  
      "content":`
        you are a product listing assistant for an e-commerce platform. 
        Your task is to analyze the provided image and generate structured data.
        respond only with raw JSON (no code block, no markdown, no explanation) the jSON should follow the schema:
        {
        "name": string, // A concise and descriptive name for the product.
        "description": string, // market friendly description of the product.}
      `
    },    
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Analyze this image and return name + description.",
        },
        {
          "type": "image_url",
          "image_url": {
            "url": `data:${mimeType};base64,${base64Image}`
          },
        },
      ],
    }
  ];
  const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages,
    });

    const raw = response.choices[0].message.content

    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim()
    let parsed;
    try {
        parsed = JSON.parse(cleaned)
    } catch (error) {
        console.error("Failed to parse JSON:", error);
        throw new Error("Failed to parse AI response");
    }
    return parsed
}

export async function POST(request) {
    try{
        const {userId} = getAuth(request)
        if(!userId){
            return NextResponse.json({error:"Unauthorized"}, {status:401})
        }
        const isSeller = await authSeller(userId)
        if(!isSeller){
            return NextResponse.json({error:"not authorised"}, {status:401})
        }

        // Rate limit: this endpoint calls a paid AI model. 10 requests / minute / user.
        const limit = rateLimit({ key: `ai:${userId}`, limit: 10, windowMs: 60_000 })
        if (!limit.success) {
            return tooManyRequestsResponse(limit.retryAfterMs)
        }

        const {base64Image, mimeType} = await request.json();

        // Validate before spending AI credits: image type allow-list and a
        // size cap (~10MB of base64) so the endpoint can't be abused.
        if (!AI_SAFE_IMAGE_TYPES.includes(mimeType)) {
            return NextResponse.json({error: "Image must be a JPEG, PNG, WebP, GIF or AVIF"}, {status: 400});
        }
        if (typeof base64Image !== 'string' || base64Image.length === 0 || base64Image.length > 14_000_000) {
            return NextResponse.json({error: "Invalid or oversized image data"}, {status: 400});
        }

        const result = await main(base64Image, mimeType)
        return NextResponse.json({...result})
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: error.code || error.message}, {status: 400});
    }
}