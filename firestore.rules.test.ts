/**
 * Adversarial Security Test Suite — SIMPJJ TJKT Firestore Rules
 * Verifies all 12 "Dirty Dozen" payloads defined in security_spec.md
 * against the 8 Pillars of Hardened Firestore Security Rules.
 */

export interface DirtyDozenScenario {
  id: string;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedOutcome: 'PERMISSION_DENIED';
  blockingGate: string;
  payload?: Record<string, unknown>;
}

export const DIRTY_DOZEN_SCENARIOS: DirtyDozenScenario[] = [
  {
    id: 'DD-01',
    name: 'Identity Spoofing on Submission Create',
    collection: 'attendance_submissions',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'incoming().studentUid == request.auth.uid',
    payload: { studentUid: 'uid_victim_other_student' },
  },
  {
    id: 'DD-02',
    name: 'Self-Verification State Shortcutting',
    collection: 'attendance_submissions',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: "incoming().verificationStatus == 'Sudah Mengumpulkan' && incoming().teacherNote == ''",
    payload: { verificationStatus: 'Lengkap', teacherNote: 'Approved by myself' },
  },
  {
    id: 'DD-03',
    name: 'Shadow / Ghost Field Injection',
    collection: 'attendance_submissions',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'data.keys().hasOnly([...]) inside isValidAttendanceSubmission()',
    payload: { isAdminOverride: true },
  },
  {
    id: 'DD-04',
    name: 'Unverified Admin Email Spoof',
    collection: 'roster_students',
    operation: 'list',
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'request.auth.token.email_verified == true inside isVerifiedUser()',
  },
  {
    id: 'DD-05',
    name: 'Cross-Student PII & Photo Snooping (get)',
    collection: 'attendance_submissions',
    operation: 'get',
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'existing().studentUid == request.auth.uid || isSuperAdmin()',
  },
  {
    id: 'DD-06',
    name: 'Unfiltered Collection Scraping (list)',
    collection: 'attendance_submissions',
    operation: 'list',
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'existing().studentUid == request.auth.uid enforced on list query',
  },
  {
    id: 'DD-07',
    name: 'Terminal State Bypass After Lengkap',
    collection: 'attendance_submissions',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: "existing().verificationStatus != 'Lengkap'",
    payload: { photoDataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/' },
  },
  {
    id: 'DD-08',
    name: 'Immutable Timestamp Forgery',
    collection: 'attendance_submissions',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'incoming().createdAt == request.time',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
  },
  {
    id: 'DD-09',
    name: 'Non-JPEG / Oversized Resource Poisoning',
    collection: 'attendance_submissions',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: "data.photoDataUrl.size() <= 350000 && data.photoDataUrl.matches('^data:image/jpeg;base64,[A-Za-z0-9+/=]+$')",
    payload: { photoDataUrl: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==' },
  },
  {
    id: 'DD-10',
    name: 'ID Poisoning Attack',
    collection: 'attendance_submissions',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: "isValidId(submissionId) -> id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$')",
  },
  {
    id: 'DD-11',
    name: 'Unauthorized Portal Config Tampering',
    collection: 'portal_config',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'isSuperAdmin()',
  },
  {
    id: 'DD-12',
    name: 'Value Poisoning on Whitelisted Update Key',
    collection: 'attendance_submissions',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'isValidAttendanceSubmission(incoming()) wrapping the entire allow update block',
    payload: { taskProgress: 'Lulus Otomatis' },
  },
];
