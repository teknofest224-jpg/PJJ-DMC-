export interface PjjConfig {
  schoolName: string;
  className: string;
  majorName: string;
  homeroomTeacher: string;
  contactChannel: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD (auto or manual 14 days)
}

export interface StudentRosterItem {
  id: string;
  no: number;
  nis: string;
  fullName: string;
  className: string;
  majorName: string;
  activeStatus: 'Aktif' | 'Nonaktif';
}

export type VerificationStatus =
  | 'Belum Mengumpulkan'
  | 'Sudah Mengumpulkan'
  | 'Perlu Verifikasi'
  | 'Lengkap'
  | 'Perlu Tindak Lanjut';

export type TaskProgressState = 'Belum selesai' | 'Sedang dikerjakan' | 'Selesai' | '-';

export interface SimulatedSubmission {
  id: string;
  timestamp: string;
  studentNameInput: string;
  matchedStudentId: string | null;
  className: string;
  majorName: string;
  subject: string;
  pjjDate: string; // YYYY-MM-DD
  weekNumber: 1 | 2;
  taskTitle: string;
  photoFormat: 'JPG/JPEG Valid' | 'Format Lain / Buram';
  taskProgress: TaskProgressState;
  learningIssue: string;
  additionalNote: string;
  waliKelasStatus: VerificationStatus;
  waliKelasNote: string;
}

export interface DriveFolderSpec {
  code: string;
  folderName: string;
  purpose: string;
  accessLevel: 'Privat (Hanya Wali Kelas)' | 'Terbatas (Wali Kelas & Kepala Program)' | 'Terkendali via Form';
  contents: string[];
}

export interface FormQuestionSpec {
  number: number;
  section: 'A. Identitas Siswa' | 'B. Bukti Proses Pengerjaan Tugas' | 'C. Informasi Pendukung';
  label: string;
  questionType: string;
  required: boolean;
  helperText: string;
  validationRule: string;
}

export interface SheetTabSpec {
  order: number;
  sheetName: string;
  role: string;
  publicVisibility: 'Dilarang Publik (Rahasia)' | 'Hanya Grafik/Agregat Aman' | 'Internal Wali Kelas';
  columns: { col: string; header: string; sourceOrFormula: string; description: string }[];
  keyFormulas: { label: string; cell: string; formula: string; explanation: string }[];
}

export interface GuideChapter {
  id: string;
  number: string;
  title: string;
  summary: string;
  steps: {
    stepTitle: string;
    instructions: string[];
    importantNote?: string;
  }[];
}

export interface ChecklistItem {
  id: string;
  category: 'Google Drive & Privasi' | 'Google Forms' | 'Google Sheets' | 'Google Sites' | 'Pengujian Akhir';
  label: string;
  verificationMethod: string;
}

export const DEFAULT_SUBJECTS_TJKT: string[] = [
  'Dasar-Dasar Teknik Jaringan Komputer dan Telekomunikasi',
  'Informatika',
  'Matematika Kejuruan',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Pendidikan Agama Islam dan Budi Pekerti',
  'Pendidikan Pancasila',
  'Projek IPAS',
];

export const DRIVE_FOLDER_STRUCTURE: DriveFolderSpec[] = [
  {
    code: '01',
    folderName: '01 — Formulir dan Administrasi',
    purpose: 'Menyimpan file master Google Forms Absensi PJJ, surat edaran jadwal PJJ, dan dokumen tata tertib kelas.',
    accessLevel: 'Privat (Hanya Wali Kelas)',
    contents: [
      'FORMULIR ABSENSI DAN BUKTI PROGRES PJJ — SMK DARUL MUTTAQIN CIANJUR (Google Forms)',
      'File desain Google Sites PJJ TRACKER',
      'Jadwal & Daftar Mata Pelajaran PJJ 2 Pekan',
    ],
  },
  {
    code: '02',
    folderName: '02 — Database dan Rekap',
    purpose: 'Menyimpan Google Sheets utama yang menerima respons formulir dan mengolah 7 lembar rekap otomatis.',
    accessLevel: 'Privat (Hanya Wali Kelas)',
    contents: [
      'DATABASE_PJJ_TRACKER_X_TJKT_2 (Google Sheets 7 Lembar Kerja)',
      'Cadangan (Backup) daftar resmi siswa kelas X TJKT 2',
    ],
  },
  {
    code: '03',
    folderName: '03 — Bukti Foto Siswa',
    purpose: 'Lokasi penyimpanan otomatis foto JPG/JPEG proses pengerjaan tugas yang diunggah siswa melalui Google Forms.',
    accessLevel: 'Privat (Hanya Wali Kelas)',
    contents: [
      'Sub-folder otomatis bawaan Google Forms (File responses)',
      'Foto bukti proses belajar siswa (DILARANG dibuka untuk akses publik)',
    ],
  },
  {
    code: '04',
    folderName: '04 — Arsip Tugas',
    purpose: 'Menyimpan soal/instruksi tugas dari guru mata pelajaran sebagai acuan wali kelas saat memverifikasi kesesuaian foto siswa.',
    accessLevel: 'Terbatas (Wali Kelas & Kepala Program)',
    contents: [
      'Instruksi tugas harian dari guru mata pelajaran',
      'Rubrik atau target capaian tugas PJJ per sesi',
    ],
  },
  {
    code: '05',
    folderName: '05 — Laporan Pekan 1',
    purpose: 'Menyimpan hasil unduhan PDF rekap monitoring hari ke-1 sampai hari ke-7 untuk evaluasi paruh waktu.',
    accessLevel: 'Terbatas (Wali Kelas & Kepala Program)',
    contents: [
      'Rekap_Monitoring_Pekan_1_X_TJKT_2.pdf',
      'Daftar tindak lanjut pembinaan siswa Pekan 1',
    ],
  },
  {
    code: '06',
    folderName: '06 — Laporan Pekan 2',
    purpose: 'Menyimpan hasil unduhan PDF rekap monitoring hari ke-8 sampai hari ke-14.',
    accessLevel: 'Terbatas (Wali Kelas & Kepala Program)',
    contents: [
      'Rekap_Monitoring_Pekan_2_X_TJKT_2.pdf',
      'Catatan perkembangan siswa pasca pembinaan Pekan 1',
    ],
  },
  {
    code: '07',
    folderName: '07 — Laporan Akhir PJJ',
    purpose: 'Menyimpan laporan evaluasi menyeluruh selama 14 hari untuk diserahkan kepada Wakil Kepala Sekolah Bidang Kurikulum / Kesiswaan.',
    accessLevel: 'Terbatas (Wali Kelas & Kepala Program)',
    contents: [
      'Laporan_Akhir_PJJ_2_Pekan_X_TJKT_2.pdf',
      'Grafik perbandingan Pekan 1 vs Pekan 2 & rekomendasi tindak lanjut',
    ],
  },
];

export const FORM_QUESTIONS_SPEC: FormQuestionSpec[] = [
  {
    number: 1,
    section: 'A. Identitas Siswa',
    label: 'Nama Lengkap Siswa',
    questionType: 'Jawaban Singkat (Short answer)',
    required: true,
    helperText: 'Ketik nama lengkap sesuai daftar absen resmi kelas menggunakan huruf kapital di awal kata (contoh penulisan sesuai ijazah/absen kelas). Jangan gunakan nama panggilan atau singkatan.',
    validationRule: 'Wajib diisi manual (jangan mengandalkan nama akun Google). Validasi panjang teks minimal 3 karakter.',
  },
  {
    number: 2,
    section: 'A. Identitas Siswa',
    label: 'Kelas',
    questionType: 'Drop-down (atau Jawaban Singkat untuk multi-kelas)',
    required: true,
    helperText: 'Pilih kelas resmi Anda saat ini (contoh default: X TJKT 2). Opsi dapat ditambah oleh wali kelas jika digunakan lintas kelas.',
    validationRule: 'Wajib dipilih oleh siswa.',
  },
  {
    number: 3,
    section: 'A. Identitas Siswa',
    label: 'Jurusan / Konsentrasi Keahlian',
    questionType: 'Drop-down atau Jawaban Singkat',
    required: true,
    helperText: 'Pilih atau ketik jurusan lengkap Anda: Teknik Jaringan Komputer dan Telekomunikasi (TJKT).',
    validationRule: 'Wajib diisi secara manual/dipilih oleh siswa.',
  },
  {
    number: 4,
    section: 'A. Identitas Siswa',
    label: 'Mata Pelajaran',
    questionType: 'Drop-down',
    required: true,
    helperText: 'Pilih mata pelajaran sesuai jadwal PJJ yang sedang dikerjakan pada sesi ini.',
    validationRule: 'Wajib dipilih dari daftar resmi mata pelajaran kelas.',
  },
  {
    number: 5,
    section: 'B. Bukti Proses Pengerjaan Tugas',
    label: 'Upload Foto Proses Pengerjaan Tugas',
    questionType: 'Upload File (File upload)',
    required: true,
    helperText: 'Unggah 1 foto jelas berformat JPG atau JPEG (maks. 10 MB) yang memperlihatkan buku catatan/lembar kerja/layar pengerjaan tugas Anda secara nyata. Foto buram, gelap, atau tangkapan layar milik teman akan diberi status Perlu Verifikasi.',
    validationRule: 'Aktifkan "Izinkan hanya jenis file tertentu" -> centang "Gambar (Image)". Jumlah maksimum file: 1. Ukuran file maks: 10 MB. Wali kelas memverifikasi ekstensi .jpg/.jpeg pada tautan Drive.',
  },
  {
    number: 6,
    section: 'C. Informasi Pendukung',
    label: 'Tanggal Pelaksanaan / Sesi PJJ',
    questionType: 'Tanggal (Date)',
    required: true,
    helperText: 'Pilih tanggal pelaksanaan tugas PJJ sesuai jadwal mata pelajaran.',
    validationRule: 'Wajib diisi untuk pemetaan Pekan 1 (Hari 1–7) dan Pekan 2 (Hari 8–14). Dibedakan dari Timestamp otomatis pengiriman.',
  },
  {
    number: 7,
    section: 'C. Informasi Pendukung',
    label: 'Judul atau Topik Tugas',
    questionType: 'Jawaban Singkat (Short answer)',
    required: true,
    helperText: 'Tuliskan judul materi atau topik tugas yang diberikan guru mata pelajaran (contoh: Perhitungan Subnetting IPv4 /26).',
    validationRule: 'Wajib diisi.',
  },
  {
    number: 8,
    section: 'C. Informasi Pendukung',
    label: 'Status Pengerjaan Tugas Saat Ini',
    questionType: 'Pilihan Ganda (Multiple choice)',
    required: true,
    helperText: 'Pilih kondisi nyata progres pengerjaan tugas Anda saat mengirimkan bukti ini.',
    validationRule: '3 opsi baku: "Belum selesai", "Sedang dikerjakan", atau "Selesai".',
  },
  {
    number: 9,
    section: 'C. Informasi Pendukung',
    label: 'Kendala Pembelajaran Selama PJJ (Jika Ada)',
    questionType: 'Paragraf (Paragraph)',
    required: false,
    helperText: 'Tuliskan apabila Anda mengalami kendala jaringan kuota, perangkat, atau kesulitan memahami materi agar dapat ditindaklanjuti wali kelas. Kosongkan atau isi "Tidak ada kendala" bila lancar.',
    validationRule: 'Opsional namun dianjurkan diisi jujur.',
  },
  {
    number: 10,
    section: 'C. Informasi Pendukung',
    label: 'Keterangan Tambahan',
    questionType: 'Paragraf (Paragraph)',
    required: false,
    helperText: 'Catatan tambahan untuk wali kelas bila pengiriman terlambat karena alasan darurat/sakit atau revisi pengiriman sebelumnya.',
    validationRule: 'Opsional.',
  },
];

export const SHEETS_ARCHITECTURE_SPEC: SheetTabSpec[] = [
  {
    order: 1,
    sheetName: 'RESPON_ABSENSI',
    role: 'Data mentah otomatis dari Google Forms ditambah 4 kolom pemeriksaan manual Wali Kelas di sisi kanan (Kolom L–O). Data asli kolom A–K pantang diubah atau dihapus.',
    publicVisibility: 'Dilarang Publik (Rahasia)',
    columns: [
      { col: 'A', header: 'Timestamp', sourceOrFormula: 'Otomatis Google Forms', description: 'Waktu sistem saat formulir dikirim (bukan bukti hadir penuh sepanjang jam pelajaran).' },
      { col: 'B', header: 'Nama Lengkap Siswa', sourceOrFormula: 'Input Form #1', description: 'Nama yang diketik manual oleh siswa.' },
      { col: 'C', header: 'Kelas', sourceOrFormula: 'Input Form #2', description: 'Kelas yang dipilih/diisi siswa.' },
      { col: 'D', header: 'Jurusan', sourceOrFormula: 'Input Form #3', description: 'Jurusan yang dipilih/diisi siswa.' },
      { col: 'E', header: 'Mata Pelajaran', sourceOrFormula: 'Input Form #4', description: 'Mata pelajaran tugas PJJ.' },
      { col: 'F', header: 'Upload Foto Proses Pengerjaan Tugas', sourceOrFormula: 'Input Form #5 (Link Drive)', description: 'Tautan privat Google Drive menuju file foto bukti pengerjaan.' },
      { col: 'G', header: 'Tanggal atau Sesi PJJ', sourceOrFormula: 'Input Form #6', description: 'Tanggal jadwal sesi PJJ yang dilaporkan.' },
      { col: 'H', header: 'Judul atau Topik Tugas', sourceOrFormula: 'Input Form #7', description: 'Topik materi tugas.' },
      { col: 'I', header: 'Status Pengerjaan', sourceOrFormula: 'Input Form #8', description: 'Belum selesai / Sedang dikerjakan / Selesai.' },
      { col: 'J', header: 'Kendala Pembelajaran', sourceOrFormula: 'Input Form #9', description: 'Catatan kendala siswa.' },
      { col: 'K', header: 'Keterangan Tambahan', sourceOrFormula: 'Input Form #10', description: 'Keterangan tambahan dari siswa.' },
      { col: 'L', header: 'Cek Kecocokan Roster (Otomatis)', sourceOrFormula: 'Formula Pencocokan DATA_SISWA', description: 'Mengecek apakah penulisan nama siswa cocok persis dengan daftar resmi di DATA_SISWA.' },
      { col: 'M', header: 'Pekan PJJ (Otomatis)', sourceOrFormula: 'Formula Rentang Tanggal', description: 'Menentukan otomatis Pekan 1 (Hari 1–7), Pekan 2 (Hari 8–14), atau Di Luar Periode.' },
      { col: 'N', header: 'Status Verifikasi Wali Kelas', sourceOrFormula: 'Dropdown Validasi Wali Kelas', description: 'Diisi Wali Kelas: Sudah Mengumpulkan / Perlu Verifikasi / Lengkap / Perlu Tindak Lanjut.' },
      { col: 'O', header: 'Catatan Pemeriksaan Wali Kelas', sourceOrFormula: 'Input Manual Wali Kelas', description: 'Catatan pemeriksaan kesesuaian foto JPG/JPEG, duplikasi pengiriman, atau tindak lanjut.' },
    ],
    keyFormulas: [
      {
        label: 'Pencocokan Nama dengan Daftar Resmi Kelas (Kolom L2)',
        cell: 'L2',
        formula: '=IF(B2=""; ""; IF(COUNTIF(DATA_SISWA!$C$5:$C$50; TRIM(B2))>0; "Cocok Roster"; "Perlu Verifikasi Nama"))',
        explanation: 'Memeriksa apakah nama yang diketik siswa di B2 terdaftar pada kolom Nama Resmi di lembar DATA_SISWA tanpa mengubah data mentah B2.',
      },
      {
        label: 'Penentuan Otomatis Pekan 1 atau Pekan 2 (Kolom M2)',
        cell: 'M2',
        formula: '=IF(G2=""; ""; IF(AND(G2>=DATA_SISWA!$B$2; G2<=DATA_SISWA!$B$2+6); "Pekan 1"; IF(AND(G2>=DATA_SISWA!$B$2+7; G2<=DATA_SISWA!$B$2+13); "Pekan 2"; "Di Luar Periode")))',
        explanation: 'Membaca Tanggal Mulai PJJ di sel DATA_SISWA!B2 lalu mengelompokkan Hari ke-1 s.d. ke-7 sebagai Pekan 1 dan Hari ke-8 s.d. ke-14 sebagai Pekan 2.',
      },
    ],
  },
  {
    order: 2,
    sheetName: 'DATA_SISWA',
    role: 'Daftar induk (roster) resmi siswa Kelas X TJKT 2 yang dikelola langsung oleh Wali Kelas beserta parameter Tanggal Mulai & Berakhir PJJ 14 hari.',
    publicVisibility: 'Dilarang Publik (Rahasia)',
    columns: [
      { col: 'A', header: 'No Urut', sourceOrFormula: '1, 2, 3, dst. (Mulai baris 5)', description: 'Nomor urut absen kelas (baris 1–3 dipakai untuk pengaturan Tanggal Mulai & Akhir PJJ).' },
      { col: 'B', header: 'NIS / NISN (Internal)', sourceOrFormula: 'Input Wali Kelas', description: 'Nomor induk siswa untuk arsip internal wali kelas (tidak ditampilkan ke publik).' },
      { col: 'C', header: 'Nama Resmi Siswa', sourceOrFormula: 'Input Wali Kelas', description: 'Nama baku siswa sesuai buku induk sekolah sebagai acuan pencocokan rumus.' },
      { col: 'D', header: 'Kelas', sourceOrFormula: 'X TJKT 2', description: 'Identitas rombongan belajar.' },
      { col: 'E', header: 'Jurusan', sourceOrFormula: 'TJKT', description: 'Teknik Jaringan Komputer dan Telekomunikasi.' },
      { col: 'F', header: 'Status Aktif', sourceOrFormula: 'Aktif / Izin Khusus', description: 'Status keaktifan siswa selama periode PJJ.' },
    ],
    keyFormulas: [
      {
        label: 'Tanggal Berakhir Otomatis 14 Hari (Sel D2)',
        cell: 'D2',
        formula: '=IF(B2=""; ""; B2+13)',
        explanation: 'Jika Tanggal Mulai PJJ diisi pada sel B2, maka sel D2 otomatis menghitung hari ke-14 (2 pekan penuh).',
      },
    ],
  },
  {
    order: 3,
    sheetName: 'REKAP_HARIAN',
    role: 'Ringkasan agregat jumlah pengumpulan laporan, bukti foto, dan kendala pada setiap hari (Hari ke-1 s.d. Hari ke-14). Aman dijadikan sumber grafik publik di Google Sites karena tidak memuat nama/email/foto individu.',
    publicVisibility: 'Hanya Grafik/Agregat Aman',
    columns: [
      { col: 'A', header: 'Hari Ke-', sourceOrFormula: 'Hari ke-1 s.d. Hari ke-14', description: 'Urutan hari pelaksanaan PJJ.' },
      { col: 'B', header: 'Tanggal PJJ', sourceOrFormula: '=DATA_SISWA!$B$2 + (ROW()-2)', description: 'Tanggal kalender otomatis mengikuti Tanggal Mulai PJJ.' },
      { col: 'C', header: 'Pekan', sourceOrFormula: 'Pekan 1 / Pekan 2', description: 'Hari 1–7 = Pekan 1; Hari 8–14 = Pekan 2.' },
      { col: 'D', header: 'Total Kiriman Masuk', sourceOrFormula: '=COUNTIFS(RESPON_ABSENSI!$G$2:$G; B2)', description: 'Jumlah formulir yang masuk pada tanggal tersebut.' },
      { col: 'E', header: 'Siswa Unik Mengumpulkan', sourceOrFormula: 'Formula COUNTUNIQUEIFS', description: 'Jumlah siswa berbeda yang melapor (mencegah hitungan ganda bila 1 siswa kirim 2 mapel).' },
      { col: 'F', header: 'Siswa Belum Melapor', sourceOrFormula: '=COUNTA(DATA_SISWA!$C$5:$C$50)-E2', description: 'Selisih total siswa resmi kelas dengan siswa unik yang sudah melapor.' },
      { col: 'G', header: 'Persentase Kepatuhan Harian', sourceOrFormula: '=IFERROR(E2/COUNTA(DATA_SISWA!$C$5:$C$50); 0)', description: 'Persentase siswa kelas yang mengirimkan laporan pada hari tersebut.' },
    ],
    keyFormulas: [
      {
        label: 'Hitung Siswa Unik per Tanggal (Kolom E2)',
        cell: 'E2',
        formula: '=IF(B2=""; 0; COUNTUNIQUEIFS(RESPON_ABSENSI!$B$2:$B; RESPON_ABSENSI!$G$2:$G; B2; RESPON_ABSENSI!$L$2:$L; "Cocok Roster"))',
        explanation: 'Menghitung berapa siswa terdaftar resmi yang sudah mengirim minimal 1 laporan pada tanggal di B2, sehingga pengiriman berulang oleh siswa yang sama tidak menggembungkan angka kehadiran.',
      },
    ],
  },
  {
    order: 4,
    sheetName: 'REKAP_MAPEL',
    role: 'Memetakan jumlah pengumpulan bukti tugas per mata pelajaran di Pekan 1 dan Pekan 2 serta rincian status progres (Selesai, Sedang dikerjakan, Belum selesai).',
    publicVisibility: 'Hanya Grafik/Agregat Aman',
    columns: [
      { col: 'A', header: 'No', sourceOrFormula: '1 s.d. N', description: 'Nomor urut mata pelajaran.' },
      { col: 'B', header: 'Mata Pelajaran', sourceOrFormula: 'Daftar Mapel Kelas X TJKT 2', description: 'Nama mata pelajaran sesuai opsi dropdown Google Forms.' },
      { col: 'C', header: 'Kiriman Pekan 1', sourceOrFormula: 'COUNTIFS Mapel + Pekan 1', description: 'Jumlah bukti terkumpul pada Hari ke-1 s.d. ke-7.' },
      { col: 'D', header: 'Kiriman Pekan 2', sourceOrFormula: 'COUNTIFS Mapel + Pekan 2', description: 'Jumlah bukti terkumpul pada Hari ke-8 s.d. ke-14.' },
      { col: 'E', header: 'Total Bukti Terkumpul', sourceOrFormula: '=C2+D2', description: 'Akumulasi selama 2 pekan.' },
      { col: 'F', header: 'Tugas Selesai', sourceOrFormula: 'COUNTIFS Status = Selesai', description: 'Jumlah laporan berstatus Selesai.' },
      { col: 'G', header: 'Sedang Dikerjakan / Belum Selesai', sourceOrFormula: '=E2-F2', description: 'Jumlah laporan yang masih berproses.' },
    ],
    keyFormulas: [
      {
        label: 'Rekap Kiriman Mapel Pekan 1 (Kolom C2)',
        cell: 'C2',
        formula: '=COUNTIFS(RESPON_ABSENSI!$E$2:$E; B2; RESPON_ABSENSI!$M$2:$M; "Pekan 1")',
        explanation: 'Menghitung total pengumpulan pada mata pelajaran di B2 khusus selama Pekan 1.',
      },
    ],
  },
  {
    order: 5,
    sheetName: 'MONITORING_PEKAN_1',
    role: 'Tabel kontrol harian Wali Kelas untuk Hari ke-1 s.d. Hari ke-7 berdasarkan daftar resmi DATA_SISWA.',
    publicVisibility: 'Internal Wali Kelas',
    columns: [
      { col: 'A', header: 'No', sourceOrFormula: '=DATA_SISWA!A5', description: 'Nomor absen dari lembar DATA_SISWA.' },
      { col: 'B', header: 'Nama Siswa', sourceOrFormula: '=DATA_SISWA!C5', description: 'Nama resmi dari lembar DATA_SISWA.' },
      { col: 'C–I', header: 'Hari 1 s.d. Hari 7', sourceOrFormula: 'COUNTIFS Nama + Tanggal Hari 1..7', description: 'Menampilkan jumlah kiriman per hari (0 = Belum, >=1 = Sudah).' },
      { col: 'J', header: 'Total Kiriman Pekan 1', sourceOrFormula: '=SUM(C5:I5)', description: 'Total bukti tugas yang dikirim siswa selama Pekan 1.' },
      { col: 'K', header: 'Perlu Verifikasi', sourceOrFormula: 'COUNTIFS Status = Perlu Verifikasi', description: 'Jumlah kiriman siswa yang ditandai Perlu Verifikasi oleh Wali Kelas.' },
      { col: 'L', header: 'Status Pekan 1', sourceOrFormula: 'Formula Indikator 5 Status', description: 'Belum Mengumpulkan / Perlu Verifikasi / Perlu Tindak Lanjut / Sudah Mengumpulkan / Lengkap.' },
    ],
    keyFormulas: [
      {
        label: 'Penentuan Status Monitoring Pekan 1 (Kolom L5)',
        cell: 'L5',
        formula: '=IF(B5=""; ""; IF(J5=0; "Belum Mengumpulkan"; IF(K5>0; "Perlu Verifikasi"; IF(COUNTIF(C5:I5; ">0")>=5; "Lengkap"; IF(COUNTIF(C5:I5; ">0")<=2; "Perlu Tindak Lanjut"; "Sudah Mengumpulkan")))))',
        explanation: 'Mengelompokkan progres siswa ke dalam 5 indikator status resmi untuk memudahkan intervensi Wali Kelas di akhir Pekan 1.',
      },
    ],
  },
  {
    order: 6,
    sheetName: 'MONITORING_PEKAN_2',
    role: 'Tabel kontrol harian Wali Kelas untuk Hari ke-8 s.d. Hari ke-14 berdasarkan daftar resmi DATA_SISWA.',
    publicVisibility: 'Internal Wali Kelas',
    columns: [
      { col: 'A', header: 'No', sourceOrFormula: '=DATA_SISWA!A5', description: 'Nomor absen dari lembar DATA_SISWA.' },
      { col: 'B', header: 'Nama Siswa', sourceOrFormula: '=DATA_SISWA!C5', description: 'Nama resmi dari lembar DATA_SISWA.' },
      { col: 'C–I', header: 'Hari 8 s.d. Hari 14', sourceOrFormula: 'COUNTIFS Nama + Tanggal Hari 8..14', description: 'Menampilkan jumlah kiriman per hari pada Pekan 2.' },
      { col: 'J', header: 'Total Kiriman Pekan 2', sourceOrFormula: '=SUM(C5:I5)', description: 'Total bukti tugas yang dikirim siswa selama Pekan 2.' },
      { col: 'K', header: 'Perlu Verifikasi', sourceOrFormula: 'COUNTIFS Status = Perlu Verifikasi', description: 'Jumlah kiriman Pekan 2 yang membutuhkan verifikasi ulang.' },
      { col: 'L', header: 'Status Pekan 2', sourceOrFormula: 'Formula Indikator 5 Status', description: 'Indikator status akhir Pekan 2 per siswa.' },
    ],
    keyFormulas: [
      {
        label: 'Cek Pengumpulan per Hari Pekan 2 (Contoh Hari ke-8 di C5)',
        cell: 'C5',
        formula: '=IF($B5=""; ""; COUNTIFS(RESPON_ABSENSI!$B$2:$B; $B5; RESPON_ABSENSI!$G$2:$G; DATA_SISWA!$B$2+7))',
        explanation: 'Menghitung jumlah laporan yang dikirim siswa B5 pada Hari ke-8 (Tanggal Mulai + 7 hari).',
      },
    ],
  },
  {
    order: 7,
    sheetName: 'LAPORAN_WALI_KELAS',
    role: 'Dashboard eksekutif Wali Kelas & Laporan Akhir evaluasi 14 hari PJJ (memuat 6 Kartu Statistik, perbandingan Pekan 1 vs Pekan 2, daftar kendala, dan rekomendasi tindak lanjut).',
    publicVisibility: 'Internal Wali Kelas',
    columns: [
      { col: 'A–F', header: 'Blok Kartu Statistik Utama (Baris 2–4)', sourceOrFormula: 'COUNTA, COUNTIFS, Persentase', description: 'Total Siswa, Sudah Mengirimkan, Belum Mengirimkan, Bukti Terkumpul, Perlu Verifikasi, % Kelengkapan.' },
      { col: 'A–J', header: 'Tabel Rekap Akhir Per Siswa (Mulai Baris 8)', sourceOrFormula: 'Gabungan Pekan 1 & Pekan 2', description: 'No, Nama, Kelas, Jurusan, Total Mapel Terkumpul, Pengiriman Terakhir, Status Laporan, Status Foto, Progres, Rekomendasi Tindak Lanjut.' },
    ],
    keyFormulas: [
      {
        label: 'Kartu Statistik: Persentase Kelengkapan Kelas',
        cell: 'F3',
        formula: '=IFERROR(COUNTIF(G8:G45; "Lengkap") / COUNTA(DATA_SISWA!C5:C45); 0)',
        explanation: 'Menghitung proporsi siswa resmi dalam kelas yang mencapai status Lengkap selama periode PJJ.',
      },
      {
        label: 'Tanggal Pengiriman Terakhir per Siswa',
        cell: 'F8',
        formula: '=IF(B8=""; "-"; IFERROR(TEXT(MAXIFS(RESPON_ABSENSI!$A$2:$A; RESPON_ABSENSI!$B$2:$B; B8); "dd/mm/yyyy hh:mm"); "Belum Ada"))',
        explanation: 'Menampilkan waktu tercatat terakhir kali siswa mengirimkan formulir absensi dan bukti tugas.',
      },
    ],
  },
];

export const TEN_STEP_GUIDE_CHAPTERS: GuideChapter[] = [
  {
    id: 'tahap-1',
    number: '01',
    title: 'Struktur Folder Google Drive & Tata Kelola Penyimpanan',
    summary: 'Menyiapkan pondasi arsip digital di akun Google resmi Wali Kelas / Sekolah sebelum membuat formulir dan spreadsheet.',
    steps: [
      {
        stepTitle: 'Membuat Folder Induk dan 7 Sub-Folder Standar',
        instructions: [
          'Buka drive.google.com menggunakan akun Google Wali Kelas (disarankan akun organisasi sekolah bila tersedia).',
          'Klik tombol "+ Baru" (New) > "Folder baru", beri nama persis: PJJ TRACKER.',
          'Buka folder PJJ TRACKER, lalu buat 7 sub-folder secara berurutan: "01 — Formulir dan Administrasi", "02 — Database dan Rekap", "03 — Bukti Foto Siswa", "04 — Arsip Tugas", "05 — Laporan Pekan 1", "06 — Laporan Pekan 2", dan "07 — Laporan Akhir PJJ".',
        ],
        importantNote: 'Pastikan ikon berbagi pada folder induk PJJ TRACKER dan seluruh sub-foldernya berstatus "Dibatasi" (Restricted / Privat). Jangan pernah mengubah izin folder 03 — Bukti Foto Siswa menjadi "Siapa saja yang memiliki link".',
      },
    ],
  },
  {
    id: 'tahap-2',
    number: '02',
    title: 'Pembuatan Google Forms Absensi & Bukti Progres PJJ',
    summary: 'Menyusun 10 butir pertanyaan wajib dengan pembatasan unggah file gambar dan pengisian identitas manual.',
    steps: [
      {
        stepTitle: 'Membuat Formulir di Dalam Folder 01',
        instructions: [
          'Masuk ke sub-folder "01 — Formulir dan Administrasi", klik "+ Baru" > "Google Formulir" > "Formulir kosong".',
          'Beri judul formulir: FORMULIR ABSENSI DAN BUKTI PROGRES PJJ — SMK DARUL MUTTAQIN CIANJUR.',
          'Isi deskripsi formulir dengan informasi periode PJJ (2 pekan), pengingat agar siswa mengetik nama lengkap sesuai daftar absen resmi kelas X TJKT 2, serta instruksi foto proses pengerjaan berformat JPG/JPEG yang terang dan jelas.',
        ],
      },
      {
        stepTitle: 'Menambahkan 10 Pertanyaan Sesuai Spesifikasi Baku',
        instructions: [
          'Bagian A (Identitas Manual): Buat pertanyaan (1) Nama Lengkap [Jawaban Singkat - Wajib], (2) Kelas [Drop-down: X TJKT 2 - Wajib], (3) Jurusan [Drop-down: Teknik Jaringan Komputer dan Telekomunikasi (TJKT) - Wajib], (4) Mata Pelajaran [Drop-down daftar mapel kelas - Wajib].',
          'Bagian B (Bukti Foto): Buat pertanyaan (5) Upload Foto Proses Pengerjaan Tugas [Tipe: Upload File - Wajib]. Klik "Lanjutkan" saat Google meminta izin folder Drive. Aktifkan "Izinkan hanya jenis file tertentu" lalu centang "Gambar". Pilih jumlah maksimum file = 1, ukuran maksimum = 10 MB.',
          'Bagian C (Informasi Pendukung): Buat pertanyaan (6) Tanggal atau Sesi PJJ [Tanggal - Wajib], (7) Judul atau Topik Tugas [Jawaban Singkat - Wajib], (8) Status Pengerjaan [Pilihan Ganda: Belum selesai / Sedang dikerjakan / Selesai - Wajib], (9) Kendala Pembelajaran [Paragraf - Opsional], (10) Keterangan Tambahan [Paragraf - Opsional].',
        ],
        importantNote: 'Karena Google Forms mengelompokkan JPG, JPEG, PNG, dan WEBP ke dalam kategori "Gambar", tuliskan secara tegas pada deskripsi pertanyaan nomor 5 bahwa target format adalah JPG atau JPEG. Wali Kelas akan memeriksa kesesuaian format saat verifikasi di Google Sheets/Drive.',
      },
      {
        stepTitle: 'Konfigurasi Tab Setelan (Settings) Formulir',
        instructions: [
          'Buka tab "Setelan" di bagian atas Google Forms -> buka bagian "Jawaban" (Responses).',
          'Jika sebagian siswa menggunakan akun @gmail.com pribadi di luar domain sekolah, MATIKAN opsi "Batasi untuk pengguna di [Domain Sekolah] dan organisasi tepercaya". Namun jika 100% siswa memiliki akun belajar/sekolah resmi, opsi ini boleh diaktifkan.',
          'PASTIKAN opsi "Batasi ke 1 jawaban" DIMATIKAN agar siswa dapat mengirimkan absensi untuk berbagai mata pelajaran dan hari selama 14 hari PJJ.',
          'Pada "Kumpulkan alamat email": pilih "Jangan kumpulkan" atau "Input responden" sesuai kebijakan privasi sekolah, namun JANGAN menggantikan kolom Nama Lengkap manual dengan email akun.',
        ],
      },
    ],
  },
  {
    id: 'tahap-3',
    number: '03',
    title: 'Penyusunan Database 7 Lembar Google Sheets Tanpa Kode',
    summary: 'Menghubungkan respons formulir ke Google Sheets dan membangun 6 lembar rekap otomatis menggunakan rumus bawaan.',
    steps: [
      {
        stepTitle: 'Mengunggah Template atau Menautkan Respons ke Folder 02',
        instructions: [
          'Cara tercepat: Klik tombol "Unduh Master Spreadsheet (.XLSX)" pada halaman ini, unggah file tersebut ke folder "02 — Database dan Rekap" di Google Drive, klik kanan file -> "Buka dengan Google Spreadsheet", lalu klik menu "File > Simpan sebagai Google Spreadsheet".',
          'Buka kembali Google Forms Anda -> klik tab "Jawaban" -> klik "Link ke Spreadsheet" -> pilih "Pilih spreadsheet yang ada" -> arahkan ke file Google Spreadsheet yang baru saja disimpan di folder 02.',
          'Ubah nama tab respons baru yang terbentuk otomatis (biasanya bernama "Form Responses 1") menjadi persis: RESPON_ABSENSI, lalu salin 4 kolom rumus verifikasi (Kolom L s.d. O) dari template.',
        ],
      },
      {
        stepTitle: 'Mengisi Daftar Resmi Siswa (DATA_SISWA) & Proteksi Tab Mentah',
        instructions: [
          'Buka tab DATA_SISWA, isi sel B2 dengan Tanggal Mulai PJJ (contoh: 2026-11-02). Sel Tanggal Akhir (Hari ke-14) dan seluruh tanggal di tab REKAP_HARIAN serta MONITORING_PEKAN_1 & 2 akan menyesuaikan otomatis.',
          'Ketik atau tempel daftar resmi nama lengkap siswa Kelas X TJKT 2 pada kolom C mulai baris ke-5. Jangan membiarkan spasi ganda di akhir nama.',
          'Klik kanan tab RESPON_ABSENSI -> "Lindungi sheet" (Protect sheet) -> izinkan pengeditan hanya untuk akun Wali Kelas agar data mentah tidak terhapus secara tidak sengaja.',
        ],
        importantNote: 'Jangan menggunakan Google Apps Script atau makro apa pun. Seluruh perhitungan cukup menggunakan COUNTIFS, COUNTUNIQUEIFS, IF, MAXIFS, dan SUM bawaan Google Sheets.',
      },
    ],
  },
  {
    id: 'tahap-4',
    number: '04',
    title: 'Panduan Pembuatan Website Google Sites (6 Halaman)',
    summary: 'Membangun portal informasi dan akses formulir yang rapi, responsif di HP siswa, dan beridentitas SMK Darul Muttaqin Cianjur.',
    steps: [
      {
        stepTitle: 'Menyiapkan Tema Biru Navy & Identitas Sekolah',
        instructions: [
          'Buka sites.google.com (atau klik "+ Baru > Lainnya > Google Sites" dari dalam folder "01 — Formulir dan Administrasi").',
          'Beri nama dokumen situs di kiri atas: PJJ TRACKER — SMK Darul Muttaqin Cianjur, dan judul tajuk situs: PJJ TRACKER.',
          'Buka panel kanan "Tema" -> klik "Buat tema" -> atur warna primer Biru Navy (#0B1F3F), latar putih bersih (#FFFFFF), dan aksen Biru Terang (#0284C7). Pilih gaya font modern tanpa kait (Sans-serif).',
        ],
      },
      {
        stepTitle: 'Membuat 6 Halaman Utama dan 5 Tombol Beranda',
        instructions: [
          'Buka panel "Halaman" (Pages) di kanan, tambahkan halaman hingga tersusun 6 menu: (1) Beranda, (2) Absensi PJJ, (3) Panduan Siswa, (4) Monitoring Progres, (5) Informasi PJJ, (6) Kontak Wali Kelas.',
          'Pada halaman "Beranda": tampilkan nama sekolah SMK Darul Muttaqin Cianjur, Kelas X TJKT 2, rentang tanggal Pekan 1 & Pekan 2, serta pasang 5 Tombol Utama menggunakan fitur Sisipkan > Tombol: "Isi Absensi PJJ" dan "Upload Bukti Pengerjaan" (keduanya diarahkan ke halaman Absensi PJJ), "Baca Panduan" (ke Panduan Siswa), "Lihat Informasi PJJ" (ke Informasi PJJ), dan "Hubungi Wali Kelas" (ke Kontak Wali Kelas).',
          'Pada halaman "Absensi PJJ": klik panel kanan "Sisipkan" > pilih "Formulir" > klik "FORMULIR ABSENSI DAN BUKTI PROGRES PJJ — SMK DARUL MUTTAQIN CIANJUR". Tambahkan juga satu tombol tautan langsung ("Buka Formulir di Tab Penuh") tepat di atas sematan formulir karena fitur Upload File Google Forms memerlukan jendela penuh pada sebagian peramban ponsel.',
        ],
      },
    ],
  },
  {
    id: 'tahap-5',
    number: '05',
    title: 'Rancangan Dashboard Wali Kelas & Halaman Monitoring Aman',
    summary: 'Memisahkan dashboard verifikasi detail milik Wali Kelas dari ringkasan progres publik di Google Sites.',
    steps: [
      {
        stepTitle: 'Mengelola Dashboard Penuh di Google Sheets (Khusus Wali Kelas)',
        instructions: [
          'Wali Kelas memantau data lengkap (nama individu, tautan bukti foto, kecocokan roster, kendala pribadi, dan catatan pembinaan) langsung di tab LAPORAN_WALI_KELAS, MONITORING_PEKAN_1, dan MONITORING_PEKAN_2 pada Google Sheets privat.',
          'Gunakan fitur "Data > Buat tampilan filter" (Filter views) di Google Sheets untuk mengelompokkan tampilan per Mata Pelajaran, Tanggal Sesi, atau Pekan Pelaksanaan tanpa mengacak urutan baris asli.',
        ],
      },
      {
        stepTitle: 'Menampilkan Ringkasan Aman di Halaman "Monitoring Progres" Google Sites',
        instructions: [
          'Di Google Sheets tab REKAP_HARIAN dan REKAP_MAPEL, blok tabel agregat (yang HANYA berisi tanggal, jumlah siswa sudah melapor, belum melapor, dan jumlah kiriman per mapel TANPA nama siswa, email, atau link foto), lalu klik "Sisipkan > Diagram" (Chart).',
          'Di Google Sites halaman "Monitoring Progres", klik "Sisipkan > Diagram" -> pilih spreadsheet PJJ TRACKER -> pilih grafik progres harian dan grafik per mata pelajaran.',
          'Tambahkan keterangan tertulis di bawah grafik pada Google Sites bahwa grafik diperbarui secara berkala mengikuti sinkronisasi Google Sheets (sekitar setiap 5 menit atau setelah pembaruan halaman, bukan siaran langsung real-time detik-ke-detik).',
        ],
        importantNote: 'Jangan pernah menyematkan seluruh file Google Sheets mentah ke Google Sites karena pengunjung publik dapat berpindah tab melihat RESPON_ABSENSI dan tautan foto siswa.',
      },
    ],
  },
  {
    id: 'tahap-6',
    number: '06',
    title: 'Integrasi Antarlayanan Google Tanpa Kode',
    summary: 'Memastikan alur otomatis satu arah dari pengisian siswa hingga penyimpanan foto dan rekapitulasi spreadsheet.',
    steps: [
      {
        stepTitle: 'Menata Lokasi Folder Otomatis Bukti Foto ke Folder 03',
        instructions: [
          'Saat pertanyaan tipe Upload File dibuat di Google Forms, Google otomatis membuat folder bernama "FORMULIR ABSENSI... (File responses)" di Drive.',
          'Buka Google Drive, cari folder "(File responses)" tersebut, klik kanan -> "Atur > Pindahkan" (Move), lalu pindahkan ke dalam folder "PJJ TRACKER / 03 — Bukti Foto Siswa". Koneksi unggahan formulir tetap berjalan normal meskipun foldernya dipindahkan.',
          'Pastikan rantai integrasi berjalan utuh: Siswa buka Google Sites -> klik formulir Google Forms -> unggah foto tersimpan otomatis di Folder 03 Drive -> baris jawaban & tautan foto tercatat otomatis di Google Sheets Folder 02 -> grafik agregat tampil di Google Sites.',
        ],
      },
    ],
  },
  {
    id: 'tahap-7',
    number: '07',
    title: 'Pengaturan Hak Akses Publik, Organisasi, dan Privasi Data',
    summary: 'Menerapkan pemisahan tegas antara situs publik tanpa password khusus dan penyimpanan administrasi tertutup.',
    steps: [
      {
        stepTitle: 'Matriks Izin Berbagi Empat Layanan',
        instructions: [
          'Google Sites: Klik tombol "Publikasikan" -> pada pengaturan "Siapa yang dapat melihat situs saya", pilih "Publik" agar siswa dan orang tua dapat membaca panduan serta informasi PJJ tanpa login khusus PJJ TRACKER. Pada "Siapa yang dapat mengedit", batasi HANYA akun Wali Kelas.',
          'Google Forms: Siswa otomatis diminta masuk ke akun Google masing-masing oleh sistem Google saat mengisi formulir karena adanya fitur Upload File. Tidak diperlukan pembuatan username/password baru.',
          'Google Sheets & Google Drive (Folder 01 s.d. 07): Pastikan status berbagi tetap "Dibatasi" (Restricted). Hanya Wali Kelas (dan Kepala Program/Kurikulum bila diberi izin Lihat) yang dapat membuka spreadsheet maupun foto bukti pengerjaan siswa.',
        ],
      },
    ],
  },
  {
    id: 'tahap-8',
    number: '08',
    title: 'Skenario Pengujian End-to-End (Siswa & Wali Kelas)',
    summary: 'Daftar uji coba wajib sebelum tautan PJJ TRACKER dibagikan ke grup kelas X TJKT 2.',
    steps: [
      {
        stepTitle: 'Uji Sisi Siswa (Ponsel & Akun Google Biasa)',
        instructions: [
          'Buka tautan Google Sites melalui jendela penyamaran (Incognito) di ponsel Android/iOS: pastikan halaman Beranda, Panduan, dan Informasi PJJ terbuka lancar tanpa diminta login.',
          'Masuk menggunakan 1 akun Google uji (non-admin) untuk mengisi formulir: coba klik Kirim saat kolom Nama atau Foto dikosongkan (pastikan tertahan oleh validasi wajib isi).',
          'Unggah 1 foto uji berformat .jpg, isi seluruh kolom, lalu kirim. Pastikan halaman konfirmasi tampil.',
        ],
      },
      {
        stepTitle: 'Uji Sisi Wali Kelas & Uji Kebocoran Privasi',
        instructions: [
          'Buka Google Sheets sebagai Wali Kelas: pastikan respons uji masuk ke RESPON_ABSENSI beserta Timestamp, tautan foto Drive dapat diklik oleh Wali Kelas, dan angka di REKAP_HARIAN serta MONITORING_PEKAN_1 bertambah.',
          'Uji kirim ke-2 dengan nama siswa yang sama pada hari yang sama: pastikan kolom "Siswa Unik Mengumpulkan" di REKAP_HARIAN tetap menghitung 1 siswa (bukan 2 siswa berbeda).',
          'Salin tautan foto Drive dari RESPON_ABSENSI lalu buka di jendela Incognito (tanpa login Wali Kelas): pastikan akses DITOLAK (terkunci aman). Hapus baris data uji dari RESPON_ABSENSI sebelum peluncuran resmi.',
        ],
      },
    ],
  },
  {
    id: 'tahap-9',
    number: '09',
    title: 'Checklist Peluncuran Website PJJ TRACKER',
    summary: 'Pemeriksaan kesiapan administrasi sebelum hari pertama PJJ dimulai.',
    steps: [
      {
        stepTitle: 'Verifikasi Pra-Peluncuran',
        instructions: [
          'Daftar resmi seluruh siswa Kelas X TJKT 2 sudah diinput lengkap tanpa salah ejaan pada tab DATA_SISWA.',
          'Tanggal Mulai PJJ pada sel DATA_SISWA!B2 sudah sesuai kalender akademik sekolah.',
          'Seluruh mata pelajaran kelas X TJKT 2 sudah masuk di pilihan Drop-down nomor 4 pada Google Forms dan tab REKAP_MAPEL.',
          'Nomor WhatsApp resmi atau kanal komunikasi Wali Kelas di halaman "Kontak Wali Kelas" sudah diuji berfungsi.',
          'Tautan pendek atau tautan resmi Google Sites siap dibagikan ke grup kelas dan grup orang tua/wali murid.',
        ],
      },
    ],
  },
  {
    id: 'tahap-10',
    number: '10',
    title: 'SOP Operasional Monitoring Harian Selama 14 Hari & Laporan Akhir',
    summary: 'Rutinitas kerja Wali Kelas dari Hari ke-1 hingga penutupan evaluasi di Hari ke-14.',
    steps: [
      {
        stepTitle: 'Rutinitas Harian Wali Kelas (15–20 Menit/Hari)',
        instructions: [
          'Pagi (07.30 WIB): Bagikan pengingat jadwal mata pelajaran hari tersebut beserta tautan Google Sites PJJ TRACKER di grup kelas X TJKT 2.',
          'Siang/Sore (15.00–16.30 WIB): Buka tab RESPON_ABSENSI. Klik tautan foto pada kiriman baru untuk memastikan foto benar-benar JPG/JPEG proses pengerjaan yang relevan (bukan foto hitam/duplikat). Isi kolom Status Verifikasi Wali Kelas ("Lengkap" bila sesuai, "Perlu Verifikasi" bila nama tidak cocok/foto buram).',
          'Tindak Lanjut Cepat: Buka tab MONITORING_PEKAN_1 (atau PEKAN_2), cek siswa berstatus "Belum Mengumpulkan" atau memiliki catatan di kolom "Kendala Pembelajaran", lalu hubungi secara persuasif.',
        ],
      },
      {
        stepTitle: 'Evaluasi Paruh Waktu (Hari ke-7) & Laporan Akhir PJJ (Hari ke-14)',
        instructions: [
          'Akhir Hari ke-7: Buka tab MONITORING_PEKAN_1, klik menu "File > Download > Dokumen PDF (.pdf)" (orientasi Lanskap, sesuaikan dengan lebar halaman), lalu simpan ke folder "05 — Laporan Pekan 1".',
          'Akhir Hari ke-14: Buka tab MONITORING_PEKAN_2 dan ekspor PDF ke folder "06 — Laporan Pekan 2".',
          'Penyusunan Laporan Akhir: Buka tab LAPORAN_WALI_KELAS, tinjau perbandingan kepatuhan Pekan 1 vs Pekan 2, daftar mata pelajaran tertinggi/terendah, rekap kendala terbanyak, dan isi kolom rekomendasi pendampingan pasca-PJJ. Ekspor PDF ke folder "07 — Laporan Akhir PJJ".',
        ],
        importantNote: 'Ingat prinsip akuntabilitas pedagogis: Timestamp pengiriman dan unggahan foto membuktikan pengumpulan laporan progres, bukan jaminan kehadiran penuh sepanjang jam pelajaran maupun kebenaran jawaban akademik (yang tetap dinilai oleh guru mata pelajaran).',
      },
    ],
  },
];

export const LAUNCH_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'chk-1',
    category: 'Google Drive & Privasi',
    label: 'Folder induk PJJ TRACKER beserta sub-folder 01 s.d. 07 telah dibuat di Google Drive Wali Kelas.',
    verificationMethod: 'Periksa urutan nama 7 sub-folder di Google Drive.',
  },
  {
    id: 'chk-2',
    category: 'Google Drive & Privasi',
    label: 'Izin akses folder "03 — Bukti Foto Siswa" dan "02 — Database dan Rekap" berstatus Dibatasi (Privat).',
    verificationMethod: 'Buka tautan folder di jendela penyamaran (Incognito) — harus meminta izin akses.',
  },
  {
    id: 'chk-3',
    category: 'Google Forms',
    label: '10 pertanyaan wajib & pendukung telah sesuai spesifikasi, dan nama siswa wajib diketik manual.',
    verificationMethod: 'Pratinjau formulir dan pastikan kolom 1 s.d. 8 memiliki tanda bintang merah wajib isi (*).',
  },
  {
    id: 'chk-4',
    category: 'Google Forms',
    label: 'Pertanyaan Upload File dibatasi hanya kategori Gambar (maks. 10 MB) dengan instruksi format JPG/JPEG.',
    verificationMethod: 'Coba unggah file .pdf atau .docx pada pratinjau — sistem harus menolak.',
  },
  {
    id: 'chk-5',
    category: 'Google Forms',
    label: 'Opsi "Batasi ke 1 jawaban" dimatikan dan akses akun Google luar domain disesuaikan dengan kondisi siswa.',
    verificationMethod: 'Cek tab Setelan > Jawaban pada Google Forms.',
  },
  {
    id: 'chk-6',
    category: 'Google Sheets',
    label: 'Daftar resmi siswa Kelas X TJKT 2 telah diisi pada tab DATA_SISWA (tanpa nama fiktif/singkatan).',
    verificationMethod: 'Cocokkan jumlah baris di DATA_SISWA dengan buku presensi resmi sekolah.',
  },
  {
    id: 'chk-7',
    category: 'Google Sheets',
    label: 'Tanggal Mulai PJJ pada DATA_SISWA!B2 telah diatur sehingga rentang Pekan 1 (Hari 1–7) & Pekan 2 (Hari 8–14) aktif.',
    verificationMethod: 'Periksa kolom Tanggal di tab REKAP_HARIAN apakah sudah berurutan 14 hari.',
  },
  {
    id: 'chk-8',
    category: 'Google Sheets',
    label: 'Tab RESPON_ABSENSI telah dikunci dengan fitur Lindungi Sheet (Protect Sheet) khusus Wali Kelas.',
    verificationMethod: 'Pastikan ikon gembok muncul pada nama tab RESPON_ABSENSI.',
  },
  {
    id: 'chk-9',
    category: 'Google Sites',
    label: 'Keenam halaman Google Sites dan 5 tombol utama di Beranda berfungsi mengarah ke tujuan yang tepat.',
    verificationMethod: 'Klik satu per satu kelima tombol pada mode Pratinjau Seluler & Desktop.',
  },
  {
    id: 'chk-10',
    category: 'Google Sites',
    label: 'Halaman Monitoring Progres hanya menampilkan grafik agregat aman (tanpa email, nama pribadi, atau foto tugas).',
    verificationMethod: 'Buka halaman Monitoring Progres di jendela Incognito dan pastikan privasi terjaga.',
  },
  {
    id: 'chk-11',
    category: 'Pengujian Akhir',
    label: 'Pengujian end-to-end pengiriman 1 formulir uji berhasil tercatat dan baris data uji telah dibersihkan kembali.',
    verificationMethod: 'Pastikan tab RESPON_ABSENSI kembali bersih (0 data uji) sebelum hari pertama PJJ.',
  },
];
