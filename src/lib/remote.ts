import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SETTINGS } from "./seed";
import type {
  AdminAccount,
  AppState,
  BudgetItem,
  BudgetPayment,
  ChangeRequest,
  ChecklistEntry,
  ChecklistTemplate,
  EditStatus,
  Guest,
  LinkState,
  OrgKey,
  PromoCard,
  Role,
  RundownItem,
  Session,
  Vendor,
  Venue,
  Wedding,
  WeddingVendor,
} from "./types";

type Cell = string | number | boolean | null;
type Row = Record<string, Cell>;

const s = (v: Cell | undefined): string => (v == null ? "" : String(v));
const n = (v: Cell | undefined): number => (v == null ? 0 : Number(v));
const nn = (v: Cell | undefined): number | null => (v == null ? null : Number(v));
const b = (v: Cell | undefined): boolean => v === true;

export function emptyState(): AppState {
  return {
    v: 1,
    session: null,
    settings: { ...DEFAULT_SETTINGS },
    weddings: [],
    templates: [],
    checklist: [],
    venues: [],
    vendors: [],
    weddingVendors: [],
    budget: [],
    payments: [],
    guests: [],
    promos: [],
    dismissed: {},
    favorites: [],
    requests: [],
    accounts: [],
  };
}

export interface Snapshot {
  state: Omit<AppState, "session" | "dismissed">;
  session: Session | null;
}

async function all(sb: SupabaseClient, table: string, match?: Record<string, string>): Promise<Row[]> {
  let q = sb.from(table).select("*");
  for (const [k, v] of Object.entries(match ?? {})) q = q.eq(k, v);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Row[];
}

const orgOf = (target: string): OrgKey => (target === "mahesa" ? "mahesa" : "momentum");

/** Ambil semua data yang boleh dilihat user ini. Penyaringan per role dilakukan aturan RLS di database. */
export async function loadSnapshot(sb: SupabaseClient, userId: string): Promise<Snapshot> {
  const [
    profiles,
    orgs,
    templates,
    promos,
    venues,
    vendors,
    weddings,
    links,
    members,
    rundown,
    checklist,
    weddingVendors,
    budget,
    payments,
    guests,
    favorites,
    requests,
    invites,
  ] = await Promise.all([
    all(sb, "profiles", { id: userId }),
    all(sb, "organizations"),
    all(sb, "checklist_templates"),
    all(sb, "promo_cards"),
    all(sb, "venues"),
    all(sb, "vendors"),
    all(sb, "weddings"),
    all(sb, "wedding_links"),
    all(sb, "wedding_members", { profile_id: userId }),
    all(sb, "rundown_items"),
    all(sb, "checklist_items"),
    all(sb, "wedding_vendors"),
    all(sb, "budget_items"),
    all(sb, "budget_payments"),
    all(sb, "guests"),
    all(sb, "favorites"),
    all(sb, "change_requests"),
    all(sb, "admin_invites"),
  ]);

  const profile = profiles[0];
  if (!profile) throw new Error("Profil belum dibuat. Coba keluar lalu masuk lagi.");

  const orgRow = (id: string) => orgs.find((o) => o.id === id);
  const mahesa = orgRow("mahesa");
  const momentum = orgRow("momentum");

  const weddingList: Wedding[] = weddings.map((w) => {
    const id = s(w.id);
    const linkOf = (org: OrgKey) => links.find((l) => l.wedding_id === id && l.org_id === org);
    const state = (org: OrgKey): LinkState => {
      const l = linkOf(org);
      return l ? (s(l.status) as LinkState) : "none";
    };
    const wcc = linkOf("momentum");
    const items: RundownItem[] = rundown
      .filter((r) => r.wedding_id === id)
      .map((r) => ({ id: s(r.id), time: s(r.at_time).slice(0, 5), title: s(r.title), note: s(r.note) }))
      .sort((x, y) => x.time.localeCompare(y.time));
    return {
      id,
      code: s(w.code),
      track: (w.track as Wedding["track"]) ?? null,
      brideName: s(w.bride_name),
      groomName: s(w.groom_name),
      akadDate: w.akad_date ? s(w.akad_date) : null,
      city: s(w.city),
      contactWa: s(w.contact_wa),
      mahesa: state("mahesa"),
      momentum: state("momentum"),
      wcc: {
        shootDate: wcc?.shoot_date ? s(wcc.shoot_date) : null,
        status: (wcc ? s(wcc.edit_status) : "belum") as EditStatus,
        resultLink: wcc ? s(wcc.result_link) : "",
      },
      rundown: items,
    };
  });

  const role = s(profile.role);
  let session: Session;
  if (role === "couple") {
    const m = members[0];
    session = { role: m ? (s(m.side) as "bride" | "groom") : "bride", weddingId: m ? s(m.wedding_id) : null };
  } else {
    session = { role: role as Role, weddingId: null };
  }

  const accounts: AdminAccount[] = invites.map((i) => ({
    id: s(i.email),
    name: s(i.name),
    email: s(i.email),
    role: s(i.role) as AdminAccount["role"],
    placeholder: s(i.email).endsWith("@contoh.id") || undefined,
  }));

  return {
    session,
    state: {
      v: 1,
      settings: {
        mahesaWa: s(mahesa?.wa) || DEFAULT_SETTINGS.mahesaWa,
        mahesaEmail: s(mahesa?.email) || DEFAULT_SETTINGS.mahesaEmail,
        momentumWa: s(momentum?.wa) || DEFAULT_SETTINGS.momentumWa,
        momentumEmail: s(momentum?.email) || DEFAULT_SETTINGS.momentumEmail,
      },
      weddings: weddingList,
      templates: templates.map(
        (t): ChecklistTemplate => ({
          id: s(t.id),
          kind: s(t.kind) as ChecklistTemplate["kind"],
          track: t.track ? (s(t.track) as ChecklistTemplate["track"]) : "semua",
          group: s(t.group_name),
          order: n(t.sort_order),
          title: s(t.title),
          hint: t.hint ? s(t.hint) : undefined,
          promo: t.promo_trigger ? (s(t.promo_trigger) as ChecklistTemplate["promo"]) : undefined,
        }),
      ),
      checklist: checklist.map(
        (c): ChecklistEntry => ({
          id: s(c.id),
          weddingId: s(c.wedding_id),
          templateId: c.template_id ? s(c.template_id) : null,
          title: s(c.title),
          kind: s(c.kind) as ChecklistEntry["kind"],
          group: s(c.group_name),
          done: b(c.done),
          hidden: b(c.hidden),
          due: c.due ? s(c.due) : "",
          note: s(c.note),
        }),
      ),
      venues: venues.map(
        (v): Venue => ({
          id: s(v.id),
          name: s(v.name),
          city: s(v.city),
          capacity: nn(v.capacity),
          priceMin: nn(v.price_min),
          priceMax: nn(v.price_max),
          wa: s(v.wa),
          mapsQuery: s(v.maps_query),
          photoUrl: s(v.photo_url),
          note: s(v.note),
        }),
      ),
      vendors: vendors.map(
        (v): Vendor => ({
          id: s(v.id),
          name: s(v.name),
          category: s(v.category),
          wa: s(v.wa),
          priceNote: s(v.price_note),
          note: s(v.note),
        }),
      ),
      weddingVendors: weddingVendors.map(
        (v): WeddingVendor => ({
          id: s(v.id),
          weddingId: s(v.wedding_id),
          catalogId: v.vendor_id ? s(v.vendor_id) : null,
          name: s(v.name),
          category: s(v.category),
          wa: s(v.wa),
          status: s(v.status) as WeddingVendor["status"],
          note: s(v.note),
          managedBy: s(v.managed_by) as WeddingVendor["managedBy"],
        }),
      ),
      budget: budget.map(
        (x): BudgetItem => ({
          id: s(x.id),
          weddingId: s(x.wedding_id),
          category: s(x.category),
          planned: n(x.planned),
          actual: n(x.actual),
          paid: n(x.paid),
        }),
      ),
      payments: payments.map(
        (x): BudgetPayment => ({
          id: s(x.id),
          weddingId: s(x.wedding_id),
          budgetId: s(x.budget_id),
          amount: n(x.amount),
          paidOn: s(x.paid_on).slice(0, 10),
          payer: s(x.payer) === "groom" ? "groom" : "bride",
          note: s(x.note),
        }),
      ),
      guests: guests.map(
        (g): Guest => ({
          id: s(g.id),
          weddingId: s(g.wedding_id),
          name: s(g.name),
          wa: s(g.wa),
          group: s(g.group_name) as Guest["group"],
          count: n(g.person_count),
          status: s(g.status) as Guest["status"],
        }),
      ),
      promos: promos.map(
        (p): PromoCard => ({
          id: s(p.id),
          target: s(p.target) as PromoCard["target"],
          trigger: s(p.trigger) as PromoCard["trigger"],
          title: s(p.title),
          body: s(p.body),
          cta: s(p.cta),
          active: b(p.active),
        }),
      ),
      favorites: favorites.map((f) => ({ weddingId: s(f.wedding_id), venueId: s(f.venue_id) })),
      requests: requests
        .map(
          (r): ChangeRequest => ({
            id: s(r.id),
            weddingId: s(r.wedding_id),
            org: orgOf(s(r.org_id)),
            section: s(r.section),
            note: s(r.note),
            status: s(r.status) as ChangeRequest["status"],
            createdAt: s(r.created_at),
          }),
        )
        .sort((x, y) => y.createdAt.localeCompare(x.createdAt)),
      accounts,
    },
  };
}

/* Penulisan: satu fungsi kecil per jenis operasi, error dilempar supaya store bisa membatalkan perubahan lokal. */

export async function upsertRow(sb: SupabaseClient, table: string, row: Record<string, unknown>, onConflict?: string) {
  const { error } = await sb.from(table).upsert(row, onConflict ? { onConflict } : undefined);
  if (error) throw error;
}

export async function insertRow(sb: SupabaseClient, table: string, row: Record<string, unknown>) {
  const { error } = await sb.from(table).insert(row);
  if (error) throw error;
}

export async function updateRows(
  sb: SupabaseClient,
  table: string,
  patch: Record<string, unknown>,
  match: Record<string, string>,
) {
  let q = sb.from(table).update(patch);
  for (const [k, v] of Object.entries(match)) q = q.eq(k, v);
  const { error } = await q;
  if (error) throw error;
}

export async function deleteRows(sb: SupabaseClient, table: string, match: Record<string, string>) {
  let q = sb.from(table).delete();
  for (const [k, v] of Object.entries(match)) q = q.eq(k, v);
  const { error } = await q;
  if (error) throw error;
}

export const toRow = {
  budget: (x: BudgetItem) => ({
    id: x.id,
    wedding_id: x.weddingId,
    category: x.category,
    planned: x.planned,
    actual: x.actual,
    // paid sengaja tidak dikirim: dijaga trigger database dari riwayat pembayaran.
  }),
  payment: (x: BudgetPayment) => ({
    id: x.id,
    wedding_id: x.weddingId,
    budget_id: x.budgetId,
    amount: x.amount,
    paid_on: x.paidOn,
    payer: x.payer,
    note: x.note,
  }),
  guest: (g: Guest) => ({
    id: g.id,
    wedding_id: g.weddingId,
    name: g.name,
    wa: g.wa,
    group_name: g.group,
    person_count: g.count,
    status: g.status,
  }),
  weddingVendor: (v: WeddingVendor) => ({
    id: v.id,
    wedding_id: v.weddingId,
    vendor_id: v.catalogId,
    name: v.name,
    category: v.category,
    wa: v.wa,
    status: v.status,
    note: v.note,
    managed_by: v.managedBy,
  }),
  venue: (v: Venue) => ({
    id: v.id,
    name: v.name,
    city: v.city,
    capacity: v.capacity,
    price_min: v.priceMin,
    price_max: v.priceMax,
    wa: v.wa,
    maps_query: v.mapsQuery,
    photo_url: v.photoUrl,
    note: v.note,
  }),
  vendor: (v: Vendor) => ({
    id: v.id,
    name: v.name,
    category: v.category,
    wa: v.wa,
    price_note: v.priceNote,
    note: v.note,
  }),
  promo: (p: PromoCard) => ({
    id: p.id,
    target: p.target,
    trigger: p.trigger,
    title: p.title,
    body: p.body,
    cta: p.cta,
    active: p.active,
  }),
  template: (t: ChecklistTemplate) => ({
    id: t.id,
    kind: t.kind,
    track: t.track === "semua" ? null : t.track,
    group_name: t.group,
    sort_order: t.order,
    title: t.title,
    hint: t.hint ?? null,
    promo_trigger: t.promo ?? null,
  }),
  entry: (e: ChecklistEntry) => ({
    id: e.id,
    wedding_id: e.weddingId,
    template_id: e.templateId,
    title: e.title,
    kind: e.kind,
    group_name: e.group,
    done: e.done,
    hidden: e.hidden,
    due: e.due || null,
    note: e.note,
  }),
  rundown: (weddingId: string, r: RundownItem) => ({
    id: r.id,
    wedding_id: weddingId,
    at_time: r.time,
    title: r.title,
    note: r.note,
  }),
  request: (r: ChangeRequest) => ({
    id: r.id,
    wedding_id: r.weddingId,
    org_id: r.org,
    section: r.section,
    note: r.note,
    status: r.status,
    created_at: r.createdAt,
  }),
};

/** Kolom tabel weddings yang boleh diubah dari patch Wedding. */
export function weddingPatchRow(p: Partial<Wedding>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (p.track !== undefined) out.track = p.track;
  if (p.brideName !== undefined) out.bride_name = p.brideName;
  if (p.groomName !== undefined) out.groom_name = p.groomName;
  if (p.akadDate !== undefined) out.akad_date = p.akadDate || null;
  if (p.city !== undefined) out.city = p.city;
  if (p.contactWa !== undefined) out.contact_wa = p.contactWa;
  return out;
}

export const orgForRole = (role: AdminAccount["role"]): OrgKey | null =>
  role === "admin_mahesa" ? "mahesa" : role === "admin_momentum" ? "momentum" : null;

/** Pesan galat yang bisa dibaca orang, bukan teks mentah dari database. */
export function describeError(e: unknown): string {
  const err = e as { message?: string; code?: string } | null;
  const msg = err?.message ?? "";
  if (err?.code === "42501" || /row-level security|permission denied/i.test(msg)) {
    return "Kamu tidak punya izin untuk perubahan ini.";
  }
  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    return "Koneksi terputus, jadi perubahan terakhir belum tersimpan. Coba ulangi saat sudah online.";
  }
  if (err?.code === "23505") return "Data itu sudah ada.";
  if (err?.code === "23503") return "Data ini masih dipakai bagian lain.";
  return msg || "Perubahan gagal disimpan. Coba ulangi.";
}
