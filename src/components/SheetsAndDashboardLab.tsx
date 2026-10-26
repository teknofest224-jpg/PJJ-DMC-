import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  PjjConfig,
  SHEETS_ARCHITECTURE_SPEC,
  SimulatedSubmission,
  StudentRosterItem,
  VerificationStatus,
} from '../data/pjjBlueprintData';
import {
  addDaysFormatted,
  downloadMasterSpreadsheetXlsx,
  formatIndonesianDate,
} from '../utils/exportGenerators';

interface SheetsSchemasViewProps {
  config: PjjConfig;
  onUpdateConfig: (patch: Partial<PjjConfig>) => void;
  roster: StudentRosterItem[];
  onAddStudent: (nis: string, fullName: string) => void;
  onBulkAddStudents: (rawLines: string) => void;
  onRemoveStudent: (id: string) => void;
  subjects: string[];
}

export const SheetsSchemasView: React.FC<SheetsSchemasViewProps> = ({
  config,
  onUpdateConfig,
  roster,
  onAddStudent,
  onBulkAddStudents,
  onRemoveStudent,
  subjects,
}) => {
  const [selectedSheetIdx, setSelectedSheetIdx] = useState(0);
  const [copiedFormulaKey, setCopiedFormulaKey] = useState<string | null>(null);
  const [newNis, setNewNis] = useState('');
  const [newName, setNewName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulkPaste, setShowBulkPaste] = useState(false);

  const activeSheet = SHEETS_ARCHITECTURE_SPEC[selectedSheetIdx];
  const pekan2End = addDaysFormatted(config.startDate, 13);

  const handleCopyFormula = (key: string, formula: string) => {
    navigator.clipboard?.writeText(formula);
    setCopiedFormulaKey(key);
    setTimeout(() => setCopiedFormulaKey(null), 1800);
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddStudent(newNis.trim(), newName.trim());
    setNewNis('');
    setNewName('');
  };

  const handleBulkSubmit = () => {
    if (!bulkText.trim()) return;
    onBulkAddStudents(bulkText);
    setBulkText('');
    setShowBulkPaste(false);
  };

  return (
    <div className="space-y-8">
      {/* Configurable Class & 14-Day PJJ Parameters + XLSX Download */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-[#0B1F3F]">
              Konfigurasi Kelas, Periode 2 Pekan & Generator Master Google Sheets
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Sesuaikan parameter kelas (fleksibel untuk {config.className} maupun kelas lain), lalu unduh file{' '}
              <span className="font-mono text-slate-800">.xlsx</span> 7-lembar siap unggah ke Google Drive tanpa Apps Script.
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadMasterSpreadsheetXlsx(config, roster, subjects)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0284C7] hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start md:self-auto"
          >
            <Download className="w-4 h-4" />
            Unduh Master 7-Sheet (.XLSX)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kelas Sasaran
            </label>
            <input
              type="text"
              value={config.className}
              onChange={(e) => onUpdateConfig({ className: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jurusan / Konsentrasi
            </label>
            <input
              type="text"
              value={config.majorName}
              onChange={(e) => onUpdateConfig({ majorName: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Mulai PJJ (Hari ke-1)
            </label>
            <input
              type="date"
              value={config.startDate}
              onChange={(e) =>
                onUpdateConfig({
                  startDate: e.target.value,
                  endDate: addDaysFormatted(e.target.value, 13),
                })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Wali Kelas (Opsional)
            </label>
            <input
              type="text"
              value={config.homeroomTeacher}
              onChange={(e) => onUpdateConfig({ homeroomTeacher: e.target.value })}
              placeholder="Ketik nama & gelar wali kelas"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>
        </div>

        <div className="text-xs text-slate-600 tabular-nums pt-1">
          Rentang Otomatis 14 Hari: <strong>Pekan 1</strong> ({formatIndonesianDate(config.startDate)} –{' '}
          {formatIndonesianDate(addDaysFormatted(config.startDate, 6))}) · <strong>Pekan 2</strong> (
          {formatIndonesianDate(addDaysFormatted(config.startDate, 7))} –{' '}
          {formatIndonesianDate(pekan2End)})
        </div>
      </div>

      {/* Official Student Roster Builder (NO FICTITIOUS DATA!) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Tabel Roster Resmi Siswa (<span className="font-mono">DATA_SISWA</span>) — Tanpa Data Fiktif
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Sesuai prinsip akurasi administrasi, daftar siswa dikosongkan dari nama karangan. Wali Kelas dapat mengisi daftar resmi siswa kelas {config.className} di bawah ini agar langsung tercantum di file ekspor Google Sheets maupun simulasi Dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowBulkPaste((v) => !v)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            {showBulkPaste ? 'Tutup Input Massal' : 'Tempel Daftar Nama Sekaligus'}
          </button>
        </div>

        {showBulkPaste && (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <label className="block text-xs font-semibold text-slate-800">
              Tempel daftar nama resmi siswa dari Excel/Word (satu nama lengkap per baris):
            </label>
            <textarea
              rows={4}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={'Masukkan satu nama resmi siswa per baris...\n(Kosongkan bila ingin mengisi nanti langsung di Google Sheets)'}
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleBulkSubmit}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3F] hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Tambahkan ke Roster Kelas
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleAddSingleStudent} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newNis}
            onChange={(e) => setNewNis(e.target.value)}
            placeholder="NIS / Nomor Absen (Opsional)"
            className="sm:w-52 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-600"
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ketik Nama Lengkap Resmi Siswa sesuai buku induk kelas..."
            className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3F] hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Tambah Siswa Resmi
          </button>
        </form>

        {roster.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-300 rounded-lg bg-slate-50">
            <p className="text-xs font-semibold text-slate-800">
              Roster Kelas {config.className} Masih Kosong (0 Siswa Terinput)
            </p>
            <p className="text-xs text-slate-600 mt-1 max-w-xl mx-auto">
              Anda dapat langsung mengunduh file Master 7-Sheet (.XLSX) yang telah menyediakan 36 baris kosong siap isi di Google Sheets, atau menambahkan daftar siswa resmi di atas untuk menguji Dashboard Wali Kelas.
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold w-14">No</th>
                    <th className="py-2.5 px-3 font-semibold w-36">NIS (Internal)</th>
                    <th className="py-2.5 px-3 font-semibold">Nama Resmi Siswa</th>
                    <th className="py-2.5 px-3 font-semibold">Kelas & Jurusan</th>
                    <th className="py-2.5 px-3 font-semibold text-right w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {roster.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-600">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{st.nis || '-'}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{st.fullName}</td>
                      <td className="py-2 px-3 text-slate-600">
                        {st.className} · {st.majorName}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onRemoveStudent(st.id)}
                          aria-label={`Hapus ${st.fullName}`}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 7-Worksheet Architecture & Copyable Native Formulas */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Spesifikasi Kolom & Rumus Bawaan 7 Lembar Google Sheets
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Klik masing-masing nama lembar kerja untuk melihat struktur kolom dan menyalin rumus asli Google Sheets (tanpa kode Apps Script).
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 rounded-lg">
          {SHEETS_ARCHITECTURE_SPEC.map((sheet, idx) => (
            <button
              key={sheet.sheetName}
              type="button"
              onClick={() => setSelectedSheetIdx(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedSheetIdx === idx
                  ? 'bg-[#0B1F3F] text-white'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
              {sheet.order}. {sheet.sheetName}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500">
              Lembar Kerja #{activeSheet.order} · Tingkat Visibilitas: {activeSheet.publicVisibility}
            </div>
            <div className="text-sm font-bold font-mono text-[#0B1F3F] mt-1">
              {activeSheet.sheetName}
            </div>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">{activeSheet.role}</p>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold w-20">Kolom</th>
                    <th className="py-2.5 px-4 font-semibold w-56">Judul Header</th>
                    <th className="py-2.5 px-4 font-semibold w-56">Sumber Data / Formula</th>
                    <th className="py-2.5 px-4 font-semibold">Keterangan Fungsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeSheet.columns.map((col) => (
                    <tr key={col.col} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-semibold text-[#0B1F3F]">
                        {col.col}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{col.header}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-700">
                        {col.sourceOrFormula}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 leading-relaxed">
                        {col.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900">
              Rumus Google Sheets Siap Salin pada Lembar {activeSheet.sheetName}:
            </h4>
            {activeSheet.keyFormulas.map((kf) => {
              const copyKey = `${activeSheet.sheetName}-${kf.cell}`;
              const isCopied = copiedFormulaKey === copyKey;
              return (
                <div
                  key={copyKey}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">
                      Sel <span className="font-mono text-[#0284C7]">{kf.cell}</span> — {kf.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyFormula(copyKey, kf.formula)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Tersalin
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Salin Rumus
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 rounded-md bg-slate-900 text-sky-200 font-mono text-xs overflow-x-auto">
                    {kf.formula}
                  </pre>
                  <p className="text-xs text-slate-600">{kf.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

interface WaliKelasDashboardViewProps {
  config: PjjConfig;
  roster: StudentRosterItem[];
  subjects: string[];
  submissions: SimulatedSubmission[];
  onUpdateSubmissionVerification: (
    id: string,
    status: VerificationStatus,
    note: string
  ) => void;
  onAddQuickVerificationRow: (row: Omit<SimulatedSubmission, 'id' | 'timestamp'>) => void;
  onSwitchToRosterTab: () => void;
}

export const WaliKelasDashboardView: React.FC<WaliKelasDashboardViewProps> = ({
  config,
  roster,
  subjects,
  submissions,
  onUpdateSubmissionVerification,
  onAddQuickVerificationRow,
  onSwitchToRosterTab,
}) => {
  const [weekFilter, setWeekFilter] = useState<'all' | 1 | 2>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showManualLogModal, setShowManualLogModal] = useState(false);

  // Quick Test Log State for Wali Kelas testing
  const [testStudentName, setTestStudentName] = useState('');
  const [testSubject, setTestSubject] = useState(subjects[0] || '');
  const [testDate, setTestDate] = useState(config.startDate);
  const [testProgress, setTestProgress] = useState<'Belum selesai' | 'Sedang dikerjakan' | 'Selesai'>('Selesai');
  const [testIssue, setTestIssue] = useState('');

  // Calculate 6 Required KPI Cards accurately based on Official Roster + Submissions
  const totalRosterStudents = roster.length;
  const reportedRosterStudentIds = new Set(
    submissions.filter((s) => s.matchedStudentId !== null).map((s) => s.matchedStudentId!)
  );
  const studentsReportedCount = reportedRosterStudentIds.size;
  const studentsNotReportedCount = Math.max(0, totalRosterStudents - studentsReportedCount);
  const totalPhotosCollected = submissions.length;
  const needsVerificationCount = submissions.filter(
    (s) => s.waliKelasStatus === 'Perlu Verifikasi'
  ).length;
  const completionPercentage =
    totalRosterStudents > 0
      ? Math.round((studentsReportedCount / totalRosterStudents) * 100)
      : 0;

  // Build unified Monitoring Rows:
  // 1) All submissions (including multiple submissions by same student or unmatched typos!)
  // 2) Official roster students who haven't submitted anything yet ("Belum Mengumpulkan")
  interface MonitoringDisplayRow {
    rowKey: string;
    submissionId: string | null;
    studentName: string;
    isRosterMatched: boolean;
    className: string;
    majorName: string;
    subject: string;
    lastSubmittedDate: string;
    weekNumber: 1 | 2 | null;
    reportStatus: VerificationStatus;
    photoStatus: string;
    taskProgress: string;
    learningIssue: string;
    waliKelasNote: string;
  }

  const submissionRows: MonitoringDisplayRow[] = submissions.map((s) => ({
    rowKey: `sub-${s.id}`,
    submissionId: s.id,
    studentName: s.studentNameInput,
    isRosterMatched: s.matchedStudentId !== null,
    className: s.className,
    majorName: s.majorName,
    subject: s.subject,
    lastSubmittedDate: `${s.pjjDate} (${s.timestamp})`,
    weekNumber: s.weekNumber,
    reportStatus: s.waliKelasStatus,
    photoStatus: s.photoFormat,
    taskProgress: s.taskProgress,
    learningIssue: s.learningIssue,
    waliKelasNote: s.waliKelasNote,
  }));

  const unsubmittedRosterRows: MonitoringDisplayRow[] = roster
    .filter((st) => !reportedRosterStudentIds.has(st.id))
    .map((st) => ({
      rowKey: `roster-${st.id}`,
      submissionId: null,
      studentName: st.fullName,
      isRosterMatched: true,
      className: st.className,
      majorName: st.majorName,
      subject: '-',
      lastSubmittedDate: 'Belum ada kiriman',
      weekNumber: null,
      reportStatus: 'Belum Mengumpulkan',
      photoStatus: 'Belum Unggah',
      taskProgress: '-',
      learningIssue: '-',
      waliKelasNote: 'Belum mengirimkan formulir absensi & bukti tugas.',
    }));

  const allMonitoringRows = [...submissionRows, ...unsubmittedRosterRows];

  const filteredRows = allMonitoringRows.filter((row) => {
    if (weekFilter !== 'all' && row.weekNumber !== weekFilter) return false;
    if (subjectFilter !== 'all' && row.subject !== subjectFilter) return false;
    if (dateFilter && !row.lastSubmittedDate.startsWith(dateFilter)) return false;
    if (statusFilter !== 'all' && row.reportStatus !== statusFilter) return false;
    if (
      searchQuery.trim() &&
      !row.studentName.toLowerCase().includes(searchQuery.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getStatusTextClass = (status: VerificationStatus): string => {
    switch (status) {
      case 'Lengkap':
        return 'text-emerald-700 font-semibold';
      case 'Sudah Mengumpulkan':
        return 'text-[#0284C7] font-semibold';
      case 'Perlu Verifikasi':
        return 'text-amber-700 font-semibold';
      case 'Perlu Tindak Lanjut':
        return 'text-red-700 font-semibold';
      case 'Belum Mengumpulkan':
      default:
        return 'text-slate-500 font-medium';
    }
  };

  const handleQuickTestCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testStudentName.trim()) return;
    const matched = roster.find(
      (r) => r.fullName.trim().toLowerCase() === testStudentName.trim().toLowerCase()
    );
    const startMs = new Date(config.startDate).getTime();
    const selMs = new Date(testDate).getTime();
    const diffDays = Math.floor((selMs - startMs) / (1000 * 60 * 60 * 24));
    const weekNum: 1 | 2 = diffDays >= 7 ? 2 : 1;

    onAddQuickVerificationRow({
      studentNameInput: testStudentName.trim(),
      matchedStudentId: matched ? matched.id : null,
      className: config.className,
      majorName: config.majorName,
      subject: testSubject,
      pjjDate: testDate,
      weekNumber: weekNum,
      taskTitle: 'Simulasi Tugas Uji Wali Kelas',
      photoFormat: 'JPG/JPEG Valid',
      taskProgress: testProgress,
      learningIssue: testIssue.trim(),
      additionalNote: '',
      waliKelasStatus: matched ? 'Sudah Mengumpulkan' : 'Perlu Verifikasi',
      waliKelasNote: matched
        ? 'Data uji tercatat — silakan ubah status ke Lengkap setelah cek foto.'
        : 'Nama tidak ditemukan di DATA_SISWA — status otomatis Perlu Verifikasi.',
    });
    setShowManualLogModal(false);
    setTestIssue('');
  };

  // Final Report (Laporan Akhir PJJ) Summary Computations
  const pekan1Submissions = submissions.filter((s) => s.weekNumber === 1).length;
  const pekan2Submissions = submissions.filter((s) => s.weekNumber === 2).length;
  const reportedIssuesList = submissions.filter((s) => s.learningIssue.trim().length > 0);

  return (
    <div className="space-y-8">
      {/* Honesty & Architecture Notice */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#0B1F3F]">
            Rancangan Dashboard Monitoring & Verifikasi Wali Kelas ({config.className})
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            Tampilan ini memodelkan lembar <strong>LAPORAN_WALI_KELAS</strong> pada Google Sheets privat Wali Kelas. Di ekosistem Google sebenarnya, data tidak terbuka ke publik dan pembaruan mengikuti sinkronisasi pengiriman Google Forms (bukan penjamin kehadiran penuh tanpa verifikasi foto oleh Wali Kelas).
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowManualLogModal((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B1F3F] hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Uji Catat Respons Siswa
          </button>
        </div>
      </div>

      {showManualLogModal && (
        <form
          onSubmit={handleQuickTestCreate}
          className="bg-white border border-slate-300 rounded-xl p-5 space-y-4"
        >
          <div className="text-sm font-bold text-slate-900">
            Tambah Simulasi Respons Pengujian Wali Kelas
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Siswa (Ketik / Pilih Roster)
              </label>
              <input
                type="text"
                list="roster-datalist"
                value={testStudentName}
                onChange={(e) => setTestStudentName(e.target.value)}
                placeholder="Ketik nama siswa..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
              <datalist id="roster-datalist">
                {roster.map((r) => (
                  <option key={r.id} value={r.fullName} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mata Pelajaran
              </label>
              <select
                value={testSubject}
                onChange={(e) => setTestSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Sesi PJJ
              </label>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Progres Tugas
              </label>
              <select
                value={testProgress}
                onChange={(e) =>
                  setTestProgress(
                    e.target.value as 'Belum selesai' | 'Sedang dikerjakan' | 'Selesai'
                  )
                }
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              >
                <option value="Selesai">Selesai</option>
                <option value="Sedang dikerjakan">Sedang dikerjakan</option>
                <option value="Belum selesai">Belum selesai</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kendala Pembelajaran (Opsional, untuk menguji rekap kendala)
            </label>
            <input
              type="text"
              value={testIssue}
              onChange={(e) => setTestIssue(e.target.value)}
              placeholder="Contoh: Sinyal seluler lemah saat hujan deras"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowManualLogModal(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap shrink-0"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] rounded-lg hover:bg-sky-700 whitespace-nowrap shrink-0"
            >
              Simpan Respons Uji
            </button>
          </div>
        </form>
      )}

      {/* 6 Mandatory Statistic Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 tabular-nums">
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="text-xs text-slate-500">Total Siswa Kelas</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalRosterStudents}</div>
          <div className="text-xs text-slate-500 mt-1">Roster DATA_SISWA</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="text-xs text-slate-500">Sudah Mengirimkan</div>
          <div className="text-2xl font-bold text-[#0284C7] mt-1">{studentsReportedCount}</div>
          <div className="text-xs text-slate-500 mt-1">Siswa terdaftar unik</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="text-xs text-slate-500">Belum Mengirimkan</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{studentsNotReportedCount}</div>
          <div className="text-xs text-slate-500 mt-1">Perlu diingatkan</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="text-xs text-slate-500">Bukti Tugas Terkumpul</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalPhotosCollected}</div>
          <div className="text-xs text-slate-500 mt-1">Total kiriman foto</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="text-xs text-slate-500">Perlu Diverifikasi</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{needsVerificationCount}</div>
          <div className="text-xs text-slate-500 mt-1">Cek nama / foto</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="text-xs text-slate-500">Kelengkapan Kelas</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{completionPercentage}%</div>
          <div className="text-xs text-slate-500 mt-1">Rasio keterlibatan</div>
        </div>
      </div>

      {/* Interactive Filter Controls (Pekan, Mata Pelajaran, Tanggal, Indikator Status) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setWeekFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                weekFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Periode (14 Hari)
            </button>
            <button
              type="button"
              onClick={() => setWeekFilter(1)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                weekFilter === 1
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pekan 1 (Hari 1–7)
            </button>
            <button
              type="button"
              onClick={() => setWeekFilter(2)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                weekFilter === 2
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pekan 2 (Hari 8–14)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg max-w-[210px] truncate"
            >
              <option value="all">Semua Mata Pelajaran</option>
              {subjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter tanggal pengiriman"
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg tabular-nums"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
            >
              <option value="all">Semua Indikator Status</option>
              <option value="Belum Mengumpulkan">Belum Mengumpulkan</option>
              <option value="Sudah Mengumpulkan">Sudah Mengumpulkan</option>
              <option value="Perlu Verifikasi">Perlu Verifikasi</option>
              <option value="Lengkap">Lengkap</option>
              <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut</option>
            </select>
          </div>
        </div>

        {/* 10-Column Student Monitoring Table */}
        {allMonitoringRows.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg bg-slate-50 space-y-3">
            <div className="text-sm font-bold text-slate-900">
              Tabel Monitoring Menunggu Pengisian Roster Resmi Kelas {config.className}
            </div>
            <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
              Tidak ada daftar siswa fiktif yang dibuat otomatis. Silakan isi daftar resmi siswa pada tab{' '}
              <strong>Skema Sheets (DATA_SISWA)</strong> atau klik tombol <strong>Uji Catat Respons Siswa</strong> di atas untuk menguji alur verifikasi Wali Kelas.
            </p>
            <button
              type="button"
              onClick={onSwitchToRosterTab}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Isi Roster Resmi Siswa (DATA_SISWA)
            </button>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 border border-slate-200 rounded-lg">
            Tidak ada baris data yang cocok dengan filter Pekan, Mata Pelajaran, atau Status yang dipilih.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">No</th>
                    <th className="py-2.5 px-3 font-semibold">Nama Siswa</th>
                    <th className="py-2.5 px-3 font-semibold">Kelas</th>
                    <th className="py-2.5 px-3 font-semibold">Jurusan</th>
                    <th className="py-2.5 px-3 font-semibold">Mata Pelajaran</th>
                    <th className="py-2.5 px-3 font-semibold">Pengiriman Terakhir</th>
                    <th className="py-2.5 px-3 font-semibold">Status Laporan</th>
                    <th className="py-2.5 px-3 font-semibold">Status Bukti Foto</th>
                    <th className="py-2.5 px-3 font-semibold">Progres Tugas</th>
                    <th className="py-2.5 px-3 font-semibold min-w-[220px]">Catatan Wali Kelas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {filteredRows.map((row, index) => (
                    <tr key={row.rowKey} className="hover:bg-slate-50 align-top">
                      <td className="py-2.5 px-3 text-slate-600">{index + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{row.studentName}</div>
                        <div className="text-[11px] text-slate-500">
                          {row.isRosterMatched
                            ? 'Terdaftar di DATA_SISWA'
                            : 'Nama belum cocok roster'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        {row.className}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-[140px] truncate">
                        {row.majorName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 max-w-[180px]">
                        {row.subject}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {row.lastSubmittedDate}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {row.submissionId ? (
                          <select
                            value={row.reportStatus}
                            onChange={(e) =>
                              onUpdateSubmissionVerification(
                                row.submissionId!,
                                e.target.value as VerificationStatus,
                                row.waliKelasNote
                              )
                            }
                            className={`bg-white border border-slate-300 rounded px-2 py-1 text-xs ${getStatusTextClass(
                              row.reportStatus
                            )}`}
                          >
                            <option value="Sudah Mengumpulkan">Sudah Mengumpulkan</option>
                            <option value="Perlu Verifikasi">Perlu Verifikasi</option>
                            <option value="Lengkap">Lengkap</option>
                            <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut</option>
                          </select>
                        ) : (
                          <span className={getStatusTextClass(row.reportStatus)}>
                            {row.reportStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        {row.photoStatus}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        {row.taskProgress}
                      </td>
                      <td className="py-2.5 px-3">
                        {row.submissionId ? (
                          <input
                            type="text"
                            value={row.waliKelasNote}
                            onChange={(e) =>
                              onUpdateSubmissionVerification(
                                row.submissionId!,
                                row.reportStatus,
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-sky-600"
                          />
                        ) : (
                          <span className="text-slate-500">{row.waliKelasNote}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Section 11: Laporan Akhir PJJ (Evaluasi 2 Pekan) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div>
          <h3 className="text-base font-bold text-[#0B1F3F]">
            Rancangan Laporan Akhir Evaluasi PJJ 2 Pekan (Bagian 11)
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Ringkasan analisis perbandingan Pekan 1 dan Pekan 2, daftar kendala belajar, serta rekomendasi pembinaan pasca-PJJ yang siap diekspor ke folder <span className="font-mono">07 — Laporan Akhir PJJ</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 tabular-nums">
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
            <div className="text-xs font-bold text-slate-900">
              Perbandingan Aktivitas Pekan 1 vs Pekan 2
            </div>
            <div className="text-xs text-slate-700">
              Pekan 1 (Hari 1–7): <strong>{pekan1Submissions}</strong> laporan terkumpul
            </div>
            <div className="text-xs text-slate-700">
              Pekan 2 (Hari 8–14): <strong>{pekan2Submissions}</strong> laporan terkumpul
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Digunakan untuk mengevaluasi konsistensi kedisiplinan siswa setelah pembinaan paruh waktu di Hari ke-7.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
            <div className="text-xs font-bold text-slate-900">
              Kendala Pembelajaran yang Dilaporkan Siswa
            </div>
            {reportedIssuesList.length === 0 ? (
              <p className="text-xs text-slate-500">
                Belum ada catatan kendala pada data simulasi saat ini.
              </p>
            ) : (
              <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                {reportedIssuesList.slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <strong>{item.studentNameInput}:</strong> {item.learningIssue}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
            <div className="text-xs font-bold text-slate-900">
              Rekomendasi Tindak Lanjut Pasca-PJJ
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              1. Konfirmasi luring buku catatan asli bagi siswa berstatus <em>Perlu Verifikasi</em>.<br />
              2. Koordinasi klinik remedial bersama Guru Mata Pelajaran untuk tugas berstatus <em>Belum selesai</em>.<br />
              3. Pendampingan konseling bagi siswa berstatus <em>Belum Mengumpulkan</em>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
