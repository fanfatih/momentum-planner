"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/shell";
import { Button, buttonClass, Card, Chip, EmptyState, Reveal, SelectField, Sheet, Tag, TextAreaField, TextField, toast } from "@/components/ui";
import { useCurrentWedding } from "@/lib/guard";
import { GUEST_GROUP, GUEST_STATUS } from "@/lib/labels";
import { removeGuest, saveGuest, useApp } from "@/lib/store";
import { canSendInvitation, defaultInviteMessage, guestLink, inviteWaUrl } from "@/lib/share-invitation";
import type { Guest, GuestGroup, GuestStatus, Invitation, Wedding } from "@/lib/types";

const GROUPS = Object.keys(GUEST_GROUP) as GuestGroup[];
const STATUSES = Object.keys(GUEST_STATUS) as GuestStatus[];

/** Tamu yang sudah dikirimi link otomatis ditandai Diundang, supaya daftar kerja tetap rapi. */
function markInvited(guest: Guest) {
  if (guest.status !== "belum") return false;
  saveGuest({ ...guest, status: "diundang" });
  toast(`${guest.name} ditandai Diundang.`);
  return true;
}

function SendPanel({
  wedding,
  invitation,
  guest,
  onSent,
}: {
  wedding: Wedding;
  invitation: Invitation | undefined;
  guest: Guest;
  onSent: () => void;
}) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const published = canSendInvitation(wedding, invitation);
  const link = published ? guestLink(origin, invitation.slug, guest.name) : "";
  const [text, setText] = useState(() => (published ? defaultInviteMessage(wedding, guest, link) : ""));

  if (wedding.plan !== "premium") return null;
  if (!published) {
    return (
      <section aria-label="Kirim undangan" className="space-y-2 rounded-[12px] border border-line bg-paper p-3">
        <h3 className="text-[16px]">Kirim undangan digital</h3>
        <p className="m-0 text-[14px] text-ink-soft">Undangan belum aktif. Aktifkan dulu di menu Undangan, lalu link personal tamu muncul di sini.</p>
      </section>
    );
  }
  return (
    <section aria-label="Kirim undangan" className="space-y-3 rounded-[12px] border border-line bg-paper p-3">
      <h3 className="text-[16px]">Kirim undangan digital</h3>
      <TextAreaField label="Pesan WhatsApp" value={text} onChange={(e) => setText(e.target.value)} hint="Boleh diubah sebelum dikirim. Link personal sudah ada di dalamnya." />
      <div className="grid grid-cols-2 gap-2">
        <a
          href={inviteWaUrl(guest, text)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("primary")}
          onClick={() => {
            if (markInvited(guest)) onSent();
          }}
        >
          Kirim lewat WhatsApp
        </a>
        <Button
          variant="secondary"
          icon="copy"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              toast("Link personal disalin.");
            } catch {
              toast("Link tidak bisa disalin otomatis.");
            }
          }}
        >
          Salin link
        </Button>
      </div>
      {!guest.wa.trim() && <p className="m-0 text-[13px] text-ink-soft">Belum ada nomor WhatsApp. WhatsApp akan meminta kamu memilih kontaknya.</p>}
    </section>
  );
}

function GuestForm({
  weddingId,
  guest,
  onClose,
  wedding,
  invitation,
}: {
  weddingId: string;
  guest: Guest | null;
  onClose: () => void;
  wedding: Wedding;
  invitation: Invitation | undefined;
}) {
  const [name, setName] = useState(guest?.name ?? "");
  const [wa, setWa] = useState(guest?.wa ?? "");
  const [group, setGroup] = useState<GuestGroup>(guest?.group ?? "keluarga_wanita");
  const [count, setCount] = useState(String(guest?.count ?? 1));
  const [status, setStatus] = useState<GuestStatus>(guest?.status ?? "belum");
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(count);
        const err: Record<string, string> = {};
        if (!name.trim()) err.name = "Isi nama tamu atau keluarganya.";
        if (!Number.isInteger(n) || n < 1) err.count = "Jumlah orang minimal 1.";
        setErrors(err);
        if (Object.keys(err).length) return;
        saveGuest({ id: guest?.id, weddingId, name: name.trim(), wa: wa.trim(), group, count: n, status });
        toast(guest ? "Data tamu diperbarui." : "Tamu ditambahkan.");
        onClose();
      }}
    >
      <TextField
        label="Nama tamu"
        placeholder="Contoh: Keluarga Pak Hasan"
        value={name}
        error={errors.name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        label="Nomor WhatsApp (opsional)"
        inputMode="tel"
        placeholder="08xxxxxxxxxx"
        value={wa}
        onChange={(e) => setWa(e.target.value)}
      />
      <SelectField label="Kelompok" value={group} onChange={(e) => setGroup(e.target.value as GuestGroup)}>
        {GROUPS.map((g) => (
          <option key={g} value={g}>
            {GUEST_GROUP[g]}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Jumlah orang"
        type="number"
        inputMode="numeric"
        min={1}
        value={count}
        error={errors.count}
        onChange={(e) => setCount(e.target.value)}
      />
      <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as GuestStatus)}>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {GUEST_STATUS[s].label}
          </option>
        ))}
      </SelectField>
      <Button type="submit" block>
        {guest ? "Simpan perubahan" : "Tambah tamu"}
      </Button>
      {guest && <SendPanel wedding={wedding} invitation={invitation} guest={guest} onSent={() => setStatus("diundang")} />}
      {guest && (
        <Button
          variant="danger"
          block
          icon="trash"
          onClick={() => {
            removeGuest(guest.id);
            toast("Tamu dihapus dari daftar.");
            onClose();
          }}
        >
          Hapus tamu ini
        </Button>
      )}
    </form>
  );
}

export default function TamuPage() {
  const wedding = useCurrentWedding();
  const all = useApp((s) => s.guests);
  const invitations = useApp((s) => s.invitations);
  const [status, setStatus] = useState<GuestStatus | "semua">("semua");
  const [group, setGroup] = useState<GuestGroup | "semua">("semua");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | "new" | null>(null);

  const guests = useMemo(() => all.filter((g) => g.weddingId === wedding?.id), [all, wedding?.id]);
  if (!wedding) return null;

  const people = (list: Guest[]) => list.reduce((n, g) => n + g.count, 0);
  const q = query.trim().toLowerCase();
  const shown = guests.filter(
    (g) =>
      (status === "semua" || g.status === status) &&
      (group === "semua" || g.group === group) &&
      (!q || g.name.toLowerCase().includes(q)),
  );
  const filtered = status !== "semua" || group !== "semua" || !!q;
  const editing = openId && openId !== "new" ? (guests.find((g) => g.id === openId) ?? null) : null;
  const invitation = invitations.find((i) => i.weddingId === wedding.id);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const sendable = canSendInvitation(wedding, invitation);

  return (
    <>
      <PageHeader
        title="Tamu"
        lead={guests.length ? `${people(guests)} orang dalam ${guests.length} undangan` : undefined}
        action={
          guests.length ? (
            <Button icon="plus" className="shrink-0" onClick={() => setOpenId("new")}>
              Tambah
            </Button>
          ) : undefined
        }
      />

      {guests.length === 0 ? (
        <EmptyState
          icon="people"
          title="Daftar tamu masih kosong"
          body="Catat per undangan. Satu baris bisa mewakili satu keluarga dengan beberapa orang."
          action={
            <Button icon="plus" onClick={() => setOpenId("new")}>
              Tambah tamu pertama
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3 px-5">
            <div role="group" aria-label="Saring menurut status" className="flex flex-wrap gap-2">
              <Chip selected={status === "semua"} onClick={() => setStatus("semua")}>
                Semua ({people(guests)})
              </Chip>
              {STATUSES.map((s) => (
                <Chip key={s} selected={status === s} onClick={() => setStatus(s)}>
                  {GUEST_STATUS[s].label} ({people(guests.filter((g) => g.status === s))})
                </Chip>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Cari nama"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <SelectField label="Kelompok" value={group} onChange={(e) => setGroup(e.target.value as GuestGroup | "semua")}>
                <option value="semua">Semua kelompok</option>
                {GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {GUEST_GROUP[g]}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>

          {shown.length === 0 ? (
            <EmptyState
              icon="search"
              title="Tidak ada tamu yang cocok"
              body="Tidak ada undangan dengan status, kelompok, atau nama tersebut."
              action={
                filtered ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setStatus("semua");
                      setGroup("semua");
                      setQuery("");
                    }}
                  >
                    Hapus semua filter
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Card className="mx-5 mt-4 overflow-hidden">
              <ul className="divide-y divide-line">
                {shown.map((g, i) => (
                  <Reveal as="li" key={g.id} i={i}>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setOpenId(g.id)}
                        className="flex min-h-16 min-w-0 flex-1 items-center justify-between gap-3 py-3 pl-4 pr-2 text-left transition-colors duration-150 hover:bg-cream-deep active:bg-line"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink">{g.name}</span>
                          <span className="block text-[13px] text-ink-soft">
                            {GUEST_GROUP[g.group]}, {g.count} orang
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <Tag tone={GUEST_STATUS[g.status].tone}>{GUEST_STATUS[g.status].label}</Tag>
                          <Icon name="chevronRight" size={16} className="text-ink-soft" />
                        </span>
                      </button>
                      {sendable && (
                        <a
                          href={inviteWaUrl(g, defaultInviteMessage(wedding, g, guestLink(origin, invitation.slug, g.name)))}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Kirim undangan ke ${g.name} lewat WhatsApp`}
                          title="Kirim undangan lewat WhatsApp"
                          onClick={() => markInvited(g)}
                          className="mr-2 inline-grid size-11 shrink-0 place-items-center rounded-[10px] text-brand-deep transition-colors duration-150 hover:bg-cream-deep active:bg-line"
                        >
                          <Icon name="chat" size={20} />
                        </a>
                      )}
                    </div>
                  </Reveal>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      <Sheet open={openId !== null} onClose={() => setOpenId(null)} title={editing ? "Ubah data tamu" : "Tambah tamu"}>
        <GuestForm key={openId ?? "none"} weddingId={wedding.id} guest={editing} wedding={wedding} invitation={invitation} onClose={() => setOpenId(null)} />
      </Sheet>
    </>
  );
}
