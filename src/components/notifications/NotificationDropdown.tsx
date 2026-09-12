/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserPlus,
  CheckCircle,
  MessageCircle,
  Heart,
  Tag,
  Sparkles,
  Bell,
  Check,
  Calendar,
} from 'lucide-react';
import { NotificationType } from '../../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_ICONS: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
  friend_request: {
    icon: <UserPlus className="w-4 h-4" />,
    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50',
  },
  friend_accepted: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50',
  },
  comment: {
    icon: <MessageCircle className="w-4 h-4" />,
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50',
  },
  like: {
    icon: <Heart className="w-4 h-4" />,
    color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/50',
  },
  tagged_in_record: {
    icon: <Tag className="w-4 h-4" />,
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/50',
  },
  bubble_reaction: {
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50',
  },
  meeting_invite: {
    icon: <Calendar className="w-4 h-4" />,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50',
  },
  meeting_reminder: {
    icon: <Calendar className="w-4 h-4" />,
    color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/50',
  },
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    travelRecords,
    setActiveRecordDetail,
    setActiveTab,
    isFriend,
    acceptFriendRequest,
    rejectFriendRequest,
    openFriendRequestsCenter,
    bubblePops,
    showToast,
    setIsMeetupModalOpen,
    setActiveMeetupId,
  } = useApp();

  const handleNotificationClick = (item: (typeof notifications)[0]) => {
    markNotificationAsRead(item.id);
    onClose();

    if (item.type === 'friend_request') {
      openFriendRequestsCenter('received');
    } else if (item.type === 'friend_accepted') {
      openFriendRequestsCenter('friends');
    } else if (item.type === 'meeting_invite' || item.type === 'meeting_reminder') {
      if (item.targetMeetupId) {
        setActiveMeetupId(item.targetMeetupId);
      }
      setIsMeetupModalOpen(true);
    } else if (item.type === 'comment' || item.type === 'like' || item.type === 'tagged_in_record') {
      if (item.targetRecordId) {
        const record = travelRecords.find((r) => r.id === item.targetRecordId);
        if (record && !record.hidden) {
          setActiveRecordDetail(record);
        } else {
          showToast('더 이상 볼 수 없는 게시물이에요.', 'warning');
        }
      }
    } else if (item.type === 'bubble_reaction') {
      if (item.targetBubbleId) {
        const bubble = bubblePops.find((b) => b.id === item.targetBubbleId);
        if (bubble && new Date(bubble.expiresAt).getTime() > Date.now()) {
          setActiveTab('bubble');
        } else {
          showToast('더 이상 볼 수 없는 게시물이에요 (만료됨).', 'warning');
        }
      } else {
        setActiveTab('bubble');
      }
    }
  };

  const timeAgo = (dateString: string) => {
    const diff = (Date.now() - new Date(dateString).getTime()) / 1000;
    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 z-50 w-80 sm:w-96 max-h-[480px] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">알림</span>
              </div>
              {notifications.some((n) => !n.isRead) && (
                <button
                  onClick={markAllNotificationsAsRead}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> 모두 읽음
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                  새로운 알림이 없습니다.
                </div>
              ) : (
                notifications.slice(0, 20).map((item) => {
                  const typeConfig = TYPE_ICONS[item.type] || {
                    icon: <Bell className="w-4 h-4" />,
                    color: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800',
                  };

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                        !item.isRead ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="relative shrink-0">
                        {item.fromPhotoURL ? (
                          <img
                            src={item.fromPhotoURL}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-xs">
                            {item.fromName?.[0] || 'U'}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-1 -right-1 p-0.5 rounded-full ring-2 ring-white dark:ring-zinc-900 ${typeConfig.color}`}
                        >
                          {typeConfig.icon}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-snug">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{item.fromName}</span>{' '}
                          {item.message.replace(item.fromName, '').trim()}
                        </p>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 block">
                          {timeAgo(item.createdAt)}
                        </span>

                        {item.type === 'friend_request' && (
                          <div className="mt-2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {isFriend(item.fromUid) ? (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> 친구 관계
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    acceptFriendRequest(item.fromUid);
                                    markNotificationAsRead(item.id);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-xs transition-colors flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" /> 수락
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    rejectFriendRequest(item.fromUid);
                                    markNotificationAsRead(item.id);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px] transition-colors"
                                >
                                  거절
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
