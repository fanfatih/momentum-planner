"use client";

import { useState } from "react";
import { AdminHeader, DataList, Denied, useRole, type Col } from "@/components/admin/shared";
import {
  Button,
  Card,
  ConfirmDelete,
  IconButton,
  Notice,
  SelectField,
  Sheet,
  Tag,
  TextField,
  toast,
} from "@/components/ui";
import { isDummyWa, toWaNumber } from "@/lib/format";
import { REMOTE } from "@/lib/mode";
import { ROLE_LABEL } from "@/lib/labels";
import { removeAccount, resetDemo, saveAccount, updateSettings, useApp } from "@/lib/store";
import type { AdminAccount, Settings } from "@/lib/types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADMIN_ROLES: AdminAccount["role"][] = ["admin_mahesa", "admin_momentum", "super_admin"];

function ContactForm({ settings }: { settings: Settings }) {
  const [form, setForm] = useState(settings);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const err: Record<string, string> = {};
        if (toWaNumber(form.mahesaWa).length < 10) err.mahesaWa = "Nomor terlalu pendek.";
        if (toWaNumber(form.momentumWa).length < 10) err.momentumWa = "Nomor terlalu pendek.";
        if (!EMAIL.test(form.mahesaEmail.trim())) err.mahesaEmail = "Format email belum benar.";
        if (!EMAIL.test(form.momentumEmail.trim())) err.momentumEmail = "Format email belum benar.";
        setErrors(err);
        if (Object.keys(err).length) return;
        updateSettings({
          mahesaWa: toWaNumber(form.mahesaWa),
          momentumWa: toWaNumber(form.momentumWa),
          mahesaEmail: form.mahesaEmail.trim(),
          momentumEmail: form.momentumEmail.trim(),
        });
        toast("Kontak disimpan.");
      }}
    >
      {isDummyWa(settings.mahesaWa) && (
        <Notice>
          Nomor WhatsApp Mahesa masih nomor contoh. Tombol Ajukan Paket dan Ajukan Perubahan belum sampai ke admin
          sungguhan sampai nomor ini diganti.
        </Notice>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="WhatsApp admin Mahesa"
          inputMode="tel"
          value={form.mahesaWa}
          error={errors.mahesaWa}
          onChange={set("mahesaWa")}
        />
        <TextField
          label="Email admin Mahesa"
          type="email"
          value={form.mahesaEmail}
          error={errors.mahesaEmail}
          onChange={set("mahesaEmail")}
        />
        <TextField
          label="WhatsApp admin Momentum"
          inputMode="tel"
          value={form.momentumWa}
          error={errors.momentumWa}
          onChange={set("momentumWa")}
        />
        <TextField
          label="Email admin Momentum"
          type="email"
          value={form.momentumEmail}
          error={errors.momentumEmail}
          onChange={set("momentumEmail")}
        />
      </div>
      <Button type="submit">Simpan kontak</Button>
    </form>
  );
}

function AccountForm({ account, onClose }: { account: AdminAccount | null; onClose: () => void }) {
  const [name, setName] = useState(account?.name ?? "");
  const [email, setEmail] = useState(account?.email ?? "");
  const [role, setRole] = useState<AdminAccount["role"]>(account?.role ?? "admin_mahesa");
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const err: Record<string, string> = {};
        if (!name.trim()) err.name = "Isi nama admin.";
        if (!EMAIL.test(email.trim())) err.email = "Isi email Google yang valid.";
        setErrors(err);
        if (Object.keys(err).length) return;
        saveAccount({ id: account?.id, name: name.trim(), email: email.trim().toLowerCase(), role });
        toast(account ? "Akun admin diperbarui." : "Akun admin ditambahkan.");
        onClose();
      }}
    >
      <TextField label="Nama" value={name} error={errors.name} onChange={(e) => setName(e.target.value)} />
      <TextField
        label="Email Google"
        type="email"
        hint="Email ini yang mendapat akses admin saat login Google aktif."
        value={email}
        error={errors.email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <SelectField label="Role" value={role} onChange={(e) => setRole(e.target.value as AdminAccount["role"])}>
        {ADMIN_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </SelectField>
      <Button type="submit" block>
        {account ? "Simpan perubahan" : "Tambah akun admin"}
      </Button>
    </form>
  );
}

export default function AkunPage() {
  const role = useRole();
  const settings = useApp((s) => s.settings);
  const accounts = useApp((s) => s.accounts);
  const [open, setOpen] = useState<string | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminAccount | null>(null);
  const [resetting, setResetting] = useState(false);

  if (!role) return null;
  if (role !== "super_admin") return <Denied need="oleh Super Admin" />;

  const editing = open && open !== "new" ? (accounts.find((a) => a.id === open) ?? null) : null;
  const superCount = accounts.filter((a) => a.role === "super_admin").length;

  const cols: Col<AdminAccount>[] = [
    {
      header: "Nama",
      cell: (a) => (
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{a.name}</span>
          {a.placeholder && <Tag>Email contoh</Tag>}
        </span>
      ),
    },
    { header: "Email Google", cell: (a) => <span className="break-all">{a.email}</span> },
    { header: "Role", cell: (a) => ROLE_LABEL[a.role], className: "whitespace-nowrap" },
  ];

  return (
    <>
      <AdminHeader title="Akun dan kontak" lead="Nomor WhatsApp tujuan tombol di aplikasi pasangan, dan daftar email yang berhak jadi admin." />

      <section aria-labelledby="kontak-title">
        <h2 id="kontak-title" className="pb-3 text-[21px]">
          Kontak admin
        </h2>
        <Card className="p-4">
          <ContactForm key={JSON.stringify(settings)} settings={settings} />
        </Card>
      </section>

      <section aria-labelledby="akun-title" className="pt-8">
        <div className="flex flex-wrap items-end justify-between gap-3 pb-3">
          <div>
            <h2 id="akun-title" className="text-[21px]">
              Akun admin
            </h2>
            <p className="mt-1 max-w-[60ch] text-[15px] text-ink-soft">
              {REMOTE
                ? "Hanya email di daftar ini yang mendapat akses admin saat pertama kali masuk dengan Google. Email lain masuk sebagai pengantin."
                : "Di mode demo daftar ini belum membatasi siapa pun. Pembatasan berlaku setelah login Google tersambung."}
            </p>
          </div>
          <Button icon="plus" onClick={() => setOpen("new")}>
            Tambah akun admin
          </Button>
        </div>
        <DataList
          caption="Daftar akun admin"
          rows={accounts}
          cols={cols}
          actions={(a) => {
            const lastSuper = a.role === "super_admin" && superCount <= 1;
            return (
              <>
                <IconButton icon="edit" label={`Ubah akun ${a.name}`} onClick={() => setOpen(a.id)} />
                <IconButton
                  icon="trash"
                  label={lastSuper ? "Super Admin terakhir tidak bisa dihapus" : `Hapus akun ${a.name}`}
                  disabled={lastSuper}
                  onClick={() => setDeleting(a)}
                />
              </>
            );
          }}
        />
      </section>

      {!REMOTE && (
      <section aria-labelledby="reset-title" className="pt-8">
        <h2 id="reset-title" className="pb-3 text-[21px]">
          Data demo
        </h2>
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="max-w-[52ch] text-[15px] text-ink-soft">
            Mengembalikan semua data di perangkat ini ke data contoh awal, termasuk proyek, katalog, dan kontak.
          </p>
          <Button variant="danger" onClick={() => setResetting(true)}>
            Kembalikan data demo ke awal
          </Button>
        </Card>
      </section>
      )}

      <Sheet variant="modal" open={open !== null} onClose={() => setOpen(null)} title={editing ? "Ubah akun admin" : "Tambah akun admin"}>
        <AccountForm key={open ?? "none"} account={editing} onClose={() => setOpen(null)} />
      </Sheet>
      <ConfirmDelete
        variant="modal"
        open={!!deleting}
        what={deleting ? `Akun ${deleting.name}` : ""}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          removeAccount(deleting.id);
          toast("Akun admin dihapus.");
          setDeleting(null);
        }}
      />
      <Sheet variant="modal" open={resetting} onClose={() => setResetting(false)} title="Kembalikan data demo?">
        <p className="text-[15px] text-ink-soft">
          Semua perubahan di perangkat ini hilang dan kamu akan keluar dari sesi ini.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setResetting(false)}>
            Batal
          </Button>
          <Button
            onClick={() => {
              resetDemo();
              toast("Data demo dikembalikan ke kondisi awal.");
            }}
          >
            Kembalikan
          </Button>
        </div>
      </Sheet>
    </>
  );
}
