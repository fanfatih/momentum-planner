import type { Metadata } from "next";
import { Block, Items, LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Ketentuan layanan" };

export default function KetentuanPage() {
  return (
    <LegalPage title="Ketentuan layanan">
      <p>Dengan memakai Momentum Planner, kamu setuju dengan ketentuan berikut. Kami menuliskannya sesingkat mungkin.</p>

      <Block title="Layanan">
        <p className="m-0">
          Momentum Planner membantu pasangan mengatur ceklis dokumen, budget, vendor, venue, dan daftar tamu. Fitur dasar gratis. Undangan digital adalah fitur paket
          premium yang diaktifkan oleh admin setelah kamu menghubungi Momentum by Luna.
        </p>
      </Block>

      <Block title="Akun dan proyek">
        <Items>
          <li>Kamu masuk dengan akun Google dan bertanggung jawab atas akun itu.</li>
          <li>Kode proyek hanya dibagikan ke orang yang kamu izinkan melihat data proyek.</li>
          <li>Data yang kamu isi harus benar dan menjadi tanggung jawabmu.</li>
        </Items>
      </Block>

      <Block title="Isi undangan">
        <Items>
          <li>Kamu menjamin punya hak atas foto, teks, dan musik yang diunggah. Lagu berhak cipta sebaiknya diganti dengan musik bebas royalti.</li>
          <li>Dilarang memuat konten yang melanggar hukum, mengandung kebencian, pornografi, atau penipuan, termasuk nomor rekening yang bukan milikmu.</li>
          <li>Kami berhak menonaktifkan undangan yang melanggar ketentuan ini, dan akan menghubungimu bila memungkinkan.</li>
        </Items>
      </Block>

      <Block title="Tema">
        <p className="m-0">
          Setelah memilih tema, tema dikunci dan tidak bisa diganti sendiri. Untuk mengganti, minta ke admin lewat WhatsApp. Isi undangan tetap bisa diubah kapan saja.
        </p>
      </Block>

      <Block title="Paket dan pembayaran">
        <p className="m-0">
          Rincian paket dan pembayaran disepakati langsung dengan Momentum by Luna lewat WhatsApp. Tidak ada tagihan otomatis dari aplikasi ini.
        </p>
      </Block>

      <Block title="Ketersediaan">
        <p className="m-0">
          Aplikasi masih terus dikembangkan dan disediakan apa adanya. Kami berusaha menjaganya tetap berjalan, tetapi tidak menjamin tanpa gangguan. Simpan salinan
          data penting, misalnya daftar tamu dan nomor rekening, di tempat lain.
        </p>
      </Block>

      <Block title="Penutupan akun">
        <p className="m-0">
          Kamu bisa berhenti kapan saja. Kami bisa menutup akun yang menyalahgunakan layanan. Soal data, lihat kebijakan privasi.
        </p>
      </Block>

      <Block title="Perubahan dan hukum">
        <p className="m-0">Ketentuan ini bisa berubah, tanggal pembaruan tertera di atas. Ketentuan ini tunduk pada hukum Republik Indonesia.</p>
      </Block>
    </LegalPage>
  );
}
