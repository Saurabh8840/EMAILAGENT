
// // @ts-nocheck
// import { Webhook } from "svix";
// import { headers } from "next/headers";
// import { db } from "@/server/db";

// export async function POST(req: Request) {
//   try {
//     const payload = await req.text();
//     const heads = await headers();

//     // Required headers
//     const svix_id = heads.get("svix-id");
//     const svix_timestamp = heads.get("svix-timestamp");
//     const svix_signature = heads.get("svix-signature");

//     if (!svix_id || !svix_timestamp || !svix_signature) {
//       console.log("Missing svix headers");
//       return new Response("Missing svix headers", { status: 400 });
//     }

//     // Verify signature
//     const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
//     const event = wh.verify(payload, {
//       "svix-id": svix_id,
//       "svix-timestamp": svix_timestamp,
//       "svix-signature": svix_signature,
//     });

//     const data = event.data;

//     // Extract correct email
//     const primaryEmail = data.email_addresses?.find(
//       (e) => e.id === data.primary_email_address_id
//     )?.email_address;

//     // Example/test events have no email → skip safely
//     if (!primaryEmail) {
//       console.log(" Skipped (no email) - likely test example event");
//       return new Response("OK", { status: 200 });
//     }

//     // Sync user → DB (idempotent)
//     await db.user.upsert({
//       where: { id: data.id },
//       create: {
//         id: data.id,
//         firstName: data.first_name,
//         lastName: data.last_name,
//         emailAddress: primaryEmail,
//         imageUrl: data.image_url,
//       },
//       update: {
//         firstName: data.first_name,
//         lastName: data.last_name,
//         emailAddress: primaryEmail,
//         imageUrl: data.image_url,
//       },
//     });

//     console.log("User synced:", data.id);
//     return new Response("OK", { status: 200 });
//   } catch (err) {
//     console.error("Webhook Error:", err);
//     return new Response("Webhook error", { status: 400 });
//   }
// }



import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server"; // Type import kiya
 // Type import kiya
import { db } from "@/server/db";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env");
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error: Verification failed", { status: 400 });
  }

  // Handle the event
  const eventType = evt.type;

  // Sirf Create aur Update par hi DB logic chalana hai
  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url, primary_email_address_id } = evt.data;

    // Aapka Logic: Find Primary Email (Perfect logic!)
    const primaryEmail = email_addresses?.find(
      (e) => e.id === primary_email_address_id
    )?.email_address;

    if (!primaryEmail) {
      return new Response("No primary email found", { status: 400 });
    }

    // DB Upsert
    await db.user.upsert({
      where: { id: id },
      create: {
        id: id,
        firstName: first_name ?? "",
        lastName: last_name ?? "",
        emailAddress: primaryEmail,
        imageUrl: image_url ?? "",
      },
      update: {
        firstName: first_name ?? "",
        lastName: last_name ?? "",
        emailAddress: primaryEmail,
        imageUrl: image_url ?? "",
      },
    });
    console.log(`User ${id} synced successfully`);
  } 
  
  // Optional: Delete handle karna hai to
  else if (eventType === "user.deleted") {
      const { id } = evt.data;
      if(id) {
          await db.user.delete({ where: { id } }).catch(() => {}); // catch error if user not found
          console.log(`User ${id} deleted`);
      }
  }

  return new Response("Webhook received", { status: 200 });
}