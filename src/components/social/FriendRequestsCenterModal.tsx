/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { FriendRequest } from '../../types';
import {
  X,
  UserCheck,
  UserX,
  Users,
  ShieldAlert,
  Clock,
  Unlock,
  Sparkles,
  UserPlus,
} from 'lucide-react';

export const FriendRequestsCenterModal: React.FC = () => {
  const {
    isFriendRequestsCenterOpen,
    setIsFriendRequestsCenterOpen,
    friendRequestsCenterTab,
    setFriendRequestsCenterTab,
    currentUser,
    publicProfiles,
    friendRequests,
    friendships,
    blocks,
    notifications,
    isFriend,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    simulateReceiveFriendRequest,
    simulateAcceptSentRequest,
    unblockUser,
    sendFriendRequest,
    removeFriend,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'friends' | 'blocked'>(
    friendRequestsCenterTab || 'received'
  );
  const [deletingFriendUid, setDeletingFriendUid] = useState<string | null>(null);

  useEffect(() => {
    if (isFriendRequestsCenterOpen && friendRequestsCenterTab) {
      setActiveTab(friendRequestsCenterTab);
    }
  }, [isFriendRequestsCenterOpen, friendRequestsCenterTab]);

  const handleTabChange = (tab: 'received' | 'sent' | 'friends' | 'blocked') => {
    setActiveTab(tab);
    setFriendRequestsCenterTab(tab);
  };

  // Received Requests (pending)
  const receivedRequests = useMemo(() => {
    const list: FriendRequest[] = [];
    const seenSenderUids = new Set<string>();

    // 1. Explicit pending requests from friendRequests list
    for (const r of friendRequests) {
      const isForMe = r.toUid === currentUser.uid || (currentUser.uid !== 'user-me' && r.toUid === 'user-me');
      if (isForMe && r.status === 'pending') {
        list.push({ ...r, toUid: currentUser.uid });
        seenSenderUids.add(r.fromUid);
      }
    }

    // 2. Synthesize from notifications of type 'friend_request' if not already added
    // and sender is not currently a friend and not blocked
    for (const notif of notifications) {
      if (notif.type === 'friend_request' && notif.fromUid && notif.fromUid !== currentUser.uid) {
        if (!seenSenderUids.has(notif.fromUid) && !isFriend(notif.fromUid) && !blocks[notif.fromUid]) {
          const existing = friendRequests.find(
            (r) => r.fromUid === notif.fromUid && (r.toUid === currentUser.uid || r.toUid === 'user-me')
          );
          if (!existing || existing.status === 'pending') {
            const sender = publicProfiles[notif.fromUid];
            list.push({
              id: existing ? existing.id : `${notif.fromUid}_${currentUser.uid}`,
              fromUid: notif.fromUid,
              fromName: sender?.name || notif.fromName || '여행자',
              fromPhotoURL: sender?.photoURL || notif.fromPhotoURL,
              toUid: currentUser.uid,
              toName: currentUser.name,
              toPhotoURL: currentUser.photoURL,
              status: 'pending',
              createdAt: notif.createdAt,
            });
            seenSenderUids.add(notif.fromUid);
          }
        }
      }
    }

    return list;
  }, [friendRequests, notifications, currentUser, publicProfiles, isFriend, blocks]);

  // Sent Requests (pending & rejected with cooldown) - exclude accepted requests and friends
  const sentRequests = useMemo(() => {
    return friendRequests.filter(
      (r) =>
        (r.fromUid === currentUser.uid || r.fromUid === 'user-me') &&
        r.status !== 'accepted' &&
        !isFriend(r.toUid)
    );
  }, [friendRequests, currentUser.uid, isFriend]);

  // Current Friends
  const currentFriends = useMemo(() => {
    return friendships
      .filter((f) => f.uids.includes(currentUser.uid))
      .map((f) => {
        const friendUid = f.uids.find((u) => u !== currentUser.uid)!;
        return {
          friendshipId: f.id,
          friendUid,
          profile: publicProfiles[friendUid],
        };
      });
  }, [friendships, currentUser.uid, publicProfiles]);

  // Blocked Users
  const blockedUsers = useMemo(() => {
    return Object.entries(blocks)
      .filter(([_, blocked]) => blocked)
      .map(([targetUid]) => ({
        uid: targetUid,
        profile: publicProfiles[targetUid],
      }));
  }, [blocks, publicProfiles]);

  if (!isFriendRequestsCenterOpen) return null;

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
            <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              친구 및 관계 정리
            </h2>
            <button
              onClick={() => setIsFriendRequestsCenterOpen(false)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 4 Tabs */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 m-4 rounded-2xl text-xs font-bold">
            <button
              onClick={() => handleTabChange('received')}
              className={`flex-1 py-2 rounded-xl transition-all relative ${
                activeTab === 'received'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-500'
              }`}
            >
              받은 요청
              {receivedRequests.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                  {receivedRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('sent')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                activeTab === 'sent'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-500'
              }`}
            >
              보낸 요청 ({sentRequests.length})
            </button>
            <button
              onClick={() => handleTabChange('friends')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                activeTab === 'friends'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-500'
              }`}
            >
              친구 목록 ({currentFriends.length})
            </button>
            <button
              onClick={() => handleTabChange('blocked')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                activeTab === 'blocked'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-500'
              }`}
            >
              차단 ({blockedUsers.length})
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Tab 1: Received Requests */}
            {activeTab === 'received' && (
              <div className="space-y-3">
                {/* Quick Simulation Bar */}
                <div className="flex items-center justify-between px-3 py-2 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-950 dark:text-indigo-200">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="font-medium text-[11px]">다른 여행자의 친구 요청 체험하기</span>
                  </div>
                  <button
                    onClick={() => simulateReceiveFriendRequest()}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-[11px] font-bold shadow-xs transition-all shrink-0"
                  >
                    + 새 요청 받기
                  </button>
                </div>

                {receivedRequests.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 space-y-3">
                    <UserPlus className="w-8 h-8 text-indigo-500 mx-auto opacity-70" />
                    <div>
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        대기 중인 받은 친구 요청이 없습니다.
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        위 버튼을 눌러 여행자로부터 새로운 친구 요청을 받아보세요!
                      </p>
                    </div>
                    <button
                      onClick={() => simulateReceiveFriendRequest()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      새 친구 요청 받아보기
                    </button>
                  </div>
                ) : (
                  receivedRequests.map((req) => {
                    const sender = publicProfiles[req.fromUid];
                    return (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {sender?.photoURL ? (
                            <img
                              src={sender.photoURL}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm shrink-0">
                              {sender?.name?.[0] || 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate block">
                              {sender?.name || req.fromName || '사용자'}
                            </span>
                            <span className="text-[11px] text-zinc-400 truncate block">
                              {sender?.bio || '친구 요청을 보냈습니다.'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => acceptFriendRequest(req.id || req.fromUid)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                          >
                            수락
                          </button>
                          <button
                            onClick={() => rejectFriendRequest(req.id || req.fromUid)}
                            className="px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs"
                          >
                            거절
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 2: Sent Requests */}
            {activeTab === 'sent' && (
              <div className="space-y-2.5">
                {sentRequests.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-10">보낸 요청이 없습니다.</p>
                ) : (
                  sentRequests.map((req) => {
                    const recipient = publicProfiles[req.toUid];
                    const isRejected = req.status === 'rejected';
                    const cooldownActive =
                      req.rejectedAt &&
                      Date.now() - new Date(req.rejectedAt).getTime() < 24 * 60 * 60 * 1000;

                    return (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {recipient?.photoURL ? (
                            <img
                              src={recipient.photoURL}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm shrink-0">
                              {recipient?.name?.[0] || 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate block">
                              {recipient?.name || req.toName || '사용자'}
                            </span>
                            <span className="text-[11px] text-zinc-400 block">
                              {isRejected
                                ? cooldownActive
                                ? '거절됨 (재요청 대기 중)'
                                : '거절됨 (재요청 가능)'
                                : '수락 대기 중...'}
                            </span>
                          </div>
                        </div>

                        <div>
                          {req.status === 'pending' ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => simulateAcceptSentRequest(req.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-bold text-[11px] hover:bg-emerald-100"
                                title="상대방이 수락했을 때의 흐름을 테스트합니다"
                              >
                                수락 시뮬레이션
                              </button>
                              <button
                                onClick={() => cancelFriendRequest(req.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold text-xs hover:bg-rose-100 hover:text-rose-600"
                              >
                                취소
                              </button>
                            </div>
                          ) : cooldownActive ? (
                            <span className="px-2.5 py-1 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> 24시간 쿨다운
                            </span>
                          ) : (
                            <button
                              onClick={() => sendFriendRequest(req.toUid)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                            >
                              다시 요청
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 3: Friends List */}
            {activeTab === 'friends' && (
              <div className="space-y-2.5">
                {currentFriends.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-10">등록된 친구가 없습니다.</p>
                ) : (
                  currentFriends.map((f) => (
                    <div
                      key={f.friendshipId}
                      className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {f.profile?.photoURL ? (
                          <img
                            src={f.profile.photoURL}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm shrink-0">
                            {f.profile?.name?.[0] || 'F'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate block">
                            {f.profile?.name || '친구'}
                          </span>
                          <span className="text-[11px] text-zinc-400 truncate block">
                            {f.profile?.bio || '여행 친구'}
                          </span>
                        </div>
                      </div>

                      {deletingFriendUid === f.friendUid ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              removeFriend(f.friendUid);
                              setDeletingFriendUid(null);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
                          >
                            삭제 확인
                          </button>
                          <button
                            onClick={() => setDeletingFriendUid(null)}
                            className="px-2 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-semibold"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingFriendUid(f.friendUid)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold"
                        >
                          친구 삭제
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 4: Blocked Users */}
            {activeTab === 'blocked' && (
              <div className="space-y-2.5">
                {blockedUsers.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-10">차단한 사용자가 없습니다.</p>
                ) : (
                  blockedUsers.map((b) => (
                    <div
                      key={b.uid}
                      className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-400 font-bold flex items-center justify-center text-sm shrink-0">
                          {b.profile?.name?.[0] || 'U'}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate block">
                            {b.profile?.name || '차단된 사용자'}
                          </span>
                          <span className="text-[11px] text-zinc-400 block">차단 목록에 있음</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (window.confirm('차단을 해제하시겠습니까?')) {
                            unblockUser(b.uid);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1 hover:bg-indigo-600 hover:text-white transition-colors"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        차단 해제
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
