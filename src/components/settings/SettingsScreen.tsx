/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronLeft,
  Map,
  Heart,
  Sparkles,
  Shield,
  Key,
  Trash2,
  Check,
  Globe,
  Lock,
  LogOut,
  RotateCcw,
} from 'lucide-react';
import { MapType } from '../../types';

export const SettingsScreen: React.FC = () => {
  const {
    currentUser,
    updateUserProfile,
    setIsSettingsOpen,
    setIsPasswordResetModalOpen,
    setIsDeleteAccountModalOpen,
    logout,
    isDemoMode,
    exitDemoMode,
    resetTrialAccount,
  } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [myMapDefault, setMyMapDefault] = useState<MapType>(currentUser.mapSettings.myMapDefault);
  const [friendMapDefault, setFriendMapDefault] = useState<MapType>(currentUser.mapSettings.friendMapDefault);
  const [activityWindowDays, setActivityWindowDays] = useState<1 | 7 | 30>(currentUser.mapSettings.activityWindowDays);
  const [likeCountVisible, setLikeCountVisible] = useState(currentUser.likeCountVisible);
  const [bubblePopReactionCountVisible, setBubblePopReactionCountVisible] = useState(currentUser.bubblePopReactionCountVisible);
  const [isPublicAccount, setIsPublicAccount] = useState(currentUser.isPublicAccount);

  const handleSave = () => {
    updateUserProfile({
      name: name.trim(),
      bio: bio.trim(),
      mapSettings: {
        myMapDefault,
        friendMapDefault,
        activityWindowDays,
      },
      likeCountVisible,
      bubblePopReactionCountVisible,
      isPublicAccount,
    });
    setIsSettingsOpen(false);
  };

  return (
    <div className="w-full min-h-screen pb-24 bg-zinc-50 dark:bg-zinc-950">
      {/* Top Header */}
      <header className="h-14 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center justify-between sticky top-0 z-30">
        <button
          onClick={() => setIsSettingsOpen(false)}
          className="p-2 -ml-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 text-xs font-bold"
        >
          <ChevronLeft className="w-5 h-5" />
          뒤로
        </button>
        <h1 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">환경설정</h1>
        <button
          onClick={handleSave}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
        >
          저장
        </button>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Section 1: Map Settings */}
        <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Map className="w-4 h-4 text-indigo-500" />
            지도 기본 설정
          </h2>

          <div className="space-y-3.5 divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {/* My Map Default */}
            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 block">
                  나의 지도 기본 보기
                </span>
                <span className="text-[11px] text-zinc-400">앱 시작 시 나의 지도 기본 영역</span>
              </div>
              <select
                value={myMapDefault}
                onChange={(e) => setMyMapDefault(e.target.value as MapType)}
                className="text-xs bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-3 py-1.5 text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="world">해외 (World)</option>
                <option value="domestic">국내 (Korea 17)</option>
              </select>
            </div>

            {/* Friend Map Default */}
            <div className="pt-3.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 block">
                  친구 지도 기본 보기
                </span>
                <span className="text-[11px] text-zinc-400">친구 지도 탭의 기본 영역</span>
              </div>
              <select
                value={friendMapDefault}
                onChange={(e) => setFriendMapDefault(e.target.value as MapType)}
                className="text-xs bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-3 py-1.5 text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="world">해외 (World)</option>
                <option value="domestic">국내 (Korea 17)</option>
              </select>
            </div>

            {/* Activity Window */}
            <div className="pt-3.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 block">
                  친구 활동 표시 기간
                </span>
                <span className="text-[11px] text-zinc-400">지도에 표시할 최근 방문 활동 범위</span>
              </div>
              <select
                value={activityWindowDays}
                onChange={(e) => setActivityWindowDays(Number(e.target.value) as 1 | 7 | 30)}
                className="text-xs bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-3 py-1.5 text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-indigo-500"
              >
                <option value={1}>최근 24시간</option>
                <option value={7}>최근 7일</option>
                <option value={30}>최근 30일</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 2: Post & Social Settings */}
        <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            게시물 및 소셜 설정
          </h2>

          <div className="space-y-3.5 divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {/* Like Count Visibility */}
            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 block">
                  좋아요 수 공개
                </span>
                <span className="text-[11px] text-zinc-400">
                  끄면 다른 사용자에게 '여러 개'로만 표시됩니다.
                </span>
              </div>
              <input
                type="checkbox"
                checked={likeCountVisible}
                onChange={(e) => setLikeCountVisible(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-zinc-300 focus:ring-indigo-500"
              />
            </div>

            {/* Bubble Pop Reaction Visibility */}
            <div className="pt-3.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 block">
                  Bubble Pop 반응 수 공개
                </span>
                <span className="text-[11px] text-zinc-400">
                  끄면 내 버블의 이모지 반응 개수가 숨겨집니다.
                </span>
              </div>
              <input
                type="checkbox"
                checked={bubblePopReactionCountVisible}
                onChange={(e) => setBubblePopReactionCountVisible(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-zinc-300 focus:ring-indigo-500"
              />
            </div>
          </div>
        </section>

        {/* Section 3: Profile & Privacy Settings */}
        <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            프로필 및 개인정보 보호
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                사용자 이름 (닉네임)
              </label>
              <input
                type="text"
                value={name}
                maxLength={50}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  한 줄 소개 (Bio)
                </label>
                <span className="text-[10px] text-zinc-400">{bio.length}/60자</span>
              </div>
              <textarea
                value={bio}
                maxLength={60}
                rows={2}
                onChange={(e) => setBio(e.target.value)}
                placeholder="나만의 여행 스타일이나 소개글을 입력하세요."
                className="w-full text-xs p-3 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 block">
                  공개 계정 설정
                </span>
                <span className="text-[11px] text-zinc-400">
                  끄면 탐색 탭의 공개 피드에 노출되지 않습니다.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isPublicAccount}
                onChange={(e) => setIsPublicAccount(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-zinc-300 focus:ring-indigo-500"
              />
            </div>
          </div>
        </section>

        {/* Section 4: Account Security & Danger Zone */}
        <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-sm space-y-3">
          <h2 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Key className="w-4 h-4 text-zinc-500" />
            계정 관리
          </h2>

          <div className="space-y-2">
            {isDemoMode ? (
              <>
                <button
                  onClick={() => {
                    resetTrialAccount();
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold text-xs text-left flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    체험 데이터 초기화
                  </span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400">초기 상태로 리셋</span>
                </button>

                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    exitDemoMode();
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs text-left flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    체험 모드 종료 (로그인 화면으로 이동)
                  </span>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400">종료 →</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  logout();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs text-left flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-zinc-500" />
                  로그아웃
                </span>
                <span className="text-[11px] text-zinc-400">세션 종료</span>
              </button>
            )}

            <button
              onClick={() => setIsPasswordResetModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs text-left flex items-center justify-between transition-colors"
            >
              <span>비밀번호 재설정</span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400">재설정 링크 전송 →</span>
            </button>

            <button
              onClick={() => setIsDeleteAccountModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-semibold text-xs text-left flex items-center justify-between transition-colors"
            >
              <span>회원 탈퇴</span>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
