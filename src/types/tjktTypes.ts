import { Timestamp } from 'firebase/firestore';

// Verbatim constants synchronized with firebase-blueprint.json & firestore.rules
export const DEPARTMENT_CANONICAL_NAME =
  'Teknik Jaringan Komputer dan Telekomunikasi (TJKT)' as const;

export const VALIDATION_LIMITS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  ID_MAX_LEN: 128,
  DATE_PATTERN: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  JPEG_DATA_URL_PATTERN: /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/,
  APP_NAME_MIN: 3,
  APP_NAME_MAX: 120,
  STUDENT_NAME_MIN: 2,
  STUDENT_NAME_MAX: 100,
  CLASS_NAME_MIN: 2,
  CLASS_NAME_MAX: 30,
  SUBJECT_MIN: 2,
  SUBJECT_MAX: 120,
  TASK_TITLE_MIN: 2,
  TASK_TITLE_MAX: 160,
  PHOTO_DATA_URL_MAX: 350000,
  FILE_NAME_MAX: 120,
  NOTE_MAX: 500,
  MAX_CLASSES: 20,
  MAX_SUBJECTS: 30,
} as const;

export const RECOMMENDED_APP_NAMES: { title: string; subtitle: string; reason: string }[] = [
  {
    title: 'SIMPJJ TJKT — Tracker Absensi & Tugas Jurusan TJKT',
    subtitle: 'Rekomendasi Utama (Resmi untuk X TJKT 1, X TJKT 2 & XI TJKT)',
    reason: 'Akronim resmi yang mudah diingat siswa dan selaras untuk laporan akademik tingkat jurusan.',
  },
  {
    title: 'TRACKER ABSENSI DAN TUGAS JURUSAN TJKT',
    subtitle: 'Lugas & Eksplisit',
    reason: 'Langsung menjelaskan fungsi absensi dan rekap tugas untuk ketiga kelas di Jurusan TJKT.',
  },
  {
    title: 'NETTRACK TJKT — Portal Presensi & Tugas Siswa',
    subtitle: 'Nuansa Kejuruan Jaringan & Telekomunikasi',
    reason: 'Mengangkat identitas teknologi jaringan komputer khas konsentrasi keahlian TJKT.',
  },
  {
    title: 'E-MONIT TJKT — SMK Darul Muttaqin Cianjur',
    subtitle: 'Formal Administrasi Kurikulum',
    reason: 'Cocok digunakan untuk rekapitulasi berkala Wali Kelas dan Ketua Program Keahlian.',
  },
];

// Hanya terdiri dari 3 kelas resmi Jurusan TJKT
export const DEFAULT_TJKT_CLASSES: string[] = [
  'X TJKT 1',
  'X TJKT 2',
  'XI TJKT',
];

// Mata Pelajaran Produktif Jurusan per Tingkat
export const PRODUCTIVE_SUBJECTS_X: string[] = [
  'Dasar Kompetensi / Dasar Teknik TJKT',
];

export const PRODUCTIVE_SUBJECTS_XI: string[] = [
  'Administrasi Sistem Keamanan Jaringan',
  'Administrasi Sistem Infrastruktur Jaringan',
  'Teknologi Jaringan Kabel dan Nirkabel',
];

// Mata Pelajaran Umum & Muatan Khas Sekolah (Kelas X & XI TJKT)
export const GENERAL_SUBJECTS_TJKT: string[] = [
  "Tahsin Al-Qur'an",
  'Pendidikan Agama Islam dan Budi Pekerti',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'Bahasa Inggris',
  'Informatika',
  'Projek IPAS',
  'Sejarah',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
  'Seni Budaya',
  'Projek Kreatif dan Kewirausahaan (PKK)',
];

export const DEFAULT_TJKT_SUBJECTS: string[] = [
  ...PRODUCTIVE_SUBJECTS_X,
  ...PRODUCTIVE_SUBJECTS_XI,
  ...GENERAL_SUBJECTS_TJKT,
];

/**
 * Ensures required TJKT subjects are present even when loading an older saved config
 */
export function ensureMandatorySubjects(subjects: string[]): string[] {
  const result = [...subjects];
  const hasKabelNirkabel = result.some((s) => s.toLowerCase().includes('nirkabel'));
  const hasTahsin = result.some((s) => s.toLowerCase().includes('tahsin'));

  if (!hasKabelNirkabel && result.length < VALIDATION_LIMITS.MAX_SUBJECTS) {
    result.push('Teknologi Jaringan Kabel dan Nirkabel');
  }
  if (!hasTahsin && result.length < VALIDATION_LIMITS.MAX_SUBJECTS) {
    result.push("Tahsin Al-Qur'an");
  }
  return result.slice(0, VALIDATION_LIMITS.MAX_SUBJECTS);
}

/**
 * Determines whether a class belongs to Grade XI or Grade X
 */
export function getClassGradeLevel(className: string): 'X' | 'XI' | 'OTHER' {
  const normalized = className.trim().toUpperCase();
  if (normalized.startsWith('XI ') || normalized === 'XI' || normalized.includes('XI TJKT')) {
    return 'XI';
  }
  if (normalized.startsWith('X ') || normalized === 'X' || normalized.includes('X TJKT')) {
    return 'X';
  }
  return 'OTHER';
}

/**
 * Classifies a subject into Produktif Kelas X, Produktif Kelas XI, or Mapel Umum
 */
export function getSubjectCategoryLabel(
  subject: string
): 'Produktif Kelas X' | 'Produktif Kelas XI' | 'Mapel Umum' {
  const low = subject.trim().toLowerCase();
  if (
    low.includes('dasar kompetensi') ||
    low.includes('dasar teknik tjkt') ||
    low.includes('dasar-dasar teknik jaringan')
  ) {
    return 'Produktif Kelas X';
  }
  if (
    low.includes('administrasi sistem keamanan jaringan') ||
    low.includes('administrasi sistem infrastruktur jaringan') ||
    low.includes('kabel dan nirkabel') ||
    low.includes('kabel nirkabel') ||
    low.includes('nirkabel')
  ) {
    return 'Produktif Kelas XI';
  }
  return 'Mapel Umum';
}

/**
 * Filters and groups available subjects based on the selected class (X TJKT 1/2 vs XI TJKT)
 */
export function getGroupedSubjectsForClass(
  className: string,
  allSubjects: string[]
): { productiveLabel: string; productive: string[]; general: string[]; flatAllowed: string[] } {
  const grade = getClassGradeLevel(className);

  const productive: string[] = [];
  const general: string[] = [];

  for (const subj of allSubjects) {
    const category = getSubjectCategoryLabel(subj);
    if (grade === 'X') {
      if (category === 'Produktif Kelas X') {
        productive.push(subj);
      } else if (category === 'Mapel Umum') {
        general.push(subj);
      }
    } else if (grade === 'XI') {
      if (category === 'Produktif Kelas XI') {
        productive.push(subj);
      } else if (category === 'Mapel Umum') {
        general.push(subj);
      }
    } else {
      if (category !== 'Mapel Umum') {
        productive.push(subj);
      } else {
        general.push(subj);
      }
    }
  }

  const productiveLabel =
    grade === 'X'
      ? 'Mapel Produktif Kelas X (X TJKT 1 & X TJKT 2)'
      : grade === 'XI'
      ? 'Mapel Produktif Kelas XI (XI TJKT)'
      : 'Mapel Produktif Jurusan TJKT';

  return {
    productiveLabel,
    productive,
    general,
    flatAllowed: [...productive, ...general],
  };
}

export type TaskProgressStatus = 'Belum selesai' | 'Sedang dikerjakan' | 'Selesai';

export type VerificationStatus =
  | 'Sudah Mengumpulkan'
  | 'Perlu Verifikasi'
  | 'Lengkap'
  | 'Perlu Tindak Lanjut';

export type RosterEnrollmentStatus = 'Aktif' | 'Izin Khusus' | 'Nonaktif';

export interface PortalConfigDoc {
  appName: string;
  schoolName: string;
  departmentName: string;
  headOfDepartment: string;
  contactChannel: string;
  startDate: string;
  endDate: string;
  classes: string[];
  subjects: string[];
  updatedByUid: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RosterStudentDoc {
  id: string;
  nis: string;
  fullName: string;
  className: string;
  homeroomTeacher: string;
  activeStatus: RosterEnrollmentStatus;
  createdByUid: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AttendanceSubmissionDoc {
  id: string;
  studentUid: string;
  studentName: string;
  className: string;
  majorName: string;
  subject: string;
  sessionDate: string;
  weekNumber: 1 | 2;
  taskTitle: string;
  taskProgress: TaskProgressStatus;
  photoDataUrl: string;
  photoFileName: string;
  learningIssue: string;
  additionalNote: string;
  verificationStatus: VerificationStatus;
  teacherNote: string;
  matchedRosterId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const INITIAL_PORTAL_CONFIG: PortalConfigDoc = {
  appName: 'SIMPJJ TJKT — Tracker Absensi & Tugas Jurusan TJKT',
  schoolName: 'SMK Darul Muttaqin Cianjur',
  departmentName: DEPARTMENT_CANONICAL_NAME,
  headOfDepartment: '',
  contactChannel: 'Kanal Resmi Wali Kelas & Ruang Praktik Jurusan TJKT (07.30 – 16.00 WIB)',
  startDate: '2026-11-02',
  endDate: '2026-11-15',
  classes: DEFAULT_TJKT_CLASSES,
  subjects: DEFAULT_TJKT_SUBJECTS,
  updatedByUid: '',
};

export function sanitizeTruncate(val: string, maxLen: number): string {
  return val.trim().slice(0, maxLen);
}

export function computePjjWeekNumber(startDate: string, sessionDate: string): 1 | 2 {
  const s = new Date(startDate).getTime();
  const t = new Date(sessionDate).getTime();
  if (Number.isNaN(s) || Number.isNaN(t)) return 1;
  const diffDays = Math.floor((t - s) / (1000 * 60 * 60 * 24));
  return diffDays >= 7 ? 2 : 1;
}

export function addDaysIso(isoDate: string, daysToAdd: number): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + daysToAdd));
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatIndoDate(isoDate: string): string {
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
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  return `${parts[2]} ${months[parts[1] - 1] || ''} ${parts[0]}`;
}

export function formatTimestampWib(ts?: Timestamp): string {
  if (!ts) return 'Baru saja';
  const dt = ts.toDate();
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.toLocaleDateString('en-CA').slice(0, 4);
  const hh = String(dt.getHours()).padStart(2, '0');
  const min = String(dt.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}
