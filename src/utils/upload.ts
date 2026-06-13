import { supabase } from "./supabase";

export function compressImage(file: File, maxPx = 1920, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) return Promise.resolve(file);
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / img.width, maxPx / img.height);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export async function uploadFile(file: File): Promise<string> {
  const ready = await compressImage(file);
  const ext = ready.name.split(".").pop() ?? "bin";
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("vc-media").upload(path, ready);
  if (error) throw new Error(error.message);
  return supabase.storage.from("vc-media").getPublicUrl(path).data.publicUrl;
}
