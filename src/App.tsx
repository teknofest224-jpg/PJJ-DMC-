import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { LogIn, LogOut } from 'lucide-react';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  signInWithGooglePopup,
  signOutUser,
} from './firebase';
import {
  ensureMandatorySubjects,
  INITIAL_PORTAL_CONFIG,
  PortalConfigDoc,
} from './types/tjktTypes';
import { FrontEndStudentPortal } from './components/FrontEndStudentPortal';
import { BackEndAdminConsole } from './components/BackEndAdminConsole';
import { ErrorBoundary } from './components/ErrorBoundary';

type ActivePortalView = 'frontend-form' | 'frontend-riwayat' | 'frontend-panduan' | 'backend';

export default function App() {
  const [activeView, setActiveView] = useState<ActivePortalView>('frontend-form');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [portalConfig, setPortalConfig] = useState<PortalConfigDoc>(INITIAL_PORTAL_CONFIG);

  // Track Firebase Auth readiness
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Subscribe to singleton public non-PII Jurusan TJKT configuration
  useEffect(() => {
    const ref = doc(db, 'portal_config', 'jurusan_tjkt');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as PortalConfigDoc;
          setPortalConfig({
            ...INITIAL_PORTAL_CONFIG,
            ...data,
            subjects: ensureMandatorySubjects(
              Array.isArray(data.subjects) && data.subjects.length > 0
                ? data.subjects
                : INITIAL_PORTAL_CONFIG.subjects
            ),
          });
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'portal_config/jurusan_tjkt');
      }
    );
    return () => unsub();
  }, []);

  const navLinks: { key: ActivePortalView; label: string }[] = [
    { key: 'frontend-form', label: 'Portal Absensi (Front-End)' },
    { key: 'frontend-riwayat', label: 'Riwayat Saya' },
    { key: 'frontend-panduan', label: 'Panduan PJJ' },
    { key: 'backend', label: 'Rekap & Monitoring (Back-End)' },
  ];

  const isBackEndActive = activeView === 'backend';
  const frontEndInitialTab =
    activeView === 'frontend-riwayat'
      ? 'riwayat'
      : activeView === 'frontend-panduan'
      ? 'panduan'
      : 'form';

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        {/* Strict 3-Zone Top Bar Contract */}
        <header className="sticky top-0 z-30 bg-[#0B1F3F] text-white border-b border-slate-800 no-print">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-5 sm:px-8 py-3.5">
            {/* Zone 1: Single text element wordmark */}
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('frontend-form');
              }}
              className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
            >
              SIMPJJ TJKT
            </a>

            {/* Zone 2: 4 concise single-line navigation links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-200">
              {navLinks.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveView(item.key)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    activeView === item.key
                      ? 'text-white border-sky-400 font-semibold'
                      : 'border-transparent hover:text-white hover:border-slate-500'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Zone 3: 1 primary action */}
            <div className="flex items-center shrink-0">
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => void signOutUser()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Keluar Akun
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void signInWithGooglePopup()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-sky-600 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Masuk Google
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Mode Switcher (Non-sticky to respect 15% mobile sticky cap) */}
        <div className="md:hidden bg-[#0F2942] border-b border-slate-800 px-4 py-2.5 flex overflow-x-auto gap-1.5 no-print">
          {navLinks.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveView(item.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeView === item.key
                  ? 'bg-[#0284C7] text-white'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Main Two-Part Application Viewport */}
        <main id="top" className="flex-1 max-w-7xl w-full mx-auto px-5 sm:px-8 py-8">
          {isBackEndActive ? (
            <BackEndAdminConsole
              config={portalConfig}
              currentUser={currentUser}
              authReady={authReady}
              onReturnToFrontEnd={() => setActiveView('frontend-form')}
            />
          ) : (
            <FrontEndStudentPortal
              config={portalConfig}
              currentUser={currentUser}
              authReady={authReady}
              initialTab={frontEndInitialTab}
            />
          )}
        </main>

        {/* Quiet Institutional Footer */}
        <footer className="bg-white border-t border-slate-200 mt-12">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              {portalConfig.appName} · {portalConfig.schoolName}
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setActiveView('frontend-form')}
                className="text-slate-700 hover:text-[#0284C7] font-medium transition-colors whitespace-nowrap shrink-0"
              >
                Front-End (Absensi Siswa)
              </button>
              <button
                type="button"
                onClick={() => setActiveView('backend')}
                className="text-slate-700 hover:text-[#0284C7] font-medium transition-colors whitespace-nowrap shrink-0"
              >
                Back-End (Rekap & Monitoring TJKT)
              </button>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
