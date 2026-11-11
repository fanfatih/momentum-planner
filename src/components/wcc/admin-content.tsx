"use client";

import { useState, type ReactNode } from "react";
import { Button, Card, ConfirmDelete, IconButton, SelectField, Sheet, Tag, TextAreaField, TextField, toast } from "@/components/ui";
import { formatRp } from "@/lib/format";
import {
  wccRemove,
  wccSave,
  wccSaveSettings,
  type WccAddon,
  type WccAdminData,
  type WccMember,
  type WccPackage,
  type WccPortfolioItem,
  type WccSettings,
} from "@/lib/wcc";
import { ImageField } from "./ImageField";

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const nextSort = (rows: { sort: number }[]) => Math.max(0, ...rows.map((r) => r.sort)) + 1;

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center gap-3 text-[15px]">
      <input type="checkbox" className="size-5 accent-[var(--brand)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function ListShell<T extends { id: string }>({
  title,
  addLabel,
  rows,
  empty,
  render,
  form,
  nameOf,
  del,
  reload,
}: {
  title: string;
  addLabel: string;
  rows: T[];
  empty: string;
  render: (r: T) => ReactNode;
  form: (r: T | null, close: () => void) => ReactNode;
  nameOf: (r: T) => string;
  del: (id: string) => Promise<string | null>;
  reload: () => void;
}) {
  const [open, setOpen] = useState<T | "new" | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const editing = open && open !== "new" ? open : null;
  return (
    <section aria-label={title} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[19px]">{title}</h2>
        <Button icon="plus" onClick={() => setOpen("new")}>
          {addLabel}
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="m-0 text-[15px] text-ink-soft">{empty}</p>
      ) : (
        <ul className="m-0 list-none space-y-2 p-0">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-2 rounded-[12px] border border-line bg-paper p-3">
              <div className="min-w-0 flex-1">{render(r)}</div>
              <IconButton icon="edit" label={`Ubah ${nameOf(r)}`} onClick={() => setOpen(r)} />
              <IconButton icon="trash" label={`Hapus ${nameOf(r)}`} onClick={() => setDeleting(r)} />
            </li>
          ))}
        </ul>
      )}
      <Sheet open={open !== null} onClose={() => setOpen(null)} title={editing ? `Ubah ${nameOf(editing)}` : addLabel}>
        {open !== null && form(editing, () => { setOpen(null); reload(); })}
      </Sheet>
      <ConfirmDelete
        open={!!deleting}
        what={deleting ? nameOf(deleting) : ""}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const err = await del(deleting.id);
          toast(err ?? "Dihapus.");
          setDeleting(null);
          reload();
        }}
      />
    </section>
  );
}

function PackageForm({ p, rows, close }: { p: WccPackage | null; rows: WccPackage[]; close: () => void }) {
  const [name, setName] = useState(p?.name ?? "");
  const [hours, setHours] = useState(String(p?.hours ?? 3));
  const [price, setPrice] = useState(String(p?.price ?? ""));
  const [oldPrice, setOldPrice] = useState(p?.old_price ? String(p.old_price) : "");
  const [features, setFeatures] = useState((p?.features ?? []).join("\n"));
  const [highlight, setHighlight] = useState(p?.highlight ?? false);
  const [active, setActive] = useState(p?.active ?? true);
  const [err, setErr] = useState<Record<string, string>>({});
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const h = Number(hours);
        const pr = Number(price);
        const er: Record<string, string> = {};
        if (!name.trim()) er.name = "Isi nama paket.";
        if (!Number.isInteger(h) || h < 1 || h > 24) er.hours = "Durasi 1 sampai 24 jam.";
        if (!Number.isFinite(pr) || pr < 0 || price === "") er.price = "Isi harga dalam rupiah.";
        const op = oldPrice === "" ? null : Number(oldPrice);
        if (op !== null && (!Number.isFinite(op) || op <= pr)) er.old = "Harga coret harus lebih besar dari harga jual.";
        setErr(er);
        if (Object.keys(er).length) return;
        const m = await wccSave("packages", { id: p?.id, name: name.trim(), hours: h, price: pr, old_price: op, features: lines(features), highlight, active, sort: p?.sort ?? nextSort(rows) });
        if (m) return toast(m);
        toast("Paket disimpan.");
        close();
      }}
    >
      <TextField label="Nama paket" value={name} error={err.name} onChange={(e) => setName(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Durasi (jam)" type="number" inputMode="numeric" min={1} max={24} value={hours} error={err.hours} onChange={(e) => setHours(e.target.value)} />
        <TextField label="Harga (Rp)" type="number" inputMode="numeric" min={0} value={price} error={err.price} onChange={(e) => setPrice(e.target.value)} />
      </div>
      <TextField label="Harga coret (opsional)" hint="Harga normal sebelum diskon. Kosongkan kalau tidak ada promo." type="number" inputMode="numeric" min={0} value={oldPrice} error={err.old} onChange={(e) => setOldPrice(e.target.value)} />
      <TextAreaField label="Isi paket" hint="Satu baris satu poin." rows={6} value={features} onChange={(e) => setFeatures(e.target.value)} />
      <Check label="Tandai sebagai paket andalan" checked={highlight} onChange={setHighlight} />
      <Check label="Tampilkan di landing page" checked={active} onChange={setActive} />
      <Button type="submit" block>
        Simpan paket
      </Button>
    </form>
  );
}

export function PackagesPanel({ data, reload }: { data: WccAdminData; reload: () => void }) {
  return (
    <ListShell
      title="Paket WCC"
      addLabel="Tambah paket"
      rows={data.packages}
      empty="Belum ada paket."
      nameOf={(p) => p.name}
      del={(id) => wccRemove("packages", id)}
      reload={reload}
      render={(p) => (
        <>
          <p className="m-0 font-semibold">
            {p.name} <span className="font-normal text-ink-soft">{p.hours} jam</span>
          </p>
          <p className="m-0 text-[15px]">
            {p.old_price ? <s className="mr-2 text-ink-soft">{formatRp(p.old_price)}</s> : null}
            {formatRp(p.price)}
          </p>
          <p className="m-0 mt-1 flex gap-2">
            {p.highlight && <Tag tone="brand">Andalan</Tag>}
            {!p.active && <Tag>Disembunyikan</Tag>}
          </p>
        </>
      )}
      form={(p, close) => <PackageForm key={p?.id ?? "new"} p={p} rows={data.packages} close={close} />}
    />
  );
}

function AddonForm({ a, rows, close }: { a: WccAddon | null; rows: WccAddon[]; close: () => void }) {
  const [name, setName] = useState(a?.name ?? "");
  const [price, setPrice] = useState(String(a?.price ?? ""));
  const [oldPrice, setOldPrice] = useState(a?.old_price ? String(a.old_price) : "");
  const [unit, setUnit] = useState<WccAddon["unit"]>(a?.unit ?? "sekali");
  const [note, setNote] = useState(a?.note ?? "");
  const [active, setActive] = useState(a?.active ?? true);
  const [err, setErr] = useState<Record<string, string>>({});
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const pr = Number(price);
        const er: Record<string, string> = {};
        if (!name.trim()) er.name = "Isi nama add-on.";
        if (!Number.isFinite(pr) || pr < 0 || price === "") er.price = "Isi harga dalam rupiah.";
        const op = oldPrice === "" ? null : Number(oldPrice);
        if (op !== null && (!Number.isFinite(op) || op <= pr)) er.old = "Harga coret harus lebih besar dari harga jual.";
        setErr(er);
        if (Object.keys(er).length) return;
        const m = await wccSave("addons", { id: a?.id, name: name.trim(), price: pr, old_price: op, unit, note: note.trim(), active, sort: a?.sort ?? nextSort(rows) });
        if (m) return toast(m);
        toast("Add-on disimpan.");
        close();
      }}
    >
      <TextField label="Nama add-on" value={name} error={err.name} onChange={(e) => setName(e.target.value)} />
      <TextField label="Harga (Rp)" type="number" inputMode="numeric" min={0} value={price} error={err.price} onChange={(e) => setPrice(e.target.value)} />
      <TextField label="Harga coret (opsional)" hint="Harga normal sebelum diskon." type="number" inputMode="numeric" min={0} value={oldPrice} error={err.old} onChange={(e) => setOldPrice(e.target.value)} />
      <SelectField label="Cara hitung" hint="Per jam: harga dikali jumlah jam dan menambah durasi acara di kalender." value={unit} onChange={(e) => setUnit(e.target.value as WccAddon["unit"])}>
        <option value="sekali">Sekali (harga tetap)</option>
        <option value="per_jam">Per jam (menambah durasi)</option>
      </SelectField>
      <TextField label="Keterangan (opsional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <Check label="Tampilkan di landing page" checked={active} onChange={setActive} />
      <Button type="submit" block>
        Simpan add-on
      </Button>
    </form>
  );
}

export function AddonsPanel({ data, reload }: { data: WccAdminData; reload: () => void }) {
  return (
    <ListShell
      title="Add-on"
      addLabel="Tambah add-on"
      rows={data.addons}
      empty="Belum ada add-on."
      nameOf={(a) => a.name}
      del={(id) => wccRemove("addons", id)}
      reload={reload}
      render={(a) => (
        <>
          <p className="m-0 font-semibold">{a.name}</p>
          <p className="m-0 text-[15px]">
            {a.old_price ? <s className="mr-2 text-ink-soft">{formatRp(a.old_price)}</s> : null}
            {formatRp(a.price)}
            {a.unit === "per_jam" ? " per jam" : ""}
          </p>
          {!a.active && (
            <p className="m-0 mt-1">
              <Tag>Disembunyikan</Tag>
            </p>
          )}
        </>
      )}
      form={(a, close) => <AddonForm key={a?.id ?? "new"} a={a} rows={data.addons} close={close} />}
    />
  );
}

function PortfolioForm({ f, rows, close }: { f: WccPortfolioItem | null; rows: WccPortfolioItem[]; close: () => void }) {
  const [title, setTitle] = useState(f?.title ?? "");
  const [thumb, setThumb] = useState(f?.thumb_url ?? "");
  const [link, setLink] = useState(f?.link_url ?? "");
  const [err, setErr] = useState<Record<string, string>>({});
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const er: Record<string, string> = {};
        if (!thumb) er.thumb = "Pilih gambar thumbnail.";
        if (!/^https:\/\//.test(link.trim())) er.link = "Tempel link reels Instagram yang diawali https://";
        setErr(er);
        if (Object.keys(er).length) return;
        const m = await wccSave("portfolio", { id: f?.id, title: title.trim(), thumb_url: thumb, link_url: link.trim(), sort: f?.sort ?? nextSort(rows) });
        if (m) return toast(m);
        toast("Portofolio disimpan.");
        close();
      }}
    >
      <ImageField label="Thumbnail" value={thumb} onChange={setThumb} aspect="aspect-[9/16]" />
      {err.thumb && (
        <p role="alert" className="m-0 text-[13px] font-medium text-brand-deep">
          {err.thumb}
        </p>
      )}
      <TextField label="Link reels Instagram" inputMode="url" placeholder="https://www.instagram.com/reel/..." value={link} error={err.link} onChange={(e) => setLink(e.target.value)} />
      <TextField label="Judul singkat (opsional)" hint="Contoh: Akad Aulia dan Raka" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
      <Button type="submit" block>
        Simpan
      </Button>
    </form>
  );
}

export function PortfolioPanel({ data, reload }: { data: WccAdminData; reload: () => void }) {
  return (
    <ListShell
      title="Portofolio"
      addLabel="Tambah reels"
      rows={data.portfolio}
      empty="Belum ada portofolio. Tambahkan thumbnail dan link reels Instagram."
      nameOf={(f) => f.title || "reels ini"}
      del={(id) => wccRemove("portfolio", id)}
      reload={reload}
      render={(f) => (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.thumb_url} alt="" className="h-16 w-9 rounded-[6px] border border-line object-cover" />
          <div className="min-w-0">
            <p className="m-0 truncate font-semibold">{f.title || "Tanpa judul"}</p>
            <p className="m-0 truncate text-[13px] text-ink-soft">{f.link_url}</p>
          </div>
        </div>
      )}
      form={(f, close) => <PortfolioForm key={f?.id ?? "new"} f={f} rows={data.portfolio} close={close} />}
    />
  );
}

function MemberForm({ m, rows, close }: { m: WccMember | null; rows: WccMember[]; close: () => void }) {
  const [name, setName] = useState(m?.name ?? "");
  const [role, setRole] = useState(m?.role ?? "");
  const [bio, setBio] = useState(m?.bio ?? "");
  const [photo, setPhoto] = useState(m?.photo_url ?? "");
  const [err, setErr] = useState("");
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return setErr("Isi nama.");
        setErr("");
        const x = await wccSave("team", { id: m?.id, name: name.trim(), role: role.trim(), bio: bio.trim(), photo_url: photo, sort: m?.sort ?? nextSort(rows) });
        if (x) return toast(x);
        toast("Anggota tim disimpan.");
        close();
      }}
    >
      <TextField label="Nama" value={name} error={err} onChange={(e) => setName(e.target.value)} />
      <TextField label="Peran" placeholder="Contoh: Videographer dan editor" value={role} onChange={(e) => setRole(e.target.value)} />
      <TextAreaField label="Perkenalan singkat" value={bio} maxLength={300} onChange={(e) => setBio(e.target.value)} />
      <ImageField label="Foto" value={photo} onChange={setPhoto} aspect="aspect-square" />
      <Button type="submit" block>
        Simpan
      </Button>
    </form>
  );
}

export function TeamPanel({ data, reload }: { data: WccAdminData; reload: () => void }) {
  return (
    <ListShell
      title="Tim"
      addLabel="Tambah anggota"
      rows={data.team}
      empty="Belum ada anggota tim. Bagian tim di landing page tersembunyi sampai ada yang ditambahkan."
      nameOf={(m) => m.name}
      del={(id) => wccRemove("team", id)}
      reload={reload}
      render={(m) => (
        <>
          <p className="m-0 font-semibold">{m.name}</p>
          <p className="m-0 text-[14px] text-ink-soft">{m.role || "Belum ada peran"}</p>
        </>
      )}
      form={(m, close) => <MemberForm key={m?.id ?? "new"} m={m} rows={data.team} close={close} />}
    />
  );
}

export function TextPanel({ data, reload }: { data: WccAdminData; reload: () => void }) {
  const s = data.settings;
  const [tagline, setTagline] = useState(s.tagline);
  const [ig, setIg] = useState(s.ig_url);
  const [freeOn, setFreeOn] = useState(s.free_enabled);
  const [freeText, setFreeText] = useState(s.free_text);
  const [freeRules, setFreeRules] = useState(s.free_rules.join("\n"));
  const [promoOn, setPromoOn] = useState(s.promo_enabled);
  const [promoText, setPromoText] = useState(s.promo_text);
  const [terms, setTerms] = useState(s.terms.join("\n"));
  const [faq, setFaq] = useState(s.faq);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const next: WccSettings = {
      tagline: tagline.trim(),
      ig_url: ig.trim(),
      free_enabled: freeOn,
      free_text: freeText.trim(),
      free_rules: lines(freeRules),
      promo_enabled: promoOn,
      promo_text: promoText.trim(),
      terms: lines(terms),
      faq: faq.filter((f) => f.q.trim() && f.a.trim()).map((f) => ({ q: f.q.trim(), a: f.a.trim() })),
    };
    const err = await wccSaveSettings(next);
    setBusy(false);
    toast(err ?? "Teks halaman disimpan.");
    if (!err) reload();
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-4">
        <h2 className="text-[19px]">Halaman utama</h2>
        <TextField label="Kalimat pembuka" value={tagline} onChange={(e) => setTagline(e.target.value)} />
        <TextField label="Link Instagram" inputMode="url" value={ig} onChange={(e) => setIg(e.target.value)} />
        <p className="m-0 text-[13px] text-ink-soft">Nomor WhatsApp diambil dari menu Akun dan kontak, jadi cukup diubah di satu tempat.</p>
      </Card>
      <Card className="space-y-4 p-4">
        <h2 className="text-[19px]">Promo</h2>
        <Check label="Tampilkan banner promo" checked={promoOn} onChange={setPromoOn} />
        <TextAreaField label="Teks promo" value={promoText} onChange={(e) => setPromoText(e.target.value)} />
      </Card>
      <Card className="space-y-4 p-4">
        <h2 className="text-[19px]">Free WCC bulanan</h2>
        <Check label="Tampilkan bagian Free WCC" checked={freeOn} onChange={setFreeOn} />
        <TextAreaField label="Penjelasan singkat" value={freeText} onChange={(e) => setFreeText(e.target.value)} />
        <TextAreaField label="Syarat ikut" hint="Satu baris satu syarat." rows={6} value={freeRules} onChange={(e) => setFreeRules(e.target.value)} />
      </Card>
      <Card className="space-y-4 p-4">
        <h2 className="text-[19px]">Syarat booking</h2>
        <TextAreaField label="Poin syarat" hint="Satu baris satu poin." rows={7} value={terms} onChange={(e) => setTerms(e.target.value)} />
      </Card>
      <Card className="space-y-4 p-4">
        <h2 className="text-[19px]">Pertanyaan umum</h2>
        {faq.map((f, i) => (
          <div key={i} className="space-y-2 rounded-[10px] border border-line p-3">
            <TextField label={`Pertanyaan ${i + 1}`} value={f.q} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
            <TextAreaField label={`Jawaban ${i + 1}`} value={f.a} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
            <Button variant="ghost" icon="trash" onClick={() => setFaq(faq.filter((_, j) => j !== i))}>
              Hapus pertanyaan {i + 1}
            </Button>
          </div>
        ))}
        <Button variant="secondary" icon="plus" onClick={() => setFaq([...faq, { q: "", a: "" }])}>
          Tambah pertanyaan
        </Button>
      </Card>
      <Button block disabled={busy} onClick={save}>
        {busy ? "Menyimpan" : "Simpan teks halaman"}
      </Button>
    </div>
  );
}
