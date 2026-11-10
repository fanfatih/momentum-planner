"use client";

import { useState } from "react";
import { AdminHeader, DataList, Denied, useRole, type Col } from "@/components/admin/shared";
import {
  Button,
  ConfirmDelete,
  EmptyState,
  IconButton,
  MoneyField,
  Segmented,
  SelectField,
  Sheet,
  Tag,
  TextAreaField,
  TextField,
  toast,
} from "@/components/ui";
import { displayWa, priceRange } from "@/lib/format";
import { VENDOR_CATEGORIES } from "@/lib/seed";
import { removeVendor, removeVenue, saveVendor, saveVenue, useApp } from "@/lib/store";
import type { Vendor, Venue } from "@/lib/types";

type View = "venue" | "vendor";

function VenueForm({ venue, onClose }: { venue: Venue | null; onClose: () => void }) {
  const [name, setName] = useState(venue?.name ?? "");
  const [city, setCity] = useState(venue?.city ?? "");
  const [capacity, setCapacity] = useState(venue?.capacity ? String(venue.capacity) : "");
  const [priceMin, setPriceMin] = useState(venue?.priceMin ?? 0);
  const [priceMax, setPriceMax] = useState(venue?.priceMax ?? 0);
  const [wa, setWa] = useState(venue?.wa ?? "");
  const [mapsQuery, setMapsQuery] = useState(venue?.mapsQuery ?? "");
  const [photoUrl, setPhotoUrl] = useState(venue?.photoUrl ?? "");
  const [note, setNote] = useState(venue?.note ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const err: Record<string, string> = {};
        if (!name.trim()) err.name = "Isi nama venue.";
        if (capacity && (!/^\d+$/.test(capacity) || Number(capacity) < 1)) err.capacity = "Kapasitas harus angka bulat.";
        if (priceMin && priceMax && priceMin > priceMax) err.price = "Harga terendah lebih besar dari harga tertinggi.";
        if (photoUrl.trim() && !/^https:\/\//i.test(photoUrl.trim())) err.photo = "Tautan foto harus diawali https://";
        setErrors(err);
        if (Object.keys(err).length) return;
        saveVenue({
          id: venue?.id,
          name: name.trim(),
          city: city.trim(),
          capacity: capacity ? Number(capacity) : null,
          priceMin: priceMin || null,
          priceMax: priceMax || null,
          wa: wa.trim(),
          mapsQuery: mapsQuery.trim(),
          photoUrl: photoUrl.trim(),
          note: note.trim(),
        });
        toast(venue ? "Venue diperbarui." : "Venue ditambahkan ke direktori.");
        onClose();
      }}
    >
      <TextField label="Nama venue" value={name} error={errors.name} onChange={(e) => setName(e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Kota" placeholder="Contoh: Kota Bogor" value={city} onChange={(e) => setCity(e.target.value)} />
        <TextField
          label="Kapasitas tamu"
          inputMode="numeric"
          value={capacity}
          error={errors.capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
        <MoneyField label="Harga terendah" value={priceMin} onChange={setPriceMin} />
        <MoneyField label="Harga tertinggi" error={errors.price} value={priceMax} onChange={setPriceMax} />
      </div>
      <TextField
        label="Nomor WhatsApp"
        inputMode="tel"
        placeholder="08xxxxxxxxxx"
        value={wa}
        onChange={(e) => setWa(e.target.value)}
      />
      <TextField
        label="Kata kunci Google Maps"
        hint="Dipakai tombol Google Maps. Kosongkan untuk memakai nama dan kota."
        value={mapsQuery}
        onChange={(e) => setMapsQuery(e.target.value)}
      />
      <TextField
        label="Tautan foto (opsional)"
        type="url"
        placeholder="https://"
        hint="Pakai foto yang sudah diizinkan pemilik venue."
        value={photoUrl}
        error={errors.photo}
        onChange={(e) => setPhotoUrl(e.target.value)}
      />
      <TextAreaField label="Catatan (opsional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button type="submit" block>
        {venue ? "Simpan perubahan" : "Tambah venue"}
      </Button>
    </form>
  );
}

function VendorForm({ vendor, onClose }: { vendor: Vendor | null; onClose: () => void }) {
  const [name, setName] = useState(vendor?.name ?? "");
  const [category, setCategory] = useState<string>(vendor?.category ?? VENDOR_CATEGORIES[0]);
  const [wa, setWa] = useState(vendor?.wa ?? "");
  const [priceNote, setPriceNote] = useState(vendor?.priceNote ?? "");
  const [note, setNote] = useState(vendor?.note ?? "");
  const [error, setError] = useState("");

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) {
          setError("Isi nama vendor.");
          return;
        }
        saveVendor({
          id: vendor?.id,
          name: name.trim(),
          category,
          wa: wa.trim(),
          priceNote: priceNote.trim(),
          note: note.trim(),
        });
        toast(vendor ? "Vendor diperbarui." : "Vendor ditambahkan ke katalog.");
        onClose();
      }}
    >
      <TextField label="Nama vendor" value={name} error={error} onChange={(e) => setName(e.target.value)} />
      <SelectField label="Kategori" value={category} onChange={(e) => setCategory(e.target.value)}>
        {VENDOR_CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </SelectField>
      <TextField
        label="Nomor WhatsApp"
        inputMode="tel"
        placeholder="08xxxxxxxxxx"
        value={wa}
        onChange={(e) => setWa(e.target.value)}
      />
      <TextField
        label="Keterangan harga"
        placeholder="Contoh: mulai Rp5 juta"
        value={priceNote}
        onChange={(e) => setPriceNote(e.target.value)}
      />
      <TextAreaField label="Catatan (opsional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button type="submit" block>
        {vendor ? "Simpan perubahan" : "Tambah vendor"}
      </Button>
    </form>
  );
}

export default function KatalogPage() {
  const role = useRole();
  const venues = useApp((s) => s.venues);
  const vendors = useApp((s) => s.vendors);
  const [view, setView] = useState<View>("venue");
  const [venueOpen, setVenueOpen] = useState<string | "new" | null>(null);
  const [vendorOpen, setVendorOpen] = useState<string | "new" | null>(null);
  const [deleting, setDeleting] = useState<{ kind: View; id: string; name: string } | null>(null);

  if (!role) return null;
  if (role !== "admin_mahesa" && role !== "super_admin") return <Denied need="oleh admin Mahesa atau Super Admin" />;

  const venueCols: Col<Venue>[] = [
    {
      header: "Venue",
      cell: (v) => (
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{v.name}</span>
          {v.sample && <Tag>Data contoh</Tag>}
        </span>
      ),
    },
    { header: "Kota", cell: (v) => v.city || "-" },
    { header: "Kapasitas", cell: (v) => (v.capacity ? `${v.capacity.toLocaleString("id-ID")} tamu` : "-") },
    { header: "Harga", cell: (v) => priceRange(v.priceMin, v.priceMax) },
    { header: "WhatsApp", cell: (v) => displayWa(v.wa), className: "whitespace-nowrap" },
  ];

  const vendorCols: Col<Vendor>[] = [
    {
      header: "Vendor",
      cell: (v) => (
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{v.name}</span>
          {v.sample && <Tag>Data contoh</Tag>}
        </span>
      ),
    },
    { header: "Kategori", cell: (v) => v.category },
    { header: "Harga", cell: (v) => v.priceNote || "-" },
    { header: "WhatsApp", cell: (v) => displayWa(v.wa), className: "whitespace-nowrap" },
  ];

  const editingVenue = venueOpen && venueOpen !== "new" ? (venues.find((v) => v.id === venueOpen) ?? null) : null;
  const editingVendor = vendorOpen && vendorOpen !== "new" ? (vendors.find((v) => v.id === vendorOpen) ?? null) : null;

  return (
    <>
      <AdminHeader
        title="Katalog"
        lead="Venue dan vendor di sini tampil sebagai rekomendasi untuk semua pasangan."
        action={
          <Button icon="plus" onClick={() => (view === "venue" ? setVenueOpen("new") : setVendorOpen("new"))}>
            {view === "venue" ? "Tambah venue" : "Tambah vendor"}
          </Button>
        }
      />
      <div className="max-w-sm pb-5">
        <Segmented
          label="Jenis katalog"
          value={view}
          onChange={setView}
          options={[
            { value: "venue", label: `Venue (${venues.length})` },
            { value: "vendor", label: `Vendor (${vendors.length})` },
          ]}
        />
      </div>

      {view === "venue" ? (
        venues.length === 0 ? (
          <EmptyState
            icon="pin"
            title="Direktori venue masih kosong"
            body="Tambahkan venue pertama. Pasangan langsung melihatnya di tab Vendor, bagian Venue."
            action={
              <Button icon="plus" onClick={() => setVenueOpen("new")}>
                Tambah venue
              </Button>
            }
          />
        ) : (
          <DataList
            caption="Daftar venue"
            rows={venues}
            cols={venueCols}
            actions={(v) => (
              <>
                <IconButton icon="edit" label={`Ubah ${v.name}`} onClick={() => setVenueOpen(v.id)} />
                <IconButton icon="trash" label={`Hapus ${v.name}`} onClick={() => setDeleting({ kind: "venue", id: v.id, name: v.name })} />
              </>
            )}
          />
        )
      ) : vendors.length === 0 ? (
        <EmptyState
          icon="store"
          title="Katalog vendor masih kosong"
          body="Tambahkan vendor per kategori, misalnya beberapa pilihan catering dan fotografi."
          action={
            <Button icon="plus" onClick={() => setVendorOpen("new")}>
              Tambah vendor
            </Button>
          }
        />
      ) : (
        <DataList
          caption="Daftar vendor"
          rows={vendors}
          cols={vendorCols}
          actions={(v) => (
            <>
              <IconButton icon="edit" label={`Ubah ${v.name}`} onClick={() => setVendorOpen(v.id)} />
              <IconButton icon="trash" label={`Hapus ${v.name}`} onClick={() => setDeleting({ kind: "vendor", id: v.id, name: v.name })} />
            </>
          )}
        />
      )}

      <Sheet variant="modal" open={venueOpen !== null} onClose={() => setVenueOpen(null)} title={editingVenue ? "Ubah venue" : "Tambah venue"}>
        <VenueForm key={venueOpen ?? "none"} venue={editingVenue} onClose={() => setVenueOpen(null)} />
      </Sheet>
      <Sheet variant="modal" open={vendorOpen !== null} onClose={() => setVendorOpen(null)} title={editingVendor ? "Ubah vendor" : "Tambah vendor"}>
        <VendorForm key={vendorOpen ?? "none"} vendor={editingVendor} onClose={() => setVendorOpen(null)} />
      </Sheet>
      <ConfirmDelete
        variant="modal"
        open={!!deleting}
        what={deleting?.name ?? ""}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          if (deleting.kind === "venue") removeVenue(deleting.id);
          else removeVendor(deleting.id);
          toast(`${deleting.name} dihapus.`);
          setDeleting(null);
        }}
      />
    </>
  );
}
