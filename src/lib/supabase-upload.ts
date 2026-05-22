export type UploadBucket =
  | "chef-profiles"
  | "chef-kitchens"
  | "chef-menus"
  | "chef-documents"
  | "user-avatars";

export async function uploadFile(
  bucket: UploadBucket,
  file: File,
  pathPrefix = "",
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("pathPrefix", pathPrefix);

  const res = await fetch(`/api/upload/${bucket}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error ?? "Upload failed");
  }

  const { url } = await res.json();
  return url;
}
