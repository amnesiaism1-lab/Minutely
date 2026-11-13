import React, { useState } from 'react';
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

const AppContent: React.FC = () => {
  const { activeTab } = useMeetingContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100">
      <Navbar onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto bg-slate-100">
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
    <MeetingProvider>
      <AppContent />
    </MeetingProvider>
  );
};

export default App;
