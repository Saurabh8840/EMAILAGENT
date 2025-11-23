


// @ts-nocheck
import { Webhook } from "svix";
import { headers } from "next/headers";
import { db } from "@/server/db";

export async function POST(req: Request) {
  try {
    const payload = await req.text();
    const heads = await headers();

    // Required headers
    const svix_id = heads.get("svix-id");
    const svix_timestamp = heads.get("svix-timestamp");
    const svix_signature = heads.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.log("Missing svix headers");
      return new Response("Missing svix headers", { status: 400 });
    }

    // Verify signature
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
    const event = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });

    const data = event.data;

    // Extract correct email
    const primaryEmail = data.email_addresses?.find(
      (e) => e.id === data.primary_email_address_id
    )?.email_address;

    // Example/test events have no email → skip safely
    if (!primaryEmail) {
      console.log("⏭ Skipped (no email) – likely test example event");
      return new Response("OK", { status: 200 });
    }

    // Sync user → DB (idempotent)
    await db.user.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        emailAddress: primaryEmail,
        imageUrl: data.image_url,
      },
      update: {
        firstName: data.first_name,
        lastName: data.last_name,
        emailAddress: primaryEmail,
        imageUrl: data.image_url,
      },
    });

    console.log("User synced:", data.id);
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response("Webhook error", { status: 400 });
  }
}
