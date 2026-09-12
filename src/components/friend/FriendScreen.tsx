/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../common/Header';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Calendar,
  Tag,
  Share2,
  Users,
  MapPin,
  Sparkles,
  Plane,
} from 'lucide-react';
import { TravelRecord } from '../../types';

export const FriendScreen: React.FC = () => {
  const {
    travelRecords,
    currentUser,
    isFriend,
    toggleLikeRecord,
    isBookmarked,
    toggleBookmark,
    setActiveRecordDetail,
    setActiveTab,
    publicProfiles,
    onPlanTripTogether,
    setSelectedUserProfileUid,
    setIsMeetupModalOpen,
    friendships,
    openFriendRequestsCenter,
  } = useApp();

  // Connected friends list
  const myFriends = useMemo(() => {
    return friendships
      .filter((f) => f.uids.includes(currentUser.uid))
      .map((f) => {
        const friendUid = f.uids.find((u) => u !== currentUser.uid)!;
        return {
          friendUid,
          profile: publicProfiles[friendUid],
        };
      });
  }, [friendships, currentUser.uid, publicProfiles]);

  // Filter records from friends
  const friendFeed = useMemo(() => {
    return travelRecords
      .filter((rec) => {
        if (rec.hidden) return false;
        if (rec.authorUid === currentUser.uid) return true; // Include own posts in friend feed too
        return isFriend(rec.authorUid) && (rec.visibility === 'friends' || rec.visibility === 'public');
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [travelRecords, currentUser.uid, isFriend]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="w-full min-h-screen pb-24 bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Top Meetup Bar */}
        <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                친구와 여행 약속 잡기
              </h3>
              <p className="text-[10px] text-zinc-400">
                날짜와 시간을 투표해 모두가 가능한 일정을 찾아보세요.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMeetupModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm shadow-amber-500/20 transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>약속잡기</span>
          </button>
        </div>

        {/* My Friends Horizontal List */}
        <section className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                내 친구 ({myFriends.length}명)
              </h3>
            </div>
            <button
              onClick={() => openFriendRequestsCenter('friends')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              친구 관리
            </button>
          </div>

          {myFriends.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-xs text-zinc-400">아직 추가된 친구가 없습니다.</p>
              <button
                onClick={() => setActiveTab('search')}
                className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                친구 찾으러 가기 &rarr;
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
              {myFriends.map(({ friendUid, profile }) => {
                const name = profile?.name || '여행자';
                const photo = profile?.photoURL;
                return (
                  <button
                    key={friendUid}
                    onClick={() => setSelectedUserProfileUid(friendUid)}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none"
                  >
                    <div className="relative">
                      {photo ? (
                        <img
                          src={photo}
                          alt={name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-900/50 group-hover:border-indigo-500 transition-all shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm border-2 border-indigo-200 dark:border-indigo-800 group-hover:border-indigo-500 transition-all shadow-sm">
                          {name[0]}
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                    </div>
                    <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 max-w-[56px] truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Empty state */}
        {friendFeed.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              아직 친구들의 여행 기록이 없어요
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
              새로운 여행 친구를 맺고 실시간 여행 지도를 탐색해보세요.
            </p>
            <button
              onClick={() => setActiveTab('search')}
              className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition-all"
            >
              친구 찾으러 가기
            </button>
          </div>
        ) : (
          friendFeed.map((record) => {
            const isLiked = !!record.likes?.[currentUser.uid];
            const bookmarked = isBookmarked(record.id);
            const authorProfile = publicProfiles[record.authorUid];
            const likeVisible =
              record.authorUid === currentUser.uid ||
              (authorProfile ? authorProfile.likeCountVisible : true);

            return (
              <article
                key={record.id}
                className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                {/* Author Header */}
                <div className="p-4 flex items-center justify-between">
                  <div
                    onClick={() => {
                      if (record.authorUid !== currentUser.uid) {
                        setSelectedUserProfileUid(record.authorUid);
                      } else {
                        setActiveTab('profile');
                      }
                    }}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    {record.authorPhotoURL ? (
                      <img
                        src={record.authorPhotoURL}
                        alt={record.authorName}
                        className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 group-hover:ring-2 ring-indigo-500 transition-all"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 font-bold flex items-center justify-center text-sm">
                        {record.authorName[0]}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {record.authorName}
                        </span>
                        {record.authorUid === currentUser.uid && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                            나
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <span>{formatDate(record.visitDate)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-indigo-500" />
                          {record.countryName || record.cityName || '여행지'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deep Link: Plan Trip Together Stub */}
                  {record.authorUid !== currentUser.uid && (
                    <button
                      onClick={() => onPlanTripTogether(record.authorUid, record.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center gap-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                      title="함께 여행 계획하기"
                    >
                      <Plane className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">함께 계획</span>
                    </button>
                  )}
                </div>

                {/* Cover Photo / Carousel preview */}
                {record.photoURLs && record.photoURLs.length > 0 && (
                  <div
                    onClick={() => setActiveRecordDetail(record)}
                    className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800 cursor-pointer overflow-hidden group"
                  >
                    <img
                      src={record.photoURLs[0]}
                      alt={record.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    {record.photoURLs.length > 1 && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur text-white text-[10px] font-bold">
                        1 / {record.photoURLs.length}
                      </div>
                    )}
                  </div>
                )}

                {/* Content & Meta */}
                <div className="p-4 space-y-3">
                  <div onClick={() => setActiveRecordDetail(record)} className="cursor-pointer space-y-1">
                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 leading-snug">
                      {record.title}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                      {record.description}
                    </p>
                  </div>

                  {/* Companion badges (OO님과 함께) */}
                  {record.companionNames && record.companionNames.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      <Users className="w-3.5 h-3.5" />
                      <span>{record.companionNames.join(', ')}님과 함께</span>
                    </div>
                  )}

                  {/* Hashtags */}
                  {record.tags && record.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {record.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-600 dark:text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Social Action Bar */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Like Button */}
                      <button
                        onClick={() => toggleLikeRecord(record.id)}
                        className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                          isLiked
                            ? 'text-rose-500'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                        <span>{likeVisible ? record.likeCount : '여러 개'}</span>
                      </button>

                      {/* Comment Button */}
                      <button
                        onClick={() => setActiveRecordDetail(record)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{record.commentCount}</span>
                      </button>
                    </div>

                    {/* Bookmark */}
                    <button
                      onClick={() => toggleBookmark(record.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        bookmarked
                          ? 'text-amber-500'
                          : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                      }`}
                      title={bookmarked ? '북마크 취소' : '북마크 저장'}
                    >
                      <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </main>
    </div>
  );
};
