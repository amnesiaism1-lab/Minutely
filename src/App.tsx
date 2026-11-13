import React, { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { MeetingProvider, useMeetingContext } from './context/MeetingContext';
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
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100">
      <Navbar onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto bg-slate-100">
          {isLoadingDb ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 py-24 text-slate-500">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Đang tải dữ liệu thực từ Supabase PostgreSQL...</p>
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
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <MeetingProvider>
        <AppContent />
      </MeetingProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
