import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import {
  DRIVE_FOLDER_STRUCTURE,
  FORM_QUESTIONS_SPEC,
  LAUNCH_CHECKLIST_ITEMS,
  PjjConfig,
  SHEETS_ARCHITECTURE_SPEC,
  StudentRosterItem,
  TEN_STEP_GUIDE_CHAPTERS,
} from '../data/pjjBlueprintData';

export function addDaysFormatted(isoDate: string, daysToAdd: number): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return isoDate;
  const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + daysToAdd));
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatIndonesianDate(isoDate: string): string {
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return isoDate;
  return `${parts[2]} ${months[parts[1] - 1] || ''} ${parts[0]}`;
}

export function downloadImplementationPdf(config: PjjConfig): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const maxContentWidth = pageWidth - marginX * 2;
  let cursorY = 20;

  const ensureSpace = (neededMm: number) => {
    if (cursorY + neededMm > pageHeight - 18) {
      doc.addPage();
      cursorY = 18;
    }
  };

  const writeWrappedText = (
    text: string,
    fontSize: number,
    fontStyle: 'normal' | 'bold',
    color: [number, number, number],
    indent = 0,
    lineSpacing = 1.38
  ) => {
    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines: string[] = doc.splitTextToSize(text, maxContentWidth - indent);
    const lineHeightMm = (fontSize * 0.3527) * lineSpacing;
    for (const line of lines) {
      ensureSpace(lineHeightMm + 1);
      doc.text(line, marginX + indent, cursorY);
      cursorY += lineHeightMm;
    }
  };

  // Cover Header Banner (Navy Blue)
  doc.setFillColor(11, 31, 63);
  doc.rect(0, 0, pageWidth, 48, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('PANDUAN IMPLEMENTASI LENGKAP: PJJ TRACKER', marginX, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(219, 234, 254);
  doc.text(
    'Sistem Monitoring Absensi & Progres Pembelajaran Jarak Jauh (100% Tanpa Kode / Ekosistem Google)',
    marginX,
    26
  );
  doc.text(
    `${config.schoolName}  |  Kelas Sasaran: ${config.className} (${config.majorName})`,
    marginX,
    33
  );
  const pekan1End = addDaysFormatted(config.startDate, 6);
  const pekan2Start = addDaysFormatted(config.startDate, 7);
  const pekan2End = addDaysFormatted(config.startDate, 13);
  doc.text(
    `Periode 2 Pekan: ${formatIndonesianDate(config.startDate)} s.d. ${formatIndonesianDate(pekan2End)}`,
    marginX,
    40
  );

  cursorY = 58;

  // Important Honesty & Scope Box
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, cursorY - 5, maxContentWidth, 24, 'F');
  writeWrappedText(
    'CATATAN PENTING SEBELUM MEMULAI:',
    9.5,
    'bold',
    [11, 31, 63],
    3
  );
  cursorY += 1;
  writeWrappedText(
    'Dokumen ini adalah panduan teknis langkah demi langkah bagi Wali Kelas untuk membangun PJJ TRACKER secara mandiri menggunakan Google Drive, Google Forms, Google Sheets, dan Google Sites tanpa menulis kode program. Sistem baru akan aktif setelah Wali Kelas membuat file dan mengatur izin akses pada akun Google resmi pemiliknya.',
    8.8,
    'normal',
    [51, 65, 85],
    3
  );
  cursorY += 7;

  // Identity Summary
  writeWrappedText('RINGKASAN PARAMETER KONFIGURASI KELAS', 11, 'bold', [11, 31, 63]);
  cursorY += 1.5;
  writeWrappedText(`• Satuan Pendidikan: ${config.schoolName}`, 9.5, 'normal', [30, 41, 59], 2);
  writeWrappedText(`• Kelas & Konsentrasi Keahlian: ${config.className} — ${config.majorName}`, 9.5, 'normal', [30, 41, 59], 2);
  writeWrappedText(`• Wali Kelas Pengampu: ${config.homeroomTeacher || '(Diisi oleh Wali Kelas)'}`, 9.5, 'normal', [30, 41, 59], 2);
  writeWrappedText(
    `• Pembagian Periode: Pekan 1 (${formatIndonesianDate(config.startDate)} – ${formatIndonesianDate(pekan1End)}) | Pekan 2 (${formatIndonesianDate(pekan2Start)} – ${formatIndonesianDate(pekan2End)})`,
    9.5,
    'normal',
    [30, 41, 59],
    2
  );
  cursorY += 5;

  // Section A: Struktur Google Drive
  ensureSpace(20);
  doc.setFillColor(11, 31, 63);
  doc.rect(marginX, cursorY - 4.5, maxContentWidth, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('LAMPIRAN TEKNIS A — STRUKTUR FOLDER GOOGLE DRIVE (PJJ TRACKER/)', marginX + 2.5, cursorY + 0.5);
  cursorY += 7;

  for (const folder of DRIVE_FOLDER_STRUCTURE) {
    ensureSpace(14);
    writeWrappedText(
      `PJJ TRACKER / ${folder.folderName}  [${folder.accessLevel}]`,
      9.5,
      'bold',
      [15, 23, 42]
    );
    writeWrappedText(`Fungsi: ${folder.purpose}`, 8.8, 'normal', [51, 65, 85], 4);
    cursorY += 2;
  }
  cursorY += 4;

  // Section B: Struktur Google Forms
  ensureSpace(20);
  doc.setFillColor(11, 31, 63);
  doc.rect(marginX, cursorY - 4.5, maxContentWidth, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('LAMPIRAN TEKNIS B — SPESIFIKASI 10 PERTANYAAN GOOGLE FORMS', marginX + 2.5, cursorY + 0.5);
  cursorY += 7;

  writeWrappedText(
    'Judul Wajib Formulir: FORMULIR ABSENSI DAN BUKTI PROGRES PJJ — SMK DARUL MUTTAQIN CIANJUR',
    9.5,
    'bold',
    [2, 132, 199]
  );
  cursorY += 2;

  for (const q of FORM_QUESTIONS_SPEC) {
    ensureSpace(16);
    writeWrappedText(
      `${q.number}. ${q.label}  —  Tipe: ${q.questionType}  (${q.required ? 'WAJIB DIISI' : 'OPSIONAL'})`,
      9.3,
      'bold',
      [15, 23, 42]
    );
    writeWrappedText(`Petunjuk Siswa: ${q.helperText}`, 8.5, 'normal', [51, 65, 85], 4);
    writeWrappedText(`Aturan Validasi: ${q.validationRule}`, 8.5, 'normal', [71, 85, 105], 4);
    cursorY += 2;
  }
  cursorY += 4;

  // Section C: Struktur 7 Lembar Google Sheets & Rumus
  ensureSpace(20);
  doc.setFillColor(11, 31, 63);
  doc.rect(marginX, cursorY - 4.5, maxContentWidth, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('LAMPIRAN TEKNIS C — ARSITEKTUR 7 LEMBAR KERJA GOOGLE SHEETS & RUMUS', marginX + 2.5, cursorY + 0.5);
  cursorY += 7;

  for (const sheet of SHEETS_ARCHITECTURE_SPEC) {
    ensureSpace(22);
    writeWrappedText(
      `Lembar ${sheet.order}: ${sheet.sheetName}  [${sheet.publicVisibility}]`,
      9.8,
      'bold',
      [11, 31, 63]
    );
    writeWrappedText(sheet.role, 8.7, 'normal', [51, 65, 85], 3);
    const colSummary = sheet.columns.map((c) => `${c.col}: ${c.header}`).join(' | ');
    writeWrappedText(`Kolom Utama: ${colSummary}`, 8.4, 'normal', [30, 41, 59], 3);
    for (const f of sheet.keyFormulas) {
      writeWrappedText(`Rumus ${f.cell} (${f.label}): ${f.formula}`, 8.2, 'bold', [2, 100, 160], 3);
    }
    cursorY += 3;
  }

  // All 10 Step-by-Step Operational Chapters
  for (const ch of TEN_STEP_GUIDE_CHAPTERS) {
    ensureSpace(24);
    doc.setFillColor(11, 31, 63);
    doc.rect(marginX, cursorY - 4.5, maxContentWidth, 7.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.2);
    doc.setTextColor(255, 255, 255);
    doc.text(`TAHAP ${ch.number} — ${ch.title.toUpperCase()}`, marginX + 2.5, cursorY + 0.5);
    cursorY += 6.5;

    writeWrappedText(ch.summary, 9, 'normal', [51, 65, 85]);
    cursorY += 2;

    for (const step of ch.steps) {
      ensureSpace(14);
      writeWrappedText(step.stepTitle, 9.4, 'bold', [15, 23, 42]);
      step.instructions.forEach((inst, idx) => {
        writeWrappedText(`${idx + 1}. ${inst}`, 8.8, 'normal', [30, 41, 59], 4);
      });
      if (step.importantNote) {
        writeWrappedText(`Catatan Kritis: ${step.importantNote}`, 8.5, 'bold', [180, 83, 9], 4);
      }
      cursorY += 2.5;
    }
    cursorY += 2;
  }

  // Launch Checklist Summary
  ensureSpace(24);
  doc.setFillColor(11, 31, 63);
  doc.rect(marginX, cursorY - 4.5, maxContentWidth, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.2);
  doc.setTextColor(255, 255, 255);
  doc.text('DAFTAR PERIKSA (CHECKLIST) KELAYAKAN PELUNCURAN WEBSITE', marginX + 2.5, cursorY + 0.5);
  cursorY += 7;

  for (const item of LAUNCH_CHECKLIST_ITEMS) {
    ensureSpace(10);
    writeWrappedText(`[   ] (${item.category}) ${item.label}`, 8.8, 'normal', [15, 23, 42], 1);
  }

  // Add page numbers across all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `PJJ TRACKER — ${config.schoolName} (${config.className})`,
      marginX,
      pageHeight - 8
    );
    doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth - marginX - 28, pageHeight - 8);
  }

  const safeClass = config.className.replace(/[^a-zA-Z0-9]+/g, '_');
  doc.save(`Panduan_Implementasi_PJJ_TRACKER_${safeClass}.pdf`);
}

export function downloadMasterSpreadsheetXlsx(
  config: PjjConfig,
  roster: StudentRosterItem[],
  subjects: string[]
): void {
  const wb = XLSX.utils.book_new();
  const maxStudentRows = Math.max(roster.length, 36); // Standard Indonesian class capacity without fake names

  // 1. RESPON_ABSENSI
  const responHeaders = [
    [
      'Timestamp',
      'Nama Lengkap Siswa',
      'Kelas',
      'Jurusan',
      'Mata Pelajaran',
      'Upload Foto Proses Pengerjaan Tugas',
      'Tanggal atau Sesi PJJ',
      'Judul atau Topik Tugas',
      'Status Pengerjaan',
      'Kendala Pembelajaran',
      'Keterangan Tambahan',
      'Cek Kecocokan Roster (Otomatis)',
      'Pekan PJJ (Otomatis)',
      'Status Verifikasi Wali Kelas',
      'Catatan Pemeriksaan Wali Kelas',
    ],
  ];
  const wsRespon = XLSX.utils.aoa_to_sheet(responHeaders);
  for (let r = 2; r <= 50; r++) {
    wsRespon[`L${r}`] = {
      t: 's',
      f: `IF(B${r}="","",IF(COUNTIF(DATA_SISWA!$C$5:$C$60,TRIM(B${r}))>0,"Cocok Roster","Perlu Verifikasi Nama"))`,
    };
    wsRespon[`M${r}`] = {
      t: 's',
      f: `IF(G${r}="","",IF(AND(G${r}>=DATA_SISWA!$B$2,G${r}<=DATA_SISWA!$B$2+6),"Pekan 1",IF(AND(G${r}>=DATA_SISWA!$B$2+7,G${r}<=DATA_SISWA!$B$2+13),"Pekan 2","Di Luar Periode")))`,
    };
  }
  XLSX.utils.book_append_sheet(wb, wsRespon, 'RESPON_ABSENSI');

  // 2. DATA_SISWA (No fake student names — uses only Wali Kelas input or clean blank rows!)
  const dataSiswaRows: (string | number)[][] = [
    ['IDENTITAS SEKOLAH', config.schoolName, 'KELAS SASARAN', config.className, 'WALI KELAS', config.homeroomTeacher || ''],
    ['TANGGAL MULAI PJJ', config.startDate, 'TANGGAL BERAKHIR (14 HARI)', addDaysFormatted(config.startDate, 13), 'JURUSAN', config.majorName],
    ['PETUNJUK ROSTER:', 'Isi daftar resmi siswa pada baris 5 ke bawah. Jangan gunakan nama panggilan/fiktif.', '', '', '', ''],
    ['No Urut', 'NIS / NISN (Internal)', 'Nama Resmi Siswa', 'Kelas', 'Jurusan', 'Status Aktif'],
  ];

  for (let i = 0; i < maxStudentRows; i++) {
    const item = roster[i];
    dataSiswaRows.push([
      i + 1,
      item ? item.nis : '',
      item ? item.fullName : '',
      item ? item.className : config.className,
      item ? item.majorName : config.majorName,
      item ? item.activeStatus : 'Aktif',
    ]);
  }
  const wsDataSiswa = XLSX.utils.aoa_to_sheet(dataSiswaRows);
  XLSX.utils.book_append_sheet(wb, wsDataSiswa, 'DATA_SISWA');

  // 3. REKAP_HARIAN (14 Hari: Pekan 1 & Pekan 2)
  const rekapHarianRows: (string | number)[][] = [
    [
      'Hari Ke-',
      'Tanggal PJJ',
      'Pekan Pelaksanaan',
      'Total Kiriman Masuk',
      'Siswa Terdaftar Mengumpulkan',
      'Siswa Belum Mengumpulkan',
      'Persentase Kepatuhan (%)',
    ],
  ];
  for (let d = 0; d < 14; d++) {
    const dateStr = addDaysFormatted(config.startDate, d);
    rekapHarianRows.push([
      `Hari ke-${d + 1}`,
      dateStr,
      d < 7 ? 'Pekan 1' : 'Pekan 2',
      0,
      0,
      0,
      0,
    ]);
  }
  const wsRekapHarian = XLSX.utils.aoa_to_sheet(rekapHarianRows);
  for (let r = 2; r <= 15; r++) {
    wsRekapHarian[`D${r}`] = { t: 'n', f: `COUNTIFS(RESPON_ABSENSI!$G$2:$G$500,B${r})` };
    wsRekapHarian[`E${r}`] = {
      t: 'n',
      f: `COUNTIFS(RESPON_ABSENSI!$G$2:$G$500,B${r},RESPON_ABSENSI!$L$2:$L$500,"Cocok Roster")`,
    };
    wsRekapHarian[`F${r}`] = {
      t: 'n',
      f: `MAX(0,COUNTA(DATA_SISWA!$C$5:$C$60)-E${r})`,
    };
    wsRekapHarian[`G${r}`] = {
      t: 'n',
      f: `IFERROR(ROUND((E${r}/COUNTA(DATA_SISWA!$C$5:$C$60))*100,1),0)`,
    };
  }
  XLSX.utils.book_append_sheet(wb, wsRekapHarian, 'REKAP_HARIAN');

  // 4. REKAP_MAPEL
  const rekapMapelRows: (string | number)[][] = [
    [
      'No',
      'Mata Pelajaran',
      'Kiriman Pekan 1',
      'Kiriman Pekan 2',
      'Total Bukti Terkumpul',
      'Status Selesai',
      'Sedang Dikerjakan / Belum Selesai',
    ],
  ];
  subjects.forEach((subj, idx) => {
    rekapMapelRows.push([idx + 1, subj, 0, 0, 0, 0, 0]);
  });
  const wsRekapMapel = XLSX.utils.aoa_to_sheet(rekapMapelRows);
  for (let i = 0; i < subjects.length; i++) {
    const r = i + 2;
    wsRekapMapel[`C${r}`] = {
      t: 'n',
      f: `COUNTIFS(RESPON_ABSENSI!$E$2:$E$500,B${r},RESPON_ABSENSI!$M$2:$M$500,"Pekan 1")`,
    };
    wsRekapMapel[`D${r}`] = {
      t: 'n',
      f: `COUNTIFS(RESPON_ABSENSI!$E$2:$E$500,B${r},RESPON_ABSENSI!$M$2:$M$500,"Pekan 2")`,
    };
    wsRekapMapel[`E${r}`] = { t: 'n', f: `C${r}+D${r}` };
    wsRekapMapel[`F${r}`] = {
      t: 'n',
      f: `COUNTIFS(RESPON_ABSENSI!$E$2:$E$500,B${r},RESPON_ABSENSI!$I$2:$I$500,"Selesai")`,
    };
    wsRekapMapel[`G${r}`] = { t: 'n', f: `E${r}-F${r}` };
  }
  XLSX.utils.book_append_sheet(wb, wsRekapMapel, 'REKAP_MAPEL');

  // Helper to build MONITORING_PEKAN_1 and MONITORING_PEKAN_2
  const buildMonitoringSheet = (weekOffsetDays: number, weekLabel: string) => {
    const dayDates = Array.from({ length: 7 }, (_, idx) =>
      addDaysFormatted(config.startDate, weekOffsetDays + idx)
    );
    const rows: (string | number)[][] = [
      [`MONITORING ${weekLabel.toUpperCase()} — ${config.schoolName} (${config.className})`],
      ['Periode Pekan:', `${dayDates[0]} s.d. ${dayDates[6]}`],
      [
        'No',
        'Nama Resmi Siswa',
        ...dayDates,
        `Total Kiriman ${weekLabel}`,
        'Perlu Verifikasi',
        `Status ${weekLabel}`,
      ],
    ];

    for (let i = 0; i < maxStudentRows; i++) {
      rows.push([i + 1, '', 0, 0, 0, 0, 0, 0, 0, 0, 0, '']);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const dayCols = ['C', 'D', 'E', 'F', 'G', 'H', 'I'];
    for (let i = 0; i < maxStudentRows; i++) {
      const r = i + 4;
      const rosterRow = i + 5;
      ws[`B${r}`] = { t: 's', f: `DATA_SISWA!C${rosterRow}` };
      dayCols.forEach((colLetter) => {
        ws[`${colLetter}${r}`] = {
          t: 'n',
          f: `IF($B${r}="",0,COUNTIFS(RESPON_ABSENSI!$B$2:$B$500,$B${r},RESPON_ABSENSI!$G$2:$G$500,${colLetter}$3))`,
        };
      });
      ws[`J${r}`] = { t: 'n', f: `IF(B${r}="",0,SUM(C${r}:I${r}))` };
      ws[`K${r}`] = {
        t: 'n',
        f: `IF(B${r}="",0,COUNTIFS(RESPON_ABSENSI!$B$2:$B$500,$B${r},RESPON_ABSENSI!$M$2:$M$500,"${weekLabel}",RESPON_ABSENSI!$N$2:$N$500,"Perlu Verifikasi"))`,
      };
      ws[`L${r}`] = {
        t: 's',
        f: `IF(B${r}="","",IF(J${r}=0,"Belum Mengumpulkan",IF(K${r}>0,"Perlu Verifikasi",IF(COUNTIF(C${r}:I${r},">0")>=5,"Lengkap",IF(COUNTIF(C${r}:I${r},">0")<=2,"Perlu Tindak Lanjut","Sudah Mengumpulkan")))))`,
      };
    }
    return ws;
  };

  XLSX.utils.book_append_sheet(wb, buildMonitoringSheet(0, 'Pekan 1'), 'MONITORING_PEKAN_1');
  XLSX.utils.book_append_sheet(wb, buildMonitoringSheet(7, 'Pekan 2'), 'MONITORING_PEKAN_2');

  // 7. LAPORAN_WALI_KELAS
  const laporanRows: (string | number)[][] = [
    [`LAPORAN AKHIR & DASHBOARD WALI KELAS PJJ 2 PEKAN — ${config.schoolName}`],
    [
      'Total Siswa Terdaftar',
      'Sudah Mengirimkan Laporan',
      'Belum Mengirimkan Laporan',
      'Total Bukti Tugas Terkumpul',
      'Laporan Perlu Verifikasi',
      'Persentase Kelengkapan (%)',
    ],
    [0, 0, 0, 0, 0, 0],
    [],
    [
      'No',
      'Nama Siswa',
      'Kelas',
      'Jurusan',
      'Total Kiriman Pekan 1',
      'Total Kiriman Pekan 2',
      'Total Akumulasi 14 Hari',
      'Status Evaluasi Akhir',
      'Catatan & Rekomendasi Tindak Lanjut Wali Kelas',
    ],
  ];

  for (let i = 0; i < maxStudentRows; i++) {
    laporanRows.push([i + 1, '', config.className, config.majorName, 0, 0, 0, '', '']);
  }

  const wsLaporan = XLSX.utils.aoa_to_sheet(laporanRows);
  const lastStudentLaporanRow = 5 + maxStudentRows;

  wsLaporan['A3'] = { t: 'n', f: `COUNTA(DATA_SISWA!C5:C60)` };
  wsLaporan['B3'] = { t: 'n', f: `COUNTIF(G6:G${lastStudentLaporanRow},">0")` };
  wsLaporan['C3'] = { t: 'n', f: `MAX(0,A3-B3)` };
  wsLaporan['D3'] = { t: 'n', f: `COUNTA(RESPON_ABSENSI!F2:F500)` };
  wsLaporan['E3'] = { t: 'n', f: `COUNTIF(RESPON_ABSENSI!N2:N500,"Perlu Verifikasi")` };
  wsLaporan['F3'] = { t: 'n', f: `IFERROR(ROUND((B3/A3)*100,1),0)` };

  for (let i = 0; i < maxStudentRows; i++) {
    const r = i + 6;
    const monRow = i + 4;
    const rosterRow = i + 5;
    wsLaporan[`B${r}`] = { t: 's', f: `DATA_SISWA!C${rosterRow}` };
    wsLaporan[`E${r}`] = { t: 'n', f: `MONITORING_PEKAN_1!J${monRow}` };
    wsLaporan[`F${r}`] = { t: 'n', f: `MONITORING_PEKAN_2!J${monRow}` };
    wsLaporan[`G${r}`] = { t: 'n', f: `E${r}+F${r}` };
    wsLaporan[`H${r}`] = {
      t: 's',
      f: `IF(B${r}="","",IF(G${r}=0,"Belum Mengumpulkan",IF(G${r}>=10,"Lengkap",IF(G${r}<=4,"Perlu Tindak Lanjut","Sudah Mengumpulkan"))))`,
    };
  }

  XLSX.utils.book_append_sheet(wb, wsLaporan, 'LAPORAN_WALI_KELAS');

  const safeClass = config.className.replace(/[^a-zA-Z0-9]+/g, '_');
  XLSX.writeFile(wb, `Master_Database_PJJ_TRACKER_${safeClass}.xlsx`);
}
