import { openai } from "@/configs/openAi";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
        const isSeller = await authSeller(userId)
        if(!isSeller){
            return NextResponse.json({error:"not authorised"}, {status:401})
        }
        const {base64Image, mimeType} = await request.json();
        const result = await main(base64Image, mimeType)
        return NextResponse.json({...result})
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: error.code || error.message}, {status: 400});
    }
}