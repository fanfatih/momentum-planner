"use client";

import { useSyncExternalStore } from "react";
import { makeCode, uid } from "./format";
import { seedState } from "./seed";
import type {
  AdminAccount,
  AppState,
  BudgetItem,
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

interface Meta {
  hydrated: boolean;
  loadError: string | null;
  saveError: boolean;
}

let state: AppState = seedState();
const serverSeed = state;
let meta: Meta = { hydrated: false, loadError: null, saveError: false };
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

export function hydrate() {
  if (meta.hydrated) return;
  let loadError: string | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && parsed.v === 1 && Array.isArray(parsed.weddings)) state = parsed;
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
  const weddingId = role === "bride" || role === "groom" ? "w1" : null;
  update((s) => ({ ...s, session: { role, weddingId } }));
}

export function startNewCouple(side: CoupleSide): string {
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

export function joinWedding(code: string, side: CoupleSide): boolean {
  const target = state.weddings.find((w) => w.code.toLowerCase() === code.trim().toLowerCase());
  if (!target) return false;
  update((s) => ({ ...s, session: { role: side, weddingId: target.id } }));
  return true;
}

export function logout() {
  update((s) => ({ ...s, session: null }));
}

export function resetDemo() {
  state = seedState();
  persist();
  emit();
}

/* Proyek pernikahan */

export function updateWedding(id: string, patch: Partial<Wedding>) {
  update((s) => ({ ...s, weddings: patchById(s.weddings, id, patch) }));
}

export function setLink(weddingId: string, org: OrgKey, link: LinkState) {
  update((s) => ({ ...s, weddings: patchById(s.weddings, weddingId, { [org]: link } as Partial<Wedding>) }));
}

export function addRundown(weddingId: string, item: Omit<RundownItem, "id">) {
  update((s) => ({
    ...s,
    weddings: s.weddings.map((w) =>
      w.id === weddingId ? { ...w, rundown: [...w.rundown, { ...item, id: uid("rd") }].sort((a, b) => a.time.localeCompare(b.time)) } : w,
    ),
  }));
}

export function removeRundown(weddingId: string, id: string) {
  update((s) => ({
    ...s,
    weddings: s.weddings.map((w) => (w.id === weddingId ? { ...w, rundown: w.rundown.filter((r) => r.id !== id) } : w)),
  }));
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
}

export function addCustomEntry(weddingId: string, data: { title: string; kind: ChecklistKind; group: string; due: string }) {
  update((s) => ({
    ...s,
    checklist: [
      ...s.checklist,
      { id: uid("c"), weddingId, templateId: null, done: false, hidden: false, note: "", ...data },
    ],
  }));
}

export function patchEntry(id: string, patch: Partial<ChecklistEntry>) {
  update((s) => ({ ...s, checklist: patchById(s.checklist, id, patch) }));
}

export function removeEntry(id: string) {
  update((s) => ({ ...s, checklist: s.checklist.filter((e) => e.id !== id) }));
}

export function saveTemplate(t: Omit<ChecklistTemplate, "id"> & { id?: string }) {
  update((s) =>
    t.id
      ? { ...s, templates: patchById(s.templates, t.id, t as ChecklistTemplate) }
      : { ...s, templates: [...s.templates, { ...t, id: uid("t") } as ChecklistTemplate] },
  );
}

export function removeTemplate(id: string) {
  update((s) => ({
    ...s,
    templates: s.templates.filter((t) => t.id !== id),
    checklist: s.checklist.filter((e) => e.templateId !== id),
  }));
}

/* Katalog */

export function saveVenue(v: Omit<Venue, "id"> & { id?: string }) {
  update((s) =>
    v.id
      ? { ...s, venues: patchById(s.venues, v.id, { ...v, sample: false } as Venue) }
      : { ...s, venues: [...s.venues, { ...v, id: uid("ve") } as Venue] },
  );
}

export function removeVenue(id: string) {
  update((s) => ({
    ...s,
    venues: s.venues.filter((v) => v.id !== id),
    favorites: s.favorites.filter((f) => f.venueId !== id),
  }));
}

export function saveVendor(v: Omit<Vendor, "id"> & { id?: string }) {
  update((s) =>
    v.id
      ? { ...s, vendors: patchById(s.vendors, v.id, { ...v, sample: false } as Vendor) }
      : { ...s, vendors: [...s.vendors, { ...v, id: uid("vn") } as Vendor] },
  );
}

export function removeVendor(id: string) {
  update((s) => ({ ...s, vendors: s.vendors.filter((v) => v.id !== id) }));
}

export function toggleFavorite(weddingId: string, venueId: string) {
  update((s) => {
    const has = s.favorites.some((f) => f.weddingId === weddingId && f.venueId === venueId);
    return {
      ...s,
      favorites: has
        ? s.favorites.filter((f) => !(f.weddingId === weddingId && f.venueId === venueId))
        : [...s.favorites, { weddingId, venueId }],
    };
  });
}

/* Vendor proyek */

export function saveWeddingVendor(v: Omit<WeddingVendor, "id"> & { id?: string }) {
  update((s) =>
    v.id
      ? { ...s, weddingVendors: patchById(s.weddingVendors, v.id, v as WeddingVendor) }
      : { ...s, weddingVendors: [...s.weddingVendors, { ...v, id: uid("wv") } as WeddingVendor] },
  );
}

export function removeWeddingVendor(id: string) {
  update((s) => ({ ...s, weddingVendors: s.weddingVendors.filter((v) => v.id !== id) }));
}

/* Budget */

export function saveBudget(b: Omit<BudgetItem, "id"> & { id?: string }) {
  update((s) =>
    b.id
      ? { ...s, budget: patchById(s.budget, b.id, b as BudgetItem) }
      : { ...s, budget: [...s.budget, { ...b, id: uid("b") } as BudgetItem] },
  );
}

export function removeBudget(id: string) {
  update((s) => ({ ...s, budget: s.budget.filter((b) => b.id !== id) }));
}

/* Tamu */

export function saveGuest(g: Omit<Guest, "id"> & { id?: string }) {
  update((s) =>
    g.id
      ? { ...s, guests: patchById(s.guests, g.id, g as Guest) }
      : { ...s, guests: [...s.guests, { ...g, id: uid("g") } as Guest] },
  );
}

export function removeGuest(id: string) {
  update((s) => ({ ...s, guests: s.guests.filter((g) => g.id !== id) }));
}

/* Promo */

export function savePromo(p: Omit<PromoCard, "id"> & { id?: string }) {
  update((s) =>
    p.id
      ? { ...s, promos: patchById(s.promos, p.id, p as PromoCard) }
      : { ...s, promos: [...s.promos, { ...p, id: uid("p") } as PromoCard] },
  );
}

export function removePromo(id: string) {
  update((s) => ({ ...s, promos: s.promos.filter((p) => p.id !== id) }));
}

export function dismissPromo(id: string) {
  update((s) => ({ ...s, dismissed: { ...s.dismissed, [id]: new Date().toISOString() } }));
}

/* Permintaan perubahan */

export function createRequest(r: Omit<ChangeRequest, "id" | "status" | "createdAt">) {
  update((s) => ({
    ...s,
    requests: [
      { ...r, id: uid("rq"), status: "menunggu", createdAt: new Date().toISOString() },
      ...s.requests,
    ],
  }));
}

export function setRequestStatus(id: string, status: RequestStatus) {
  update((s) => ({ ...s, requests: patchById(s.requests, id, { status }) }));
}

/* Akun dan pengaturan */

export function saveAccount(a: Omit<AdminAccount, "id"> & { id?: string }) {
  update((s) =>
    a.id
      ? { ...s, accounts: patchById(s.accounts, a.id, { ...a, placeholder: false } as AdminAccount) }
      : { ...s, accounts: [...s.accounts, { ...a, id: uid("ac") } as AdminAccount] },
  );
}

export function removeAccount(id: string) {
  update((s) => ({ ...s, accounts: s.accounts.filter((a) => a.id !== id) }));
}

export function updateSettings(patch: Partial<Settings>) {
  update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
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
