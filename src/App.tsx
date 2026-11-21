import React, { useState, useEffect, useRef } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { MeetingProvider, useMeetingContext } from './context/MeetingContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { CommandPalette } from './components/common/CommandPalette';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/home/Dashboard';
import { MeetingList } from './components/meetings/MeetingList';
import { LiveMeetingMode } from './components/live/LiveMeetingMode';
import { ActionBoard } from './components/actions/ActionBoard';
import { MinutesPreview } from './components/preview/MinutesPreview';
import { TemplateManager } from './components/templates/TemplateManager';
import { CreateMeetingModal } from './components/meetings/CreateMeetingModal';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '28140765256-q2dgdm400o7g2nivd4pb317ef3l840g9.apps.googleusercontent.com';

const WorkspaceSkeleton: React.FC = () => (
  <div className="mx-auto max-w-7xl space-y-6 p-6 sm:p-8" aria-label="Đang tải không gian làm việc">
    <div className="flex flex-col justify-between gap-4 border-b border-slate-200/70 pb-5 sm:flex-row sm:items-end">
      <div className="space-y-2">
        <div className="animate-shimmer h-3 w-36 rounded-md" />
        <div className="animate-shimmer h-7 w-64 rounded-lg" />
        <div className="animate-shimmer h-3.5 w-96 max-w-full rounded-md" />
      </div>
      <div className="flex gap-2">
        <div className="animate-shimmer h-9 w-36 rounded-lg" />
        <div className="animate-shimmer h-9 w-36 rounded-lg" />
      </div>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((idx) => (
        <div
          key={idx}
          className="space-y-3 rounded-xl border border-slate-200/70 bg-white/80 p-5"
        >
          <div className="animate-shimmer h-3.5 w-28 rounded" />
          <div className="animate-shimmer h-7 w-20 rounded" />
          <div className="animate-shimmer h-3 w-36 rounded" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-2.5 lg:col-span-2">
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className="h-24 rounded-xl border border-slate-200/70 bg-white/80 p-4"
          >
            <div className="animate-shimmer h-4 w-1/3 rounded" />
            <div className="animate-shimmer mt-3 h-4 w-2/3 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-2.5">
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className="h-24 rounded-xl border border-slate-200/70 bg-white/80 p-4"
          >
            <div className="animate-shimmer h-3.5 w-3/4 rounded" />
            <div className="animate-shimmer mt-3 h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { activeTab, isLoadingDb } = useMeetingContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('minutely_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [comfortMode, setComfortMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('minutely_comfort_mode') === 'true';
    } catch {
      return false;
    }
  });

  const mainScrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.documentElement.dataset.comfort = comfortMode ? 'warm' : 'cool';
    try {
      localStorage.setItem('minutely_comfort_mode', String(comfortMode));
    } catch {}
  }, [comfortMode]);

  useEffect(() => {
    try {
      localStorage.setItem('minutely_sidebar_collapsed', String(isSidebarCollapsed));
    } catch {}
  }, [isSidebarCollapsed]);

  // Global Ctrl+K / Cmd+K shortcut for Command Palette
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Scroll smoothly to top when switching views
  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[var(--surface-canvas)] font-sans text-slate-900 antialiased">
      <Navbar
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        onOpenCommandPalette={() => setIsCommandOpen(true)}
        comfortMode={comfortMode}
        onToggleComfortMode={() => setComfortMode((prev) => !prev)}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        <main
          ref={mainScrollRef}
          className="relative min-w-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {/* Subtle top ambient light */}
          <div
            className="no-print pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,_rgba(148,163,184,0.12),_transparent_70%)]"
            aria-hidden
          />
          <div className="relative z-[1] min-h-full">
            {isLoadingDb ? (
              <WorkspaceSkeleton />
            ) : (
              <div key={activeTab} className="animate-page-enter min-h-full">
                {activeTab === 'dashboard' && (
                  <Dashboard onOpenCreateModal={() => setIsCreateModalOpen(true)} />
                )}
                {activeTab === 'meetings' && (
                  <MeetingList onOpenCreateModal={() => setIsCreateModalOpen(true)} />
                )}
                {activeTab === 'live' && <LiveMeetingMode />}
                {activeTab === 'actions' && <ActionBoard />}
                {activeTab === 'preview' && <MinutesPreview />}
                {activeTab === 'templates' && <TemplateManager />}
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        comfortMode={comfortMode}
        onToggleComfortMode={() => setComfortMode((prev) => !prev)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ToastProvider>
          <MeetingProvider>
            <AppContent />
          </MeetingProvider>
        </ToastProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
};

export default App;
