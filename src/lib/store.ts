"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { makeCode, uid } from "./format";
import { REMOTE } from "./mode";
import * as R from "./remote";
import { seedState } from "./seed";
import { sb } from "./supabase";
import type {
  AdminAccount,
  AppState,
  BudgetItem,
  BudgetPayment,
  ChangeRequest,
  ChecklistEntry,
  ChecklistKind,
  ChecklistTemplate,
  CoupleSide,
  Guest,
  LinkState,
  OrgKey,
  PromoCard,
  RequestStatus,
  Role,
  RundownItem,
  Settings,
  Track,
  Vendor,
  Venue,
  Wedding,
  WeddingVendor,
} from "./types";

const STORAGE_KEY = "momentum-planner-demo-v1";
const DISMISS_KEY = "momentum-planner-dismissed-v1";

interface Meta {
  hydrated: boolean;
  loadError: string | null;
  saveError: boolean;
  /** Pesan gagal simpan ke server (mode database). */
  syncError: string | null;
  /** Ada sesi Google yang aktif (mode database). */
  authed: boolean;
  email: string;
}

let state: AppState = REMOTE ? R.emptyState() : seedState();
const serverSeed = state;
let meta: Meta = { hydrated: false, loadError: null, saveError: false, syncError: null, authed: false, email: "" };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function persist() {
  try {
    if (REMOTE) localStorage.setItem(DISMISS_KEY, JSON.stringify(state.dismissed));
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (meta.saveError) meta = { ...meta, saveError: false };
  } catch {
    if (!meta.saveError) meta = { ...meta, saveError: true };
  }
}

function update(fn: (s: AppState) => AppState) {
  state = fn(state);
  persist();
  emit();
}

/* Sinkronisasi ke Supabase. Perubahan lokal langsung tampil, lalu dikirim berurutan lewat satu antrean.
   Kalau satu perubahan ditolak server, pesan tampil dan data dimuat ulang dari server supaya layar tidak berbohong. */

let queue: Promise<void> = Promise.resolve();
let pending = 0;
let started = false;

function sync(job: (c: SupabaseClient) => Promise<void>) {
  const client = sb;
  if (!REMOTE || !client) return;
  pending++;
  queue = queue.then(async () => {
    try {
      await job(client);
      if (meta.syncError) {
        meta = { ...meta, syncError: null };
        emit();
      }
    } catch (e) {
      meta = { ...meta, syncError: R.describeError(e) };
      await reload(true);
    } finally {
      pending--;
    }
  });
}

export function dismissSyncError() {
  meta = { ...meta, syncError: null };
  emit();
}

/** Muat ulang semua data dari server. Dilewati kalau masih ada perubahan yang antre, kecuali dipaksa. */
export async function reload(force = false) {
  const client = sb;
  if (!REMOTE || !client) return;
  if (!force && pending > 0) return;
  const { data } = await client.auth.getSession();
  const user = data.session?.user;
  if (!user) {
    state = { ...R.emptyState(), dismissed: state.dismissed };
    meta = { ...meta, authed: false, email: "" };
    emit();
    return;
  }
  try {
    const snap = await R.loadSnapshot(client, user.id);
    state = { ...snap.state, session: snap.session, dismissed: state.dismissed };
    meta = { ...meta, authed: true, email: user.email ?? "", loadError: null };
  } catch (e) {
    const detail = R.describeError(e);
    meta = {
      ...meta,
      authed: true,
      email: user.email ?? "",
      loadError: `Data dari server belum bisa dimuat. ${detail} Muat ulang halaman setelah koneksi pulih.`,
    };
  }
  emit();
}

async function hydrateRemote() {
  const client = sb;
  if (!client) return;
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (raw) state = { ...state, dismissed: JSON.parse(raw) as Record<string, string> };
  } catch {
    /* tutup-iklan hanya kenyamanan, boleh hilang */
  }
  await reload(true);
  meta = { ...meta, hydrated: true };
  emit();
  client.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      state = { ...R.emptyState(), dismissed: state.dismissed };
      meta = { ...meta, authed: false, email: "" };
      emit();
    }
  });
  const refresh = () => {
    if (document.visibilityState === "visible" && meta.authed) void reload();
  };
  document.addEventListener("visibilitychange", refresh);
  window.setInterval(refresh, 60_000);
}

export function hydrate() {
  if (started) return;
  started = true;
  if (REMOTE) {
    void hydrateRemote();
    return;
  }
  let loadError: string | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && parsed.v === 1 && Array.isArray(parsed.weddings)) state = { ...parsed, payments: parsed.payments ?? [] };
      else loadError = "Data tersimpan di perangkat ini tidak dikenali, jadi dimuat ulang dari data contoh.";
    }
  } catch {
    loadError = "Data tersimpan di perangkat ini rusak atau tidak bisa dibaca, jadi dimuat ulang dari data contoh.";
  }
  meta = { ...meta, hydrated: true, loadError };
  emit();
}

export function useApp<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(serverSeed),
  );
}

export function useMeta(): Meta {
  return useSyncExternalStore(
    subscribe,
    () => meta,
    () => meta,
  );
}

export function dismissLoadError() {
  meta = { ...meta, loadError: null };
  emit();
}

function patchById<T extends { id: string }>(list: T[], id: string, patch: Partial<T>): T[] {
  return list.map((x) => (x.id === id ? { ...x, ...patch } : x));
}

/* Sesi */

export function login(role: Role) {
  if (REMOTE) return;
  const weddingId = role === "bride" || role === "groom" ? "w1" : null;
  update((s) => ({ ...s, session: { role, weddingId } }));
}

/** Mulai login Google. Mengembalikan pesan galat, atau null kalau browser sedang diarahkan ke Google. */
export async function signInWithGoogle(): Promise<string | null> {
  if (!sb) return "Login Google belum diatur di versi ini.";
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/masuk` },
  });
  return error ? error.message : null;
}

export async function startNewCouple(side: CoupleSide): Promise<string | null> {
  if (REMOTE && sb) {
    for (let i = 0; i < 4; i++) {
      const { data, error } = await sb.rpc("create_wedding", { p_side: side, p_code: makeCode() });
      if (!error) {
        await reload(true);
        return String(data);
      }
      if (error.code !== "23505") {
        meta = { ...meta, syncError: R.describeError(error) };
        emit();
        return null;
      }
    }
    return null;
  }
  const id = uid("w");
  const wedding: Wedding = {
    id,
    code: makeCode(),
    track: null,
    brideName: "",
    groomName: "",
    akadDate: null,
    city: "",
    contactWa: "",
    mahesa: "none",
    momentum: "none",
    wcc: { shootDate: null, status: "belum", resultLink: "" },
    rundown: [],
  };
  update((s) => ({
    ...s,
    weddings: [...s.weddings, wedding],
    session: { role: side, weddingId: id },
  }));
  return id;
}

export type JoinResult = "ok" | "notfound" | "taken" | "error";

export async function joinWedding(code: string, side: CoupleSide): Promise<JoinResult> {
  if (REMOTE && sb) {
    const { error } = await sb.rpc("join_wedding", { p_code: code.trim(), p_side: side });
    if (!error) {
      await reload(true);
      return "ok";
    }
    if (/tidak ditemukan/i.test(error.message)) return "notfound";
    if (error.code === "23505") return "taken";
    meta = { ...meta, syncError: R.describeError(error) };
    emit();
    return "error";
  }
  const target = state.weddings.find((w) => w.code.toLowerCase() === code.trim().toLowerCase());
  if (!target) return "notfound";
  update((s) => ({ ...s, session: { role: side, weddingId: target.id } }));
  return "ok";
}

export function logout() {
  if (REMOTE) {
    state = { ...R.emptyState(), dismissed: state.dismissed };
    meta = { ...meta, authed: false, email: "" };
    emit();
    void sb?.auth.signOut();
    return;
  }
  update((s) => ({ ...s, session: null }));
}

export function resetDemo() {
  if (REMOTE) return;
  state = seedState();
  persist();
  emit();
}

/* Proyek pernikahan */

export function updateWedding(id: string, patch: Partial<Wedding>) {
  update((s) => ({ ...s, weddings: patchById(s.weddings, id, patch) }));
  sync(async (c) => {
    const row = R.weddingPatchRow(patch);
    if (Object.keys(row).length) await R.updateRows(c, "weddings", row, { id });
    if (patch.wcc) {
      await R.updateRows(
        c,
        "wedding_links",
        { shoot_date: patch.wcc.shootDate, edit_status: patch.wcc.status, result_link: patch.wcc.resultLink },
        { wedding_id: id, org_id: "momentum" },
      );
    }
  });
}

export function setLink(weddingId: string, org: OrgKey, link: LinkState) {
  const prev = state.weddings.find((w) => w.id === weddingId)?.[org] ?? "none";
  update((s) => ({ ...s, weddings: patchById(s.weddings, weddingId, { [org]: link } as Partial<Wedding>) }));
  sync(async (c) => {
    if (link === "none") await R.deleteRows(c, "wedding_links", { wedding_id: weddingId, org_id: org });
    else if (prev === "none") await R.insertRow(c, "wedding_links", { wedding_id: weddingId, org_id: org, status: link });
    else await R.updateRows(c, "wedding_links", { status: link }, { wedding_id: weddingId, org_id: org });
  });
}

export function addRundown(weddingId: string, item: Omit<RundownItem, "id">) {
  const created: RundownItem = { ...item, id: uid("rd") };
  update((s) => ({
    ...s,
    weddings: s.weddings.map((w) =>
      w.id === weddingId ? { ...w, rundown: [...w.rundown, created].sort((a, b) => a.time.localeCompare(b.time)) } : w,
    ),
  }));
  sync((c) => R.insertRow(c, "rundown_items", R.toRow.rundown(weddingId, created)));
}

export function removeRundown(weddingId: string, id: string) {
  update((s) => ({
    ...s,
    weddings: s.weddings.map((w) => (w.id === weddingId ? { ...w, rundown: w.rundown.filter((r) => r.id !== id) } : w)),
  }));
  sync((c) => R.deleteRows(c, "rundown_items", { id }));
}

/* Ceklis */

type EntryPatch = Partial<Pick<ChecklistEntry, "done" | "hidden" | "due" | "note">>;

export function setTemplateState(weddingId: string, templateId: string, patch: EntryPatch) {
  update((s) => {
    const existing = s.checklist.find((e) => e.weddingId === weddingId && e.templateId === templateId);
    if (existing) return { ...s, checklist: patchById<ChecklistEntry>(s.checklist, existing.id, patch) };
    const entry: ChecklistEntry = {
      id: uid("c"),
      weddingId,
      templateId,
      title: "",
      kind: "acara",
      group: "",
      done: false,
      hidden: false,
      due: "",
      note: "",
      ...patch,
    };
    return { ...s, checklist: [...s.checklist, entry] };
  });
  const saved = state.checklist.find((e) => e.weddingId === weddingId && e.templateId === templateId);
  if (saved) sync((c) => R.upsertRow(c, "checklist_items", R.toRow.entry(saved)));
}

export function addCustomEntry(weddingId: string, data: { title: string; kind: ChecklistKind; group: string; due: string }) {
  const entry: ChecklistEntry = { id: uid("c"), weddingId, templateId: null, done: false, hidden: false, note: "", ...data };
  update((s) => ({ ...s, checklist: [...s.checklist, entry] }));
  sync((c) => R.insertRow(c, "checklist_items", R.toRow.entry(entry)));
}

export function patchEntry(id: string, patch: Partial<ChecklistEntry>) {
  update((s) => ({ ...s, checklist: patchById(s.checklist, id, patch) }));
  const saved = state.checklist.find((e) => e.id === id);
  if (saved) sync((c) => R.upsertRow(c, "checklist_items", R.toRow.entry(saved)));
}

export function removeEntry(id: string) {
  update((s) => ({ ...s, checklist: s.checklist.filter((e) => e.id !== id) }));
  sync((c) => R.deleteRows(c, "checklist_items", { id }));
}

export function saveTemplate(t: Omit<ChecklistTemplate, "id"> & { id?: string }) {
  const full = { ...t, id: t.id ?? uid("t") } as ChecklistTemplate;
  update((s) =>
    t.id ? { ...s, templates: patchById(s.templates, t.id, full) } : { ...s, templates: [...s.templates, full] },
  );
  sync((c) => R.upsertRow(c, "checklist_templates", R.toRow.template(full)));
}

export function removeTemplate(id: string) {
  update((s) => ({
    ...s,
    templates: s.templates.filter((t) => t.id !== id),
    checklist: s.checklist.filter((e) => e.templateId !== id),
  }));
  sync((c) => R.deleteRows(c, "checklist_templates", { id }));
}

/* Katalog */

export function saveVenue(v: Omit<Venue, "id"> & { id?: string }) {
  const full = { ...v, id: v.id ?? uid("ve"), sample: false } as Venue;
  update((s) => (v.id ? { ...s, venues: patchById(s.venues, v.id, full) } : { ...s, venues: [...s.venues, full] }));
  sync((c) => R.upsertRow(c, "venues", R.toRow.venue(full)));
}

export function removeVenue(id: string) {
  update((s) => ({
    ...s,
    venues: s.venues.filter((v) => v.id !== id),
    favorites: s.favorites.filter((f) => f.venueId !== id),
  }));
  sync((c) => R.deleteRows(c, "venues", { id }));
}

export function saveVendor(v: Omit<Vendor, "id"> & { id?: string }) {
  const full = { ...v, id: v.id ?? uid("vn"), sample: false } as Vendor;
  update((s) => (v.id ? { ...s, vendors: patchById(s.vendors, v.id, full) } : { ...s, vendors: [...s.vendors, full] }));
  sync((c) => R.upsertRow(c, "vendors", R.toRow.vendor(full)));
}

export function removeVendor(id: string) {
  update((s) => ({ ...s, vendors: s.vendors.filter((v) => v.id !== id) }));
  sync((c) => R.deleteRows(c, "vendors", { id }));
}

export function toggleFavorite(weddingId: string, venueId: string) {
  const has = state.favorites.some((f) => f.weddingId === weddingId && f.venueId === venueId);
  update((s) => ({
    ...s,
    favorites: has
      ? s.favorites.filter((f) => !(f.weddingId === weddingId && f.venueId === venueId))
      : [...s.favorites, { weddingId, venueId }],
  }));
  sync((c) =>
    has
      ? R.deleteRows(c, "favorites", { wedding_id: weddingId, venue_id: venueId })
      : R.insertRow(c, "favorites", { wedding_id: weddingId, venue_id: venueId }),
  );
}

/* Vendor proyek */

export function saveWeddingVendor(v: Omit<WeddingVendor, "id"> & { id?: string }) {
  const full = { ...v, id: v.id ?? uid("wv") } as WeddingVendor;
  update((s) =>
    v.id
      ? { ...s, weddingVendors: patchById(s.weddingVendors, v.id, full) }
      : { ...s, weddingVendors: [...s.weddingVendors, full] },
  );
  sync((c) => R.upsertRow(c, "wedding_vendors", R.toRow.weddingVendor(full)));
}

export function removeWeddingVendor(id: string) {
  update((s) => ({ ...s, weddingVendors: s.weddingVendors.filter((v) => v.id !== id) }));
  sync((c) => R.deleteRows(c, "wedding_vendors", { id }));
}

/* Budget */

/** Total "dibayar" tidak diisi manual: dihitung dari riwayat pembayaran (di mode database oleh trigger). */
export function saveBudget(b: Omit<BudgetItem, "id" | "paid"> & { id?: string }): string {
  const id = b.id ?? uid("b");
  const existing = b.id ? state.budget.find((x) => x.id === b.id) : undefined;
  const full: BudgetItem = { ...b, id, paid: existing?.paid ?? 0 };
  update((s) => (b.id ? { ...s, budget: patchById(s.budget, b.id, full) } : { ...s, budget: [...s.budget, full] }));
  sync((c) => R.upsertRow(c, "budget_items", R.toRow.budget(full)));
  return id;
}

export function removeBudget(id: string) {
  update((s) => ({
    ...s,
    budget: s.budget.filter((b) => b.id !== id),
    payments: s.payments.filter((p) => p.budgetId !== id),
  }));
  sync((c) => R.deleteRows(c, "budget_items", { id }));
}

export function addPayment(p: Omit<BudgetPayment, "id">) {
  const full: BudgetPayment = { ...p, id: uid("bp") };
  update((s) => ({
    ...s,
    payments: [...s.payments, full],
    budget: s.budget.map((b) => (b.id === p.budgetId ? { ...b, paid: b.paid + p.amount } : b)),
  }));
  sync((c) => R.insertRow(c, "budget_payments", R.toRow.payment(full)));
}

export function removePayment(id: string) {
  const p = state.payments.find((x) => x.id === id);
  if (!p) return;
  update((s) => ({
    ...s,
    payments: s.payments.filter((x) => x.id !== id),
    budget: s.budget.map((b) => (b.id === p.budgetId ? { ...b, paid: Math.max(b.paid - p.amount, 0) } : b)),
  }));
  sync((c) => R.deleteRows(c, "budget_payments", { id }));
}

/* Tamu */

export function saveGuest(g: Omit<Guest, "id"> & { id?: string }) {
  const full = { ...g, id: g.id ?? uid("g") } as Guest;
  update((s) => (g.id ? { ...s, guests: patchById(s.guests, g.id, full) } : { ...s, guests: [...s.guests, full] }));
  sync((c) => R.upsertRow(c, "guests", R.toRow.guest(full)));
}

export function removeGuest(id: string) {
  update((s) => ({ ...s, guests: s.guests.filter((g) => g.id !== id) }));
  sync((c) => R.deleteRows(c, "guests", { id }));
}

/* Promo */

export function savePromo(p: Omit<PromoCard, "id"> & { id?: string }) {
  const full = { ...p, id: p.id ?? uid("p") } as PromoCard;
  update((s) => (p.id ? { ...s, promos: patchById(s.promos, p.id, full) } : { ...s, promos: [...s.promos, full] }));
  sync((c) => R.upsertRow(c, "promo_cards", R.toRow.promo(full)));
}

export function removePromo(id: string) {
  update((s) => ({ ...s, promos: s.promos.filter((p) => p.id !== id) }));
  sync((c) => R.deleteRows(c, "promo_cards", { id }));
}

export function dismissPromo(id: string) {
  update((s) => ({ ...s, dismissed: { ...s.dismissed, [id]: new Date().toISOString() } }));
}

/* Permintaan perubahan */

export function createRequest(r: Omit<ChangeRequest, "id" | "status" | "createdAt">) {
  const created: ChangeRequest = { ...r, id: uid("rq"), status: "menunggu", createdAt: new Date().toISOString() };
  update((s) => ({ ...s, requests: [created, ...s.requests] }));
  sync((c) => R.insertRow(c, "change_requests", R.toRow.request(created)));
}

export function setRequestStatus(id: string, status: RequestStatus) {
  update((s) => ({ ...s, requests: patchById(s.requests, id, { status }) }));
  sync((c) => R.updateRows(c, "change_requests", { status }, { id }));
}

/* Akun dan pengaturan */

export function saveAccount(a: Omit<AdminAccount, "id"> & { id?: string }) {
  if (REMOTE) {
    const email = a.email.trim().toLowerCase();
    const full: AdminAccount = { id: email, name: a.name, email, role: a.role };
    update((s) => ({ ...s, accounts: [...s.accounts.filter((x) => x.id !== a.id && x.id !== email), full] }));
    const org = R.orgForRole(a.role);
    sync(async (c) => {
      if (a.id && a.id !== email) await R.deleteRows(c, "admin_invites", { email: a.id });
      await R.upsertRow(c, "admin_invites", { email, name: a.name, role: a.role, org_id: org }, "email");
      // Kalau orangnya sudah pernah login, role di profilnya ikut diperbarui.
      await R.updateRows(c, "profiles", { role: a.role, org_id: org }, { email });
    });
    return;
  }
  update((s) =>
    a.id
      ? { ...s, accounts: patchById(s.accounts, a.id, { ...a, placeholder: false } as AdminAccount) }
      : { ...s, accounts: [...s.accounts, { ...a, id: uid("ac") } as AdminAccount] },
  );
}

export function removeAccount(id: string) {
  const target = state.accounts.find((a) => a.id === id);
  if (REMOTE && target && target.email.toLowerCase() === meta.email.toLowerCase()) {
    meta = { ...meta, syncError: "Kamu tidak bisa menghapus akunmu sendiri, supaya tidak terkunci dari panel admin." };
    emit();
    return;
  }
  update((s) => ({ ...s, accounts: s.accounts.filter((a) => a.id !== id) }));
  if (target) {
    sync(async (c) => {
      await R.deleteRows(c, "admin_invites", { email: target.email });
      await R.updateRows(c, "profiles", { role: "couple", org_id: null }, { email: target.email.toLowerCase() });
    });
  }
}

export function updateSettings(patch: Partial<Settings>) {
  update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  sync(async (c) => {
    const mahesa: Record<string, string> = {};
    const momentum: Record<string, string> = {};
    if (patch.mahesaWa !== undefined) mahesa.wa = patch.mahesaWa;
    if (patch.mahesaEmail !== undefined) mahesa.email = patch.mahesaEmail;
    if (patch.momentumWa !== undefined) momentum.wa = patch.momentumWa;
    if (patch.momentumEmail !== undefined) momentum.email = patch.momentumEmail;
    if (Object.keys(mahesa).length) await R.updateRows(c, "organizations", mahesa, { id: "mahesa" });
    if (Object.keys(momentum).length) await R.updateRows(c, "organizations", momentum, { id: "momentum" });
  });
}

/* Turunan */

export interface ChecklistRow {
  key: string;
  templateId: string | null;
  entryId: string | null;
  title: string;
  kind: ChecklistKind;
  group: string;
  order: number;
  hint?: string;
  promo?: ChecklistTemplate["promo"];
  done: boolean;
  hidden: boolean;
  due: string;
  note: string;
  custom: boolean;
}

export function buildChecklist(
  templates: ChecklistTemplate[],
  entries: ChecklistEntry[],
  weddingId: string,
  track: Track | null,
): ChecklistRow[] {
  const mine = entries.filter((e) => e.weddingId === weddingId);
  const rows: ChecklistRow[] = [];
  for (const t of templates) {
    if (t.track !== "semua" && t.track !== track) continue;
    const e = mine.find((x) => x.templateId === t.id);
    rows.push({
      key: t.id,
      templateId: t.id,
      entryId: e?.id ?? null,
      title: t.title,
      kind: t.kind,
      group: t.group,
      order: t.order,
      hint: t.hint,
      promo: t.promo,
      done: e?.done ?? false,
      hidden: e?.hidden ?? false,
      due: e?.due ?? "",
      note: e?.note ?? "",
      custom: false,
    });
  }
  mine
    .filter((e) => e.templateId === null)
    .forEach((e, i) => {
      rows.push({
        key: e.id,
        templateId: null,
        entryId: e.id,
        title: e.title,
        kind: e.kind,
        group: e.group || "Tambahan sendiri",
        order: 1000 + i,
        done: e.done,
        hidden: e.hidden,
        due: e.due,
        note: e.note,
        custom: true,
      });
    });
  return rows.sort((a, b) => a.order - b.order);
}

/** Ubah status satu baris ceklis, baik item default maupun item buatan sendiri. */
export function patchRow(weddingId: string, row: ChecklistRow, patch: EntryPatch) {
  if (row.templateId) setTemplateState(weddingId, row.templateId, patch);
  else if (row.entryId) patchEntry(row.entryId, patch);
}

export function canSeeWedding(role: Role, w: Wedding): boolean {
  if (role === "super_admin") return true;
  if (role === "admin_mahesa") return w.mahesa !== "none";
  if (role === "admin_momentum") return w.momentum !== "none";
  return false;
}
