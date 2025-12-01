// /api/aurinko/callback

import { auth } from "@clerk/nextjs/server";
import { NextRequest,NextResponse } from "next/server";

export const GET=async (req: NextRequest) => {
    const {userId}=await auth();
    if(!userId){
        return new Response('message:"Not authenticated',{status:401});

        const params=new URL(req.url).searchParams;

    }

    const params=new URL(req.url).searchParams;
    const status=params.get("status");
    if(status!=="success"){
        return new Response('message:"Authorization failed',{status:400});
    }

    const code=params.get('code');
    if(!code){
        return NextResponse.json({message:"Missing code"}, {status:400});
    }

    


    console.log("userId:",userId);
}