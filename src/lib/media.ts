import { REMOTE, SUPABASE_URL } from "./mode";
import { sb } from "./supabase";

const BUCKET = "invitation-media";
const PHOTO_SIDE = 1280;

/** Batas ukuran musik. Di mode demo file disimpan di browser, jadi dibatasi lebih kecil. */
export const MUSIC_LIMIT = REMOTE ? 6 * 1024 * 1024 : 1024 * 1024;
export const MUSIC_LIMIT_LABEL = REMOTE ? "6 MB" : "1 MB";

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Gagal membaca file."));
    r.readAsDataURL(b);
  });

/** Foto dikecilkan di browser supaya cepat dibuka tamu dan hemat kuota penyimpanan. */
export async function compressImage(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Pakai foto JPG, PNG, atau WebP.");
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    throw new Error("Foto ini tidak bisa dibuka. Coba foto lain.");
  }
  const scale = Math.min(1, PHOTO_SIDE / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Foto ini tidak bisa diproses.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.78));
  if (!blob) throw new Error("Foto ini tidak bisa diproses.");
  return blob;
}

const rand = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/** Mengunggah satu file dan mengembalikan alamat yang bisa dibuka siapa pun lewat link undangan. */
export async function uploadMedia(weddingId: string, kind: "foto" | "musik", blob: Blob, ext: string): Promise<string> {
  if (REMOTE && sb) {
    const path = `${weddingId}/${kind}-${rand()}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || undefined, cacheControl: "31536000", upsert: false });
    if (error) throw new Error("File belum terunggah. Cek koneksi lalu coba lagi.");
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
  return blobToDataUrl(blob);
}

/** Menghapus file lama dari penyimpanan. Gagal tidak mengganggu pasangan, file yatim hanya memakan sedikit ruang. */
export async function removeMedia(urls: string[]): Promise<void> {
  if (!REMOTE || !sb || !SUPABASE_URL) return;
  const marker = `/object/public/${BUCKET}/`;
  const paths = urls
    .map((u) => {
      const i = u.indexOf(marker);
      return i < 0 ? "" : decodeURIComponent(u.slice(i + marker.length).split("?")[0]);
    })
    .filter(Boolean);
  if (!paths.length) return;
  try {
    await sb.storage.from(BUCKET).remove(paths);
  } catch {
    /* diabaikan */
  }
}
