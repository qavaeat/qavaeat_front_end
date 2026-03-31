// src/lib/supabase-upload.ts
// ─────────────────────────────────────────────────────────────
// FILE UPLOAD UTILITY
//
// Uses Supabase Storage to upload files and return public URLs.
// Replace NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
// in your .env.local once you create your Supabase project.
//
// Bucket names used:
//   chef-profiles      → profile photos
//   chef-kitchens      → kitchen / working area photos
//   chef-menus         → sample menu photos
//   chef-documents     → national IDs + business permits
//
// Until you have Supabase set up, uploadFile() returns a
// dummy placeholder URL so the rest of the form works.
// ─────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Returns null client when env vars are missing (dummy mode)
const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

export type UploadBucket =
  | "chef-profiles"
  | "chef-kitchens"
  | "chef-menus"
  | "chef-documents";

export async function uploadFile(
  bucket: UploadBucket,
  file: File,
  pathPrefix = ""
): Promise<string> {
  // ── DUMMY MODE (no Supabase configured yet) ──
  if (!supabase) {
    console.warn(
      "[uploadFile] Supabase not configured — returning dummy URL."
    );
    // Simulate upload delay
    await new Promise((r) => setTimeout(r, 600));
    return `https://via.placeholder.com/400x300?text=${encodeURIComponent(
      file.name
    )}`;
  }

  // ── REAL UPLOAD ──
  const ext = file.name.split(".").pop();
  const filename = `${pathPrefix}${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, file, { upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}