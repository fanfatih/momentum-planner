"use client";

import { useMemo, useState } from "react";
import { CheckToggle, PageHeader } from "@/components/shell";
import {
  Button,
  Chip,
  cx,
  IconButton,
  EmptyState,
  ProgressBar,
  Reveal,
  Segmented,
  Sheet,
  Tag,
  TextAreaField,
  TextField,
  toast,
} from "@/components/ui";
import { Icon } from "@/components/icons";
import { formatShortDate } from "@/lib/format";
import { useCurrentWedding } from "@/lib/guard";
import { TRACK_LABEL, TRACK_NOTES } from "@/lib/seed";
import { addCustomEntry, buildChecklist, patchEntry, patchRow, removeEntry, useApp, type ChecklistRow } from "@/lib/store";
import type { ChecklistKind } from "@/lib/types";

/** Grup yang tidak berlaku untuk semua pasangan, jadi tertutup dulu. */
const COLLAPSED_BY_DEFAULT = new Set(["Kondisi khusus"]);

const KIND_OPTIONS: { value: ChecklistKind; label: string }[] = [
  { value: "administrasi", label: "Administrasi" },
  { value: "acara", label: "Persiapan acara" },
];

function RowForm({ weddingId, row, onClose }: { weddingId: string; row: ChecklistRow; onClose: () => void }) {
  const [title, setTitle] = useState(row.title);
  const [due, setDue] = useState(row.due);
  const [note, setNote] = useState(row.note);
  const [error, setError] = useState("");

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (row.custom && !title.trim()) {
      setError("Isi nama itemnya.");
      return;
    }
    if (row.custom && row.entryId) patchEntry(row.entryId, { title: title.trim(), due, note: note.trim() });
    else patchRow(weddingId, row, { due, note: note.trim() });
    toast("Item ceklis disimpan.");
    onClose();
  };

  return (
    <form onSubmit={save} className="space-y-4" noValidate>
      {row.custom ? (
        <TextField label="Nama item" value={title} error={error} onChange={(e) => setTitle(e.target.value)} />
      ) : (
        <div>
          <p className="text-[17px] font-semibold text-ink">{row.title}</p>
          {row.hint && <p className="mt-1 text-sm text-ink-soft">{row.hint}</p>}
        </div>
      )}
      <TextField label="Tenggat (opsional)" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      <TextAreaField
        label="Catatan (opsional)"
        placeholder="Contoh: fotokopi 2 lembar, bawa aslinya"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button type="submit" block>
        Simpan item
      </Button>
      <Button
        variant="secondary"
        block
        icon={row.hidden ? "eye" : "eyeOff"}
        onClick={() => {
          patchRow(weddingId, row, { hidden: !row.hidden });
          toast(row.hidden ? "Item ditampilkan lagi." : "Item dihapus dari daftar.");
          onClose();
        }}
      >
        {row.hidden ? "Tampilkan lagi di daftar" : "Hapus dari daftar, tidak berlaku untuk kami"}
      </Button>
      {row.custom && row.entryId && (
        <Button
          variant="danger"
          block
          icon="trash"
          onClick={() => {
            removeEntry(row.entryId!);
            toast("Item dihapus.");
            onClose();
          }}
        >
          Hapus item ini
        </Button>
      )}
    </form>
  );
}

function AddForm({ weddingId, kind, onClose }: { weddingId: string; kind: ChecklistKind; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState<ChecklistKind>(kind);
  const [due, setDue] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) {
          setError("Isi nama itemnya.");
          return;
        }
        addCustomEntry(weddingId, { title: title.trim(), kind: target, group: "Tambahan sendiri", due });
        toast("Item ditambahkan ke ceklis.");
        onClose();
      }}
    >
      <TextField
        label="Nama item"
        placeholder="Contoh: pesan suvenir"
        value={title}
        error={error}
        onChange={(e) => {
          setTitle(e.target.value);
          setError("");
        }}
      />
      <div>
        <p className="mb-1.5 text-sm font-semibold">Masuk ke bagian</p>
        <Segmented label="Bagian ceklis" value={target} onChange={setTarget} options={KIND_OPTIONS} />
      </div>
      <TextField label="Tenggat (opsional)" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      <Button type="submit" block>
        Tambah ke ceklis
      </Button>
    </form>
  );
}

export default function CeklisPage() {
  const wedding = useCurrentWedding();
  const templates = useApp((s) => s.templates);
  const entries = useApp((s) => s.checklist);
  const [kind, setKind] = useState<ChecklistKind>("administrasi");
  const [showHidden, setShowHidden] = useState(false);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const all = useMemo(
    () => (wedding ? buildChecklist(templates, entries, wedding.id, wedding.track) : []),
    [templates, entries, wedding],
  );

  if (!wedding) return null;

  const active = all.filter((r) => !r.hidden);
  const done = active.filter((r) => r.done).length;
  const hiddenCount = all.filter((r) => r.kind === kind && r.hidden).length;
  const rows = all.filter((r) => r.kind === kind && (showHidden || !r.hidden));
  const groups = rows.reduce<{ name: string; rows: ChecklistRow[] }[]>((acc, r) => {
    const g = acc.find((x) => x.name === r.group);
    if (g) g.rows.push(r);
    else acc.push({ name: r.group, rows: [r] });
    return acc;
  }, []);

  const editing = all.find((r) => r.key === editKey) ?? null;

  const removeRow = (r: ChecklistRow) => {
    if (r.custom && r.entryId) {
      removeEntry(r.entryId);
      toast("Item dihapus.");
    } else {
      patchRow(wedding.id, r, { hidden: true });
      toast("Item dihapus dari daftar. Bisa dimunculkan lagi lewat Lihat item tersembunyi.");
    }
  };

  return (
    <>
      <PageHeader title="Ceklis" lead={`${done} dari ${active.length} item selesai`} />
      <div className="px-5">
        <ProgressBar value={active.length ? (done / active.length) * 100 : 0} label="Kemajuan ceklis" />
        <div className="mt-4">
          <Segmented label="Bagian ceklis" value={kind} onChange={setKind} options={KIND_OPTIONS} />
        </div>
        {kind === "administrasi" && wedding.track && (
          <p className="mt-3 rounded-[10px] border border-line bg-paper px-3 py-2.5 text-[13px] text-ink-soft">
            <span className="font-semibold text-ink">{TRACK_LABEL[wedding.track]}.</span> {TRACK_NOTES[wedding.track]}
          </p>
        )}
        {hiddenCount > 0 && (
          <div className="mt-3">
            <Chip selected={showHidden} onClick={() => setShowHidden(!showHidden)}>
              {showHidden ? "Sembunyikan lagi" : `Lihat ${hiddenCount} item tersembunyi`}
            </Chip>
          </div>
        )}
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon="checklist"
          title="Belum ada item di bagian ini"
          body="Item default belum tersedia untuk bagian ini. Kamu tetap bisa menambah item sendiri."
          action={
            <Button icon="plus" onClick={() => setAdding(true)}>
              Tambah item sendiri
            </Button>
          }
        />
      ) : (
        groups.map((g, gi) => {
          const gkey = `${kind}:${g.name}`;
          const isOpen = openGroups[gkey] ?? !COLLAPSED_BY_DEFAULT.has(g.name);
          const panelId = `grup-${gi}`;
          return (
          <Reveal key={g.name} i={gi} className="pt-5">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenGroups({ ...openGroups, [gkey]: !isOpen })}
              className="flex min-h-11 w-full items-center justify-between gap-3 px-5 text-left transition-colors duration-150 hover:bg-cream-deep active:bg-line"
            >
              <span className="min-w-0">
                <span className="block text-[19px] font-semibold leading-snug text-ink">{g.name}</span>
                {!isOpen && COLLAPSED_BY_DEFAULT.has(g.name) && (
                  <span className="block text-[13px] text-ink-soft">Buka kalau ada yang berlaku untuk kalian</span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-sm text-ink-soft">
                {g.rows.filter((r) => r.done).length}/{g.rows.length}
                <Icon name="chevronDown" size={18} className={cx("transition-transform duration-150", isOpen && "rotate-180")} />
              </span>
            </button>
            {isOpen && (
            <ul id={panelId} className="mt-1 px-2">
              {g.rows.map((r) => (
                <li key={r.key}>
                  <div className="flex items-start gap-1">
                    <CheckToggle
                      checked={r.done}
                      label={`Tandai selesai: ${r.title}`}
                      onChange={(v) => patchRow(wedding.id, r, { done: v })}
                    />
                    <button
                      type="button"
                      onClick={() => setEditKey(r.key)}
                      className="min-h-11 min-w-0 flex-1 rounded-[8px] px-1 py-2.5 text-left transition-colors duration-150 hover:bg-cream-deep active:bg-line"
                    >
                      <span className={cx("block text-[15px]", r.done ? "text-ink-soft line-through" : "text-ink")}>
                        {r.title}
                      </span>
                      {r.hint && <span className="mt-0.5 block text-[13px] text-ink-soft">{r.hint}</span>}
                      {(r.due || r.note || r.hidden || r.custom) && (
                        <span className="mt-1.5 flex flex-wrap gap-1.5">
                          {r.due && <Tag tone="sun">Tenggat {formatShortDate(r.due)}</Tag>}
                          {r.note && <Tag>Ada catatan</Tag>}
                          {r.custom && <Tag tone="leaf">Item sendiri</Tag>}
                          {r.hidden && <Tag>Disembunyikan</Tag>}
                        </span>
                      )}
                    </button>
                    {r.hidden ? (
                      <IconButton
                        icon="eye"
                        label={`Tampilkan lagi: ${r.title}`}
                        onClick={() => {
                          patchRow(wedding.id, r, { hidden: false });
                          toast("Item ditampilkan lagi.");
                        }}
                      />
                    ) : (
                      <IconButton icon="trash" label={`Hapus dari daftar: ${r.title}`} onClick={() => removeRow(r)} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
            )}
          </Reveal>
          );
        })
      )}

      {groups.length > 0 && (
        <div className="px-5 pt-6">
          <Button variant="secondary" block icon="plus" onClick={() => setAdding(true)}>
            Tambah item sendiri
          </Button>
        </div>
      )}

      <Sheet open={!!editing} onClose={() => setEditKey(null)} title="Detail item">
        {editing && <RowForm key={editing.key} weddingId={wedding.id} row={editing} onClose={() => setEditKey(null)} />}
      </Sheet>
      <Sheet open={adding} onClose={() => setAdding(false)} title="Tambah item ceklis">
        <AddForm weddingId={wedding.id} kind={kind} onClose={() => setAdding(false)} />
      </Sheet>
    </>
  );
}
