/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  UserPlus,
  Check,
  Ban,
  Flag,
  Globe,
  MapPin,
  Heart,
  MessageCircle,
  Clock,
} from 'lucide-react';

export const UserProfileModal: React.FC = () => {
  const {
    selectedUserProfileUid,
    setSelectedUserProfileUid,
    currentUser,
    publicProfiles,
    friendships,
    friendRequests,
    blocks,
    isFriend,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    blockUser,
    unblockUser,
    travelRecords,
    setActiveRecordDetail,
    createReport,
    showToast,
  } = useApp();

  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState<'inappropriate' | 'spam' | 'other'>('inappropriate');
  const [reportDetail, setReportDetail] = useState('');
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);

  const user = selectedUserProfileUid ? publicProfiles[selectedUserProfileUid] : null;

  // Their public records
  const userRecords = useMemo(() => {
    if (!selectedUserProfileUid) return [];
    return travelRecords
      .filter(
        (r) =>
          r.authorUid === selectedUserProfileUid &&
          !r.hidden &&
          (r.visibility === 'public' || (r.visibility === 'friends' && isFriend(selectedUserProfileUid)))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [travelRecords, selectedUserProfileUid, isFriend]);

  if (!selectedUserProfileUid || !user) return null;

  const isAlreadyFriend = isFriend(user.uid);
  const isBlocked = !!blocks[user.uid];
  const pendingSent = friendRequests.find(
    (r) => (r.fromUid === currentUser.uid || r.fromUid === 'user-me') && r.toUid === user.uid && r.status === 'pending'
  );
  const pendingReceived = friendRequests.find(
    (r) => r.fromUid === user.uid && (r.toUid === currentUser.uid || r.toUid === 'user-me') && r.status === 'pending'
  );

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReport('profile', user.uid, reportReason, reportDetail.trim() || '프로필 신고');
    setIsReporting(false);
    setReportDetail('');
  };

  const handleConfirmBlock = () => {
    blockUser(user.uid);
    setIsBlockConfirmOpen(false);
    setSelectedUserProfileUid(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="font-bold text-xs text-zinc-500">프로필 정보</span>
            <button
              onClick={() => setSelectedUserProfileUid(null)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* User Profile Card */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-xl">
                    {user.name[0]}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {user.name}
                  </h3>
                  <span className="text-xs text-zinc-400 block mt-0.5">
                    {user.isPublicAccount ? '공개 계정' : '비공개 계정'}
                  </span>
                </div>
              </div>

              {/* Relationship Actions */}
              <div>
                {isBlocked ? (
                  <button
                    onClick={() => unblockUser(user.uid)}
                    className="px-3.5 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold"
                  >
                    차단 해제
                  </button>
                ) : isAlreadyFriend ? (
                  <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center gap-1 border border-emerald-200">
                    <Check className="w-3.5 h-3.5" /> 친구
                  </span>
                ) : pendingReceived ? (
                  <button
                    onClick={() => acceptFriendRequest(pendingReceived.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                  >
                    요청 수락
                  </button>
                ) : pendingSent ? (
                  <button
                    onClick={() => cancelFriendRequest(pendingSent.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-zinc-200 text-zinc-600 text-xs font-semibold"
                  >
                    요청 취소
                  </button>
                ) : (
                  <button
                    onClick={() => sendFriendRequest(user.uid)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> 친구 추가
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-2xl leading-relaxed">
                {user.bio}
              </p>
            )}

            {/* User Stories */}
            <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                여행 스토리 ({userRecords.length})
              </h4>

              {userRecords.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-6">
                  공개된 여행 기록이 없습니다.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {userRecords.map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => {
                        setSelectedUserProfileUid(null);
                        setActiveRecordDetail(rec);
                      }}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 cursor-pointer shadow-sm"
                    >
                      {rec.photoURLs && rec.photoURLs.length > 0 ? (
                        <img
                          src={rec.photoURLs[0]}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
                          {rec.title}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white">
                        <span className="font-bold text-xs truncate">{rec.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Report Form Drawer */}
            {isReporting && (
              <form onSubmit={handleReportSubmit} className="p-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  <span className="flex items-center gap-1.5 text-rose-500">
                    <Flag className="w-3.5 h-3.5" /> 사용자 신고하기
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsReporting(false)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  {(['inappropriate', 'spam', 'other'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReportReason(r)}
                      className={`py-1.5 px-2 rounded-xl border text-center font-medium transition-colors ${
                        reportReason === r
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {r === 'inappropriate' ? '부적절한 내용' : r === 'spam' ? '스팸/홍보' : '기타 사유'}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={reportDetail}
                  onChange={(e) => setReportDetail(e.target.value)}
                  placeholder="신고 상세 사유를 입력하세요"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  신고 접수
                </button>
              </form>
            )}

            {/* Block Confirmation Drawer */}
            {isBlockConfirmOpen && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-2">
                <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  {user.name}님을 차단하시겠습니까?
                </p>
                <p className="text-[11px] text-rose-600/80 dark:text-rose-300/80">
                  차단 시 서로의 여행 스토리, 지도 핀, 버블 팝을 볼 수 없으며 기존 친구 관계가 해제됩니다.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsBlockConfirmOpen(false)}
                    className="flex-1 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBlock}
                    className="flex-1 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                  >
                    차단 실행
                  </button>
                </div>
              </div>
            )}

            {/* Block / Report Actions */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <button
                onClick={() => setIsReporting((prev) => !prev)}
                className="flex items-center gap-1 hover:text-rose-500"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>사용자 신고</span>
              </button>

              {!isBlocked ? (
                <button
                  onClick={() => setIsBlockConfirmOpen(true)}
                  className="flex items-center gap-1 text-rose-500 hover:underline"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>사용자 차단</span>
                </button>
              ) : (
                <button
                  onClick={() => unblockUser(user.uid)}
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  차단 해제
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
