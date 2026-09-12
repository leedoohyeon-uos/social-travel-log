/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../common/Header';
import {
  Settings,
  Users,
  Globe,
  MapPin,
  BookOpen,
  Camera,
  Lock,
  Heart,
  MessageCircle,
  Bookmark,
  Award,
  Filter,
} from 'lucide-react';
import { TravelRecord } from '../../types';

export const ProfileScreen: React.FC = () => {
  const {
    currentUser,
    userStats,
    userBadges,
    friendships,
    travelRecords,
    bookmarks,
    setIsSettingsOpen,
    setActiveRecordDetail,
    setIsFriendRequestsCenterOpen,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'my_records' | 'commented' | 'liked' | 'bookmarks'>('my_records');
  const [onlyCompanions, setOnlyCompanions] = useState(false);

  // Friend count
  const friendCount = useMemo(() => {
    return friendships.filter((f) => f.uids.includes(currentUser.uid)).length;
  }, [friendships, currentUser.uid]);

  // Tab 1: Written Records
  const myRecords = useMemo(() => {
    return travelRecords
      .filter((r) => r.authorUid === currentUser.uid && !r.hidden)
      .filter((r) => (onlyCompanions ? r.companionUids && r.companionUids.length > 0 : true))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [travelRecords, currentUser.uid, onlyCompanions]);

  // Tab 2: Commented Records
  const commentedRecords = useMemo(() => {
    return travelRecords
      .filter((r) => !r.hidden && r.comments?.some((c) => c.authorUid === currentUser.uid))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [travelRecords, currentUser.uid]);

  // Tab 3: Liked Records
  const likedRecords = useMemo(() => {
    return travelRecords
      .filter((r) => !r.hidden && !!r.likes?.[currentUser.uid])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [travelRecords, currentUser.uid]);

  // Tab 4: Bookmarked Records
  const bookmarkedRecords = useMemo(() => {
    const bookmarkedIds = bookmarks
      .filter((b) => b.ownerUid === currentUser.uid)
      .map((b) => b.recordId);
    return travelRecords.filter((r) => bookmarkedIds.includes(r.id) && !r.hidden);
  }, [travelRecords, bookmarks, currentUser.uid]);

  const currentTabRecords =
    activeTab === 'my_records'
      ? myRecords
      : activeTab === 'commented'
      ? commentedRecords
      : activeTab === 'liked'
      ? likedRecords
      : bookmarkedRecords;

  return (
    <div className="w-full min-h-screen pb-24 bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="max-w-xl mx-auto px-4 py-5 space-y-6">
        {/* Profile Card */}
        <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 font-bold flex items-center justify-center text-xl">
                  {currentUser.name[0]}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {currentUser.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {currentUser.isPublicAccount ? '공개 계정' : '비공개'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{currentUser.email}</p>
                <button
                  onClick={() => setIsFriendRequestsCenterOpen(true)}
                  className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 mt-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>친구 {friendCount}명</span>
                </button>
              </div>
            </div>

            {/* Settings Gear */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="설정"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Bio */}
          {currentUser.bio && (
            <p className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-2xl leading-relaxed">
              {currentUser.bio}
            </p>
          )}

          {/* 4-Stat Cards */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 text-center">
              <Globe className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
              <span className="block font-black text-sm text-zinc-900 dark:text-zinc-100">
                {userStats.visitedCountriesCount}
              </span>
              <span className="text-[10px] text-zinc-400">방문 국가</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 text-center">
              <MapPin className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <span className="block font-black text-sm text-zinc-900 dark:text-zinc-100">
                {userStats.visitedRegionsCount}
              </span>
              <span className="text-[10px] text-zinc-400">국내 탐방</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 text-center">
              <BookOpen className="w-4 h-4 text-sky-500 mx-auto mb-1" />
              <span className="block font-black text-sm text-zinc-900 dark:text-zinc-100">
                {userStats.totalRecordsCount}
              </span>
              <span className="text-[10px] text-zinc-400">여행 스토리</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 text-center">
              <Camera className="w-4 h-4 text-purple-500 mx-auto mb-1" />
              <span className="block font-black text-sm text-zinc-900 dark:text-zinc-100">
                {userStats.totalPhotosCount}
              </span>
              <span className="text-[10px] text-zinc-400">남긴 사진</span>
            </div>
          </div>
        </section>

        {/* Travel Badges Strip */}
        <section className="space-y-2.5">
          <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            여행 뱃지 ({userBadges.filter((b) => b.achieved).length}/{userBadges.length})
          </h3>
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {userBadges.map((badge) => (
              <div
                key={badge.id}
                className={`p-3 rounded-2xl border shrink-0 w-36 transition-all ${
                  badge.achieved
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-zinc-900 dark:text-zinc-100'
                    : 'bg-zinc-100/50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 opacity-60'
                }`}
              >
                <div className="text-2xl mb-1">{badge.icon}</div>
                <p className="font-bold text-xs truncate">{badge.title}</p>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                  {badge.progressText}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 4 Activity Tabs */}
        <section className="space-y-4">
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl">
            <button
              onClick={() => setActiveTab('my_records')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'my_records'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              작성한 글 ({myRecords.length})
            </button>
            <button
              onClick={() => setActiveTab('commented')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'commented'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              댓글단 글
            </button>
            <button
              onClick={() => setActiveTab('liked')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'liked'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              좋아요한 글
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'bookmarks'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              북마크
            </button>
          </div>

          {/* Subfilter: 함께한 여행만 보기 (Tab 1 Only) */}
          {activeTab === 'my_records' && (
            <div className="flex items-center justify-end">
              <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyCompanions}
                  onChange={(e) => setOnlyCompanions(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600 border-zinc-300 focus:ring-indigo-500"
                />
                <span>함께한 여행만 보기 (동행자)</span>
              </label>
            </div>
          )}

          {/* Record Items */}
          {currentTabRecords.length === 0 ? (
            <div className="py-14 text-center text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
              표시할 여행 기록이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {currentTabRecords.map((record) => (
                <div
                  key={record.id}
                  onClick={() => setActiveRecordDetail(record)}
                  className="p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-center gap-3.5 cursor-pointer hover:shadow-md transition-all group"
                >
                  {record.photoURLs && record.photoURLs.length > 0 ? (
                    <img
                      src={record.photoURLs[0]}
                      alt={record.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs shrink-0">
                      사진 없음
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600">
                        {record.title}
                      </h4>
                      {record.visibility === 'private' && (
                        <span className="text-zinc-400 shrink-0" title="비공개">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                      {record.description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-2">
                      <span>{record.visitDate}</span>
                      <span className="flex items-center gap-0.5">
                        <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                        {record.likeCount}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MessageCircle className="w-3 h-3 text-blue-500" />
                        {record.commentCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
