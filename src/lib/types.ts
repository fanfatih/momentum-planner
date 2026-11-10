export type Role = "bride" | "groom" | "admin_mahesa" | "admin_momentum" | "super_admin";
export type CoupleSide = "bride" | "groom";
export type Track = "muslim" | "nonmuslim";
export type LinkState = "none" | "diajukan" | "aktif";
export type OrgKey = "mahesa" | "momentum";
export type EditStatus = "belum" | "shooting" | "editing" | "selesai";
export type VendorStatus = "kandidat" | "dihubungi" | "deal";
export type GuestGroup = "keluarga_pria" | "keluarga_wanita" | "teman" | "kolega";
export type GuestStatus = "belum" | "diundang" | "hadir" | "tidak_hadir";
export type ChecklistKind = "administrasi" | "acara";
export type PromoTrigger = "beranda" | "ceklis-wo" | "ceklis-dokumentasi";
export type RequestStatus = "menunggu" | "disetujui" | "ditolak";

export interface Session {
  role: Role;
  weddingId: string | null;
}

export interface RundownItem {
  id: string;
  time: string;
  title: string;
  note: string;
}

export interface Wedding {
  id: string;
  code: string;
  track: Track | null;
  brideName: string;
  groomName: string;
  akadDate: string | null;
  city: string;
  contactWa: string;
  mahesa: LinkState;
  momentum: LinkState;
  wcc: { shootDate: string | null; status: EditStatus; resultLink: string };
  rundown: RundownItem[];
  sample?: boolean;
}

export interface ChecklistTemplate {
  id: string;
  kind: ChecklistKind;
  track: Track | "semua";
  group: string;
  order: number;
  title: string;
  hint?: string;
  promo?: Exclude<PromoTrigger, "beranda">;
}

export interface ChecklistEntry {
  id: string;
  weddingId: string;
  templateId: string | null;
  title: string;
  kind: ChecklistKind;
  group: string;
  done: boolean;
  hidden: boolean;
  due: string;
  note: string;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  capacity: number | null;
  priceMin: number | null;
  priceMax: number | null;
  wa: string;
  mapsQuery: string;
  photoUrl: string;
  note: string;
  sample?: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  wa: string;
  priceNote: string;
  note: string;
  sample?: boolean;
}

export interface WeddingVendor {
  id: string;
  weddingId: string;
  catalogId: string | null;
  name: string;
  category: string;
  wa: string;
  status: VendorStatus;
  note: string;
  managedBy: "couple" | OrgKey;
}

export interface BudgetItem {
  id: string;
  weddingId: string;
  category: string;
  planned: number;
  actual: number;
  paid: number;
}

export interface Guest {
  id: string;
  weddingId: string;
  name: string;
  wa: string;
  group: GuestGroup;
  count: number;
  status: GuestStatus;
}

export interface PromoCard {
  id: string;
  target: "mahesa" | "wcc";
  trigger: PromoTrigger;
  title: string;
  body: string;
  cta: string;
  active: boolean;
}

export interface ChangeRequest {
  id: string;
  weddingId: string;
  org: OrgKey;
  section: string;
  note: string;
  status: RequestStatus;
  createdAt: string;
}

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: "admin_mahesa" | "admin_momentum" | "super_admin";
  placeholder?: boolean;
}

export interface Settings {
  mahesaWa: string;
  mahesaEmail: string;
  momentumWa: string;
  momentumEmail: string;
}

export interface Favorite {
  weddingId: string;
  venueId: string;
}

export interface AppState {
  v: 1;
  session: Session | null;
  settings: Settings;
  weddings: Wedding[];
  templates: ChecklistTemplate[];
  checklist: ChecklistEntry[];
  venues: Venue[];
  vendors: Vendor[];
  weddingVendors: WeddingVendor[];
  budget: BudgetItem[];
  guests: Guest[];
  promos: PromoCard[];
  dismissed: Record<string, string>;
  favorites: Favorite[];
  requests: ChangeRequest[];
  accounts: AdminAccount[];
}
