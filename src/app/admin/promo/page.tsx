"use client";

import { useState } from "react";
import { AdminHeader, DataList, Denied, useRole, type Col } from "@/components/admin/shared";
import {
  Button,
  ConfirmDelete,
  EmptyState,
  IconButton,
  SelectField,
  Sheet,
  Tag,
  TextAreaField,
  TextField,
  toast,
} from "@/components/ui";
import { removePromo, savePromo, useApp } from "@/lib/store";
import type { PromoCard, PromoTrigger } from "@/lib/types";

const TRIGGER: Record<PromoTrigger, string> = {
  beranda: "Beranda",
  "ceklis-wo": "Ceklis, item pilih WO",
  "ceklis-dokumentasi": "Ceklis, item dokumentasi",
};

const TARGET: Record<PromoCard["target"], string> = {
  mahesa: "Mahesa Weddings",
  wcc: "WCC Momentum",
};

function PromoForm({ promo, onClose }: { promo: PromoCard | null; onClose: () => void }) {
  const [title, setTitle] = useState(promo?.title ?? "");
  const [body, setBody] = useState(promo?.body ?? "");
  const [cta, setCta] = useState(promo?.cta ?? "");
  const [target, setTarget] = useState<PromoCard["target"]>(promo?.target ?? "mahesa");
  const [trigger, setTrigger] = useState<PromoTrigger>(promo?.trigger ?? "beranda");
  const [active, setActive] = useState(promo?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const err: Record<string, string> = {};
        if (!title.trim()) err.title = "Isi judul kartu.";
        if (!body.trim()) err.body = "Isi teks kartu.";
        if (!cta.trim()) err.cta = "Isi teks tombol.";
        setErrors(err);
        if (Object.keys(err).length) return;
        savePromo({ id: promo?.id, title: title.trim(), body: body.trim(), cta: cta.trim(), target, trigger, active });
        toast(promo ? "Kartu promo diperbarui." : "Kartu promo ditambahkan.");
        onClose();
      }}
    >
      <TextField label="Judul" value={title} error={errors.title} onChange={(e) => setTitle(e.target.value)} />
      <TextAreaField label="Teks kartu" value={body} error={errors.body} onChange={(e) => setBody(e.target.value)} />
      <TextField
        label="Teks tombol"
        placeholder="Contoh: Ajukan Paket Mahesa"
        value={cta}
        error={errors.cta}
        onChange={(e) => setCta(e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Mengiklankan"
          hint="Kartu hilang begitu proyek tertaut ke pihak ini."
          value={target}
          onChange={(e) => setTarget(e.target.value as PromoCard["target"])}
        >
          {(Object.keys(TARGET) as PromoCard["target"][]).map((t) => (
            <option key={t} value={t}>
              {TARGET[t]}
            </option>
          ))}
        </SelectField>
        <SelectField label="Muncul di" value={trigger} onChange={(e) => setTrigger(e.target.value as PromoTrigger)}>
          {(Object.keys(TRIGGER) as PromoTrigger[]).map((t) => (
            <option key={t} value={t}>
              {TRIGGER[t]}
            </option>
          ))}
        </SelectField>
      </div>
      <label className="flex min-h-11 items-center gap-3 text-[15px]">
        <input
          type="checkbox"
          className="size-5 accent-[var(--brand)]"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Tampilkan kartu ini ke pasangan
      </label>
      <Button type="submit" block>
        {promo ? "Simpan perubahan" : "Tambah kartu promo"}
      </Button>
    </form>
  );
}

export default function PromoPage() {
  const role = useRole();
  const promos = useApp((s) => s.promos);
  const [open, setOpen] = useState<string | "new" | null>(null);
  const [deleting, setDeleting] = useState<PromoCard | null>(null);

  if (!role) return null;
  if (role !== "super_admin") return <Denied need="oleh Super Admin" />;

  const editing = open && open !== "new" ? (promos.find((p) => p.id === open) ?? null) : null;

  const cols: Col<PromoCard>[] = [
    {
      header: "Kartu",
      cell: (p) => (
        <span>
          <span className="block font-semibold">{p.title}</span>
          <span className="block text-sm font-normal text-ink-soft">{p.body}</span>
        </span>
      ),
    },
    { header: "Mengiklankan", cell: (p) => TARGET[p.target], className: "whitespace-nowrap" },
    { header: "Muncul di", cell: (p) => TRIGGER[p.trigger] },
    {
      header: "Status",
      cell: (p) => <Tag tone={p.active ? "leaf" : "neutral"}>{p.active ? "Tampil" : "Disembunyikan"}</Tag>,
    },
  ];

  return (
    <>
      <AdminHeader
        title="Kartu promo"
        lead="Muncul sebagai popup melayang, satu per satu. Pasangan bisa menutupnya, atau mencentang untuk menyembunyikannya sampai besok."
        action={
          <Button icon="plus" onClick={() => setOpen("new")}>
            Tambah kartu
          </Button>
        }
      />

      {promos.length === 0 ? (
        <EmptyState
          icon="megaphone"
          title="Belum ada kartu promo"
          body="Tanpa kartu, pasangan tidak melihat iklan Mahesa maupun WCC Momentum di aplikasi."
          action={
            <Button icon="plus" onClick={() => setOpen("new")}>
              Tambah kartu
            </Button>
          }
        />
      ) : (
        <DataList
          caption="Daftar kartu promo"
          rows={promos}
          cols={cols}
          actions={(p) => (
            <>
              <IconButton icon="edit" label={`Ubah kartu ${p.title}`} onClick={() => setOpen(p.id)} />
              <IconButton icon="trash" label={`Hapus kartu ${p.title}`} onClick={() => setDeleting(p)} />
            </>
          )}
        />
      )}

      <Sheet variant="modal" open={open !== null} onClose={() => setOpen(null)} title={editing ? "Ubah kartu promo" : "Tambah kartu promo"}>
        <PromoForm key={open ?? "none"} promo={editing} onClose={() => setOpen(null)} />
      </Sheet>
      <ConfirmDelete
        variant="modal"
        open={!!deleting}
        what={deleting?.title ?? ""}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          removePromo(deleting.id);
          toast("Kartu promo dihapus.");
          setDeleting(null);
        }}
      />
    </>
  );
}
