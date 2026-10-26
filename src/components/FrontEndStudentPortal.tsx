import React, { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileImage,
  LogIn,
  RefreshCw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import {
  db,
  handleFirestoreError,
  OperationType,
  signInWithGooglePopup,
} from '../firebase';
import {
  addDaysIso,
  AttendanceSubmissionDoc,
  computePjjWeekNumber,
  DEPARTMENT_CANONICAL_NAME,
  formatIndoDate,
  formatTimestampWib,
  getGroupedSubjectsForClass,
  getSubjectCategoryLabel,
  PortalConfigDoc,
  sanitizeTruncate,
  TaskProgressStatus,
  VALIDATION_LIMITS,
} from '../types/tjktTypes';
import { compressImageToJpegDataUrl } from '../utils/imageCompressor';

import heroWorkspaceImg from '../assets/images/hero_pjj_smk_tjkt_1793006876709.jpg';
import examplePhotoImg from '../assets/images/contoh_bukti_foto_pjj_1793006877106.jpg';

type FrontEndTab = 'form' | 'riwayat' | 'panduan';

interface FrontEndStudentPortalProps {
  config: PortalConfigDoc;
  currentUser: User | null;
  authReady: boolean;
  initialTab?: FrontEndTab;
}

export const FrontEndStudentPortal: React.FC<FrontEndStudentPortalProps> = ({
  config,
  currentUser,
  authReady,
  initialTab = 'form',
}) => {
  const [subTab, setSubTab] = useState<FrontEndTab>(initialTab);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [guideImgFailed, setGuideImgFailed] = useState(false);

  useEffect(() => {
    setSubTab(initialTab);
  }, [initialTab]);

  // Form states
  const [studentName, setStudentName] = useState('');
  const [selectedClass, setSelectedClass] = useState(config.classes[0] || 'X TJKT 1');

  const groupedSubjects = useMemo(
    () => getGroupedSubjectsForClass(selectedClass, config.subjects),
    [selectedClass, config.subjects]
  );

  const [selectedSubject, setSelectedSubject] = useState(
    groupedSubjects.flatAllowed[0] || config.subjects[0] || ''
  );
  const [sessionDate, setSessionDate] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return today;
  });
  const [taskTitle, setTaskTitle] = useState('');
  const [taskProgress, setTaskProgress] = useState<TaskProgressStatus>('Selesai');
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [photoApproxKb, setPhotoApproxKb] = useState<number>(0);
  const [learningIssue, setLearningIssue] = useState('');
  const [additionalNote, setAdditionalNote] = useState('');

  const [compressingPhoto, setCompressingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Student personal submission history
  const [mySubmissions, setMySubmissions] = useState<AttendanceSubmissionDoc[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Revision modal state for student's own unlocked submission
  const [revisingDoc, setRevisingDoc] = useState<AttendanceSubmissionDoc | null>(null);
  const [revProgress, setRevProgress] = useState<TaskProgressStatus>('Selesai');
  const [revPhotoDataUrl, setRevPhotoDataUrl] = useState('');
  const [revPhotoFileName, setRevPhotoFileName] = useState('');
  const [revIssue, setRevIssue] = useState('');
  const [revNote, setRevNote] = useState('');
  const [revSaving, setRevSaving] = useState(false);
  const [revError, setRevError] = useState<string | null>(null);

  useEffect(() => {
    if (config.classes.length > 0 && !config.classes.includes(selectedClass)) {
      setSelectedClass(config.classes[0]);
    }
  }, [config.classes, selectedClass]);

  // Whenever class changes (e.g. X TJKT 1 -> XI TJKT), ensure selectedSubject belongs to that grade's allowed subjects
  useEffect(() => {
    if (
      groupedSubjects.flatAllowed.length > 0 &&
      !groupedSubjects.flatAllowed.includes(selectedSubject)
    ) {
      setSelectedSubject(groupedSubjects.flatAllowed[0]);
    }
  }, [groupedSubjects, selectedSubject]);

  // Subscribe strictly to the signed-in student's own submissions
  useEffect(() => {
    if (!authReady || !currentUser) {
      setMySubmissions([]);
      return;
    }

    setLoadingHistory(true);
    const path = 'attendance_submissions';
    const q = query(
      collection(db, path),
      where('studentUid', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const docs: AttendanceSubmissionDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AttendanceSubmissionDoc, 'id'>),
        }));
        docs.sort((a, b) => {
          const tA = a.createdAt?.toMillis() ?? 0;
          const tB = b.createdAt?.toMillis() ?? 0;
          return tB - tA;
        });
        setMySubmissions(docs);
        setLoadingHistory(false);
      },
      (err) => {
        setLoadingHistory(false);
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [authReady, currentUser]);

  const handlePhotoUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    setCompressingPhoto(true);
    try {
      const result = await compressImageToJpegDataUrl(file);
      setPhotoDataUrl(result.dataUrl);
      setPhotoFileName(result.fileName);
      setPhotoApproxKb(result.approxKb);
    } catch (err) {
      setPhotoDataUrl('');
      setPhotoFileName('');
      setPhotoApproxKb(0);
      setFormError(err instanceof Error ? err.message : 'Gagal memproses foto tugas.');
    } finally {
      setCompressingPhoto(false);
    }
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!currentUser) {
      setFormError('Silakan masuk menggunakan Akun Google terlebih dahulu sebelum mengirim absensi.');
      return;
    }

    const cleanName = sanitizeTruncate(studentName, VALIDATION_LIMITS.STUDENT_NAME_MAX);
    const cleanClass = sanitizeTruncate(selectedClass, VALIDATION_LIMITS.CLASS_NAME_MAX);
    const cleanSubject = sanitizeTruncate(selectedSubject, VALIDATION_LIMITS.SUBJECT_MAX);
    const cleanTaskTitle = sanitizeTruncate(taskTitle, VALIDATION_LIMITS.TASK_TITLE_MAX);
    const cleanIssue = sanitizeTruncate(learningIssue, VALIDATION_LIMITS.NOTE_MAX);
    const cleanNote = sanitizeTruncate(additionalNote, VALIDATION_LIMITS.NOTE_MAX);

    if (cleanName.length < VALIDATION_LIMITS.STUDENT_NAME_MIN) {
      setFormError('Nama Lengkap Siswa wajib diketik manual minimal 2 karakter sesuai daftar absen resmi.');
      return;
    }
    if (!VALIDATION_LIMITS.DATE_PATTERN.test(sessionDate)) {
      setFormError('Tanggal sesi PJJ wajib dipilih.');
      return;
    }
    if (cleanTaskTitle.length < VALIDATION_LIMITS.TASK_TITLE_MIN) {
      setFormError('Judul atau Topik Tugas wajib diisi.');
      return;
    }
    if (!photoDataUrl || !VALIDATION_LIMITS.JPEG_DATA_URL_PATTERN.test(photoDataUrl)) {
      setFormError('Foto Bukti Proses Pengerjaan Tugas (JPG/JPEG) wajib diunggah sebelum mengirim.');
      return;
    }

    const weekNumber = computePjjWeekNumber(config.startDate, sessionDate);
    setSubmitting(true);

    try {
      await addDoc(collection(db, 'attendance_submissions'), {
        studentUid: currentUser.uid,
        studentName: cleanName,
        className: cleanClass,
        majorName: DEPARTMENT_CANONICAL_NAME,
        subject: cleanSubject,
        sessionDate,
        weekNumber,
        taskTitle: cleanTaskTitle,
        taskProgress,
        photoDataUrl,
        photoFileName: sanitizeTruncate(photoFileName || 'bukti_pjj.jpg', VALIDATION_LIMITS.FILE_NAME_MAX),
        learningIssue: cleanIssue,
        additionalNote: cleanNote,
        verificationStatus: 'Sudah Mengumpulkan',
        teacherNote: '',
        matchedRosterId: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setFormSuccess(
        `Absensi dan bukti tugas untuk kelas ${cleanClass} (${cleanSubject}) berhasil dikirim dan tercatat di sistem Back-End Jurusan TJKT.`
      );
      setTaskTitle('');
      setPhotoDataUrl('');
      setPhotoFileName('');
      setPhotoApproxKb(0);
      setLearningIssue('');
      setAdditionalNote('');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'attendance_submissions');
      } catch {
        setFormError('Gagal menyimpan kiriman absensi. Pastikan akun Google Anda aktif dan foto valid.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openRevisionModal = (sub: AttendanceSubmissionDoc) => {
    setRevisingDoc(sub);
    setRevProgress(sub.taskProgress);
    setRevPhotoDataUrl(sub.photoDataUrl);
    setRevPhotoFileName(sub.photoFileName);
    setRevIssue(sub.learningIssue);
    setRevNote(sub.additionalNote);
    setRevError(null);
  };

  const handleRevisionPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRevError(null);
    try {
      const result = await compressImageToJpegDataUrl(file);
      setRevPhotoDataUrl(result.dataUrl);
      setRevPhotoFileName(result.fileName);
    } catch (err) {
      setRevError(err instanceof Error ? err.message : 'Gagal memproses foto revisi.');
    }
  };

  const handleSaveRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisingDoc || !currentUser) return;
    setRevSaving(true);
    setRevError(null);
    const docPath = `attendance_submissions/${revisingDoc.id}`;
    try {
      await updateDoc(doc(db, 'attendance_submissions', revisingDoc.id), {
        taskProgress: revProgress,
        photoDataUrl: revPhotoDataUrl,
        photoFileName: sanitizeTruncate(revPhotoFileName, VALIDATION_LIMITS.FILE_NAME_MAX),
        learningIssue: sanitizeTruncate(revIssue, VALIDATION_LIMITS.NOTE_MAX),
        additionalNote: sanitizeTruncate(revNote, VALIDATION_LIMITS.NOTE_MAX),
        verificationStatus: 'Sudah Mengumpulkan',
        updatedAt: serverTimestamp(),
      });
      setRevisingDoc(null);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, docPath);
      } catch {
        setRevError('Gagal menyimpan revisi. Laporan yang sudah berstatus Lengkap tidak dapat diubah lagi.');
      }
    } finally {
      setRevSaving(false);
    }
  };

  const pekan1End = addDaysIso(config.startDate, 6);
  const pekan2Start = addDaysIso(config.startDate, 7);
  const pekan2End = config.endDate || addDaysIso(config.startDate, 13);

  const getStatusTextStyle = (status: string) => {
    if (status === 'Lengkap') return 'text-emerald-700 font-semibold';
    if (status === 'Perlu Verifikasi') return 'text-amber-700 font-semibold';
    if (status === 'Perlu Tindak Lanjut') return 'text-red-700 font-semibold';
    return 'text-[#0284C7] font-semibold';
  };

  return (
    <div className="space-y-8">
      {/* Front-End Hero Split */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 bg-[#0F2942] text-white flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-sky-300 font-medium">
                <span>BAGIAN FRONT-END (PORTAL SISWA)</span>
                <span aria-hidden="true">·</span>
                <span>{config.schoolName}</span>
              </div>

              <h1
                className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight max-w-2xl"
                style={{ textWrap: 'balance' }}
              >
                {config.appName}
              </h1>

              <p className="text-sm text-slate-200 leading-relaxed max-w-xl">
                Portal terpadu pengisian daftar hadir sesi belajar dan unggah bukti foto pengerjaan tugas untuk siswa kelas <strong>{config.classes.join(', ')}</strong> konsentrasi keahlian {config.departmentName}.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-200 tabular-nums">
              <span>Periode Aktif: {formatIndoDate(config.startDate)} – {formatIndoDate(pekan2End)}</span>
              <span aria-hidden="true">·</span>
              <span>Kelas: {config.classes.join(' / ')}</span>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[220px] bg-slate-900">
            {!heroImgFailed ? (
              <img
                src={heroWorkspaceImg}
                alt="Ruang belajar siswa jurusan Teknik Jaringan Komputer dan Telekomunikasi"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-300">
                <ClipboardCheck className="w-10 h-10 text-sky-400 mb-2" />
                <span className="text-xs text-center">{config.departmentName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Front-End Functional Workspace Sub-Toolbar */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => setSubTab('form')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'form'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Isi Absensi & Unggah Tugas
            </button>

            <button
              type="button"
              onClick={() => setSubTab('riwayat')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                subTab === 'riwayat'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Riwayat Kiriman Saya ({mySubmissions.length})
            </button>

            <button
              type="button"
              onClick={() => setSubTab('panduan')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'panduan'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Panduan Foto & Daftar Mapel
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-[#0284C7] shrink-0" />
            <span>Data foto & identitas siswa terlindungi dari publik</span>
          </div>
        </div>
      </section>

      {/* SUB-TAB 1: FORMULIR ABSENSI & BUKTI TUGAS SISWA JURUSAN TJKT */}
      {subTab === 'form' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#0B1F3F]">
                Formulir Absensi & Bukti Progres Tugas Siswa Jurusan TJKT
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Pilih kelas rombel ({config.classes.join(', ')}) terlebih dahulu agar daftar Mata Pelajaran Produktif menyesuaikan tingkat kelas Anda secara otomatis.
              </p>
            </div>

            {!currentUser && authReady && (
              <button
                type="button"
                onClick={() => void signInWithGooglePopup()}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0284C7] hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
              >
                <LogIn className="w-4 h-4" />
                Masuk Akun Google Siswa
              </button>
            )}
          </div>

          {!currentUser ? (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="text-sm font-bold text-slate-900">
                Masuk dengan Akun Google untuk Mengunggah Bukti Tugas
              </div>
              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                Tidak diperlukan pendaftaran username atau password khusus. Gunakan akun Google sekolah maupun pribadi Anda agar riwayat pengumpulan tugas tercatat aman dan tidak tertukar dengan siswa lain.
              </p>
              <button
                type="button"
                onClick={() => void signInWithGooglePopup()}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0B1F3F] hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <LogIn className="w-4 h-4" />
                Masuk dengan Akun Google Sekarang
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmitAttendance(e)} className="space-y-6">
              {/* Section A: Identitas Siswa */}
              <div className="space-y-4">
                <div className="text-sm font-bold text-slate-900">
                  A. Identitas Siswa Jurusan TJKT (Wajib Diisi Manual)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      1. Nama Lengkap Siswa <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={VALIDATION_LIMITS.STUDENT_NAME_MAX}
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Ketik nama lengkap sesuai buku absen resmi kelas"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      2. Kelas Rombel TJKT <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                    >
                      {config.classes.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      3. Konsentrasi Keahlian / Jurusan
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={DEPARTMENT_CANONICAL_NAME}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-100 text-slate-700 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      4. Mata Pelajaran (Menyesuaikan Kelas {selectedClass}){' '}
                      <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                    >
                      {groupedSubjects.productive.length > 0 && (
                        <optgroup label={groupedSubjects.productiveLabel}>
                          {groupedSubjects.productive.map((subj) => (
                            <option key={subj} value={subj}>
                              {subj}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {groupedSubjects.general.length > 0 && (
                        <optgroup label="Mata Pelajaran Umum">
                          {groupedSubjects.general.map((subj) => (
                            <option key={subj} value={subj}>
                              {subj}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Kelompok Mapel: <strong>{getSubjectCategoryLabel(selectedSubject)}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Section B: Bukti Foto Pengerjaan */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="text-sm font-bold text-slate-900">
                  B. Bukti Foto Proses Pengerjaan Tugas (Wajib)
                </div>

                <div className="p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-600">
                      {compressingPhoto ? (
                        <span className="font-semibold text-sky-700">
                          Mengoptimalkan foto ke format standar JPEG...
                        </span>
                      ) : photoFileName ? (
                        <span className="font-semibold text-slate-900 tabular-nums">
                          Foto siap dikirim: {photoFileName} (~{photoApproxKb} KB · Format JPEG)
                        </span>
                      ) : (
                        'Unggah 1 foto jelas yang memperlihatkan catatan atau layar kerja tugas Anda.'
                      )}
                    </div>

                    <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0B1F3F] bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto">
                      <FileImage className="w-4 h-4 text-[#0284C7]" />
                      Pilih Foto Tugas (JPG/JPEG)
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => void handlePhotoUploadChange(e)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {photoDataUrl && (
                    <div className="pt-2">
                      <img
                        src={photoDataUrl}
                        alt="Pratinjau foto bukti pengerjaan tugas"
                        referrerPolicy="no-referrer"
                        className="max-h-56 rounded-lg border border-slate-200 object-contain bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Section C: Informasi Pendukung */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <div className="text-sm font-bold text-slate-900">
                  C. Informasi Sesi & Progres Tugas
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      6. Tanggal Sesi Pembelajaran <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      7. Judul / Topik Tugas <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={VALIDATION_LIMITS.TASK_TITLE_MAX}
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Contoh: Perhitungan Subnetting / Konfigurasi Firewall Jaringan"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    8. Status Pengerjaan Saat Ini <span className="text-red-600">*</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {(['Belum selesai', 'Sedang dikerjakan', 'Selesai'] as TaskProgressStatus[]).map(
                      (st) => (
                        <label
                          key={st}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
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
                      9. Kendala Pembelajaran (Jika Ada)
                    </label>
                    <textarea
                      rows={2}
                      maxLength={VALIDATION_LIMITS.NOTE_MAX}
                      value={learningIssue}
                      onChange={(e) => setLearningIssue(e.target.value)}
                      placeholder="Tuliskan jika ada kendala jaringan, perangkat praktik, atau pemahaman materi..."
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      10. Keterangan Tambahan (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      maxLength={VALIDATION_LIMITS.NOTE_MAX}
                      value={additionalNote}
                      onChange={(e) => setAdditionalNote(e.target.value)}
                      placeholder="Catatan izin darurat atau keterangan susulan..."
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                </div>
              </div>

              {formError && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                  {formSuccess}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <span className="text-xs text-slate-500">
                  Masuk sebagai: <strong>{currentUser.email}</strong>
                </span>

                <button
                  type="submit"
                  disabled={submitting || compressingPhoto}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-[#0B1F3F] hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  {submitting ? 'Mengirim ke Back-End...' : 'Kirim Absensi & Bukti Tugas'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* SUB-TAB 2: RIWAYAT KIRIMAN SAYA (PRIBADI SISWA) */}
      {subTab === 'riwayat' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-[#0B1F3F]">
              Riwayat Absensi & Status Pemeriksaan Tugas Saya
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Hanya menampilkan laporan yang dikirim dari akun Google Anda. Siswa lain tidak dapat melihat daftar ini.
            </p>
          </div>

          {!currentUser ? (
            <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <p className="text-xs text-slate-700">
                Silakan masuk dengan Akun Google Anda untuk melihat riwayat pengiriman absensi dan catatan pemeriksaan Wali Kelas.
              </p>
              <button
                type="button"
                onClick={() => void signInWithGooglePopup()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3F] rounded-lg whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                Masuk Akun Google
              </button>
            </div>
          ) : loadingHistory ? (
            <div className="space-y-2">
              <div className="h-11 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-11 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          ) : mySubmissions.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg bg-slate-50 space-y-3">
              <div className="text-sm font-bold text-slate-900">Belum Ada Riwayat Pengiriman</div>
              <p className="text-xs text-slate-600">
                Anda belum mengirimkan absensi atau foto tugas pada periode ini.
              </p>
              <button
                type="button"
                onClick={() => setSubTab('form')}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] rounded-lg whitespace-nowrap shrink-0"
              >
                Isi Absensi Pertama
              </button>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Waktu Kirim</th>
                      <th className="py-2.5 px-3 font-semibold">Kelas</th>
                      <th className="py-2.5 px-3 font-semibold">Mata Pelajaran & Tugas</th>
                      <th className="py-2.5 px-3 font-semibold">Tanggal Sesi</th>
                      <th className="py-2.5 px-3 font-semibold">Progres</th>
                      <th className="py-2.5 px-3 font-semibold">Status Pemeriksaan</th>
                      <th className="py-2.5 px-3 font-semibold">Catatan Wali Kelas</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {mySubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50 align-top">
                        <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {formatTimestampWib(sub.createdAt)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                          {sub.className}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{sub.subject}</div>
                          <div className="text-slate-600 mt-0.5">{sub.taskTitle}</div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                          {sub.sessionDate} · Pekan {sub.weekNumber}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                          {sub.taskProgress}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={getStatusTextStyle(sub.verificationStatus)}>
                            {sub.verificationStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-[200px]">
                          {sub.teacherNote || 'Menunggu pemeriksaan Wali Kelas'}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {sub.verificationStatus !== 'Lengkap' ? (
                            <button
                              type="button"
                              onClick={() => openRevisionModal(sub)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#0B1F3F] bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Revisi
                            </button>
                          ) : (
                            <span className="text-slate-400">Terkunci</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Revision Modal */}
          {revisingDoc && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
              <form
                onSubmit={(e) => void handleSaveRevision(e)}
                className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4"
              >
                <div className="pb-3 border-b border-slate-200">
                  <h3 className="text-base font-bold text-[#0B1F3F]">
                    Revisi Bukti Tugas — {revisingDoc.subject}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Perbarui progres atau unggah foto pengganti sebelum dikunci berstatus Lengkap oleh Wali Kelas.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Status Pengerjaan Terbaru
                  </label>
                  <select
                    value={revProgress}
                    onChange={(e) => setRevProgress(e.target.value as TaskProgressStatus)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="Belum selesai">Belum selesai</option>
                    <option value="Sedang dikerjakan">Sedang dikerjakan</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Ganti Foto Bukti Pengerjaan (Opsional)
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => void handleRevisionPhotoChange(e)}
                    className="text-xs text-slate-700"
                  />
                  {revPhotoDataUrl && (
                    <img
                      src={revPhotoDataUrl}
                      alt="Pratinjau foto revisi"
                      referrerPolicy="no-referrer"
                      className="mt-2 max-h-40 rounded border border-slate-200 object-contain"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Keterangan Revisi
                  </label>
                  <input
                    type="text"
                    value={revNote}
                    onChange={(e) => setRevNote(e.target.value)}
                    placeholder="Contoh: Mengunggah ulang foto catatan yang lebih terang"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                {revError && (
                  <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700">
                    {revError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRevisingDoc(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap shrink-0"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={revSaving}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] rounded-lg hover:bg-sky-700 whitespace-nowrap shrink-0"
                  >
                    {revSaving ? 'Menyimpan...' : 'Simpan Revisi'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: PANDUAN FOTO, DAFTAR KELAS & MATA PELAJARAN PRODUKTIF */}
      {subTab === 'panduan' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#0B1F3F]">
                  Panduan Pengisian Absensi & Pembagian Mapel Produktif Jurusan TJKT
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Berlaku untuk ketiga rombongan belajar Jurusan TJKT ({config.classes.join(', ')}) di {config.schoolName}.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 tabular-nums">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B1F3F]">
                    <Calendar className="w-4 h-4 text-[#0284C7]" />
                    Pekan 1 (Hari ke-1 s.d. ke-7)
                  </div>
                  <div className="text-xs text-slate-700 font-semibold">
                    {formatIndoDate(config.startDate)} – {formatIndoDate(pekan1End)}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B1F3F]">
                    <Calendar className="w-4 h-4 text-[#0284C7]" />
                    Pekan 2 (Hari ke-8 s.d. ke-14)
                  </div>
                  <div className="text-xs text-slate-700 font-semibold">
                    {formatIndoDate(pekan2Start)} – {formatIndoDate(pekan2End)}
                  </div>
                </div>
              </div>

              {/* Official Productive vs General Subject Breakdown */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs">
                <div className="font-bold text-[#0B1F3F]">
                  Daftar Mata Pelajaran Produktif Jurusan vs Umum:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-semibold text-slate-900">
                      Kelas X TJKT 1 & X TJKT 2 (Produktif):
                    </div>
                    <p className="text-slate-700">• Dasar Kompetensi / Dasar Teknik TJKT</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-semibold text-slate-900">
                      Kelas XI TJKT (Produktif):
                    </div>
                    <p className="text-slate-700">• Administrasi Sistem Keamanan Jaringan</p>
                    <p className="text-slate-700">• Administrasi Sistem Infrastruktur Jaringan</p>
                    <p className="text-slate-700">• Teknologi Jaringan Kabel dan Nirkabel</p>
                  </div>
                </div>
                <p className="text-slate-600">
                  <strong>Mata Pelajaran Umum & Khas Sekolah (Kelas X & XI TJKT):</strong> Mencakup <strong>Tahsin Al-Qur&apos;an</strong>, PAI & Budi Pekerti, Pendidikan Pancasila, Bahasa Indonesia, Matematika, Bahasa Inggris, dan mata pelajaran umum lainnya.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs text-slate-700 leading-relaxed">
                <div className="font-bold text-slate-900">Ketentuan Wajib Siswa:</div>
                <ol className="list-decimal pl-4 space-y-1.5">
                  <li>Pilih <strong>Kelas Rombel TJKT</strong> (X TJKT 1, X TJKT 2, atau XI TJKT) dengan benar.</li>
                  <li>Ketik <strong>Nama Lengkap</strong> sesuai daftar absen resmi kelas (tanpa singkatan atau nama panggilan).</li>
                  <li>Foto bukti pengerjaan harus memperlihatkan proses belajar nyata yang terang dan terbaca jelas.</li>
                  <li>Kanal bantuan kendala teknis/izin sakit: <strong>{config.contactChannel}</strong>.</li>
                </ol>
              </div>
            </div>

            <div className="lg:col-span-5 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <div className="aspect-4/3 bg-slate-200">
                {!guideImgFailed ? (
                  <img
                    src={examplePhotoImg}
                    alt="Contoh foto bukti proses pengerjaan tugas jaringan komputer yang jelas"
                    referrerPolicy="no-referrer"
                    onError={() => setGuideImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-6 text-xs text-slate-500">
                    Contoh Foto Bukti Pengerjaan Tugas Valid
                  </div>
                )}
              </div>
              <div className="p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Contoh Dokumentasi Proses Pengerjaan yang Disetujui
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Objek catatan atau layar kerja terlihat fokus, diambil sendiri oleh siswa bersangkutan, dan tidak mencantumkan data sensitif di luar tugas sekolah.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
