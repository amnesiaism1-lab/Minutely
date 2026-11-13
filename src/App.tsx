import React, { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { MeetingProvider, useMeetingContext } from './context/MeetingContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
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

const AppContent: React.FC = () => {
  const { activeTab, isLoadingDb } = useMeetingContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[var(--surface-canvas)] font-sans text-slate-900 antialiased">
      <Navbar onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />

        <main className="relative min-w-0 flex-1 overflow-y-auto overscroll-contain">
          {/* Soft canvas wash — depth without purple/glow */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(148,163,184,0.12),_transparent_55%)]"
            aria-hidden
          />
          <div className="relative z-[1] min-h-full">
            {isLoadingDb ? (
              <div className="flex h-full flex-col items-center justify-center space-y-3 py-24 text-slate-500">
                <div
                  className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"
                  role="status"
                  aria-label="Đang tải"
                />
                <p className="text-xs font-medium text-slate-600">
                  Đang đồng bộ dữ liệu hệ thống…
                </p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </main>
      </div>

      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
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
