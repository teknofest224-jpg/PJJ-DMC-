# Security Specification — SIMPJJ TJKT (Front-End & Back-End)

## 1. Data Invariants

1. **Default-Deny Catch-All**: Any path not explicitly matched in `/portal_config/{configId}`, `/roster_students/{rosterId}`, or `/attendance_submissions/{submissionId}` is unconditionally denied (`allow read, write: if false;`).
2. **Verified Authentication Gate**: All writes and authenticated reads require `request.auth != null && request.auth.token.email_verified == true`. Unverified email tokens cannot act as either students or bootstrapped admin (`teknofest224@gmail.com`).
3. **PII & Photo Isolation**:
   - `/roster_students/{rosterId}` contains student NIS and official names and is strictly accessible ONLY to the verified bootstrapped admin (`isSuperAdmin()`).
   - `/attendance_submissions/{submissionId}` contains student work photos and learning obstacles; `get` and `list` are strictly restricted to the owning student (`resource.data.studentUid == request.auth.uid`) or `isSuperAdmin()`. No student can read or list another student's submissions.
4. **Anti-Spoofing & State Integrity on Creation**:
   - Students creating an `AttendanceSubmission` MUST set `studentUid == request.auth.uid`, `verificationStatus == 'Sudah Mengumpulkan'`, `teacherNote == ''`, `matchedRosterId == ''`, and `createdAt == request.time && updatedAt == request.time`.
5. **Terminal State Locking & Action-Based Updates**:
   - Once an `AttendanceSubmission` reaches terminal state `verificationStatus == 'Lengkap'`, the owning student can no longer modify it (`existing().verificationStatus != 'Lengkap'`). Only `isSuperAdmin()` can override terminal state for administrative corrections.
   - Updates are strictly partitioned into Student Revision (`affectedKeys().hasOnly(...)`) and Admin Verification (`affectedKeys().hasOnly(['verificationStatus', 'teacherNote', 'matchedRosterId', 'updatedAt'])`), wrapped in `isValidAttendanceSubmission(incoming())`.
6. **Zero `get()`/`exists()` in `allow list`**: No `list` rule performs extra document reads, preventing O(n) cost attacks while enforcing `resource.data` filters.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 01 — Identity Spoofing on Submission Create**: Authenticated student `uid_attacker` submits `studentUid: "uid_victim"` to forge attendance for another student -> `PERMISSION_DENIED`.
2. **Payload 02 — Self-Verification State Shortcutting**: Authenticated student creates submission with `verificationStatus: "Lengkap"` and `teacherNote: "Disetujui"` -> `PERMISSION_DENIED`.
3. **Payload 03 — Shadow / Ghost Field Injection**: Authenticated student sends all valid fields plus an undeclared field `"isAdminOverride": true` -> `PERMISSION_DENIED` via `hasOnly()`.
4. **Payload 04 — Unverified Admin Email Spoof**: Attacker signs in with `email: "teknofest224@gmail.com"` where `email_verified: false` and attempts to read `/roster_students` -> `PERMISSION_DENIED`.
5. **Payload 05 — Cross-Student PII & Photo Snooping (`get`)**: Verified student `uid_a` attempts `get` on `/attendance_submissions/sub_owned_by_uid_b` -> `PERMISSION_DENIED`.
6. **Payload 06 — Unfiltered Collection Scraping (`list`)**: Verified student `uid_a` runs an unfiltered `collection(db, 'attendance_submissions')` query without `where('studentUid', '==', 'uid_a')` -> `PERMISSION_DENIED`.
7. **Payload 07 — Terminal State Bypass**: Verified student attempts to replace `photoDataUrl` on a submission already marked `verificationStatus == 'Lengkap'` by the teacher -> `PERMISSION_DENIED`.
8. **Payload 08 — Immutable Timestamp Forgery**: Verified student sends client-forged past `createdAt` (`2020-01-01T00:00:00Z`) instead of `serverTimestamp()` (`request.time`) -> `PERMISSION_DENIED`.
9. **Payload 09 — Non-JPEG / Oversized Resource Poisoning**: Verified student sends `photoDataUrl: "data:text/html;base64,PHNjcmlwdD4="` or string exceeding `350000` chars -> `PERMISSION_DENIED`.
10. **Payload 10 — ID Poisoning Attack**: User attempts to create `/attendance_submissions/bad$id!with spaces` or >128 chars -> `PERMISSION_DENIED` via `isValidId()`.
11. **Payload 11 — Unauthorized Portal Config Tampering**: Verified non-admin student attempts to update `/portal_config/jurusan_tjkt` to alter class names or dates -> `PERMISSION_DENIED`.
12. **Payload 12 — Value Poisoning on Whitelisted Update Key**: Admin or student updates `taskProgress` (an allowed update key) with integer `999` or invalid enum `"Lulus Otomatis"` -> `PERMISSION_DENIED` because `isValidAttendanceSubmission(incoming())` wraps the entire `update` block.
