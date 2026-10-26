import React, { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  Lock,
  LogIn,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  db,
  handleFirestoreError,
  OperationType,
  signInWithGooglePopup,
  signOutUser,
  SUPER_ADMIN_EMAIL,
} from '../firebase';
import {
  addDaysIso,
  AttendanceSubmissionDoc,
  DEFAULT_TJKT_CLASSES,
  DEFAULT_TJKT_SUBJECTS,
  DEPARTMENT_CANONICAL_NAME,
  formatTimestampWib,
  getGroupedSubjectsForClass,
  getSubjectCategoryLabel,
  PortalConfigDoc,
  RECOMMENDED_APP_NAMES,
  RosterStudentDoc,
  sanitizeTruncate,
  VALIDATION_LIMITS,
  VerificationStatus,
} from '../types/tjktTypes';
import {
  exportTjktEvaluationPdf,
  exportTjktRecapXlsx,
} from '../utils/tjktReportExporter';

type BackEndSubTab = 'monitoring' | 'rekap' | 'roster' | 'pengaturan';

interface BackEndAdminConsoleProps {
  config: PortalConfigDoc;
  currentUser: User | null;
  authReady: boolean;
  onReturnToFrontEnd: () => void;
}

export const BackEndAdminConsole: React.FC<BackEndAdminConsoleProps> = ({
  config,
  currentUser,
  authReady,
  onReturnToFrontEnd,
}) => {
  const [subTab, setSubTab] = useState<BackEndSubTab>('monitoring');

  const isVerifiedAdmin = Boolean(
    currentUser &&
      currentUser.emailVerified &&
      currentUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
  );

  // Live Back-End Firestore data
  const [submissions, setSubmissions] = useState<AttendanceSubmissionDoc[]>([]);
  const [roster, setRoster] = useState<RosterStudentDoc[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Monitoring Filters
  const [classFilter, setClassFilter] = useState<string>('all');
  const [weekFilter, setWeekFilter] = useState<'all' | 1 | 2>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Photo & Verification Inspection Modal
  const [inspectingSub, setInspectingSub] = useState<AttendanceSubmissionDoc | null>(null);
  const [editVerifStatus, setEditVerifStatus] = useState<VerificationStatus>('Sudah Mengumpulkan');
  const [editTeacherNote, setEditTeacherNote] = useState<string>('');
  const [savingVerification, setSavingVerification] = useState(false);

  // Roster Management Form States
  const [rosterClass, setRosterClass] = useState(config.classes[0] || 'X TJKT 1');
  const [rosterHomeroom, setRosterHomeroom] = useState('');
  const [singleNis, setSingleNis] = useState('');
  const [singleName, setSingleName] = useState('');
  const [bulkNames, setBulkNames] = useState('');
  const [showBulkRoster, setShowBulkRoster] = useState(false);
  const [savingRoster, setSavingRoster] = useState(false);

  // Department Config Editor States
  const [cfgAppName, setCfgAppName] = useState(config.appName);
  const [cfgSchoolName, setCfgSchoolName] = useState(config.schoolName);
  const [cfgHeadName, setCfgHeadName] = useState(config.headOfDepartment);
  const [cfgContact, setCfgContact] = useState(config.contactChannel);
  const [cfgStartDate, setCfgStartDate] = useState(config.startDate);
  const [cfgEndDate, setCfgEndDate] = useState(config.endDate);
  const [cfgClassesText, setCfgClassesText] = useState(config.classes.join('\n'));
  const [cfgSubjectsText, setCfgSubjectsText] = useState(config.subjects.join('\n'));
  const [savingConfig, setSavingConfig] = useState(false);
  const [configFeedback, setConfigFeedback] = useState<string | null>(null);

  useEffect(() => {
    setCfgAppName(config.appName);
    setCfgSchoolName(config.schoolName);
    setCfgHeadName(config.headOfDepartment);
    setCfgContact(config.contactChannel);
    setCfgStartDate(config.startDate);
    setCfgEndDate(config.endDate);
    setCfgClassesText(config.classes.join('\n'));
    setCfgSubjectsText(config.subjects.join('\n'));
    if (config.classes.length > 0 && !config.classes.includes(rosterClass)) {
      setRosterClass(config.classes[0]);
    }
  }, [config, rosterClass]);

  const relevantSubjectsForFilter = useMemo(() => {
    if (classFilter === 'all') return config.subjects;
    return getGroupedSubjectsForClass(classFilter, config.subjects).flatAllowed;
  }, [classFilter, config.subjects]);

  // Attach Back-End Firestore listeners ONLY when verified SuperAdmin is signed in
  useEffect(() => {
    if (!authReady || !isVerifiedAdmin || !currentUser) {
      setSubmissions([]);
      setRoster([]);
      return;
    }

    setLoadingData(true);

    const subQuery = query(
      collection(db, 'attendance_submissions'),
      where('majorName', '==', DEPARTMENT_CANONICAL_NAME)
    );
    const unsubSubmissions = onSnapshot(
      subQuery,
      (snap) => {
        const list: AttendanceSubmissionDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AttendanceSubmissionDoc, 'id'>),
        }));
        list.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
        setSubmissions(list);
        setLoadingData(false);
      },
      (err) => {
        setLoadingData(false);
        handleFirestoreError(err, OperationType.LIST, 'attendance_submissions');
      }
    );

    const rosterQuery = query(
      collection(db, 'roster_students'),
      where('createdByUid', '==', currentUser.uid)
    );
    const unsubRoster = onSnapshot(
      rosterQuery,
      (snap) => {
        const list: RosterStudentDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<RosterStudentDoc, 'id'>),
        }));
        list.sort((a, b) =>
          a.className === b.className
            ? a.fullName.localeCompare(b.fullName)
            : a.className.localeCompare(b.className)
        );
        setRoster(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'roster_students');
      }
    );

    return () => {
      unsubSubmissions();
      unsubRoster();
    };
  }, [authReady, isVerifiedAdmin, currentUser]);

  // Auth Gate UI
  if (!authReady) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-xl">
        <div className="h-8 w-64 bg-slate-100 rounded animate-pulse mb-3" />
        <div className="h-4 w-96 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
        <div className="w-11 h-11 rounded-xl bg-slate-100 text-[#0B1F3F] flex items-center justify-center mx-auto">
          <Lock className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-[#0B1F3F]">
          Akses Back-End — Panel Rekap & Monitoring Jurusan TJKT
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Halaman Back-End memuat data pribadi siswa, bukti foto pengerjaan tugas, dan rekapitulasi kehadiran kelas X TJKT 1, X TJKT 2, serta XI TJKT. Silakan masuk menggunakan Akun Google Admin / Koordinator Jurusan TJKT yang berwenang.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => void signInWithGooglePopup()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0B1F3F] hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <LogIn className="w-4 h-4" />
            Masuk sebagai Admin / Wali Kelas TJKT
          </button>
          <button
            type="button"
            onClick={onReturnToFrontEnd}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Kembali ke Front-End Absensi Siswa
          </button>
        </div>
      </div>
    );
  }

  if (!isVerifiedAdmin) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
          <Lock className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Akun Saat Ini Terdaftar sebagai Pengakses Siswa (Front-End)
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Anda masuk sebagai <strong>{currentUser.email}</strong>. Demi menjaga kerahasiaan foto tugas dan data pribadi seluruh siswa Jurusan TJKT, panel Back-End dibatasi khusus akun pengelola resmi Jurusan TJKT (<strong>{SUPER_ADMIN_EMAIL}</strong>).
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onReturnToFrontEnd}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-[#0284C7] hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Buka Portal Absensi Siswa (Front-End)
          </button>
          <button
            type="button"
            onClick={async () => {
              await signOutUser();
              await signInWithGooglePopup();
            }}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Ganti ke Akun Admin TJKT
          </button>
        </div>
      </div>
    );
  }

  // Scoped metrics based on active Class Filter
  const scopedRoster =
    classFilter === 'all' ? roster : roster.filter((r) => r.className === classFilter);
  const scopedSubmissions =
    classFilter === 'all' ? submissions : submissions.filter((s) => s.className === classFilter);

  const findMatchedRoster = (sub: AttendanceSubmissionDoc): RosterStudentDoc | undefined => {
    if (sub.matchedRosterId) {
      const byId = roster.find((r) => r.id === sub.matchedRosterId);
      if (byId) return byId;
    }
    return roster.find(
      (r) =>
        r.className === sub.className &&
        r.fullName.trim().toLowerCase() === sub.studentName.trim().toLowerCase()
    );
  };

  const reportedRosterIds = new Set<string>();
  scopedSubmissions.forEach((s) => {
    const m = findMatchedRoster(s);
    if (m) reportedRosterIds.add(m.id);
  });

  const uniqueActiveSenders =
    scopedRoster.length > 0
      ? reportedRosterIds.size
      : new Set(
          scopedSubmissions.map((s) => `${s.className}:${s.studentName.trim().toLowerCase()}`)
        ).size;

  const notSubmittedCount = Math.max(0, scopedRoster.length - reportedRosterIds.size);
  const needsVerifCount = scopedSubmissions.filter(
    (s) => s.verificationStatus === 'Perlu Verifikasi'
  ).length;
  const compliancePct =
    scopedRoster.length > 0
      ? Math.round((reportedRosterIds.size / scopedRoster.length) * 100)
      : scopedSubmissions.length > 0
      ? 100
      : 0;

  // Build Unified Monitoring Table Rows
  interface UnifiedMonitoringRow {
    key: string;
    submission: AttendanceSubmissionDoc | null;
    studentName: string;
    className: string;
    isRosterMatched: boolean;
    subject: string;
    sessionDateLabel: string;
    weekNumber: 1 | 2 | null;
    taskTitle: string;
    taskProgress: string;
    status: VerificationStatus | 'Belum Mengumpulkan';
    teacherNote: string;
  }

  const submittedRows: UnifiedMonitoringRow[] = scopedSubmissions.map((s) => {
    const matched = findMatchedRoster(s);
    return {
      key: `sub-${s.id}`,
      submission: s,
      studentName: s.studentName,
      className: s.className,
      isRosterMatched: Boolean(matched),
      subject: s.subject,
      sessionDateLabel: `${s.sessionDate} (${formatTimestampWib(s.createdAt)})`,
      weekNumber: s.weekNumber,
      taskTitle: s.taskTitle,
      taskProgress: s.taskProgress,
      status: s.verificationStatus,
      teacherNote: s.teacherNote,
    };
  });

  const unsubmittedRows: UnifiedMonitoringRow[] = scopedRoster
    .filter((r) => !reportedRosterIds.has(r.id))
    .map((r) => ({
      key: `roster-${r.id}`,
      submission: null,
      studentName: r.fullName,
      className: r.className,
      isRosterMatched: true,
      subject: '-',
      sessionDateLabel: 'Belum mengirim absensi',
      weekNumber: null,
      taskTitle: '-',
      taskProgress: '-',
      status: 'Belum Mengumpulkan',
      teacherNote: r.homeroomTeacher ? `Wali Kelas: ${r.homeroomTeacher}` : 'Perlu diingatkan',
    }));

  const combinedRows = [...submittedRows, ...unsubmittedRows].filter((row) => {
    if (weekFilter !== 'all' && row.weekNumber !== weekFilter) return false;
    if (subjectFilter !== 'all' && row.subject !== subjectFilter) return false;
    if (dateFilter && !row.sessionDateLabel.startsWith(dateFilter)) return false;
    if (statusFilter !== 'all' && row.status !== statusFilter) return false;
    if (
      searchQuery.trim() &&
      !row.studentName.toLowerCase().includes(searchQuery.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const openInspectionModal = (sub: AttendanceSubmissionDoc) => {
    setInspectingSub(sub);
    setEditVerifStatus(sub.verificationStatus);
    setEditTeacherNote(sub.teacherNote);
  };

  const handleSaveVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingSub) return;
    setSavingVerification(true);
    const matched = findMatchedRoster(inspectingSub);
    const docPath = `attendance_submissions/${inspectingSub.id}`;
    try {
      await updateDoc(doc(db, 'attendance_submissions', inspectingSub.id), {
        verificationStatus: editVerifStatus,
        teacherNote: sanitizeTruncate(editTeacherNote, VALIDATION_LIMITS.NOTE_MAX),
        matchedRosterId: matched ? matched.id : '',
        updatedAt: serverTimestamp(),
      });
      setInspectingSub(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    } finally {
      setSavingVerification(false);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    const docPath = `attendance_submissions/${id}`;
    try {
      await deleteDoc(doc(db, 'attendance_submissions', id));
      setInspectingSub(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  };

  const handleAddSingleRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim() || !currentUser) return;
    setSavingRoster(true);
    try {
      await addDoc(collection(db, 'roster_students'), {
        nis: sanitizeTruncate(singleNis, 30),
        fullName: sanitizeTruncate(singleName, VALIDATION_LIMITS.STUDENT_NAME_MAX),
        className: sanitizeTruncate(rosterClass, VALIDATION_LIMITS.CLASS_NAME_MAX),
        homeroomTeacher: sanitizeTruncate(rosterHomeroom, 100),
        activeStatus: 'Aktif',
        createdByUid: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSingleNis('');
      setSingleName('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'roster_students');
    } finally {
      setSavingRoster(false);
    }
  };

  const handleBulkAddRoster = async () => {
    if (!bulkNames.trim() || !currentUser) return;
    const lines = bulkNames
      .split(/\r?\n/)
      .map((l) => sanitizeTruncate(l, VALIDATION_LIMITS.STUDENT_NAME_MAX))
      .filter((l) => l.length >= VALIDATION_LIMITS.STUDENT_NAME_MIN);
    if (lines.length === 0) return;

    setSavingRoster(true);
    try {
      for (const name of lines) {
        await addDoc(collection(db, 'roster_students'), {
          nis: '',
          fullName: name,
          className: sanitizeTruncate(rosterClass, VALIDATION_LIMITS.CLASS_NAME_MAX),
          homeroomTeacher: sanitizeTruncate(rosterHomeroom, 100),
          activeStatus: 'Aktif',
          createdByUid: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setBulkNames('');
      setShowBulkRoster(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'roster_students');
    } finally {
      setSavingRoster(false);
    }
  };

  const handleDeleteRosterStudent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'roster_students', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `roster_students/${id}`);
    }
  };

  const handleLoadOfficialTjktDefaults = () => {
    setCfgClassesText(DEFAULT_TJKT_CLASSES.join('\n'));
    setCfgSubjectsText(DEFAULT_TJKT_SUBJECTS.join('\n'));
    setConfigFeedback(
      'Daftar standar 3 kelas (X TJKT 1, X TJKT 2, XI TJKT) dan Mapel Produktif X/XI + Umum telah dimuat. Klik "Simpan Pengaturan Jurusan TJKT" untuk menerapkan.'
    );
  };

  const handleSavePortalConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setConfigFeedback(null);

    const parsedClasses = cfgClassesText
      .split(/\r?\n/)
      .map((c) => sanitizeTruncate(c, VALIDATION_LIMITS.CLASS_NAME_MAX))
      .filter((c) => c.length >= VALIDATION_LIMITS.CLASS_NAME_MIN)
      .slice(0, VALIDATION_LIMITS.MAX_CLASSES);

    const parsedSubjects = cfgSubjectsText
      .split(/\r?\n/)
      .map((s) => sanitizeTruncate(s, VALIDATION_LIMITS.SUBJECT_MAX))
      .filter((s) => s.length >= VALIDATION_LIMITS.SUBJECT_MIN)
      .slice(0, VALIDATION_LIMITS.MAX_SUBJECTS);

    if (parsedClasses.length === 0 || parsedSubjects.length === 0) {
      setConfigFeedback('Minimal harus terdapat 1 kelas TJKT dan 1 mata pelajaran.');
      return;
    }

    setSavingConfig(true);
    const ref = doc(db, 'portal_config', 'jurusan_tjkt');
    try {
      const existingSnap = await getDoc(ref);
      const payload = {
        appName: sanitizeTruncate(cfgAppName, VALIDATION_LIMITS.APP_NAME_MAX),
        schoolName: sanitizeTruncate(cfgSchoolName, VALIDATION_LIMITS.APP_NAME_MAX),
        departmentName: DEPARTMENT_CANONICAL_NAME,
        headOfDepartment: sanitizeTruncate(cfgHeadName, 100),
        contactChannel: sanitizeTruncate(cfgContact, 160),
        startDate: cfgStartDate,
        endDate: cfgEndDate,
        classes: parsedClasses,
        subjects: parsedSubjects,
        updatedByUid: currentUser.uid,
        updatedAt: serverTimestamp(),
      };

      if (existingSnap.exists()) {
        await updateDoc(ref, payload);
      } else {
        await setDoc(ref, {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      setConfigFeedback(
        'Pengaturan Jurusan TJKT berhasil disimpan dan langsung diperbarui di Front-End Siswa.'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'portal_config/jurusan_tjkt');
    } finally {
      setSavingConfig(false);
    }
  };

  const getStatusClass = (status: string) => {
    if (status === 'Lengkap') return 'text-emerald-700 font-semibold';
    if (status === 'Perlu Verifikasi') return 'text-amber-700 font-semibold';
    if (status === 'Perlu Tindak Lanjut') return 'text-red-700 font-semibold';
    if (status === 'Sudah Mengumpulkan') return 'text-[#0284C7] font-semibold';
    return 'text-slate-500 font-medium';
  };

  return (
    <div className="space-y-8">
      {/* Back-End Header Banner + Sub-Module Navigation */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-6 sm:p-8 bg-[#0B1F3F] text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-sky-300 font-medium">
              <span>BAGIAN BACK-END (ADMIN, WALI KELAS & KAPROG TJKT)</span>
              <span aria-hidden="true">·</span>
              <span>{config.schoolName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Pusat Rekapitulasi Absensi & Monitoring Tugas Jurusan TJKT
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pantau kehadiran sesi belajar, periksa bukti foto tugas siswa kelas <strong>{config.classes.join(', ')}</strong>, kelola daftar siswa resmi per kelas, serta unduh laporan Excel & PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => exportTjktRecapXlsx(config, roster, submissions, classFilter)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#0B1F3F] bg-white hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#0284C7]" />
              Ekspor Rekap Excel (.XLSX)
            </button>
            <button
              type="button"
              onClick={() => exportTjktEvaluationPdf(config, roster, submissions, classFilter)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0284C7] hover:bg-sky-600 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              Unduh Laporan PDF
            </button>
          </div>
        </div>

        {/* Back-End Sub-Tabs */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => setSubTab('monitoring')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'monitoring'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monitoring & Verifikasi Foto
            </button>
            <button
              type="button"
              onClick={() => setSubTab('rekap')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'rekap'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rekap Mapel Produktif & Umum
            </button>
            <button
              type="button"
              onClick={() => setSubTab('roster')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                subTab === 'roster'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Data Siswa Per Kelas ({roster.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('pengaturan')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'pengaturan'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Pengaturan Nama & Kelas TJKT
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Filter Cakupan Kelas:</span>
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setSubjectFilter('all');
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900"
            >
              <option value="all">Semua Kelas ({config.classes.join(', ')})</option>
              {config.classes.map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* MODULE 1: MONITORING KEHADIRAN & VERIFIKASI BUKTI TUGAS */}
      {subTab === 'monitoring' && (
        <div className="space-y-6">
          {/* 6 KPI Statistic Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 tabular-nums">
            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <div className="text-xs text-slate-500">Siswa Terdaftar</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{scopedRoster.length}</div>
              <div className="text-xs text-slate-500 mt-1">
                {classFilter === 'all' ? '3 Kelas TJKT' : classFilter}
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <div className="text-xs text-slate-500">Sudah Melapor</div>
              <div className="text-2xl font-bold text-[#0284C7] mt-1">{uniqueActiveSenders}</div>
              <div className="text-xs text-slate-500 mt-1">Siswa aktif unik</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <div className="text-xs text-slate-500">Belum Melapor</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{notSubmittedCount}</div>
              <div className="text-xs text-slate-500 mt-1">Dari roster resmi</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <div className="text-xs text-slate-500">Total Bukti Tugas</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {scopedSubmissions.length}
              </div>
              <div className="text-xs text-slate-500 mt-1">Foto terkumpul</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <div className="text-xs text-slate-500">Perlu Verifikasi</div>
              <div className="text-2xl font-bold text-amber-700 mt-1">{needsVerifCount}</div>
              <div className="text-xs text-slate-500 mt-1">Tunggu cek guru</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <div className="text-xs text-slate-500">Kepatuhan</div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{compliancePct}%</div>
              <div className="text-xs text-slate-500 mt-1">Rasio kehadiran</div>
            </div>
          </div>

          {/* Multi-Class Comparison Table across Jurusan TJKT */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">
                Rekapitulasi Kehadiran & Pengumpulan Tugas Per Kelas ({config.classes.join(', ')})
              </h3>
              <span className="text-xs text-slate-500">
                Klik baris kelas untuk memfilter tabel detail
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="border-b border-slate-200 text-slate-600 bg-white">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Kelas Rombel TJKT</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Siswa Roster</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Sudah Melapor</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Belum Melapor</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Bukti Tugas Masuk</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Diverifikasi Lengkap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {config.classes.map((cls) => {
                    const cRoster = roster.filter((r) => r.className === cls);
                    const cSubs = submissions.filter((s) => s.className === cls);
                    const cMatchedCount = cRoster.filter((st) =>
                      cSubs.some(
                        (s) =>
                          s.matchedRosterId === st.id ||
                          s.studentName.trim().toLowerCase() === st.fullName.trim().toLowerCase()
                      )
                    ).length;
                    const cSenders =
                      cRoster.length > 0
                        ? cMatchedCount
                        : new Set(cSubs.map((s) => s.studentName.trim().toLowerCase())).size;
                    const cLengkap = cSubs.filter((s) => s.verificationStatus === 'Lengkap').length;
                    const isSelected = classFilter === cls;

                    return (
                      <tr
                        key={cls}
                        onClick={() => setClassFilter(isSelected ? 'all' : cls)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-sky-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-4 font-semibold text-[#0B1F3F]">{cls}</td>
                        <td className="py-2.5 px-4 text-right text-slate-700">{cRoster.length}</td>
                        <td className="py-2.5 px-4 text-right font-semibold text-[#0284C7]">
                          {cSenders}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-600">
                          {Math.max(0, cRoster.length - cMatchedCount)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                          {cSubs.length}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-emerald-700">
                          {cLengkap}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Student Monitoring & Photo Verification Grid */}
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
                  Semua Pekan
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
                  className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg max-w-[220px] truncate"
                >
                  <option value="all">Semua Mata Pelajaran</option>
                  {relevantSubjectsForFilter.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  aria-label="Filter tanggal sesi"
                  className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg tabular-nums"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  <option value="all">Semua Status</option>
                  <option value="Belum Mengumpulkan">Belum Mengumpulkan</option>
                  <option value="Sudah Mengumpulkan">Sudah Mengumpulkan</option>
                  <option value="Perlu Verifikasi">Perlu Verifikasi</option>
                  <option value="Lengkap">Lengkap</option>
                  <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut</option>
                </select>
              </div>
            </div>

            {loadingData ? (
              <div className="space-y-2">
                <div className="h-10 bg-slate-100 rounded animate-pulse" />
                <div className="h-10 bg-slate-100 rounded animate-pulse" />
              </div>
            ) : combinedRows.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg bg-slate-50 space-y-2">
                <div className="text-sm font-bold text-slate-900">
                  Belum Ada Data Absensi atau Roster pada Filter Ini
                </div>
                <p className="text-xs text-slate-600 max-w-lg mx-auto">
                  Silakan tambahkan daftar siswa resmi per kelas pada tab <strong>Data Siswa Per Kelas</strong>, atau minta siswa mengirim absensi melalui halaman <strong>Front-End</strong>.
                </p>
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
                        <th className="py-2.5 px-3 font-semibold">Mata Pelajaran & Topik</th>
                        <th className="py-2.5 px-3 font-semibold">Tanggal Sesi & Kirim</th>
                        <th className="py-2.5 px-3 font-semibold">Progres</th>
                        <th className="py-2.5 px-3 font-semibold">Status Laporan</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Bukti & Verifikasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 tabular-nums">
                      {combinedRows.map((row, idx) => (
                        <tr key={row.key} className="hover:bg-slate-50 align-top">
                          <td className="py-3 px-3 text-slate-600">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{row.studentName}</div>
                            <div className="text-[11px] text-slate-500">
                              {row.isRosterMatched ? 'Cocok Roster' : 'Belum terdaftar di Roster'}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#0B1F3F] whitespace-nowrap">
                            {row.className}
                          </td>
                          <td className="py-3 px-3 max-w-[230px]">
                            <div className="font-medium text-slate-900">{row.subject}</div>
                            {row.taskTitle !== '-' && (
                              <div className="text-slate-500 mt-0.5">{row.taskTitle}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                            {row.sessionDateLabel}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                            {row.taskProgress}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={getStatusClass(row.status)}>{row.status}</span>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {row.submission ? (
                              <button
                                type="button"
                                onClick={() => openInspectionModal(row.submission!)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0B1F3F] hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Cek Foto & Verifikasi
                              </button>
                            ) : (
                              <span className="text-slate-400">Belum Unggah</span>
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
        </div>
      )}

      {/* MODULE 2: REKAP MAPEL PRODUKTIF & UMUM + KENDALA SISWA */}
      {subTab === 'rekap' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-[#0B1F3F]">
                Rekapitulasi Pengumpulan Tugas Mapel Produktif & Umum ({classFilter === 'all' ? 'Seluruh Kelas TJKT' : classFilter})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="border-b border-slate-200 text-slate-600 bg-white">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Mata Pelajaran</th>
                    <th className="py-2.5 px-4 font-semibold">Kelompok Mapel</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Pekan 1</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Pekan 2</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Total Bukti</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Tugas Selesai</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Masih Proses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {relevantSubjectsForFilter.map((subj) => {
                    const list = scopedSubmissions.filter((s) => s.subject === subj);
                    const p1 = list.filter((s) => s.weekNumber === 1).length;
                    const p2 = list.filter((s) => s.weekNumber === 2).length;
                    const done = list.filter((s) => s.taskProgress === 'Selesai').length;
                    const cat = getSubjectCategoryLabel(subj);
                    return (
                      <tr key={subj} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-medium text-slate-900">{subj}</td>
                        <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                          {cat !== 'Mapel Umum' ? (
                            <span className="font-semibold text-[#0284C7]">{cat}</span>
                          ) : (
                            <span>{cat}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-600">{p1}</td>
                        <td className="py-2.5 px-4 text-right text-slate-600">{p2}</td>
                        <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                          {list.length}
                        </td>
                        <td className="py-2.5 px-4 text-right text-emerald-700 font-semibold">
                          {done}
                        </td>
                        <td className="py-2.5 px-4 text-right text-amber-700">
                          {list.length - done}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#0B1F3F]">
              Daftar Kendala Pembelajaran yang Dilaporkan Siswa
            </h3>
            {scopedSubmissions.filter((s) => s.learningIssue.trim().length > 0).length === 0 ? (
              <p className="text-xs text-slate-500">
                Belum ada laporan kendala jaringan, perangkat, maupun materi pada filter kelas ini.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {scopedSubmissions
                  .filter((s) => s.learningIssue.trim().length > 0)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{s.studentName}</span>
                        <span className="text-slate-500">
                          {' '}
                          · {s.className} · {s.subject}
                        </span>
                        <p className="text-slate-700 mt-1">{s.learningIssue}</p>
                      </div>
                      <span className="font-mono text-slate-500 shrink-0">{s.sessionDate}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODULE 3: MANAJEMEN ROSTER RESMI SISWA PER KELAS TJKT */}
      {subTab === 'roster' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-[#0B1F3F]">
                Database Roster Resmi Siswa Kelas {config.classes.join(', ')}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Kelola daftar nama resmi siswa untuk masing-masing rombel tanpa data fiktif.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowBulkRoster((v) => !v)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              {showBulkRoster ? 'Tutup Input Massal' : 'Tempel Daftar Siswa Sekaligus'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Pilih Kelas Rombel TJKT Sasaran Input
              </label>
              <select
                value={rosterClass}
                onChange={(e) => setRosterClass(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg"
              >
                {config.classes.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Nama Wali Kelas Rombel Ini (Opsional)
              </label>
              <input
                type="text"
                value={rosterHomeroom}
                onChange={(e) => setRosterHomeroom(e.target.value)}
                placeholder="Ketik nama Wali Kelas pengampu rombel..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {showBulkRoster ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="block text-xs font-semibold text-slate-800">
                Tempel daftar nama resmi siswa untuk kelas {rosterClass} (1 nama per baris):
              </label>
              <textarea
                rows={5}
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
                placeholder="Tempel daftar nama lengkap siswa di sini..."
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={savingRoster}
                  onClick={() => void handleBulkAddRoster()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3F] hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {savingRoster ? 'Menyimpan...' : `Simpan Semua ke Kelas ${rosterClass}`}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => void handleAddSingleRoster(e)} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={singleNis}
                onChange={(e) => setSingleNis(e.target.value)}
                placeholder="NIS / NISN (Opsional)"
                className="sm:w-44 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums"
              />
              <input
                type="text"
                required
                value={singleName}
                onChange={(e) => setSingleName(e.target.value)}
                placeholder={`Ketik nama lengkap resmi siswa kelas ${rosterClass}...`}
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                disabled={savingRoster}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3F] hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Tambah ke {rosterClass}
              </button>
            </form>
          )}

          {scopedRoster.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-300 rounded-lg bg-slate-50 text-xs text-slate-600">
              Belum ada daftar siswa yang diinput untuk cakupan {classFilter === 'all' ? 'Jurusan TJKT' : classFilter}.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold w-12">No</th>
                      <th className="py-2.5 px-3 font-semibold w-32">NIS</th>
                      <th className="py-2.5 px-3 font-semibold">Nama Resmi Siswa</th>
                      <th className="py-2.5 px-3 font-semibold">Kelas</th>
                      <th className="py-2.5 px-3 font-semibold">Wali Kelas</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-16">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {scopedRoster.map((st, idx) => (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{st.nis || '-'}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{st.fullName}</td>
                        <td className="py-2 px-3 font-semibold text-[#0B1F3F]">{st.className}</td>
                        <td className="py-2 px-3 text-slate-600">{st.homeroomTeacher || '-'}</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => void handleDeleteRosterStudent(st.id)}
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
      )}

      {/* MODULE 4: PENGATURAN NAMA APLIKASI JURUSAN, DAFTAR KELAS & JADWAL */}
      {subTab === 'pengaturan' && (
        <form
          onSubmit={(e) => void handleSavePortalConfig(e)}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-[#0B1F3F]">
                Pengaturan Nama Aplikasi Jurusan TJKT, 3 Rombel Kelas & Mapel Produktif/Umum
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Perubahan yang disimpan di sini akan langsung memperbarui tampilan Front-End Portal Absensi Siswa.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoadOfficialTjktDefaults}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Muat Standar 3 Kelas & Mapel Produktif
            </button>
          </div>

          {/* Curated Name Recommendations */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-900">
              Pilih Rekomendasi Nama Aplikasi Jurusan TJKT (Klik untuk Memakai):
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {RECOMMENDED_APP_NAMES.map((rec) => {
                const active = cfgAppName === rec.title;
                return (
                  <button
                    key={rec.title}
                    type="button"
                    onClick={() => setCfgAppName(rec.title)}
                    className={`p-3.5 rounded-xl border text-left transition-colors ${
                      active
                        ? 'border-[#0284C7] bg-sky-50/70'
                        : 'border-slate-200 bg-slate-50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#0B1F3F]">{rec.title}</span>
                      {active && <CheckCircle2 className="w-4 h-4 text-[#0284C7] shrink-0" />}
                    </div>
                    <div className="text-[11px] font-medium text-sky-700 mt-0.5">{rec.subtitle}</div>
                    <p className="text-[11px] text-slate-600 mt-1">{rec.reason}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Nama Aplikasi Aktif (Dapat Diedit Bebas)
              </label>
              <input
                type="text"
                required
                value={cfgAppName}
                onChange={(e) => setCfgAppName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Nama Satuan Pendidikan / Sekolah
              </label>
              <input
                type="text"
                required
                value={cfgSchoolName}
                onChange={(e) => setCfgSchoolName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Tanggal Mulai PJJ (Hari ke-1)
              </label>
              <input
                type="date"
                required
                value={cfgStartDate}
                onChange={(e) => {
                  setCfgStartDate(e.target.value);
                  setCfgEndDate(addDaysIso(e.target.value, 13));
                }}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Tanggal Berakhir PJJ (Hari ke-14)
              </label>
              <input
                type="date"
                required
                value={cfgEndDate}
                onChange={(e) => setCfgEndDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Nama Ketua Program Keahlian TJKT (Opsional)
              </label>
              <input
                type="text"
                value={cfgHeadName}
                onChange={(e) => setCfgHeadName(e.target.value)}
                placeholder="Contoh: Kepala Program Keahlian TJKT"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Kanal Bantuan Siswa (Tampil di Panduan Front-End)
              </label>
              <input
                type="text"
                value={cfgContact}
                onChange={(e) => setCfgContact(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Daftar Kelas Jurusan TJKT (Standar: X TJKT 1, X TJKT 2, XI TJKT)
              </label>
              <textarea
                rows={7}
                value={cfgClassesText}
                onChange={(e) => setCfgClassesText(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Daftar Mata Pelajaran Produktif X/XI & Umum (1 mapel per baris)
              </label>
              <textarea
                rows={7}
                value={cfgSubjectsText}
                onChange={(e) => setCfgSubjectsText(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {configFeedback && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
              {configFeedback}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingConfig}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0B1F3F] hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {savingConfig ? 'Menyimpan ke Server...' : 'Simpan Pengaturan Jurusan TJKT'}
            </button>
          </div>
        </form>
      )}

      {/* PHOTO & VERIFICATION INSPECTION MODAL */}
      {inspectingSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full overflow-hidden my-8">
            <div className="px-6 py-4 bg-[#0B1F3F] text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-sky-300">
                  Pemeriksaan Bukti Tugas · Kelas {inspectingSub.className}
                </div>
                <h3 className="text-base font-bold text-white">{inspectingSub.studentName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingSub(null)}
                aria-label="Tutup modal pemeriksaan"
                className="p-1 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
              <div className="md:col-span-7 bg-slate-100 rounded-lg border border-slate-200 p-3 flex flex-col items-center justify-center">
                <img
                  src={inspectingSub.photoDataUrl}
                  alt={`Bukti pengerjaan tugas oleh ${inspectingSub.studentName}`}
                  referrerPolicy="no-referrer"
                  className="max-h-96 w-full object-contain rounded"
                />
                <div className="text-[11px] text-slate-500 mt-2 font-mono">
                  {inspectingSub.photoFileName} · Sesi {inspectingSub.sessionDate} (Pekan {inspectingSub.weekNumber})
                </div>
              </div>

              <form
                onSubmit={(e) => void handleSaveVerification(e)}
                className="md:col-span-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="text-slate-500">Mata Pelajaran</div>
                    <div className="font-bold text-slate-900">{inspectingSub.subject}</div>
                    <div className="text-[11px] text-[#0284C7] font-medium">
                      {getSubjectCategoryLabel(inspectingSub.subject)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Judul / Topik Tugas</div>
                    <div className="font-semibold text-slate-800">{inspectingSub.taskTitle}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Klaim Progres Siswa</div>
                    <div className="font-semibold text-slate-800">{inspectingSub.taskProgress}</div>
                  </div>
                  {inspectingSub.learningIssue && (
                    <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900">
                      <strong>Kendala Siswa:</strong> {inspectingSub.learningIssue}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200">
                    <label className="block font-bold text-slate-900 mb-1">
                      Keputusan Verifikasi Wali Kelas / Guru
                    </label>
                    <select
                      value={editVerifStatus}
                      onChange={(e) => setEditVerifStatus(e.target.value as VerificationStatus)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900"
                    >
                      <option value="Sudah Mengumpulkan">Sudah Mengumpulkan</option>
                      <option value="Perlu Verifikasi">Perlu Verifikasi (Foto Buram / Nama Salah)</option>
                      <option value="Lengkap">Lengkap (Disetujui & Dikunci)</option>
                      <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut / Pembinaan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">
                      Catatan Pemeriksaan (Tampil di Riwayat Siswa)
                    </label>
                    <textarea
                      rows={3}
                      value={editTeacherNote}
                      onChange={(e) => setEditTeacherNote(e.target.value)}
                      placeholder="Berikan umpan balik atau instruksi perbaikan..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => void handleDeleteSubmission(inspectingSub.id)}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg whitespace-nowrap shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectingSub(null)}
                      className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap shrink-0"
                    >
                      Tutup
                    </button>
                    <button
                      type="submit"
                      disabled={savingVerification}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-sky-700 rounded-lg whitespace-nowrap shrink-0"
                    >
                      {savingVerification ? 'Menyimpan...' : 'Simpan Verifikasi'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
