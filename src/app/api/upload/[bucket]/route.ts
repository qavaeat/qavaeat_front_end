
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const ALLOWED_BUCKETS = [
  "chef-profiles",
  "chef-kitchens",
  "chef-menus",
  "chef-documents",
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bucket: string }> }  // 👈 now a Promise
) {
  const { bucket } = await params;  // 👈 await it

  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const pathPrefix = (formData.get("pathPrefix") as string) ?? "";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const filename = `${pathPrefix}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filename, buffer, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filename);
  return NextResponse.json({ url: data.publicUrl });
}