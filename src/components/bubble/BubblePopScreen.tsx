/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../common/Header';
import {
  Sparkles,
  Send,
  Image as ImageIcon,
  Clock,
  Trash2,
  AlertTriangle,
  Heart,
  Smile,
  Frown,
  Flame,
  ThumbsUp,
  X,
  Upload,
  Users,
} from 'lucide-react';
import { BubbleEmoji, BubblePopPost } from '../../types';

export const BubblePopScreen: React.FC = () => {
  const {
    bubblePops,
    currentUser,
    publicProfiles,
    createBubblePop,
    deleteBubblePop,
    reactToBubblePop,
    updateUserProfile,
    setHasUnreadBubblePops,
    showToast,
    isFriend,
    setSelectedUserProfileUid,
  } = useApp();

  const [feedFilter, setFeedFilter] = useState<'all' | 'friends'>('all');
  const [textContent, setTextContent] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isPhotoMode, setIsPhotoMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setPhotoUrl(e.target.result);
        setIsPhotoMode(true);
      }
    };
    reader.readAsDataURL(file);
  };

  // Clear unread dot badge on screen mount
  useEffect(() => {
    setHasUnreadBubblePops(false);
  }, [setHasUnreadBubblePops]);

  // Active bubbles (not expired yet)
  const activeBubbles = useMemo(() => {
    const now = Date.now();
    return bubblePops
      .filter((b) => {
        if (new Date(b.expiresAt).getTime() <= now) return false;
        if (feedFilter === 'friends') {
          return b.authorUid === currentUser.uid || isFriend(b.authorUid);
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bubblePops, feedFilter, currentUser.uid, isFriend]);

  const handleSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim() && !photoUrl.trim()) {
      showToast('내용이나 사진을 입력해주세요.', 'warning');
      return;
    }

    if (!currentUser.bubblePopComposerWarningDismissed) {
      setShowWarningModal(true);
    } else {
      executeCreate();
    }
  };

  const executeCreate = () => {
    createBubblePop({
      type: photoUrl.trim() ? 'photo' : 'text',
      text: textContent.trim() || undefined,
      downloadURL: photoUrl.trim() || undefined,
    });
    setTextContent('');
    setPhotoUrl('');
    setIsPhotoMode(false);
  };

  const handleConfirmWarning = () => {
    if (doNotShowAgain) {
      updateUserProfile({ bubblePopComposerWarningDismissed: true });
    }
    setShowWarningModal(false);
    executeCreate();
  };

  const getRemainingHours = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return '만료됨';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours === 0) return `${mins}분 남음`;
    return `${hours}시간 ${mins}분 남음`;
  };

  const isUrgentExpiry = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff < 3600000; // Less than 1 hour
  };

  return (
    <div className="w-full min-h-screen pb-24 bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="max-w-xl mx-auto px-4 py-5 space-y-6">
        {/* Intro Banner */}
        <div className="p-4 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-200/50 dark:border-pink-900/30 rounded-3xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-pink-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
              실시간 여행 버블 (Bubble Pop)
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              지금 어디에 계신가요? 24시간 뒤 톡 터지듯 사라지는 순간의 이야기 🫧
            </p>
          </div>
        </div>

        {/* Composer Card */}
        <form
          onSubmit={handleSubmitAttempt}
          className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm space-y-3"
        >
          <div className="flex items-start gap-3">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 font-bold flex items-center justify-center text-xs shrink-0">
                {currentUser.name[0]}
              </div>
            )}
            <div className="flex-1 space-y-2">
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="지금 떠오르는 여행 생각이나 짧은 순간을 공유해보세요..."
                rows={2}
                maxLength={300}
                className="w-full text-xs bg-transparent border-none focus:outline-none resize-none text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400"
              />

              {isPhotoMode && (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        processFile(e.target.files[0]);
                      }
                      e.target.value = '';
                    }}
                    className="hidden"
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files?.[0]) {
                        processFile(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`p-2.5 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-colors ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 hover:border-indigo-400'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-xs text-zinc-500">이미지 드래그 또는</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      파일 선택
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="또는 사진 이미지 URL 직접 입력"
                      className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsPhotoMode((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                isPhotoMode || photoUrl
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                  : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>사진 추가</span>
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-pink-500/20 transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              버블 띄우기
            </button>
          </div>
        </form>

        {/* Active Bubble Pops List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>🫧 24시간 실시간 버블</span>
            </h3>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-full flex items-center text-xs">
              <button
                type="button"
                onClick={() => setFeedFilter('all')}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  feedFilter === 'all'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('friends')}
                className={`px-3 py-1 rounded-full font-semibold transition-all flex items-center gap-1 ${
                  feedFilter === 'friends'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>친구만</span>
              </button>
            </div>
          </div>

          {activeBubbles.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="text-3xl mb-2">🫧</div>
              <p className="font-bold text-xs text-zinc-700 dark:text-zinc-300">
                {feedFilter === 'friends' ? '친구들의 버블이 없습니다' : '지금 떠있는 버블이 없습니다'}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {feedFilter === 'friends'
                  ? '새로운 친구를 추가하거나 전체 피드를 확인해보세요!'
                  : '첫 번째 버블을 띄워 친구들에게 소식을 전해보세요!'}
              </p>
            </div>
          ) : (
            activeBubbles.map((bubble) => {
              const isAuthor = bubble.authorUid === currentUser.uid;
              const urgent = isUrgentExpiry(bubble.expiresAt);
              const authorProfile = publicProfiles[bubble.authorUid];
              const reactionCountsVisible =
                isAuthor ||
                (authorProfile ? authorProfile.bubblePopReactionCountVisible : true);
              const myReaction = bubble.reactions?.[currentUser.uid];

              return (
                <article
                  key={bubble.id}
                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-4 space-y-3 transition-all hover:shadow-md"
                >
                  {/* Author and 24h Expiry Clock */}
                  <div className="flex items-center justify-between">
                    <div
                      onClick={() => {
                        if (bubble.authorUid !== currentUser.uid) {
                          setSelectedUserProfileUid(bubble.authorUid);
                        }
                      }}
                      className="flex items-center gap-2.5 cursor-pointer group"
                    >
                      {bubble.authorPhotoURL ? (
                        <img
                          src={bubble.authorPhotoURL}
                          alt={bubble.authorName}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 group-hover:ring-2 ring-indigo-500 transition-all"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-xs group-hover:ring-2 ring-indigo-500 transition-all">
                          {bubble.authorName[0]}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {bubble.authorName}
                          {isAuthor && <span className="ml-1 text-[10px] text-zinc-400">(나)</span>}
                        </span>
                        <div
                          className={`flex items-center gap-1 text-[10px] font-semibold ${
                            urgent
                              ? 'text-rose-500 animate-pulse'
                              : 'text-zinc-400 dark:text-zinc-500'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{getRemainingHours(bubble.expiresAt)}</span>
                        </div>
                      </div>
                    </div>

                    {(isAuthor || currentUser.role === 'admin') && (
                      <button
                        onClick={() => deleteBubblePop(bubble.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="버블 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Bubble Content (Text & Photo) */}
                  {bubble.text && (
                    <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                      {bubble.text}
                    </p>
                  )}

                  {bubble.downloadURL && (
                    <div className="rounded-2xl overflow-hidden aspect-video bg-zinc-100 dark:bg-zinc-800 max-h-72">
                      <img
                        src={bubble.downloadURL}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* 4 Emoji Reactions Bar (❤️ 😢 😡 👍) */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                    {(
                      [
                        { key: 'heart', emoji: '❤️' },
                        { key: 'sad', emoji: '😢' },
                        { key: 'angry', emoji: '😡' },
                        { key: 'thumbsUp', emoji: '👍' },
                      ] as { key: BubbleEmoji; emoji: string }[]
                    ).map((r) => {
                      const count = bubble.reactionCounts[r.key] || 0;
                      const active = myReaction === r.key;

                      return (
                        <button
                          key={r.key}
                          onClick={() => reactToBubblePop(bubble.id, r.key)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 active:scale-90 ${
                            active
                              ? 'bg-pink-100 dark:bg-pink-950/60 ring-2 ring-pink-400 text-pink-700 dark:text-pink-300 scale-105'
                              : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                          }`}
                        >
                          <span className="text-sm">{r.emoji}</span>
                          {count > 0 && reactionCountsVisible && (
                            <span className="text-[11px] font-bold">{count}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>

      {/* First-Time Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Bubble Pop 등록 안내
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                작성하신 버블은 <strong>24시간 동안 모든 친구에게 공개</strong>되며, 24시간이 지나면 완전히 삭제되어 다시 볼 수 없게 됩니다.
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={doNotShowAgain}
                onChange={(e) => setDoNotShowAgain(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-zinc-300 focus:ring-indigo-500"
              />
              <span>이 안내를 다시 보지 않음</span>
            </label>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWarningModal(false)}
                className="py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmWarning}
                className="py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700"
              >
                확인 및 등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
