import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  FileImage,
  HelpCircle,
  Info,
  Laptop,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Upload,
} from 'lucide-react';
import {
  PjjConfig,
  SimulatedSubmission,
  StudentRosterItem,
  TaskProgressState,
} from '../data/pjjBlueprintData';
import { addDaysFormatted, formatIndonesianDate } from '../utils/exportGenerators';

import heroWorkspaceImg from '../assets/images/hero_pjj_smk_tjkt_1793006876709.jpg';
import examplePhotoImg from '../assets/images/contoh_bukti_foto_pjj_1793006877106.jpg';

type SitesPageKey =
  | 'beranda'
  | 'absensi'
  | 'panduan'
  | 'monitoring'
  | 'informasi'
  | 'kontak';

interface SitesBlueprintPreviewProps {
  config: PjjConfig;
  subjects: string[];
  roster: StudentRosterItem[];
  submissions: SimulatedSubmission[];
  onAddSimulatedSubmission: (submission: Omit<SimulatedSubmission, 'id' | 'timestamp'>) => void;
}

export const SitesBlueprintPreview: React.FC<SitesBlueprintPreviewProps> = ({
  config,
  subjects,
  roster,
  submissions,
  onAddSimulatedSubmission,
}) => {
  const [activeSitePage, setActiveSitePage] = useState<SitesPageKey>('beranda');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [guideImgFailed, setGuideImgFailed] = useState(false);

  // Interactive Form Test State (Skenario Pengujian Siswa)
  const [studentNameInput, setStudentNameInput] = useState('');
  const [selectedClass, setSelectedClass] = useState(config.className);
  const [selectedMajor, setSelectedMajor] = useState(config.majorName);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '');
  const [selectedDate, setSelectedDate] = useState(config.startDate);
  const [taskTitle, setTaskTitle] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [taskProgress, setTaskProgress] = useState<TaskProgressState>('Sedang dikerjakan');
  const [learningIssue, setLearningIssue] = useState('');
  const [additionalNote, setAdditionalNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const pekan1End = addDaysFormatted(config.startDate, 6);
  const pekan2Start = addDaysFormatted(config.startDate, 7);
  const pekan2End = addDaysFormatted(config.startDate, 13);

  const siteNavItems: { key: SitesPageKey; label: string }[] = [
    { key: 'beranda', label: 'Beranda' },
    { key: 'absensi', label: 'Absensi PJJ' },
    { key: 'panduan', label: 'Panduan Siswa' },
    { key: 'monitoring', label: 'Monitoring Progres' },
    { key: 'informasi', label: 'Informasi PJJ' },
    { key: 'kontak', label: 'Kontak Wali Kelas' },
  ];

  const handleSimulatedFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoFileName('');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setFormError('Google Forms akan menolak file non-gambar. Pilih file foto berformat JPG atau JPEG.');
      setPhotoFileName('');
      return;
    }
    setFormError(null);
    setPhotoFileName(file.name);
  };

  const handleFormTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess(null);

    if (!studentNameInput.trim()) {
      setFormError('Kolom wajib #1 (Nama Lengkap Siswa) harus diketik secara manual.');
      return;
    }
    if (!selectedClass.trim() || !selectedMajor.trim() || !selectedSubject.trim()) {
      setFormError('Kolom wajib Kelas, Jurusan, dan Mata Pelajaran belum lengkap.');
      return;
    }
    if (!photoFileName) {
      setFormError('Kolom wajib #5 (Upload Foto Proses Pengerjaan Tugas) harus dilampirkan sebelum formulir dikirim.');
      return;
    }
    if (!selectedDate || !taskTitle.trim()) {
      setFormError('Tanggal sesi PJJ dan Judul/Topik Tugas wajib diisi.');
      return;
    }

    const isJpg = /\.(jpe?g)$/i.test(photoFileName);
    const matchedRoster = roster.find(
      (r) => r.fullName.trim().toLowerCase() === studentNameInput.trim().toLowerCase()
    );

    const startMs = new Date(config.startDate).getTime();
    const selMs = new Date(selectedDate).getTime();
    const diffDays = Math.floor((selMs - startMs) / (1000 * 60 * 60 * 24));
    const weekNum: 1 | 2 = diffDays >= 7 ? 2 : 1;

    const needsVerification = !matchedRoster || !isJpg;

    onAddSimulatedSubmission({
      studentNameInput: studentNameInput.trim(),
      matchedStudentId: matchedRoster ? matchedRoster.id : null,
      className: selectedClass,
      majorName: selectedMajor,
      subject: selectedSubject,
      pjjDate: selectedDate,
      weekNumber: weekNum,
      taskTitle: taskTitle.trim(),
      photoFormat: isJpg ? 'JPG/JPEG Valid' : 'Format Lain / Buram',
      taskProgress,
      learningIssue: learningIssue.trim(),
      additionalNote: additionalNote.trim(),
      waliKelasStatus: needsVerification ? 'Perlu Verifikasi' : 'Sudah Mengumpulkan',
      waliKelasNote: !matchedRoster
        ? 'Nama belum cocok dengan daftar resmi DATA_SISWA — perlu cek ejaan.'
        : !isJpg
        ? 'Ekstensi gambar bukan .jpg/.jpeg — wali kelas perlu memeriksa file.'
        : 'Menunggu pemeriksaan kesesuaian foto oleh wali kelas.',
    });

    setFormError(null);
    setFormSuccess(
      'Simulasi respons berhasil dicatat ke tabel uji Dashboard Wali Kelas di tab "Dashboard Wali Kelas".'
    );
    setTaskTitle('');
    setPhotoFileName('');
    setLearningIssue('');
    setAdditionalNote('');
  };

  // Safe aggregated statistics for public Google Sites "Monitoring Progres"
  const totalOfficialStudents = roster.length;
  const uniqueMatchedStudents = new Set(
    submissions.filter((s) => s.matchedStudentId !== null).map((s) => s.matchedStudentId)
  ).size;
  const pekan1Count = submissions.filter((s) => s.weekNumber === 1).length;
  const pekan2Count = submissions.filter((s) => s.weekNumber === 2).length;

  return (
    <div className="space-y-6">
      {/* Blueprint Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Cetak Biru Interaktif Google Sites (6 Halaman Standar)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Gunakan pratinjau ini sebagai acuan tata letak saat menyusun situs di{' '}
            <span className="font-mono text-slate-800">sites.google.com</span> tanpa kode program.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewportMode('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              viewportMode === 'desktop'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            Pratinjau Komputer
          </button>
          <button
            type="button"
            onClick={() => setViewportMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              viewportMode === 'mobile'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Pratinjau Ponsel Siswa
          </button>
        </div>
      </div>

      {/* Simulated Google Sites Window Frame */}
      <div
        className={`mx-auto transition-opacity duration-150 bg-white border border-slate-300 rounded-xl overflow-hidden ${
          viewportMode === 'mobile' ? 'max-w-[410px]' : 'w-full'
        }`}
      >
        {/* Simulated Google Sites Header (Navy Blue Theme) */}
        <div className="bg-[#0B1F3F] text-white px-5 py-4 border-b border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setActiveSitePage('beranda')}
              className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0 text-left"
            >
              PJJ TRACKER
            </button>

            <div className="flex flex-wrap items-center gap-1.5">
              {siteNavItems.map((nav) => (
                <button
                  key={nav.key}
                  type="button"
                  onClick={() => setActiveSitePage(nav.key)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeSitePage === nav.key
                      ? 'bg-[#0284C7] text-white'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {nav.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Page 1: BERANDA */}
        {activeSitePage === 'beranda' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch border-b border-slate-200">
              <div
                className={`${
                  viewportMode === 'mobile' ? 'col-span-12 p-5' : 'lg:col-span-7 p-6 sm:p-8'
                } flex flex-col justify-between bg-[#0F2942] text-white`}
              >
                <div className="space-y-3">
                  <div className="text-xs text-sky-300 font-medium">
                    {config.schoolName} · Kelas {config.className}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight max-w-xl">
                    Sistem Monitoring Absensi dan Progres Pembelajaran Jarak Jauh
                  </h3>
                  <p className="text-sm text-slate-200 leading-relaxed max-w-xl">
                    Portal resmi pelaporan kehadiran sesi belajar, dokumentasi foto proses pengerjaan tugas, dan informasi kegiatan PJJ selama 2 pekan untuk konsentrasi keahlian {config.majorName}.
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-200 tabular-nums">
                  <span>Periode: {formatIndonesianDate(config.startDate)} – {formatIndonesianDate(pekan2End)}</span>
                  <span aria-hidden="true">·</span>
                  <span>Durasi: 14 Hari (2 Pekan)</span>
                  <span aria-hidden="true">·</span>
                  <span>Akses Tanpa Password Khusus</span>
                </div>
              </div>

              {viewportMode === 'desktop' && (
                <div className="lg:col-span-5 relative min-h-[240px] bg-slate-800">
                  {!heroImgFailed ? (
                    <img
                      src={heroWorkspaceImg}
                      alt="Ilustrasi ruang belajar siswa Teknik Jaringan Komputer dan Telekomunikasi"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-300 bg-slate-900">
                      <Laptop className="w-10 h-10 text-sky-400 mb-2" />
                      <span className="text-xs text-center">Banner Header Google Sites — {config.className}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5 Mandatory Main CTA Buttons on Beranda */}
            <div className="p-6 sm:p-8 space-y-6 bg-white">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Akses Cepat Layanan Siswa (5 Tombol Utama Beranda)
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Absensi kehadiran sesi dan unggah foto bukti pengerjaan terintegrasi dalam satu formulir resmi Google Forms.
                </p>
              </div>

              <div
                className={`grid gap-3 ${
                  viewportMode === 'mobile'
                    ? 'grid-cols-1'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveSitePage('absensi')}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-white bg-[#0B1F3F] hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <ClipboardCheck className="w-4 h-4 shrink-0" />
                  Isi Absensi PJJ
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSitePage('absensi')}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-white bg-[#0284C7] hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  Upload Bukti Pengerjaan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSitePage('panduan')}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  Baca Panduan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSitePage('informasi')}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Info className="w-4 h-4 shrink-0" />
                  Lihat Informasi PJJ
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSitePage('kontak')}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  Hubungi Wali Kelas
                </button>
              </div>

              {/* Period & Privacy Notice Cards */}
              <div
                className={`grid gap-4 pt-2 ${
                  viewportMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
                }`}
              >
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="text-xs font-semibold text-slate-900">Pekan Pertama (Hari 1–7)</div>
                  <div className="text-sm font-bold text-[#0B1F3F] mt-1 tabular-nums">
                    {formatIndonesianDate(config.startDate)} – {formatIndonesianDate(pekan1End)}
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">
                    Evaluasi paruh waktu dilakukan Wali Kelas pada akhir hari ke-7.
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="text-xs font-semibold text-slate-900">Pekan Kedua (Hari 8–14)</div>
                  <div className="text-sm font-bold text-[#0B1F3F] mt-1 tabular-nums">
                    {formatIndonesianDate(pekan2Start)} – {formatIndonesianDate(pekan2End)}
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">
                    Rekapitulasi akhir pengumpulan tugas dan tindak lanjut pasca-PJJ.
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="text-xs font-semibold text-slate-900">Ketentuan Akun & Privasi</div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Tidak ada pembuatan akun baru. Siswa cukup masuk ke akun Google masing-masing saat mengunggah foto JPG/JPEG. Foto dan data pribadi bersifat tertutup khusus pemeriksaan Wali Kelas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page 2: ABSENSI PJJ (Google Form Structure & Interactive Test) */}
        {activeSitePage === 'absensi' && (
          <div className="p-6 sm:p-8 space-y-6 bg-slate-50">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">
                Halaman 2 Google Sites · Sematan Google Forms Resmi
              </div>
              <h3 className="text-lg font-bold text-[#0B1F3F] mt-1">
                FORMULIR ABSENSI DAN BUKTI PROGRES PJJ — SMK DARUL MUTTAQIN CIANJUR
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Pastikan Anda telah masuk ke akun Google di peramban sebelum memilih file foto. Ketik Nama Lengkap sesuai daftar absen resmi kelas (jangan gunakan nama panggilan). Waktu pengiriman dicatat otomatis oleh sistem, namun pemeriksaan kehadiran dan keaslian tugas tetap diverifikasi oleh Wali Kelas.
              </p>
            </div>

            <form
              onSubmit={handleFormTestSubmit}
              className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5"
            >
              <div className="pb-3 border-b border-slate-200">
                <h4 className="text-sm font-bold text-slate-900">
                  A. Identitas Siswa (Input Manual Wajib)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Formulir tidak mengambil nama otomatis dari profil Google agar sesuai dengan buku induk kelas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    1. Nama Lengkap Siswa <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentNameInput}
                    onChange={(e) => setStudentNameInput(e.target.value)}
                    placeholder="Ketik nama lengkap sesuai daftar absen resmi"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    2. Kelas <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    3. Jurusan <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={selectedMajor}
                    onChange={(e) => setSelectedMajor(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    4. Mata Pelajaran <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                  >
                    {subjects.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 pb-3 border-b border-slate-200">
                <h4 className="text-sm font-bold text-slate-900">
                  B. Bukti Proses Pengerjaan Tugas (Wajib)
                </h4>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  5. Upload Foto Proses Pengerjaan Tugas (Target: JPG / JPEG, Maks. 10 MB){' '}
                  <span className="text-red-600">*</span>
                </label>
                <div className="p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    {photoFileName ? (
                      <span className="font-semibold text-slate-900">
                        File terpilih: {photoFileName}
                      </span>
                    ) : (
                      'Pilih foto jelas yang menunjukkan buku catatan/perangkat saat mengerjakan tugas.'
                    )}
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0B1F3F] bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-100 whitespace-nowrap shrink-0">
                    <FileImage className="w-3.5 h-3.5" />
                    Tambahkan File Gambar
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/*"
                      onChange={handleSimulatedFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 pb-3 border-b border-slate-200">
                <h4 className="text-sm font-bold text-slate-900">
                  C. Informasi Pendukung Sesi PJJ
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    6. Tanggal atau Sesi PJJ <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    7. Judul atau Topik Tugas <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Contoh: Analisis Topologi Jaringan Lokal"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-2">
                  8. Status Pengerjaan <span className="text-red-600">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {(['Belum selesai', 'Sedang dikerjakan', 'Selesai'] as TaskProgressState[]).map(
                    (st) => (
                      <label
                        key={st}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                          taskProgress === st
                            ? 'border-[#0284C7] bg-sky-50 text-slate-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="taskProgress"
                          checked={taskProgress === st}
                          onChange={() => setTaskProgress(st)}
                          className="accent-[#0284C7]"
                        />
                        {st}
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    9. Kendala Pembelajaran yang Dialami (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={learningIssue}
                    onChange={(e) => setLearningIssue(e.target.value)}
                    placeholder="Tuliskan jika ada kendala sinyal, kuota, perangkat, atau materi..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    10. Keterangan Tambahan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={additionalNote}
                    onChange={(e) => setAdditionalNote(e.target.value)}
                    placeholder="Keterangan izin/susulan/perbaikan kiriman sebelumnya..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                  {formSuccess}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-slate-500">
                  Mode Simulasi Uji Formulir: menguji logika validasi sebelum Anda membuat Google Form asli.
                </span>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0B1F3F] hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Uji Kirim Formulir Simulasi
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Page 3: PANDUAN SISWA */}
        {activeSitePage === 'panduan' && (
          <div className="p-6 sm:p-8 space-y-6 bg-white">
            <div>
              <div className="text-xs text-slate-500">Halaman 3 Google Sites · Prosedur Standar Siswa</div>
              <h3 className="text-xl font-bold text-[#0B1F3F] mt-1">
                Panduan Pengisian Absensi & Pengambilan Foto Bukti Tugas
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    01. Aturan Penulisan Identitas Manual
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Tuliskan <strong>Nama Lengkap</strong> persis sesuai daftar presensi resmi kelas {config.className} (bukan nama panggilan atau singkatan). Ketidaksesuaian ejaan akan membuat laporan masuk ke antrean <em>Perlu Verifikasi</em> pada rekap Wali Kelas.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    02. Kriteria Foto Proses Pengerjaan (JPG / JPEG)
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Ambil foto dari sudut atas meja belajar dengan pencahayaan cukup yang memperlihatkan buku tulis/catatan atau layar kerja tugas sesuai mata pelajaran hari tersebut. Pastikan format kamera ponsel diatur ke standar <strong>JPG/JPEG</strong> (bukan dokumen PDF atau foto gelap/buram).
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    03. Ketentuan Pengiriman Ulang & Kejujuran Akademik
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Satu pengiriman berlaku untuk satu sesi mata pelajaran. Jika Anda salah memilih mata pelajaran atau foto terpotong, kirim ulang dan tulis penjelasan pada kolom <strong>Keterangan Tambahan</strong> agar Wali Kelas menggabungkan peninjauan Anda.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <div className="aspect-4/3 bg-slate-200">
                  {!guideImgFailed ? (
                    <img
                      src={examplePhotoImg}
                      alt="Contoh foto bukti proses pengerjaan tugas siswa yang jelas dan rapi"
                      referrerPolicy="no-referrer"
                      onError={() => setGuideImgFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-500">
                      <FileImage className="w-8 h-8 mb-2" />
                      <span className="text-xs text-center">Contoh Foto Bukti Proses Pengerjaan</span>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Contoh Foto Valid (Disetujui Wali Kelas)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Tulisan catatan dan topik materi terlihat jelas, tidak memotret kartu identitas pribadi sensitif, dan relevan dengan mata pelajaran yang dipilih.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page 4: MONITORING PROGRES (Safe Public Summary Only) */}
        {activeSitePage === 'monitoring' && (
          <div className="p-6 sm:p-8 space-y-6 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
              <div>
                <div className="text-xs text-slate-500">
                  Halaman 4 Google Sites · Ringkasan Agregat Aman untuk Publik
                </div>
                <h3 className="text-xl font-bold text-[#0B1F3F] mt-1">
                  Monitoring Progres Kelas {config.className}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-[#0284C7] shrink-0" />
                Privasi Terlindungi (Tanpa Email & Tanpa Foto Siswa)
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              <strong>Keterangan Pembaruan Data:</strong> Grafik ringkasan pada halaman Google Sites bersumber dari lembar rekap agregat Google Sheets. Pembaruan angka mengikuti jeda sinkronisasi publikasi Google Sheets (sekitar 5 menit atau setelah halaman dimuat ulang), bukan pembaruan seketika (real-time). Data individu, alamat email, dan foto bukti tugas disimpan tertutup khusus pemeriksaan Wali Kelas.
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 tabular-nums">
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="text-xs text-slate-500">Siswa Terdaftar di Roster</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{totalOfficialStudents}</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="text-xs text-slate-500">Siswa Sudah Melapor</div>
                <div className="text-2xl font-bold text-[#0284C7] mt-1">{uniqueMatchedStudents}</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="text-xs text-slate-500">Kiriman Pekan 1</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{pekan1Count}</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="text-xs text-slate-500">Kiriman Pekan 2</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{pekan2Count}</div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-800">
                Rekapitulasi Pengumpulan Berdasarkan Mata Pelajaran (Agregat Aman)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 bg-white">
                      <th className="py-2.5 px-4 font-semibold">Mata Pelajaran</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Pekan 1</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Pekan 2</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Total Laporan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {subjects.map((subj) => {
                      const p1 = submissions.filter(
                        (s) => s.subject === subj && s.weekNumber === 1
                      ).length;
                      const p2 = submissions.filter(
                        (s) => s.subject === subj && s.weekNumber === 2
                      ).length;
                      return (
                        <tr key={subj} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 text-slate-800 font-medium">{subj}</td>
                          <td className="py-2.5 px-4 text-right text-slate-600">{p1}</td>
                          <td className="py-2.5 px-4 text-right text-slate-600">{p2}</td>
                          <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                            {p1 + p2}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Page 5: INFORMASI PJJ */}
        {activeSitePage === 'informasi' && (
          <div className="p-6 sm:p-8 space-y-6 bg-white">
            <div>
              <div className="text-xs text-slate-500">Halaman 5 Google Sites · Pengumuman & Jadwal</div>
              <h3 className="text-xl font-bold text-[#0B1F3F] mt-1">
                Informasi Pelaksanaan & Tenggat Waktu PJJ 2 Pekan
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 tabular-nums">
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0B1F3F]">
                  <Calendar className="w-4 h-4 text-[#0284C7]" />
                  Jadwal Pekan Pertama (Hari ke-1 s.d. ke-7)
                </div>
                <p className="text-xs text-slate-700">
                  Rentang Tanggal: <strong>{formatIndonesianDate(config.startDate)}</strong> s.d.{' '}
                  <strong>{formatIndonesianDate(pekan1End)}</strong>
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Batas unggah laporan harian disarankan sebelum pukul 16.00 WIB setiap hari kerja agar dapat diperiksa Wali Kelas pada sore hari.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0B1F3F]">
                  <Calendar className="w-4 h-4 text-[#0284C7]" />
                  Jadwal Pekan Kedua (Hari ke-8 s.d. ke-14)
                </div>
                <p className="text-xs text-slate-700">
                  Rentang Tanggal: <strong>{formatIndonesianDate(pekan2Start)}</strong> s.d.{' '}
                  <strong>{formatIndonesianDate(pekan2End)}</strong>
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Siswa yang masih berstatus <em>Sedang dikerjakan</em> atau <em>Perlu Verifikasi</em> pada Pekan 1 wajib melengkapi revisi sebelum penutupan Hari ke-14.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <h4 className="text-sm font-bold text-slate-900">
                Ketentuan Akademik & Penilaian
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pengiriman formulir absensi dan foto bukti proses di PJJ TRACKER berfungsi sebagai rekapitulasi pemantauan kedisiplinan belajar oleh Wali Kelas. Penilaian substansi kebenaran jawaban tetap dilakukan oleh masing-masing Guru Mata Pelajaran sesuai instruksi tugas.
              </p>
            </div>
          </div>
        )}

        {/* Page 6: KONTAK WALI KELAS */}
        {activeSitePage === 'kontak' && (
          <div className="p-6 sm:p-8 space-y-6 bg-white">
            <div>
              <div className="text-xs text-slate-500">Halaman 6 Google Sites · Layanan Bantuan Siswa</div>
              <h3 className="text-xl font-bold text-[#0B1F3F] mt-1">
                Kanal Komunikasi Resmi Wali Kelas {config.className}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="text-xs text-slate-500">Wali Kelas Pengampu</div>
                <div className="text-base font-bold text-slate-900">
                  {config.homeroomTeacher || 'Wali Kelas X TJKT 2 (Diatur pada Parameter Kelas)'}
                </div>
                <div className="text-xs text-slate-600">
                  {config.schoolName} · Jurusan {config.majorName}
                </div>
                <div className="pt-2 text-xs font-medium text-[#0284C7]">
                  Kanal Resmi: {config.contactChannel}
                </div>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  <HelpCircle className="w-4 h-4 text-[#0284C7]" />
                  Kapan Harus Menghubungi Wali Kelas?
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Mengalami gangguan perangkat atau ketiadaan jaringan internet lebih dari 1 hari.</li>
                  <li>Sakit atau izin darurat keluarga sehingga tidak dapat mengikuti sesi PJJ tepat waktu.</li>
                  <li>Gagal mengunggah foto pada Google Forms karena kendala penyimpanan akun Google.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Simulated Google Sites Quiet Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>PJJ TRACKER · {config.schoolName}</span>
          <span>Kelas {config.className} · Ekosistem Google Sites, Forms, Sheets & Drive</span>
        </div>
      </div>
    </div>
  );
};
