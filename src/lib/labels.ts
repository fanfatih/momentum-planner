import type {
  EditStatus,
  GuestGroup,
  GuestStatus,
  LinkState,
  RequestStatus,
  Role,
  VendorStatus,
} from "./types";

type Tone = "neutral" | "leaf" | "brand" | "sun";

export const GUEST_GROUP: Record<GuestGroup, string> = {
  keluarga_pria: "Keluarga pria",
  keluarga_wanita: "Keluarga wanita",
  teman: "Teman",
  kolega: "Kolega",
};

export const GUEST_STATUS: Record<GuestStatus, { label: string; tone: Tone }> = {
  belum: { label: "Belum diundang", tone: "neutral" },
  diundang: { label: "Diundang", tone: "sun" },
  hadir: { label: "Hadir", tone: "leaf" },
  tidak_hadir: { label: "Tidak hadir", tone: "brand" },
};

export const VENDOR_STATUS: Record<VendorStatus, { label: string; tone: Tone }> = {
  kandidat: { label: "Kandidat", tone: "neutral" },
  dihubungi: { label: "Dihubungi", tone: "sun" },
  deal: { label: "Deal", tone: "leaf" },
};

export const EDIT_STATUS: Record<EditStatus, string> = {
  belum: "Belum mulai",
  shooting: "Shooting",
  editing: "Sedang diedit",
  selesai: "Selesai",
};

export const LINK_STATE: Record<LinkState, { label: string; tone: Tone }> = {
  none: { label: "Tidak tertaut", tone: "neutral" },
  diajukan: { label: "Diajukan", tone: "sun" },
  aktif: { label: "Aktif", tone: "leaf" },
};

export const REQUEST_STATUS: Record<RequestStatus, { label: string; tone: Tone }> = {
  menunggu: { label: "Menunggu konfirmasi", tone: "sun" },
  disetujui: { label: "Disetujui", tone: "leaf" },
  ditolak: { label: "Ditolak", tone: "brand" },
};

export const ROLE_LABEL: Record<Role, string> = {
  bride: "Pengantin wanita",
  groom: "Pengantin pria",
  admin_mahesa: "Admin Mahesa",
  admin_momentum: "Admin Momentum",
  super_admin: "Super Admin",
};
