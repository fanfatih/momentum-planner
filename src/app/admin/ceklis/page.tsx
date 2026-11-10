"use client";

import { useState } from "react";
import { AdminHeader, DataList, Denied, useRole, type Col } from "@/components/admin/shared";
import {
  Button,
  ConfirmDelete,
  EmptyState,
  IconButton,
  Segmented,
  SelectField,
  Sheet,
  TextField,
  toast,
} from "@/components/ui";
import { removeTemplate, saveTemplate, useApp } from "@/lib/store";
import type { ChecklistKind, ChecklistTemplate } from "@/lib/types";

type TrackValue = ChecklistTemplate["track"];
type PromoValue = NonNullable<ChecklistTemplate["promo"]> | "none";

const TRACK: Record<TrackValue, string> = {
  semua: "Semua pasangan",
  muslim: "Muslim (KUA)",
  nonmuslim: "Non-Muslim (Catatan Sipil)",
};

function TemplateForm({ item, kind, onClose }: { item: ChecklistTemplate | null; kind: ChecklistKind; onClose: () => void }) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [target, setTarget] = useState<ChecklistKind>(item?.kind ?? kind);
  const [track, setTrack] = useState<TrackValue>(item?.track ?? "semua");
  const [group, setGroup] = useState(item?.group ?? "");
  const [order, setOrder] = useState(String(item?.order ?? 100));
  const [hint, setHint] = useState(item?.hint ?? "");
  const [promo, setPromo] = useState<PromoValue>(item?.promo ?? "none");
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const err: Record<string, string> = {};
        if (!title.trim()) err.title = "Isi judul item.";
        if (!group.trim()) err.group = "Isi nama kelompok, misalnya Dokumen dasar.";
        if (!/^\d+$/.test(order)) err.order = "Urutan harus angka bulat.";
        setErrors(err);
        if (Object.keys(err).length) return;
        saveTemplate({
          id: item?.id,
          title: title.trim(),
          kind: target,
          track,
          group: group.trim(),
          order: Number(order),
          hint: hint.trim() || undefined,
          promo: promo === "none" ? undefined : promo,
        });
        toast(item ? "Item default diperbarui." : "Item default ditambahkan.");
        onClose();
      }}
    >
      <TextField label="Judul item" value={title} error={errors.title} onChange={(e) => setTitle(e.target.value)} />
      <TextField
        label="Keterangan (opsional)"
        hint="Tampil di bawah judul, misalnya sumber aturan atau hal yang perlu dicek."
        value={hint}
        onChange={(e) => setHint(e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Bagian" value={target} onChange={(e) => setTarget(e.target.value as ChecklistKind)}>
          <option value="administrasi">Administrasi</option>
          <option value="acara">Persiapan acara</option>
        </SelectField>
        <SelectField label="Berlaku untuk" value={track} onChange={(e) => setTrack(e.target.value as TrackValue)}>
          {(Object.keys(TRACK) as TrackValue[]).map((t) => (
            <option key={t} value={t}>
              {TRACK[t]}
            </option>
          ))}
        </SelectField>
        <TextField label="Kelompok" value={group} error={errors.group} onChange={(e) => setGroup(e.target.value)} />
        <TextField
          label="Urutan"
          inputMode="numeric"
          hint="Angka kecil tampil lebih dulu."
          value={order}
          error={errors.order}
          onChange={(e) => setOrder(e.target.value)}
        />
      </div>
      <SelectField
        label="Kartu promo di bawah item ini"
        value={promo}
        onChange={(e) => setPromo(e.target.value as PromoValue)}
      >
        <option value="none">Tidak ada</option>
        <option value="ceklis-wo">Promo Mahesa (pemicu pilih WO)</option>
        <option value="ceklis-dokumentasi">Promo WCC (pemicu dokumentasi)</option>
      </SelectField>
      <Button type="submit" block>
        {item ? "Simpan perubahan" : "Tambah item default"}
      </Button>
    </form>
  );
}

export default function CeklisAdminPage() {
  const role = useRole();
  const templates = useApp((s) => s.templates);
  const [kind, setKind] = useState<ChecklistKind>("administrasi");
  const [track, setTrack] = useState<TrackValue | "all">("all");
  const [open, setOpen] = useState<string | "new" | null>(null);
  const [deleting, setDeleting] = useState<ChecklistTemplate | null>(null);

  if (!role) return null;
  if (role !== "super_admin") return <Denied need="oleh Super Admin" />;

  const rows = templates
    .filter((t) => t.kind === kind && (track === "all" || t.track === track))
    .sort((a, b) => a.order - b.order);
  const editing = open && open !== "new" ? (templates.find((t) => t.id === open) ?? null) : null;

  const cols: Col<ChecklistTemplate>[] = [
    {
      header: "Item",
      cell: (t) => (
        <span>
          <span className="block font-semibold">{t.title}</span>
          {t.hint && <span className="block text-sm font-normal text-ink-soft">{t.hint}</span>}
        </span>
      ),
    },
    { header: "Berlaku untuk", cell: (t) => TRACK[t.track] },
    { header: "Kelompok", cell: (t) => t.group },
    { header: "Urutan", cell: (t) => t.order, className: "tabular-nums" },
  ];

  return (
    <>
      <AdminHeader
        title="Ceklis default"
        lead="Perubahan di sini langsung berlaku di ceklis semua pasangan. Verifikasi syarat ke KUA dan Disdukcapil sebelum mengubah item administrasi."
        action={
          <Button icon="plus" onClick={() => setOpen("new")}>
            Tambah item
          </Button>
        }
      />
      <div className="grid gap-3 pb-5 sm:grid-cols-[minmax(0,22rem)_minmax(0,16rem)] sm:items-end">
        <Segmented
          label="Bagian ceklis"
          value={kind}
          onChange={setKind}
          options={[
            { value: "administrasi", label: "Administrasi" },
            { value: "acara", label: "Persiapan acara" },
          ]}
        />
        <SelectField label="Saring jalur" value={track} onChange={(e) => setTrack(e.target.value as TrackValue | "all")}>
          <option value="all">Semua jalur</option>
          {(Object.keys(TRACK) as TrackValue[]).map((t) => (
            <option key={t} value={t}>
              {TRACK[t]}
            </option>
          ))}
        </SelectField>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon="checklist"
          title="Tidak ada item untuk saringan ini"
          body="Belum ada item default di bagian dan jalur yang dipilih."
          action={
            <Button icon="plus" onClick={() => setOpen("new")}>
              Tambah item
            </Button>
          }
        />
      ) : (
        <DataList
          caption="Daftar item ceklis default"
          rows={rows}
          cols={cols}
          actions={(t) => (
            <>
              <IconButton icon="edit" label={`Ubah item ${t.title}`} onClick={() => setOpen(t.id)} />
              <IconButton icon="trash" label={`Hapus item ${t.title}`} onClick={() => setDeleting(t)} />
            </>
          )}
        />
      )}

      <Sheet variant="modal" open={open !== null} onClose={() => setOpen(null)} title={editing ? "Ubah item default" : "Tambah item default"}>
        <TemplateForm key={open ?? "none"} item={editing} kind={kind} onClose={() => setOpen(null)} />
      </Sheet>
      <ConfirmDelete
        variant="modal"
        open={!!deleting}
        what={deleting?.title ?? ""}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          removeTemplate(deleting.id);
          toast("Item default dihapus dari semua ceklis.");
          setDeleting(null);
        }}
      />
    </>
  );
}
