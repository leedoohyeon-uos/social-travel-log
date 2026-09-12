/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../common/Header';
import {
  Search,
  X,
  UserPlus,
  Users,
  Check,
  Star,
  Flame,
  Clock,
  MapPin,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { PRESET_TAGS, WORLD_COUNTRIES } from '../../data/geoData';
import { TravelRecord } from '../../types';

export const SearchScreen: React.FC = () => {
  const {
    currentUser,
    publicProfiles,
    friendships,
    friendRequests,
    blocks,
    isFriend,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    travelRecords,
    countryVisits,
    regionVisits,
    setActiveRecordDetail,
    setIsFriendRequestsCenterOpen,
    setSelectedUserProfileUid,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortTab, setSortTab] = useState<'wishlist' | 'popular' | 'latest'>('wishlist');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 300ms Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Friend Request Pending Count for Badge
  const pendingReceivedCount = useMemo(() => {
    return friendRequests.filter((r) => (r.toUid === currentUser.uid || r.toUid === 'user-me') && r.status === 'pending').length;
  }, [friendRequests, currentUser.uid]);

  // User Search Results (Max 8, excluding blocked)
  const searchResults = useMemo(() => {
    if (!debouncedSearch) return [];

    return Object.values(publicProfiles)
      .filter((user: any) => {
        if (!user || !user.uid) return false;
        if (user.uid === currentUser.uid) return false;
        if (blocks[user.uid]) return false; // Blocked excluded
        const userName = (user.name || '').toLowerCase();
        const userBio = (user.bio || '').toLowerCase();
        return userName.includes(debouncedSearch) || userBio.includes(debouncedSearch);
      })
      .slice(0, 8);
  }, [debouncedSearch, publicProfiles, currentUser.uid, blocks]);

  // Wishlist codes for prioritization
  const myWishlistCountries = useMemo(() => {
    return Object.values(countryVisits)
      .filter((c: any) => c.wishlist)
      .map((c: any) => c.code);
  }, [countryVisits]);

  const myWishlistRegions = useMemo(() => {
    return Object.values(regionVisits)
      .filter((r: any) => r.wishlist)
      .map((r: any) => r.code);
  }, [regionVisits]);

  // Explore feed (Public only)
  const exploreRecords = useMemo(() => {
    return travelRecords
      .filter((rec) => {
        if (rec.hidden) return false;
        if (rec.visibility !== 'public') return false;
        // Public accounts check
        const author = publicProfiles[rec.authorUid];
        if (author && !author.isPublicAccount) return false;

        // Tag filter
        if (selectedTag && (!rec.tags || !rec.tags.includes(selectedTag))) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortTab === 'wishlist') {
          const aInWishlist = myWishlistCountries.includes(a.countryCode) || (a.regionCode && myWishlistRegions.includes(a.regionCode));
          const bInWishlist = myWishlistCountries.includes(b.countryCode) || (b.regionCode && myWishlistRegions.includes(b.regionCode));
          if (aInWishlist && !bInWishlist) return -1;
          if (!aInWishlist && bInWishlist) return 1;
          return b.likeCount - a.likeCount;
        } else if (sortTab === 'popular') {
          return b.likeCount - a.likeCount;
        } else {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [travelRecords, publicProfiles, selectedTag, sortTab, myWishlistCountries, myWishlistRegions]);

  // Trending destination highlights
  const trendingDestinations = [
    { name: '스위스 인터라켄', countryCode: 'CH', img: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=400&auto=format&fit=crop&q=80', count: '1.2k 기록' },
    { name: '일본 교토', countryCode: 'JP', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&auto=format&fit=crop&q=80', count: '3.4k 기록' },
    { name: '프랑스 파리', countryCode: 'FR', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&auto=format&fit=crop&q=80', count: '2.8k 기록' },
    { name: '스페인 바르셀로나', countryCode: 'ES', img: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&auto=format&fit=crop&q=80', count: '1.9k 기록' },
  ];

  return (
    <div className="w-full min-h-screen pb-24 bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="max-w-xl mx-auto px-4 py-5 space-y-6">
        {/* Search Bar & Friend Request Center Trigger */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="여행자 이름이나 소개를 검색해보세요"
              className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Friend Requests Center Modal Button */}
          <button
            onClick={() => setIsFriendRequestsCenterOpen(true)}
            className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm relative transition-colors"
            title="친구 요청 및 관계 관리"
          >
            <Users className="w-4 h-4" />
            {pendingReceivedCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 h-4 min-w-[16px] rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 animate-pulse">
                {pendingReceivedCount}
              </span>
            )}
          </button>
        </div>

        {/* User Search Results Dropdown */}
        {debouncedSearch && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/60 animate-fadeIn">
            {searchResults.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400">
                "{debouncedSearch}" 검색 결과와 일치하는 사용자가 없습니다.
              </div>
            ) : (
              searchResults.map((user) => {
                const isAlreadyFriend = isFriend(user.uid);
                const pendingSent = friendRequests.find(
                  (r) => (r.fromUid === currentUser.uid || r.fromUid === 'user-me') && r.toUid === user.uid && r.status === 'pending'
                );
                const pendingReceived = friendRequests.find(
                  (r) => r.fromUid === user.uid && (r.toUid === currentUser.uid || r.toUid === 'user-me') && r.status === 'pending'
                );

                return (
                  <div key={user.uid} className="p-3.5 flex items-center justify-between gap-3">
                    <div
                      onClick={() => setSelectedUserProfileUid(user.uid)}
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    >
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 font-bold flex items-center justify-center text-sm shrink-0">
                          {user.name[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate block">
                          {user.name}
                        </span>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {user.bio || '등록된 소개글이 없습니다.'}
                        </p>
                      </div>
                    </div>

                    {/* Relationship Action Button */}
                    <div className="shrink-0">
                      {isAlreadyFriend ? (
                        <span className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold text-xs flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> 친구
                        </span>
                      ) : pendingReceived ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => acceptFriendRequest(pendingReceived.id)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700"
                          >
                            수락
                          </button>
                          <button
                            onClick={() => rejectFriendRequest(pendingReceived.id)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs"
                          >
                            거절
                          </button>
                        </div>
                      ) : pendingSent ? (
                        <button
                          onClick={() => cancelFriendRequest(pendingSent.id)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold text-xs hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        >
                          요청 취소
                        </button>
                      ) : (
                        <button
                          onClick={() => sendFriendRequest(user.uid)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> 요청
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Trending Destinations Carousel */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              지금 인기있는 여행지
            </h2>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
            {trendingDestinations.map((dest, idx) => (
              <div
                key={idx}
                className="group relative w-36 h-48 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 cursor-pointer shadow-sm hover:shadow-md transition-all"
              >
                <img
                  src={dest.img}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3 text-white">
                  <span className="font-bold text-xs leading-snug">{dest.name}</span>
                  <span className="text-[10px] text-zinc-300 font-medium">{dest.count}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Hashtag Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              !selectedTag
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            #전체
          </button>
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedTag === tag
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-indigo-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Explore Feed & Sort Tabs */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              여행자들의 스토리
            </h2>

            {/* 3 Sort Tabs */}
            <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl text-[11px] font-semibold">
              <button
                onClick={() => setSortTab('wishlist')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  sortTab === 'wishlist'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Star className="w-3 h-3" />
                위시리스트
              </button>
              <button
                onClick={() => setSortTab('popular')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  sortTab === 'popular'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Flame className="w-3 h-3" />
                인기순
              </button>
              <button
                onClick={() => setSortTab('latest')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  sortTab === 'latest'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Clock className="w-3 h-3" />
                최신순
              </button>
            </div>
          </div>

          {/* Square Photo Thumbnail Grid */}
          {exploreRecords.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              조건에 맞는 공개 여행 스토리가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {exploreRecords.map((record) => {
                const inMyWishlist =
                  myWishlistCountries.includes(record.countryCode) ||
                  (record.regionCode && myWishlistRegions.includes(record.regionCode));

                return (
                  <div
                    key={record.id}
                    onClick={() => setActiveRecordDetail(record)}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 cursor-pointer shadow-sm hover:shadow-md transition-all"
                  >
                    {record.photoURLs && record.photoURLs.length > 0 ? (
                      <img
                        src={record.photoURLs[0]}
                        alt={record.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
                        사진 없음
                      </div>
                    )}

                    {/* Wishlist Highlight Tag */}
                    {inMyWishlist && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-white font-bold text-[9px] flex items-center gap-0.5 shadow-sm">
                        <Star className="w-2.5 h-2.5 fill-white" /> 내 위시
                      </span>
                    )}

                    {/* Overlay info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end text-white">
                      <p className="font-bold text-xs line-clamp-1">{record.title}</p>
                      <div className="flex items-center justify-between text-[10px] text-zinc-300 mt-1">
                        <span>{record.authorName}</span>
                        <span className="flex items-center gap-0.5">
                          <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                          {record.likeCount}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
