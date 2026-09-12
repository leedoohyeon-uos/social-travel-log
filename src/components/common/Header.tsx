/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, ShieldAlert, Sun, Moon, MapPin, HelpCircle, Users } from 'lucide-react';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

interface HeaderProps {
  mapMode?: 'friend' | 'me';
  setMapMode?: (mode: 'friend' | 'me') => void;
  isModeTransitioning?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ mapMode, setMapMode, isModeTransitioning }) => {
  const {
    activeTab,
    unreadNotificationCount,
    currentUser,
    setIsAdminReportModalOpen,
    setIsHelpModalOpen,
    openFriendRequestsCenter,
    friendRequests,
    toggleTheme,
    isDarkMode,
  } = useApp();

  const pendingFriendRequestsCount = friendRequests.filter(
    (r) => (r.toUid === currentUser.uid || (currentUser.uid !== 'user-me' && r.toUid === 'user-me')) && r.status === 'pending'
  ).length;

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const getTitle = () => {
    switch (activeTab) {
      case 'search':
        return '탐색';
      case 'bubble':
        return 'Bubble Pop';
      case 'friend':
        return '친구 피드';
      case 'profile':
        return '내 프로필';
      default:
        return '';
    }
  };

  return (
    <header className="h-14 bg-white/90 dark:bg-[#0c0c0c]/90 backdrop-blur border-b border-zinc-200 dark:border-white/10 px-4 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Brand / Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C4A484] to-[#9A7B56] flex items-center justify-center text-white shadow-sm shadow-[#C4A484]/20">
          <MapPin className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
        </div>
        <span className="font-bold text-base tracking-tight bg-gradient-to-r from-[#E5C590] via-[#C4A484] to-[#A68353] bg-clip-text text-transparent hidden sm:inline font-serif">
          Social Travel Map
        </span>
      </div>

      {/* Center: Contextual Title or Map Segment Toggle */}
      <div className="flex-1 flex justify-center max-w-xs mx-2">
        {activeTab === 'map' && setMapMode ? (
          <div className="bg-zinc-100 dark:bg-[#18181b] p-0.5 rounded-full flex items-center shadow-inner border border-zinc-200/60 dark:border-white/10">
            <button
              disabled={isModeTransitioning}
              onClick={() => setMapMode('friend')}
              className={`px-4 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                mapMode === 'friend'
                  ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#E5C590] shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              } ${isModeTransitioning ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              친구 지도
            </button>
            <button
              disabled={isModeTransitioning}
              onClick={() => setMapMode('me')}
              className={`px-4 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                mapMode === 'me'
                  ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#E5C590] shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              } ${isModeTransitioning ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              나의 지도
            </button>
          </div>
        ) : (
          <h1 className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{getTitle()}</h1>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 relative">
        {/* Admin Moderation Button */}
        {currentUser.role === 'admin' && (
          <button
            onClick={() => setIsAdminReportModalOpen(true)}
            title="관리자 신고 검토"
            className="p-2 rounded-xl text-amber-500 dark:text-[#E5C590] hover:bg-amber-50 dark:hover:bg-white/5 transition-colors"
          >
            <ShieldAlert className="w-5 h-5" />
          </button>
        )}

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
          title={isDarkMode ? '밝은 모드로 전환' : '어두운 모드로 전환'}
          aria-label={isDarkMode ? '밝은 모드로 전환' : '어두운 모드로 전환'}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-700" />
          )}
        </button>

        {/* Comprehensive Help & Guide */}
        <button
          onClick={() => setIsHelpModalOpen(true)}
          className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
          title="도움말 및 이용 가이드"
          aria-label="도움말 및 서비스 이용 가이드 열기"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Friends & Requests Center */}
        <button
          onClick={() => openFriendRequestsCenter('received')}
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors relative"
          title="친구 및 관계 정리"
          aria-label="친구 및 관계 정리 센터"
        >
          <Users className="w-5 h-5" />
          {pendingFriendRequestsCount > 0 && (
            <span className="absolute top-1 right-1 px-1.5 min-w-[18px] h-[18px] rounded-full bg-indigo-600 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white dark:ring-[#0c0c0c] shadow-sm animate-pulse">
              {pendingFriendRequestsCount > 9 ? '9+' : pendingFriendRequestsCount}
            </span>
          )}
        </button>

        {/* Notifications */}
        <button
          onClick={() => setIsNotifOpen((prev) => !prev)}
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors relative"
          title="알림"
          aria-label={`알림 목록 ${unreadNotificationCount > 0 ? `(읽지 않은 알림 ${unreadNotificationCount}개)` : ''}`}
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationCount > 0 && (
            <span className="absolute top-1 right-1 px-1.5 min-w-[18px] h-[18px] rounded-full bg-[#C4A484] text-[10px] font-bold text-zinc-950 flex items-center justify-center ring-2 ring-white dark:ring-[#0c0c0c] shadow-sm animate-pulse">
              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      </div>
    </header>
  );
};
