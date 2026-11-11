"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminHeader, Denied, useRole } from "@/components/admin/shared";
import { Icon } from "@/components/icons";
import { ORG_NAME } from "@/components/promo";
import { Button, buttonClass, Card, EmptyState, IconButton, Segmented, SelectField, Tag, TextField, toast } from "@/components/ui";
import { coupleLabel, daysUntil, displayWa, formatDate, formatRp, formatShortDate, waLink } from "@/lib/format";
import { resolveTheme, THEMES } from "@/lib/invitation-themes";
import { EDIT_STATUS, LINK_STATE, REQUEST_STATUS, VENDOR_STATUS } from "@/lib/labels";
import { TRACK_LABEL, VENDOR_CATEGORIES } from "@/lib/seed";
import {
  addRundown,
  adminSetInvitationTheme,
  buildChecklist,
  canSeeWedding,
  removeRundown,
  removeWeddingVendor,
  saveWeddingVendor,
  setLink,
  setRequestStatus,
  updateWedding,
  useApp,
} from "@/lib/store";
import type { EditStatus, LinkState, OrgKey, Plan, VendorStatus, Wedding } from "@/lib/types";

function Panel({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3">
        <h2 className="text-[21px]">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Summary({ wedding }: { wedding: Wedding }) {
  const templates = useApp((s) => s.templates);
  const entries = useApp((s) => s.checklist);
  const budget = useApp((s) => s.budget);
  const guests = useApp((s) => s.guests);

  const rows = useMemo(
    () => buildChecklist(templates, entries, wedding.id, wedding.track).filter((r) => !r.hidden),
    [templates, entries, wedding.id, wedding.track],
  );
  const mine = budget.filter((b) => b.weddingId === wedding.id);
  const paid = mine.reduce((n, b) => n + b.paid, 0);
  const total = mine.reduce((n, b) => n + (b.actual || b.planned), 0);
  const myGuests = guests.filter((g) => g.weddingId === wedding.id);
  const days = daysUntil(wedding.akadDate);

  const facts: [string, string][] = [
    [
      "Menuju akad",
      days === null ? "Tanggal belum diisi" : days > 0 ? `${days} hari lagi` : days === 0 ? "Hari ini" : `Lewat ${-days} hari`,
    ],
    ["Ceklis", rows.length ? `${rows.filter((r) => r.done).length} dari ${rows.length} selesai` : "Belum ada item"],
    ["Budget", mine.length ? `${formatRp(paid)} dibayar dari ${formatRp(total)}` : "Belum diisi"],
    [
      "Tamu",
      myGuests.length
        ? `${myGuests.reduce((n, g) => n + g.count, 0)} orang, ${myGuests.length} undangan`
        : "Belum diisi",
    ],
  ];

  return (
    <Card className="p-4">
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-[13px] text-ink-soft">{label}</dt>
            <dd className="font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function PlanEditor({ wedding }: { wedding: Wedding }) {
  return (
    <Card className="p-4">
      <p className="max-w-[60ch] text-[15px] text-ink-soft">
        Paket premium membuka fitur undangan digital. Aktifkan setelah pembayaran dikonfirmasi lewat WhatsApp.
      </p>
      <div className="mt-3 max-w-sm">
        <Segmented<Plan>
          label="Paket proyek"
          value={wedding.plan}
          onChange={(plan) => {
            updateWedding(wedding.id, { plan });
            toast(plan === "premium" ? "Paket premium diaktifkan." : "Paket dikembalikan ke gratis.");
          }}
          options={[
            { value: "gratis", label: "Gratis" },
            { value: "premium", label: "Premium" },
          ]}
        />
      </div>
    </Card>
  );
}

function ThemeAdmin({ wedding }: { wedding: Wedding }) {
  const invitation = useApp((s) => s.invitations.find((i) => i.weddingId === wedding.id));
  const [theme, setTheme] = useState(resolveTheme(invitation?.theme).id);
  if (!invitation) {
    return <p className="text-[15px] text-ink-soft">Pasangan belum membuat undangan, jadi belum ada tema yang bisa diatur.</p>;
  }
  const current = resolveTheme(invitation.theme);
  return (
    <Card className="space-y-4 p-4">
      <p className="max-w-[60ch] text-[15px] text-ink-soft">
        Tema saat ini: <strong className="text-ink">{current.name}</strong>, {invitation.themeLocked ? "terkunci" : "belum dikunci"}. Pasangan hanya bisa ganti tema sendiri selama belum dikunci.
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <SelectField label="Tema" value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)}>
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </SelectField>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              if (await adminSetInvitationTheme(wedding.id, theme, true)) toast("Tema diganti dan dikunci.");
            }}
          >
            Ganti dan kunci
          </Button>
          <Button
            variant="secondary"
            disabled={!invitation.themeLocked}
            onClick={async () => {
              if (await adminSetInvitationTheme(wedding.id, invitation.theme, false)) toast("Kunci dibuka, pasangan bisa memilih tema lagi.");
            }}
          >
            Buka kunci
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RequestList({ weddingId, org }: { weddingId: string; org: OrgKey }) {
  const all = useApp((s) => s.requests);
  const list = all.filter((r) => r.weddingId === weddingId && r.org === org);
  if (!list.length) {
    return <p className="text-[15px] text-ink-soft">Belum ada permintaan perubahan dari pasangan ini.</p>;
  }
  return (
    <ul className="space-y-3">
      {list.map((r) => (
        <li key={r.id}>
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone={REQUEST_STATUS[r.status].tone}>{REQUEST_STATUS[r.status].label}</Tag>
              <span className="text-[13px] text-ink-soft">
                {r.section}, {formatShortDate(r.createdAt.slice(0, 10))}
              </span>
            </div>
            <p className="mt-2 text-[15px] text-ink">{r.note}</p>
            {r.status === "menunggu" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setRequestStatus(r.id, "disetujui");
                    toast("Permintaan disetujui. Jangan lupa ubah datanya.");
                  }}
                >
                  Setujui perubahan
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setRequestStatus(r.id, "ditolak");
                    toast("Permintaan ditolak.");
                  }}
                >
                  Tolak
                </Button>
              </div>
            )}
          </Card>
        </li>
      ))}
    </ul>
  );
}

function RundownEditor({ wedding }: { wedding: Wedding }) {
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  return (
    <Card className="p-4">
      {wedding.rundown.length ? (
        <ol className="divide-y divide-line">
          {wedding.rundown.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-1.5">
              <span className="w-14 shrink-0 font-serif font-semibold tabular-nums text-brand-deep">{r.time}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] text-ink">{r.title}</span>
                {r.note && <span className="block text-[13px] text-ink-soft">{r.note}</span>}
              </span>
              <IconButton icon="trash" label={`Hapus ${r.title} dari rundown`} onClick={() => removeRundown(wedding.id, r.id)} />
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[15px] text-ink-soft">Rundown masih kosong. Tambahkan susunan acara pertama di bawah.</p>
      )}
      <form
        noValidate
        className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[8rem_1fr] lg:grid-cols-[8rem_1fr_1fr_auto] lg:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (!time || !title.trim()) {
            setError("Isi jam dan nama acaranya.");
            return;
          }
          addRundown(wedding.id, { time, title: title.trim(), note: note.trim() });
          setTime("");
          setTitle("");
          setNote("");
          setError("");
        }}
      >
        <TextField label="Jam" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        <TextField label="Acara" value={title} error={error} onChange={(e) => setTitle(e.target.value)} />
        <TextField label="Catatan (opsional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button type="submit" icon="plus">
          Tambah
        </Button>
      </form>
    </Card>
  );
}

const STATUSES = Object.keys(VENDOR_STATUS) as VendorStatus[];

function ProjectVendors({ wedding }: { wedding: Wedding }) {
  const catalog = useApp((s) => s.vendors);
  const all = useApp((s) => s.weddingVendors);
  const list = all.filter((v) => v.weddingId === wedding.id);
  const [source, setSource] = useState("manual");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(VENDOR_CATEGORIES[0]);
  const [status, setStatus] = useState<VendorStatus>("deal");
  const [error, setError] = useState("");

  return (
    <Card className="p-4">
      {list.length ? (
        <ul className="divide-y divide-line">
          {list.map((v) => {
            const mine = v.managedBy === "mahesa";
            return (
              <li key={v.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{v.name}</span>
                  <span className="block text-[13px] text-ink-soft">
                    {v.category}, {mine ? "dikelola Mahesa" : "pilihan pasangan"}
                  </span>
                </span>
                {mine ? (
                  <>
                    <label className="sr-only" htmlFor={`st-${v.id}`}>
                      Status {v.name}
                    </label>
                    <select
                      id={`st-${v.id}`}
                      value={v.status}
                      onChange={(e) => saveWeddingVendor({ ...v, status: e.target.value as VendorStatus })}
                      className="min-h-11 rounded-[8px] border border-ink/55 bg-paper px-2 text-[15px] hover:border-ink"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {VENDOR_STATUS[s].label}
                        </option>
                      ))}
                    </select>
                    <IconButton icon="trash" label={`Hapus ${v.name} dari proyek`} onClick={() => removeWeddingVendor(v.id)} />
                  </>
                ) : (
                  <Tag tone={VENDOR_STATUS[v.status].tone}>{VENDOR_STATUS[v.status].label}</Tag>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[15px] text-ink-soft">Belum ada vendor di proyek ini.</p>
      )}

      <form
        noValidate
        className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const picked = catalog.find((c) => c.id === source);
          if (!picked && !name.trim()) {
            setError("Isi nama vendornya.");
            return;
          }
          saveWeddingVendor({
            weddingId: wedding.id,
            catalogId: picked?.id ?? null,
            name: picked?.name ?? name.trim(),
            category: picked?.category ?? category,
            wa: picked?.wa ?? "",
            status,
            note: "",
            managedBy: "mahesa",
          });
          setName("");
          setError("");
          toast("Vendor ditambahkan dan terkunci untuk pasangan.");
        }}
      >
        <SelectField label="Sumber vendor" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="manual">Isi manual</option>
          {catalog.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.category})
            </option>
          ))}
        </SelectField>
        {source === "manual" && (
          <>
            <TextField label="Nama vendor" value={name} error={error} onChange={(e) => setName(e.target.value)} />
            <SelectField label="Kategori" value={category} onChange={(e) => setCategory(e.target.value)}>
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </SelectField>
          </>
        )}
        <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as VendorStatus)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {VENDOR_STATUS[s].label}
            </option>
          ))}
        </SelectField>
        <Button type="submit" icon="plus">
          Tambah vendor
        </Button>
      </form>
    </Card>
  );
}

function WccForm({ wedding }: { wedding: Wedding }) {
  const [shootDate, setShootDate] = useState(wedding.wcc.shootDate ?? "");
  const [status, setStatus] = useState<EditStatus>(wedding.wcc.status);
  const [link, setLinkValue] = useState(wedding.wcc.resultLink);
  const [error, setError] = useState("");

  return (
    <Card className="p-4">
      <form
        noValidate
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_auto] lg:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const url = link.trim();
          if (url && !/^https?:\/\//i.test(url)) {
            setError("Tautan harus diawali https://");
            return;
          }
          updateWedding(wedding.id, { wcc: { shootDate: shootDate || null, status, resultLink: url } });
          setError("");
          toast("Data WCC disimpan.");
        }}
      >
        <TextField label="Jadwal shooting" type="date" value={shootDate} onChange={(e) => setShootDate(e.target.value)} />
        <SelectField label="Status editing" value={status} onChange={(e) => setStatus(e.target.value as EditStatus)}>
          {(Object.keys(EDIT_STATUS) as EditStatus[]).map((s) => (
            <option key={s} value={s}>
              {EDIT_STATUS[s]}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Tautan hasil video"
          type="url"
          placeholder="https://"
          value={link}
          error={error}
          onChange={(e) => setLinkValue(e.target.value)}
        />
        <Button type="submit">Simpan data WCC</Button>
      </form>
    </Card>
  );
}

function LinkEditor({ wedding }: { wedding: Wedding }) {
  return (
    <Card className="grid gap-3 p-4 sm:grid-cols-2">
      {(["mahesa", "momentum"] as OrgKey[]).map((org) => (
        <SelectField
          key={org}
          label={`Tautan ke ${ORG_NAME[org]}`}
          value={wedding[org]}
          onChange={(e) => {
            setLink(wedding.id, org, e.target.value as LinkState);
            toast(`Tautan ${ORG_NAME[org]} diubah.`);
          }}
        >
          {(Object.keys(LINK_STATE) as LinkState[]).map((s) => (
            <option key={s} value={s}>
              {LINK_STATE[s].label}
            </option>
          ))}
        </SelectField>
      ))}
    </Card>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const role = useRole();
  const weddings = useApp((s) => s.weddings);
  const wedding = useMemo(() => weddings.find((w) => w.id === id) ?? null, [weddings, id]);

  if (!role) return null;

  const back = (
    <Link href="/admin" className={buttonClass("ghost")}>
      <Icon name="chevronLeft" size={18} />
      Semua proyek
    </Link>
  );

  if (!wedding) {
    return (
      <EmptyState
        level={1}
        icon="folder"
        title="Proyek tidak ditemukan"
        body="Proyek ini mungkin sudah dihapus, atau tautannya salah."
        action={back}
      />
    );
  }

  if (!canSeeWedding(role, wedding)) return <Denied need="oleh admin dari organisasi yang tertaut ke proyek ini" />;

  const isSuper = role === "super_admin";
  const mahesaOpen = (isSuper || role === "admin_mahesa") && wedding.mahesa === "aktif";
  const momentumOpen = (isSuper || role === "admin_momentum") && wedding.momentum === "aktif";
  const myOrg: OrgKey | null = role === "admin_mahesa" ? "mahesa" : role === "admin_momentum" ? "momentum" : null;
  const pendingOnly = !!myOrg && wedding[myOrg] === "diajukan";
  const name = coupleLabel(wedding.brideName, wedding.groomName);

  return (
    <>
      <div className="-ml-3 pb-2">{back}</div>
      <AdminHeader
        title={name}
        lead={
          <>
            Akad {formatDate(wedding.akadDate, "belum diisi")}
            {wedding.city ? `, ${wedding.city}` : ""}. Jalur {wedding.track ? TRACK_LABEL[wedding.track] : "belum dipilih"}.
            Kode {wedding.code}.
          </>
        }
        action={
          wedding.contactWa ? (
            <a
              href={waLink(wedding.contactWa, `Halo ${name}, ini admin dari Momentum Planner.`)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("secondary")}
            >
              <Icon name="chat" size={18} />
              WhatsApp {displayWa(wedding.contactWa)}
            </a>
          ) : undefined
        }
      />
      {wedding.sample && (
        <div className="-mt-3 pb-4">
          <Tag>Data contoh</Tag>
        </div>
      )}

      {pendingOnly && myOrg ? (
        <Card className="p-5">
          <Tag tone="sun">Pengajuan belum ditautkan</Tag>
          <p className="mt-2 max-w-[60ch] text-[15px] text-ink">
            Pasangan ini mengajukan paket ke {ORG_NAME[myOrg]}. Detail proyek terbuka setelah kamu menautkannya.
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              setLink(wedding.id, myOrg, "aktif");
              toast("Proyek ditautkan.");
            }}
          >
            Tautkan proyek
          </Button>
        </Card>
      ) : (
        <>
          <Summary wedding={wedding} />

          {isSuper && (
            <Panel title="Tautan organisasi">
              <LinkEditor wedding={wedding} />
            </Panel>
          )}

          {isSuper && (
            <Panel title="Paket proyek" aside={<Tag tone={wedding.plan === "premium" ? "leaf" : "neutral"}>{wedding.plan === "premium" ? "Premium" : "Gratis"}</Tag>}>
              <PlanEditor wedding={wedding} />
            </Panel>
          )}

          {isSuper && wedding.plan === "premium" && (
            <Panel title="Tema undangan">
              <ThemeAdmin key={wedding.id} wedding={wedding} />
            </Panel>
          )}

          {mahesaOpen && (
            <>
              <Panel title="Permintaan perubahan ke Mahesa">
                <RequestList weddingId={wedding.id} org="mahesa" />
              </Panel>
              <Panel title="Rundown hari H" aside={<Tag tone="leaf">Hanya-baca untuk pasangan</Tag>}>
                <RundownEditor wedding={wedding} />
              </Panel>
              <Panel title="Vendor proyek" aside={<Tag tone="leaf">Vendor Mahesa terkunci untuk pasangan</Tag>}>
                <ProjectVendors wedding={wedding} />
              </Panel>
            </>
          )}

          {momentumOpen && (
            <>
              <Panel title="Permintaan perubahan ke Momentum">
                <RequestList weddingId={wedding.id} org="momentum" />
              </Panel>
              <Panel title="Paket WCC">
                <WccForm key={wedding.id} wedding={wedding} />
              </Panel>
            </>
          )}
        </>
      )}
    </>
  );
}
