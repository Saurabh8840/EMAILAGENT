// /api/aurinko/callback

import { auth } from "@clerk/nextjs/server";
import { NextRequest,NextResponse } from "next/server";

export const GET=async (req: NextRequest) => {
    const {userId}=await auth();
    if(!userId){
        return new Response('message:"Not authenticated',{status:401});

        const params=new URL(req.url).searchParams;

    }

    console.log("userId:",userId);
}