import React, { useState } from 'react';
import {
  CheckSquare,
  Download,
  Folder,
  FolderLock,
  Square,
} from 'lucide-react';
import {
  DRIVE_FOLDER_STRUCTURE,
  FORM_QUESTIONS_SPEC,
  LAUNCH_CHECKLIST_ITEMS,
  PjjConfig,
  TEN_STEP_GUIDE_CHAPTERS,
} from '../data/pjjBlueprintData';
import { downloadImplementationPdf } from '../utils/exportGenerators';

interface StepByStepGuideViewProps {
  config: PjjConfig;
}

export const StepByStepGuideView: React.FC<StepByStepGuideViewProps> = ({ config }) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');

  const visibleChapters =
    selectedChapterId === 'all'
      ? TEN_STEP_GUIDE_CHAPTERS
      : TEN_STEP_GUIDE_CHAPTERS.filter((c) => c.id === selectedChapterId);

  return (
    <div className="space-y-8">
      {/* Top Action Bar inside Guide */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#0B1F3F]">
            Panduan Implementasi 100% Tanpa Kode (Ekosistem Google)
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Ikuti urutan kerja mulai dari pembuatan struktur folder Google Drive, penyusunan Google Forms, penautan Google Sheets 7 lembar, pembangunan Google Sites, hingga pengujian menyeluruh sebelum dipublikasikan pada akun Google pemilik.
          </p>
        </div>

        <button
          type="button"
          onClick={() => downloadImplementationPdf(config)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0B1F3F] hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          Unduh Panduan Lengkap (.PDF)
        </button>
      </div>

      {/* Deliverable 1: Struktur Folder Google Drive */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div>
          <div className="text-xs text-slate-500">
            Hasil Kerja #1 · Fondasi Penyimpanan Administrasi & Bukti Foto
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">
            Struktur Folder Google Drive (<span className="font-mono">PJJ TRACKER/</span>)
          </h3>
        </div>

        <div className="p-4 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs space-y-1.5 overflow-x-auto">
          <div className="font-semibold text-sky-300 flex items-center gap-2">
            <Folder className="w-4 h-4 shrink-0" />
            PJJ TRACKER/  (Izin Induk: Dibatasi / Hanya Wali Kelas)
          </div>
          {DRIVE_FOLDER_STRUCTURE.map((f) => (
            <div key={f.code} className="pl-6 flex items-center gap-2 text-slate-200">
              <FolderLock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>├── {f.folderName}</span>
              <span className="text-slate-400">· {f.accessLevel}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DRIVE_FOLDER_STRUCTURE.map((folder) => (
            <div
              key={folder.code}
              className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2"
            >
              <div className="text-xs text-slate-500 tabular-nums">
                Sub-Folder {folder.code} · {folder.accessLevel}
              </div>
              <div className="text-sm font-bold text-[#0B1F3F]">{folder.folderName}</div>
              <p className="text-xs text-slate-700 leading-relaxed">{folder.purpose}</p>
              <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4 pt-1">
                {folder.contents.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Deliverable 2: Struktur Formulir Google Forms */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div>
          <div className="text-xs text-slate-500">
            Hasil Kerja #2 · Spesifikasi Pertanyaan, Tipe Input & Validasi Unggah Foto
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">
            FORMULIR ABSENSI DAN BUKTI PROGRES PJJ — SMK DARUL MUTTAQIN CIANJUR
          </h3>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="py-2.5 px-3 font-semibold w-12">No</th>
                  <th className="py-2.5 px-3 font-semibold w-44">Bagian</th>
                  <th className="py-2.5 px-3 font-semibold w-52">Pertanyaan</th>
                  <th className="py-2.5 px-3 font-semibold w-44">Tipe di Google Forms</th>
                  <th className="py-2.5 px-3 font-semibold w-24">Sifat</th>
                  <th className="py-2.5 px-3 font-semibold">Petunjuk & Aturan Validasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {FORM_QUESTIONS_SPEC.map((q) => (
                  <tr key={q.number} className="hover:bg-slate-50 align-top">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                      {q.number}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{q.section}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{q.label}</td>
                    <td className="py-3 px-3 font-mono text-[#0B1F3F]">{q.questionType}</td>
                    <td className="py-3 px-3">
                      {q.required ? (
                        <span className="font-semibold text-red-700">Wajib (*)</span>
                      ) : (
                        <span className="text-slate-500">Opsional</span>
                      )}
                    </td>
                    <td className="py-3 px-3 space-y-1 text-slate-600 leading-relaxed">
                      <div>{q.helperText}</div>
                      <div className="text-[11px] text-slate-800 font-medium">
                        Validasi: {q.validationRule}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Chapter Filter & Detailed 10-Stage Operational Manual */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-lg">
          <button
            type="button"
            onClick={() => setSelectedChapterId('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              selectedChapterId === 'all'
                ? 'bg-[#0B1F3F] text-white'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Semua 10 Tahap
          </button>
          {TEN_STEP_GUIDE_CHAPTERS.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setSelectedChapterId(ch.id)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                selectedChapterId === ch.id
                  ? 'bg-[#0B1F3F] text-white'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Tahap {ch.number}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {visibleChapters.map((ch) => (
            <section
              key={ch.id}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div className="pb-3 border-b border-slate-200">
                <div className="text-xs text-[#0284C7] font-semibold tabular-nums">
                  Dokumentasi Teknis Tahap {ch.number} dari 10
                </div>
                <h3 className="text-base font-bold text-[#0B1F3F] mt-0.5">
                  {ch.number}. {ch.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1">{ch.summary}</p>
              </div>

              <div className="space-y-4">
                {ch.steps.map((st) => (
                  <div key={st.stepTitle} className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-900">{st.stepTitle}</h4>
                    <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-700 leading-relaxed">
                      {st.instructions.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ol>
                    {st.importantNote && (
                      <div className="mt-2 p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-950 leading-relaxed">
                        <strong>Perhatian Keamanan & Validitas:</strong> {st.importantNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

interface ChecklistAndTestingViewProps {
  checkedIds: Record<string, boolean>;
  onToggleCheck: (id: string) => void;
  onResetChecks: () => void;
}

export const ChecklistAndTestingView: React.FC<ChecklistAndTestingViewProps> = ({
  checkedIds,
  onToggleCheck,
  onResetChecks,
}) => {
  const totalItems = LAUNCH_CHECKLIST_ITEMS.length;
  const completedItems = LAUNCH_CHECKLIST_ITEMS.filter((item) => checkedIds[item.id]).length;
  const progressPct = Math.round((completedItems / totalItems) * 100);

  return (
    <div className="space-y-8">
      {/* Interactive Launch Checklist */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-[#0B1F3F]">
              Checklist Kesiapan Peluncuran Website PJJ TRACKER
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Pastikan seluruh 11 butir verifikasi terpenuhi pada akun Google pemilik sebelum membagikan tautan ke siswa Kelas X TJKT 2.
            </p>
          </div>

          <div className="flex items-center gap-4 tabular-nums">
            <div className="text-right">
              <div className="text-sm font-bold text-slate-900">
                {completedItems} / {totalItems} Terverifikasi ({progressPct}%)
              </div>
              <div className="text-xs text-slate-500">Status kesiapan peluncuran</div>
            </div>
            <button
              type="button"
              onClick={onResetChecks}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Reset Checklist
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {LAUNCH_CHECKLIST_ITEMS.map((item) => {
            const isDone = Boolean(checkedIds[item.id]);
            return (
              <div
                key={item.id}
                onClick={() => onToggleCheck(item.id)}
                role="checkbox"
                aria-checked={isDone}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleCheck(item.id);
                  }
                }}
                className="py-3.5 px-3 flex items-start gap-3 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className="mt-0.5 text-[#0284C7] shrink-0">
                  {isDone ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500">{item.category}</div>
                  <div
                    className={`text-sm font-medium ${
                      isDone ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}
                  >
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-600">
                    Cara Uji: {item.verificationMethod}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 14-Day Operational SOP Matrix & End-to-End Test Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="text-base font-bold text-[#0B1F3F]">
            Skenario Pengujian End-to-End (Bagian 8)
          </h3>
          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
              <div className="font-bold text-slate-900">1. Skenario Uji Sisi Siswa (Akun Biasa & Ponsel)</div>
              <p>
                Buka tautan publik Google Sites di ponsel tanpa login khusus: pastikan 6 halaman terbuka responsif. Klik Isi Absensi PJJ, masuk akun Google siswa, uji kirim kosong (harus ditolak), uji unggah file PDF (harus ditolak), lalu unggah foto JPG/JPEG yang benar hingga muncul pesan konfirmasi.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
              <div className="font-bold text-slate-900">2. Skenario Uji Pengiriman Ganda & Salah Ejaan Nama</div>
              <p>
                Kirim 2 respons dengan nama siswa resmi yang sama untuk 2 mata pelajaran berbeda: pastikan tab <span className="font-mono">REKAP_HARIAN</span> tetap menghitung 1 siswa unik. Selanjutnya kirim 1 respons dengan nama singkatan: pastikan kolom L di <span className="font-mono">RESPON_ABSENSI</span> otomatis menandai <em>Perlu Verifikasi Nama</em>.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
              <div className="font-bold text-slate-900">3. Skenario Uji Audit Privasi (Mode Penyamaran)</div>
              <p>
                Salin tautan folder <span className="font-mono">03 — Bukti Foto Siswa</span> dan tautan Google Sheets <span className="font-mono">DATABASE_PJJ_TRACKER</span>, lalu tempel di jendela Incognito. Sistem wajib menolak akses publik.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="text-base font-bold text-[#0B1F3F]">
            Jadwal Operasional Monitoring 14 Hari (Bagian 10)
          </h3>
          <div className="space-y-3 text-xs text-slate-700 leading-relaxed tabular-nums">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <div className="font-bold text-slate-900">Hari ke-1 s.d. Hari ke-6 (Pekan Pertama)</div>
              <p>
                Pemeriksaan harian sore hari (15.00–16.30 WIB) pada tab <span className="font-mono">RESPON_ABSENSI</span>: cek kualitas dan keaslian foto JPG/JPEG, ubah status pemeriksaan menjadi <em>Lengkap</em> atau <em>Perlu Verifikasi</em>, serta catat kendala kuota/perangkat siswa.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <div className="font-bold text-slate-900">Hari ke-7 (Penutupan Evaluasi Pekan 1)</div>
              <p>
                Tinjau tab <span className="font-mono">MONITORING_PEKAN_1</span>, ekspor laporan PDF ke folder <span className="font-mono">05 — Laporan Pekan 1</span>, dan hubungi orang tua/siswa yang berstatus <em>Belum Mengumpulkan</em> atau <em>Perlu Tindak Lanjut</em>.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <div className="font-bold text-slate-900">Hari ke-8 s.d. Hari ke-13 (Pekan Kedua)</div>
              <p>
                Lanjutkan verifikasi rutin harian pada tab <span className="font-mono">MONITORING_PEKAN_2</span> dan pantau perbaikan tugas susulan dari Pekan 1.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <div className="font-bold text-slate-900">Hari ke-14 (Rekapitulasi & Laporan Akhir PJJ)</div>
              <p>
                Ekspor <span className="font-mono">MONITORING_PEKAN_2</span> ke folder <span className="font-mono">06</span>, lengkapi analisis evaluasi & rekomendasi pada tab <span className="font-mono">LAPORAN_WALI_KELAS</span>, lalu simpan PDF final ke folder <span className="font-mono">07 — Laporan Akhir PJJ</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
