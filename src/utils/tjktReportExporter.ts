import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import {
  addDaysIso,
  AttendanceSubmissionDoc,
  formatIndoDate,
  formatTimestampWib,
  getGroupedSubjectsForClass,
  getSubjectCategoryLabel,
  PortalConfigDoc,
  RosterStudentDoc,
} from '../types/tjktTypes';

export function exportTjktRecapXlsx(
  config: PortalConfigDoc,
  roster: RosterStudentDoc[],
  submissions: AttendanceSubmissionDoc[],
  selectedClassFilter: string
): void {
  const wb = XLSX.utils.book_new();
  const scopeLabel =
    selectedClassFilter === 'all' ? 'Seluruh_Kelas_TJKT' : selectedClassFilter.replace(/\s+/g, '_');

  const scopedRoster =
    selectedClassFilter === 'all'
      ? roster
      : roster.filter((r) => r.className === selectedClassFilter);

  const scopedSubmissions =
    selectedClassFilter === 'all'
      ? submissions
      : submissions.filter((s) => s.className === selectedClassFilter);

  // Sheet 1: RESPON_ABSENSI_TJKT
  const responRows: (string | number)[][] = [
    [
      'No',
      'Waktu Kirim (WIB)',
      'Nama Lengkap Siswa',
      'Kelas',
      'Jurusan',
      'Mata Pelajaran',
      'Kelompok Mapel',
      'Tanggal Sesi PJJ',
      'Pekan PJJ',
      'Judul / Topik Tugas',
      'Progres Tugas',
      'Nama File Foto',
      'Status Verifikasi Back-End',
      'Catatan Wali Kelas / Guru',
      'Kendala Pembelajaran',
      'Keterangan Tambahan',
    ],
  ];

  scopedSubmissions.forEach((s, idx) => {
    responRows.push([
      idx + 1,
      formatTimestampWib(s.createdAt),
      s.studentName,
      s.className,
      s.majorName,
      s.subject,
      getSubjectCategoryLabel(s.subject),
      s.sessionDate,
      `Pekan ${s.weekNumber}`,
      s.taskTitle,
      s.taskProgress,
      s.photoFileName,
      s.verificationStatus,
      s.teacherNote || '-',
      s.learningIssue || '-',
      s.additionalNote || '-',
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(responRows), 'RESPON_ABSENSI');

  // Sheet 2: DATA_SISWA_ROSTER
  const rosterRows: (string | number)[][] = [
    [
      'No',
      'NIS / NISN',
      'Nama Resmi Siswa',
      'Kelas Rombel',
      'Wali Kelas',
      'Status Aktif',
      'Jumlah Laporan Masuk',
    ],
  ];
  scopedRoster.forEach((st, idx) => {
    const count = scopedSubmissions.filter(
      (sub) =>
        sub.matchedRosterId === st.id ||
        (sub.className === st.className &&
          sub.studentName.trim().toLowerCase() === st.fullName.trim().toLowerCase())
    ).length;
    rosterRows.push([
      idx + 1,
      st.nis || '-',
      st.fullName,
      st.className,
      st.homeroomTeacher || '-',
      st.activeStatus,
      count,
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rosterRows), 'DATA_SISWA');

  // Sheet 3: REKAP_PER_KELAS_TJKT
  const targetClasses =
    selectedClassFilter === 'all' ? config.classes : [selectedClassFilter];
  const classSummaryRows: (string | number)[][] = [
    [
      'Kelas Rombel TJKT',
      'Siswa Terdaftar (Roster)',
      'Siswa Sudah Mengumpulkan',
      'Siswa Belum Mengumpulkan',
      'Total Bukti Tugas Masuk',
      'Laporan Lengkap',
      'Perlu Verifikasi',
      'Persentase Kepatuhan (%)',
    ],
  ];

  targetClasses.forEach((cls) => {
    const clsRoster = roster.filter((r) => r.className === cls);
    const clsSubs = submissions.filter((s) => s.className === cls);
    const matchedRosterCount = clsRoster.filter((st) =>
      clsSubs.some(
        (s) =>
          s.matchedRosterId === st.id ||
          s.studentName.trim().toLowerCase() === st.fullName.trim().toLowerCase()
      )
    ).length;
    const uniqueSenders =
      clsRoster.length > 0
        ? matchedRosterCount
        : new Set(clsSubs.map((s) => s.studentName.trim().toLowerCase())).size;
    const notSubmitted = Math.max(0, clsRoster.length - matchedRosterCount);
    const lengkapCount = clsSubs.filter((s) => s.verificationStatus === 'Lengkap').length;
    const verifyCount = clsSubs.filter((s) => s.verificationStatus === 'Perlu Verifikasi').length;
    const pct =
      clsRoster.length > 0 ? Math.round((matchedRosterCount / clsRoster.length) * 100) : 0;

    classSummaryRows.push([
      cls,
      clsRoster.length,
      uniqueSenders,
      notSubmitted,
      clsSubs.length,
      lengkapCount,
      verifyCount,
      pct,
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(classSummaryRows), 'REKAP_PER_KELAS');

  // Sheet 4: REKAP_HARIAN_14_HARI
  const dailyRows: (string | number)[][] = [
    ['Hari Ke-', 'Tanggal Sesi', 'Pekan', 'Total Kiriman Masuk', 'Siswa Unik Melapor'],
  ];
  for (let d = 0; d < 14; d++) {
    const dt = addDaysIso(config.startDate, d);
    const daySubs = scopedSubmissions.filter((s) => s.sessionDate === dt);
    const uniq = new Set(daySubs.map((s) => `${s.className}:${s.studentName.toLowerCase()}`)).size;
    dailyRows.push([`Hari ke-${d + 1}`, dt, d < 7 ? 'Pekan 1' : 'Pekan 2', daySubs.length, uniq]);
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dailyRows), 'REKAP_HARIAN');

  // Sheet 5: REKAP_PER_MAPEL
  const targetSubjects =
    selectedClassFilter === 'all'
      ? config.subjects
      : getGroupedSubjectsForClass(selectedClassFilter, config.subjects).flatAllowed;

  const mapelRows: (string | number)[][] = [
    [
      'No',
      'Mata Pelajaran Jurusan TJKT',
      'Kelompok Mapel',
      'Kiriman Pekan 1',
      'Kiriman Pekan 2',
      'Total Bukti Tugas',
      'Status Selesai',
      'Sedang Dikerjakan',
      'Belum Selesai',
    ],
  ];
  targetSubjects.forEach((subj, i) => {
    const sList = scopedSubmissions.filter((s) => s.subject === subj);
    mapelRows.push([
      i + 1,
      subj,
      getSubjectCategoryLabel(subj),
      sList.filter((s) => s.weekNumber === 1).length,
      sList.filter((s) => s.weekNumber === 2).length,
      sList.length,
      sList.filter((s) => s.taskProgress === 'Selesai').length,
      sList.filter((s) => s.taskProgress === 'Sedang dikerjakan').length,
      sList.filter((s) => s.taskProgress === 'Belum selesai').length,
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(mapelRows), 'REKAP_MAPEL');

  XLSX.writeFile(wb, `Rekap_BackEnd_TJKT_${scopeLabel}.xlsx`);
}

export function exportTjktEvaluationPdf(
  config: PortalConfigDoc,
  roster: RosterStudentDoc[],
  submissions: AttendanceSubmissionDoc[],
  selectedClassFilter: string
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2;
  let y = 18;

  const ensureSpace = (h: number) => {
    if (y + h > pageHeight - 16) {
      doc.addPage();
      y = 18;
    }
  };

  const writeText = (
    text: string,
    size: number,
    style: 'normal' | 'bold',
    color: [number, number, number],
    indent = 0
  ) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines: string[] = doc.splitTextToSize(text, contentWidth - indent);
    const lh = size * 0.3527 * 1.4;
    for (const line of lines) {
      ensureSpace(lh + 1);
      doc.text(line, marginX + indent, y);
      y += lh;
    }
  };

  const scopeTitle =
    selectedClassFilter === 'all'
      ? `Seluruh Kelas Jurusan TJKT (${config.classes.join(', ')})`
      : `Kelas ${selectedClassFilter}`;

  const scopedRoster =
    selectedClassFilter === 'all'
      ? roster
      : roster.filter((r) => r.className === selectedClassFilter);
  const scopedSubmissions =
    selectedClassFilter === 'all'
      ? submissions
      : submissions.filter((s) => s.className === selectedClassFilter);

  // Header Banner
  doc.setFillColor(11, 31, 63);
  doc.rect(0, 0, pageWidth, 42, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(config.appName.toUpperCase(), marginX, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(219, 234, 254);
  doc.text(`${config.schoolName} — ${config.departmentName}`, marginX, 24);
  doc.text(
    `Cakupan Laporan: ${scopeTitle}  |  Periode: ${formatIndoDate(config.startDate)} s.d. ${formatIndoDate(config.endDate)}`,
    marginX,
    31
  );

  y = 52;

  const p1Count = scopedSubmissions.filter((s) => s.weekNumber === 1).length;
  const p2Count = scopedSubmissions.filter((s) => s.weekNumber === 2).length;
  const lengkapCount = scopedSubmissions.filter((s) => s.verificationStatus === 'Lengkap').length;
  const verifyCount = scopedSubmissions.filter(
    (s) => s.verificationStatus === 'Perlu Verifikasi'
  ).length;

  writeText('1. RINGKASAN STATISTIK MONITORING KEHADIRAN & TUGAS', 11, 'bold', [11, 31, 63]);
  y += 1.5;
  writeText(`• Total Siswa Resmi Terdaftar di Roster (${scopeTitle}): ${scopedRoster.length} siswa`, 9.3, 'normal', [30, 41, 59], 3);
  writeText(`• Total Bukti Absensi & Pengerjaan Tugas Terkumpul: ${scopedSubmissions.length} kiriman`, 9.3, 'normal', [30, 41, 59], 3);
  writeText(`• Distribusi Per Pekan: Pekan 1 = ${p1Count} kiriman  |  Pekan 2 = ${p2Count} kiriman`, 9.3, 'normal', [30, 41, 59], 3);
  writeText(`• Status Pemeriksaan Guru/Wali Kelas: ${lengkapCount} Lengkap  |  ${verifyCount} Perlu Verifikasi`, 9.3, 'normal', [30, 41, 59], 3);
  y += 4;

  writeText('2. REKAPITULASI PER KELAS ROMBEL JURUSAN TJKT', 11, 'bold', [11, 31, 63]);
  y += 1.5;
  const targetClasses =
    selectedClassFilter === 'all' ? config.classes : [selectedClassFilter];
  for (const cls of targetClasses) {
    const cRoster = roster.filter((r) => r.className === cls).length;
    const cSubs = submissions.filter((s) => s.className === cls).length;
    writeText(
      `• Kelas ${cls}: ${cRoster} siswa terdaftar | ${cSubs} bukti tugas masuk`,
      9.2,
      'normal',
      [30, 41, 59],
      3
    );
  }
  y += 4;

  writeText('3. DAFTAR PENGIRIMAN ABSENSI & PROGRES TUGAS TERBARU', 11, 'bold', [11, 31, 63]);
  y += 2;
  if (scopedSubmissions.length === 0) {
    writeText('Belum ada data kiriman absensi pada cakupan kelas ini.', 9, 'normal', [100, 116, 139], 3);
  } else {
    scopedSubmissions.slice(0, 60).forEach((s, idx) => {
      ensureSpace(12);
      writeText(
        `${idx + 1}. ${s.studentName} (${s.className}) — ${s.subject} [${getSubjectCategoryLabel(s.subject)}]`,
        9.1,
        'bold',
        [15, 23, 42],
        2
      );
      writeText(
        `   Sesi: ${s.sessionDate} (Pekan ${s.weekNumber}) | Tugas: ${s.taskTitle} | Progres: ${s.taskProgress} | Verifikasi: ${s.verificationStatus}`,
        8.4,
        'normal',
        [71, 85, 105],
        2
      );
      if (s.learningIssue) {
        writeText(`   Kendala Siswa: ${s.learningIssue}`, 8.2, 'normal', [180, 83, 9], 2);
      }
      y += 1;
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${config.appName} — ${config.schoolName}`, marginX, pageHeight - 8);
    doc.text(`Halaman ${p} / ${totalPages}`, pageWidth - marginX - 24, pageHeight - 8);
  }

  const safeScope = scopeTitle.replace(/[^a-zA-Z0-9]+/g, '_');
  doc.save(`Laporan_Monitoring_TJKT_${safeScope}.pdf`);
}
