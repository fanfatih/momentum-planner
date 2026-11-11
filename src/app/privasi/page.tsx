import type { Metadata } from "next";
import { Block, Items, LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Kebijakan privasi" };

export default function PrivasiPage() {
  return (
    <LegalPage title="Kebijakan privasi">
      <p>
        Momentum Planner dikelola oleh Momentum by Luna di Bogor. Halaman ini menjelaskan data apa yang kami simpan, siapa yang bisa melihatnya, dan bagaimana
        kamu bisa meminta data dihapus.
      </p>

      <Block title="Data yang kami simpan">
        <Items>
          <li>Akun: nama dan alamat email dari akun Google yang dipakai masuk. Kami tidak pernah melihat kata sandi Google kamu.</li>
          <li>Proyek pernikahan: nama pasangan, tanggal, kota, jalur dokumen, ceklis, budget, vendor, dan daftar tamu (nama, kelompok, jumlah orang, dan nomor WhatsApp bila diisi).</li>
          <li>Undangan digital: kalimat, jadwal acara, foto galeri, musik latar, dan nomor rekening untuk amplop digital bila diisi.</li>
          <li>Respons tamu: nama, status kehadiran, jumlah tamu, dan ucapan yang ditulis tamu di halaman undangan.</li>
        </Items>
      </Block>

      <Block title="Siapa yang bisa melihat">
        <Items>
          <li>Pasangan dan anggota proyek yang bergabung dengan kode proyek.</li>
          <li>Admin Momentum by Luna dan Super Admin. Admin Mahesa Weddings hanya melihat proyek yang ditautkan ke Mahesa.</li>
          <li>
            Undangan yang diaktifkan bersifat terbuka: siapa pun yang punya link bisa melihat isinya, foto, musik, nomor rekening amplop digital, dan daftar ucapan
            (nama dan pesan tamu). Jangan mengisi hal yang tidak ingin dilihat orang lain di bagian itu.
          </li>
          <li>Nama di link personal (bagian ?to=) terlihat oleh siapa pun yang menerima link itu.</li>
        </Items>
      </Block>

      <Block title="Di mana data disimpan">
        <p className="m-0">
          Data disimpan di layanan database dan penyimpanan file pihak ketiga (Supabase), dan aplikasi dijalankan di penyedia hosting. Kami tidak menjual data dan
          tidak memakai pelacak iklan pihak ketiga. Iklan dan promo di dalam aplikasi adalah promo Momentum by Luna dan Mahesa Weddings sendiri.
        </p>
        <p className="m-0">
          Di perangkatmu, aplikasi memakai penyimpanan browser untuk menjaga sesi masuk dan agar aplikasi bisa dibuka lebih cepat.
        </p>
      </Block>

      <Block title="Nomor WhatsApp tamu">
        <p className="m-0">
          Nomor tamu diisi oleh pasangan. Pengiriman undangan dilakukan lewat WhatsApp milik pasangan sendiri; kami tidak mengirim pesan ke tamu. Pastikan tamu
          bersedia dihubungi.
        </p>
      </Block>

      <Block title="Foto dan musik">
        <p className="m-0">
          Foto dan musik yang diunggah hanya dipakai untuk menampilkan undangan kamu. Berkas yang diganti atau dihapus dari undangan ikut dihapus dari penyimpanan.
          Kamu bertanggung jawab memastikan punya hak memakai foto dan lagu tersebut.
        </p>
      </Block>

      <Block title="Menghapus data">
        <p className="m-0">
          Kamu bisa menonaktifkan undangan kapan saja di menu Undangan. Untuk menghapus akun, proyek, atau respons tamu, hubungi Momentum by Luna lewat WhatsApp atau
          email yang tertera di menu Undangan, sebutkan kode proyekmu. Kami memproses permintaan itu sesegera mungkin.
        </p>
      </Block>

      <Block title="Perubahan kebijakan">
        <p className="m-0">Kalau kebijakan ini berubah, tanggal pembaruan di atas ikut berubah. Perubahan besar kami kabarkan lewat aplikasi.</p>
      </Block>
    </LegalPage>
  );
}
