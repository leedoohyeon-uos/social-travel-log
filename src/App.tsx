/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { MapScreen } from './components/map/MapScreen';
import { FriendScreen } from './components/friend/FriendScreen';
import { SearchScreen } from './components/search/SearchScreen';
import { BubblePopScreen } from './components/bubble/BubblePopScreen';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { BottomNav } from './components/common/BottomNav';
import { ToastContainer } from './components/common/ToastContainer';
import { TravelRecordDetailModal } from './components/record/TravelRecordDetailModal';
import { TravelRecordComposerModal } from './components/record/TravelRecordComposerModal';
import { FriendRequestsCenterModal } from './components/social/FriendRequestsCenterModal';
import { UserProfileModal } from './components/social/UserProfileModal';
import { PasswordResetModal } from './components/social/PasswordResetModal';
import { DeleteAccountModal } from './components/social/DeleteAccountModal';
import { AdminReportModal } from './components/social/AdminReportModal';
import { OnboardingTooltip } from './components/common/OnboardingTooltip';
import { HelpModal } from './components/common/HelpModal';
import { MeetupModal } from './components/meetup/MeetupModal';

const AppContent: React.FC = () => {
  const {
    authStatus,
    isDemoMode,
    exitDemoMode,
    activeTab,
    isSettingsOpen,
    activeRecordDetail,
    setActiveRecordDetail,
    currentUser,
    isAdminReportModalOpen,
    setIsAdminReportModalOpen,
    isHelpModalOpen,
    setIsHelpModalOpen,
  } = useApp();

  if (authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#080808]">
        <AuthScreen />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-zinc-50 dark:bg-[#080808] text-zinc-900 dark:text-[#E5E5E5] flex flex-col font-sans transition-colors duration-200 ${activeTab === 'map' ? 'h-[100dvh] overflow-hidden' : ''}`}>
      {/* Demo Mode Notice Banner */}
      {isDemoMode && (
        <aside aria-label="체험 모드 안내" className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 z-40 sticky top-0 backdrop-blur shrink-0">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>체험 모드로 둘러보는 중입니다 (샘플 데이터)</span>
          </div>
          <button
            onClick={exitDemoMode}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-colors"
          >
            로그인 / 회원가입
          </button>
        </aside>
      )}

      {/* Main View Router */}
      <div className={`flex-1 w-full relative ${activeTab === 'map' ? 'min-h-0 overflow-hidden' : ''}`}>
        {isSettingsOpen ? (
          <SettingsScreen />
        ) : (
          <>
            {activeTab === 'map' && (
              <>
                <MapScreen />
                <OnboardingTooltip />
              </>
            )}
            {activeTab === 'friend' && <FriendScreen />}
            {activeTab === 'search' && <SearchScreen />}
            {activeTab === 'bubble' && <BubblePopScreen />}
            {activeTab === 'profile' && <ProfileScreen />}
          </>
        )}
      </div>

      {/* Fixed Bottom Navigation (Hidden in settings) */}
      {!isSettingsOpen && <BottomNav />}

      {/* Global Toast Notifications */}
      <ToastContainer />

      {/* Global Travel Record Detail & Comments Modal */}
      <TravelRecordDetailModal
        record={activeRecordDetail}
        onClose={() => setActiveRecordDetail(null)}
      />

      {/* Travel Record Composer / Editor Modal */}
      <TravelRecordComposerModal />

      {/* Social & Relationship Modals */}
      <FriendRequestsCenterModal />
      <UserProfileModal />
      <PasswordResetModal />
      <DeleteAccountModal />

      {/* Comprehensive Help & Guide Modal (PART 12 / 4-B) */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* Travel Meetup (약속잡기) Modal */}
      <MeetupModal />

      {/* Admin Monitoring Center (Only if admin role) */}
      {currentUser.role === 'admin' && (
        <AdminReportModal
          isOpen={isAdminReportModalOpen}
          onClose={() => setIsAdminReportModalOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
