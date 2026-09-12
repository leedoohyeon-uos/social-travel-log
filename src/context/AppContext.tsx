/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  UserProfile,
  PublicProfile,
  CountryVisit,
  RegionVisit,
  TravelRecord,
  FriendRequest,
  Friendship,
  NotificationItem,
  BookmarkItem,
  BubblePopPost,
  BubbleEmoji,
  ReportItem,
  MapSettings,
  RecordVisibility,
  TravelBadge,
  TravelStats,
  ReportReason,
  ReportTargetType,
} from '../types';
import {
  CURRENT_USER,
  OTHER_USERS,
  INITIAL_FRIENDSHIPS,
  INITIAL_FRIEND_REQUESTS,
  INITIAL_COUNTRIES,
  INITIAL_REGIONS,
  INITIAL_TRAVEL_RECORDS,
  INITIAL_BUBBLE_POPS,
  INITIAL_NOTIFICATIONS,
  INITIAL_BOOKMARKS,
  INITIAL_BLOCKS,
  INITIAL_REPORTS,
} from '../data/mockInitialState';
import { BADGE_DEFINITIONS } from '../data/geoData';
import {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from '../services/firebase';
import { getFirebaseAuthErrorMessage } from '../utils/firebaseErrors';
import {
  getRealUserProfile,
  saveRealUserProfile,
  getRealCountryVisits,
  saveRealCountryVisit,
  getRealRegionVisits,
  saveRealRegionVisit,
  getRealTravelRecords,
  saveRealTravelRecord,
  deleteRealTravelRecord,
  saveRealNotification,
  getRealNotifications,
  getRealPublicProfiles,
  getRealFriendRequests,
  getRealFriendships,
  saveRealFriendRequest,
  deleteRealFriendRequest,
  saveRealFriendship,
  deleteRealFriendship,
  getRealBubblePops,
  saveRealBubblePop,
  deleteRealBubblePop,
} from '../services/firebaseDataService';

interface ToastMessage {
  id: string;
  text: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface AppContextType {
  // Authentication & Service Mode (Real Service vs Demo)
  authStatus: 'loading' | 'unauthenticated' | 'authenticated' | 'demo';
  isDemoMode: boolean;
  loginWithFirebase: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupWithFirebase: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;

  // Navigation & Active View
  activeTab: 'search' | 'bubble' | 'map' | 'friend' | 'profile';
  setActiveTab: (tab: 'search' | 'bubble' | 'map' | 'friend' | 'profile') => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  selectedUserProfileUid: string | null;
  setSelectedUserProfileUid: (uid: string | null) => void;

  // Current User & Profiles
  currentUser: UserProfile;
  publicProfiles: Record<string, PublicProfile>;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  syncPublicProfile: (uid: string, updates: Partial<PublicProfile>) => void;

  // Map States & Locations
  countryVisits: Record<string, CountryVisit>;
  regionVisits: Record<string, RegionVisit>;
  toggleCountryVisit: (code: string, name: string) => void;
  incrementCountryVisit: (code: string, name: string) => void;
  decrementCountryVisit: (code: string, name: string) => void;
  toggleCountryWishlist: (code: string, name: string) => void;
  toggleRegionVisit: (code: string, name: string) => void;
  incrementRegionVisit: (code: string, name: string) => void;
  decrementRegionVisit: (code: string, name: string) => void;
  toggleRegionWishlist: (code: string, name: string) => void;
  addPhotoToLocation: (type: 'country' | 'region', code: string, photoURL: string, caption?: string) => void;

  // Travel Records
  travelRecords: TravelRecord[];
  activeRecordDetail: TravelRecord | null;
  setActiveRecordDetail: (record: TravelRecord | null) => void;
  activeRecordEditing: TravelRecord | null;
  setActiveRecordEditing: (record: TravelRecord | null) => void;
  isRecordComposerOpen: boolean;
  setIsRecordComposerOpen: (open: boolean) => void;
  composerPrefill: { countryCode?: string; regionCode?: string; photoIds?: string[] } | null;
  setComposerPrefill: (prefill: { countryCode?: string; regionCode?: string; photoIds?: string[] } | null) => void;

  createTravelRecord: (record: Omit<TravelRecord, 'id' | 'createdAt' | 'updatedAt' | 'likeCount' | 'commentCount' | 'hidden' | 'authorUid' | 'authorName' | 'authorPhotoURL' | 'randomSeed'>) => void;
  updateTravelRecord: (id: string, updates: Partial<TravelRecord>) => void;
  deleteTravelRecord: (id: string) => void;
  toggleLikeRecord: (recordId: string) => void;
  addCommentToRecord: (recordId: string, content: string) => Promise<boolean>;
  deleteComment: (recordId: string, commentId: string) => void;

  // Friendships & Requests & Blocks
  friendships: Friendship[];
  friendRequests: FriendRequest[];
  blocks: Record<string, { blockedAt: string }>;
  isFriend: (targetUid: string) => boolean;
  isBlocked: (targetUid: string) => boolean;
  sendFriendRequest: (toUid: string) => { success: boolean; error?: string };
  cancelFriendRequest: (requestId: string) => void;
  acceptFriendRequest: (requestId: string) => void;
  rejectFriendRequest: (requestId: string) => void;
  simulateReceiveFriendRequest: (fromUid?: string) => void;
  simulateAcceptSentRequest: (requestId: string) => void;
  removeFriendship: (targetUid: string) => void;
  removeFriend: (targetUid: string) => void;
  blockUser: (targetUid: string) => void;
  unblockUser: (targetUid: string) => void;

  // Bookmarks
  bookmarks: BookmarkItem[];
  isBookmarked: (recordId: string) => boolean;
  toggleBookmark: (recordId: string) => void;

  // Bubble Pop
  bubblePops: BubblePopPost[];
  createBubblePop: (post: { type: 'text' | 'photo'; text?: string; downloadURL?: string }) => void;
  deleteBubblePop: (id: string) => void;
  reactToBubblePop: (postId: string, emoji: BubbleEmoji) => void;
  hasUnreadBubblePops: boolean;
  setHasUnreadBubblePops: (has: boolean) => void;

  // Notifications
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Reports & Moderation
  reports: ReportItem[];
  createReport: (targetType: ReportTargetType, targetPath: string, reason: ReportReason, reasonDetail?: string) => { success: boolean; error?: string };
  updateReportStatus: (reportId: string, status: 'reviewed' | 'dismissed', hideTarget?: boolean) => void;
  isAdminReportModalOpen: boolean;
  setIsAdminReportModalOpen: (open: boolean) => void;

  // Deep Link Stub & Toasts
  toasts: ToastMessage[];
  showToast: (text: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onPlanTripTogether: (targetUid: string, recordId?: string) => void;

  // Meetup (약속잡기) State
  isMeetupModalOpen: boolean;
  setIsMeetupModalOpen: (open: boolean) => void;
  activeMeetupId: string | null;
  setActiveMeetupId: (id: string | null) => void;
  prefilledFriendUidForMeetup: string | null;
  setPrefilledFriendUidForMeetup: (uid: string | null) => void;
  sendMeetupInviteToFriends: (groupId: string, meetupName: string, friendUids: string[]) => void;

  // Stats & Badges
  userStats: TravelStats;
  userBadges: TravelBadge[];

  // Friend Requests Center Modal
  isFriendRequestsCenterOpen: boolean;
  setIsFriendRequestsCenterOpen: (open: boolean) => void;
  friendRequestsCenterTab: 'received' | 'sent' | 'friends' | 'blocked';
  setFriendRequestsCenterTab: (tab: 'received' | 'sent' | 'friends' | 'blocked') => void;
  openFriendRequestsCenter: (tab?: 'received' | 'sent' | 'friends' | 'blocked') => void;

  // Account Management
  isPasswordResetModalOpen: boolean;
  setIsPasswordResetModalOpen: (open: boolean) => void;
  passwordResetCooldownSeconds: number;
  requestPasswordReset: (email: string) => boolean;
  isDeleteAccountModalOpen: boolean;
  setIsDeleteAccountModalOpen: (open: boolean) => void;
  deleteAccount: (password: string) => Promise<boolean>;

  // Onboarding & Help (PART 20-1 & PART 12)
  completeOnboarding: () => void;
  isHelpModalOpen: boolean;
  setIsHelpModalOpen: (open: boolean) => void;

  // Trial Account Reset (PART 18-2)
  resetTrialAccount: () => Promise<boolean>;

  // Theme & Appearance (Light / Dark Mode)
  theme: 'light' | 'dark';
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const createDefaultUserProfile = (uid: string, email: string, name: string): UserProfile => ({
  uid,
  email,
  name,
  role: 'user',
  onboardingSeen: false,
  theme: 'system',
  friendRequestCount: 0,
  friendRequestResetAt: new Date().toISOString(),
  reportCount: 0,
  reportCountResetAt: new Date().toISOString(),
  mapSettings: {
    myMapDefault: 'domestic',
    friendMapDefault: 'domestic',
    activityWindowDays: 7,
  },
  likeCountVisible: true,
  bubblePopReactionCountVisible: true,
  isPublicAccount: true,
  bio: '',
  bubblePopComposerWarningDismissed: false,
  createdAt: new Date().toISOString(),
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<'search' | 'bubble' | 'map' | 'friend' | 'profile'>('map');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedUserProfileUid, setSelectedUserProfileUid] = useState<string | null>(null);

  // Modals
  const [isFriendRequestsCenterOpen, setIsFriendRequestsCenterOpen] = useState(false);
  const [friendRequestsCenterTab, setFriendRequestsCenterTab] = useState<'received' | 'sent' | 'friends' | 'blocked'>('received');

  const openFriendRequestsCenter = useCallback((tab: 'received' | 'sent' | 'friends' | 'blocked' = 'received') => {
    setFriendRequestsCenterTab(tab);
    setIsFriendRequestsCenterOpen(true);
  }, []);
  const [isAdminReportModalOpen, setIsAdminReportModalOpen] = useState(false);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isRecordComposerOpen, setIsRecordComposerOpen] = useState(false);
  const [composerPrefill, setComposerPrefill] = useState<{ countryCode?: string; regionCode?: string; photoIds?: string[] } | null>(null);
  const [activeRecordDetail, setActiveRecordDetail] = useState<TravelRecord | null>(null);
  const [activeRecordEditing, setActiveRecordEditing] = useState<TravelRecord | null>(null);

  // Authentication & Service Mode State (Real Service vs Demo)
  const [authStatus, setAuthStatus] = useState<'loading' | 'unauthenticated' | 'authenticated' | 'demo'>(() => {
    const mode = localStorage.getItem('stm_mode');
    if (mode === 'demo') return 'demo';
    const realSession = localStorage.getItem('stm_real_session');
    if (realSession) return 'authenticated';
    return 'unauthenticated';
  });

  const isDemoMode = authStatus === 'demo';

  // Theme State (Light vs Dark)
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'dark';
  });

  const isDarkMode = theme === 'dark';

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  }, []);

  // Core Data States
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const mode = localStorage.getItem('stm_mode');
    if (mode === 'demo') {
      const saved = localStorage.getItem('stm_demo_user');
      return saved ? JSON.parse(saved) : CURRENT_USER;
    }
    const realSession = localStorage.getItem('stm_real_session');
    if (realSession) {
      const session = JSON.parse(realSession);
      const saved = localStorage.getItem(`stm_real_user_${session.uid}`);
      if (saved) return JSON.parse(saved);
    }
    return CURRENT_USER;
  });

  const [publicProfiles, setPublicProfiles] = useState<Record<string, PublicProfile>>(() => {
    const mode = localStorage.getItem('stm_mode');
    if (mode === 'demo') {
      const saved = localStorage.getItem('stm_demo_profiles');
      return saved ? JSON.parse(saved) : OTHER_USERS;
    }
    const saved = localStorage.getItem('stm_real_profiles');
    return saved ? { ...OTHER_USERS, ...JSON.parse(saved) } : OTHER_USERS;
  });

  const [countryVisits, setCountryVisits] = useState<Record<string, CountryVisit>>(() => {
    const mode = localStorage.getItem('stm_mode');
    if (mode === 'demo') {
      const saved = localStorage.getItem('stm_demo_countries');
      return saved ? JSON.parse(saved) : INITIAL_COUNTRIES;
    }
    const realSession = localStorage.getItem('stm_real_session');
    if (realSession) {
      const session = JSON.parse(realSession);
      const saved = localStorage.getItem(`stm_real_countries_${session.uid}`);
      if (saved) return JSON.parse(saved);
    }
    return {};
  });

  const [regionVisits, setRegionVisits] = useState<Record<string, RegionVisit>>(() => {
    const mode = localStorage.getItem('stm_mode');
    if (mode === 'demo') {
      const saved = localStorage.getItem('stm_demo_regions');
      return saved ? JSON.parse(saved) : INITIAL_REGIONS;
    }
    const realSession = localStorage.getItem('stm_real_session');
    if (realSession) {
      const session = JSON.parse(realSession);
      const saved = localStorage.getItem(`stm_real_regions_${session.uid}`);
      if (saved) return JSON.parse(saved);
    }
    return {};
  });

  const [travelRecords, setTravelRecords] = useState<TravelRecord[]>(() => {
    const mode = localStorage.getItem('stm_mode');
    if (mode === 'demo') {
      const saved = localStorage.getItem('stm_demo_records');
      return saved ? JSON.parse(saved) : INITIAL_TRAVEL_RECORDS;
    }
    const saved = localStorage.getItem('stm_real_travel_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [friendships, setFriendships] = useState<Friendship[]>(() => {
    const mode = localStorage.getItem('stm_mode');
    if (mode === 'demo') {
      const saved = localStorage.getItem('stm_demo_friendships');
      return saved ? JSON.parse(saved) : INITIAL_FRIENDSHIPS;
    }
    return [];
  });

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(() => {
    const saved = localStorage.getItem('stm_demo_requests') || localStorage.getItem('stm_demo_friend_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved requests:', e);
      }
    }
    return INITIAL_FRIEND_REQUESTS;
  });

  const [blocks, setBlocks] = useState<Record<string, { blockedAt: string }>>(() => {
    const mode = localStorage.getItem('stm_mode');
    if (mode === 'demo') {
      const saved = localStorage.getItem('stm_demo_blocks');
      return saved ? JSON.parse(saved) : INITIAL_BLOCKS;
    }
    return {};
  });

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    const mode = localStorage.getItem('stm_mode');
    if (mode === 'demo') {
      const saved = localStorage.getItem('stm_demo_bookmarks');
      return saved ? JSON.parse(saved) : INITIAL_BOOKMARKS;
    }
    return [];
  });

  const [bubblePops, setBubblePops] = useState<BubblePopPost[]>(() => {
    const mode = localStorage.getItem('stm_mode');
    if (mode === 'demo') {
      const saved = localStorage.getItem('stm_demo_bubbles');
      return saved ? JSON.parse(saved) : INITIAL_BUBBLE_POPS;
    }
    return [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const mode = localStorage.getItem('stm_mode');
    if (mode === 'demo') {
      const saved = localStorage.getItem('stm_demo_notifs');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    }
    return [];
  });

  const [reports, setReports] = useState<ReportItem[]>(() => {
    const mode = localStorage.getItem('stm_mode');
    if (mode === 'demo') {
      const saved = localStorage.getItem('stm_demo_reports');
      return saved ? JSON.parse(saved) : INITIAL_REPORTS;
    }
    return [];
  });

  const [hasUnreadBubblePops, setHasUnreadBubblePops] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Loaders for Real vs Demo data
  const isLoggingOutRef = useRef(false);

  const loadRealUserData = useCallback(async (uid: string) => {
    const profile = await getRealUserProfile(uid);
    if (profile) {
      setCurrentUser(profile);
    }
    const countries = await getRealCountryVisits(uid);
    setCountryVisits(countries); // Strictly empty if user hasn't visited any!
    const regions = await getRealRegionVisits(uid);
    setRegionVisits(regions); // Strictly empty if user hasn't visited any!
    const records = await getRealTravelRecords(uid);
    setTravelRecords(records); // Strictly empty if user has no records!

    const [realProfiles, realFriendships, realRequests, realBubbles, realNotifs] = await Promise.all([
      getRealPublicProfiles(),
      getRealFriendships(uid),
      getRealFriendRequests(uid),
      getRealBubblePops(uid),
      getRealNotifications(uid),
    ]);

    // Clean up any legacy user-doyun data if present
    const finalRequests = realRequests.filter(
      (r) => r.fromUid !== 'user-doyun' && r.toUid !== 'user-doyun'
    );
    const finalNotifs = realNotifs.filter((n) => n.fromUid !== 'user-doyun');

    setPublicProfiles(realProfiles);
    setFriendships(realFriendships);
    setFriendRequests(finalRequests);
    setBubblePops(realBubbles);
    setNotifications(finalNotifs);
    const rawBookmarks = localStorage.getItem(`stm_real_bookmarks_${uid}`);
    setBookmarks(rawBookmarks ? JSON.parse(rawBookmarks) : []);
  }, []);

  const loadDemoData = useCallback(() => {
    const savedDemoUser = localStorage.getItem('stm_demo_user');
    setCurrentUser(savedDemoUser ? JSON.parse(savedDemoUser) : CURRENT_USER);
    const savedCountries = localStorage.getItem('stm_demo_countries');
    setCountryVisits(savedCountries ? JSON.parse(savedCountries) : INITIAL_COUNTRIES);
    const savedRegions = localStorage.getItem('stm_demo_regions');
    setRegionVisits(savedRegions ? JSON.parse(savedRegions) : INITIAL_REGIONS);
    const savedRecords = localStorage.getItem('stm_demo_records');
    setTravelRecords(savedRecords ? JSON.parse(savedRecords) : INITIAL_TRAVEL_RECORDS);
    const savedFriendships = localStorage.getItem('stm_demo_friendships');
    setFriendships(savedFriendships ? JSON.parse(savedFriendships) : INITIAL_FRIENDSHIPS);
    const savedRequests = localStorage.getItem('stm_demo_requests');
    setFriendRequests(savedRequests ? JSON.parse(savedRequests) : INITIAL_FRIEND_REQUESTS);
    const savedBookmarks = localStorage.getItem('stm_demo_bookmarks');
    setBookmarks(savedBookmarks ? JSON.parse(savedBookmarks) : INITIAL_BOOKMARKS);
    const savedBubbles = localStorage.getItem('stm_demo_bubbles');
    setBubblePops(savedBubbles ? JSON.parse(savedBubbles) : INITIAL_BUBBLE_POPS);
    const savedNotifs = localStorage.getItem('stm_demo_notifs');
    setNotifications(savedNotifs ? JSON.parse(savedNotifs) : INITIAL_NOTIFICATIONS);
    const savedProfiles = localStorage.getItem('stm_demo_profiles');
    setPublicProfiles(savedProfiles ? JSON.parse(savedProfiles) : OTHER_USERS);
  }, []);

  // Firebase auth state listener
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (isLoggingOutRef.current) {
          setAuthStatus('unauthenticated');
          return;
        }

        if (fbUser) {
          localStorage.setItem('stm_real_session', JSON.stringify({ uid: fbUser.uid, email: fbUser.email }));
          localStorage.removeItem('stm_mode');
          let existingProfile = await getRealUserProfile(fbUser.uid);
          if (!existingProfile) {
            existingProfile = createDefaultUserProfile(
              fbUser.uid,
              fbUser.email || '',
              fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : '여행자')
            );
            await saveRealUserProfile(existingProfile);
          }
          await loadRealUserData(fbUser.uid);
          setAuthStatus('authenticated');
        } else {
          localStorage.removeItem('stm_real_session');
          const mode = localStorage.getItem('stm_mode');
          if (mode === 'demo') {
            loadDemoData();
            setAuthStatus('demo');
          } else {
            setAuthStatus('unauthenticated');
          }
        }
      });
      return () => unsubscribe();
    } else {
      const mode = localStorage.getItem('stm_mode');
      if (mode === 'demo') {
        loadDemoData();
        setAuthStatus('demo');
      } else {
        const realSession = localStorage.getItem('stm_real_session');
        if (realSession) {
          const session = JSON.parse(realSession);
          loadRealUserData(session.uid);
          setAuthStatus('authenticated');
        } else {
          setAuthStatus('unauthenticated');
        }
      }
    }
  }, [loadRealUserData, loadDemoData]);

  // Separate persistence per mode
  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('stm_demo_user', JSON.stringify(currentUser));
    } else if (authStatus === 'authenticated') {
      saveRealUserProfile(currentUser);
    }
  }, [currentUser, isDemoMode, authStatus]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('stm_demo_profiles', JSON.stringify(publicProfiles));
    } else if (authStatus === 'authenticated') {
      localStorage.setItem('stm_real_profiles', JSON.stringify(publicProfiles));
    }
  }, [publicProfiles, isDemoMode, authStatus]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('stm_demo_countries', JSON.stringify(countryVisits));
    }
  }, [countryVisits, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('stm_demo_regions', JSON.stringify(regionVisits));
    }
  }, [regionVisits, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('stm_demo_records', JSON.stringify(travelRecords));
    }
  }, [travelRecords, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('stm_demo_friendships', JSON.stringify(friendships));
    } else if (authStatus === 'authenticated') {
      localStorage.setItem(`stm_real_friendships_${currentUser.uid}`, JSON.stringify(friendships));
    }
  }, [friendships, isDemoMode, authStatus, currentUser.uid]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('stm_demo_requests', JSON.stringify(friendRequests));
    } else if (authStatus === 'authenticated') {
      localStorage.setItem(`stm_real_friend_requests_${currentUser.uid}`, JSON.stringify(friendRequests));
    }
  }, [friendRequests, isDemoMode, authStatus, currentUser.uid]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('stm_demo_blocks', JSON.stringify(blocks));
    }
  }, [blocks, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('stm_demo_bookmarks', JSON.stringify(bookmarks));
    } else if (authStatus === 'authenticated') {
      localStorage.setItem(`stm_real_bookmarks_${currentUser.uid}`, JSON.stringify(bookmarks));
    }
  }, [bookmarks, isDemoMode, authStatus, currentUser.uid]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('stm_demo_bubbles', JSON.stringify(bubblePops));
    } else if (authStatus === 'authenticated') {
      localStorage.setItem(`stm_real_bubbles_${currentUser.uid}`, JSON.stringify(bubblePops));
    }
  }, [bubblePops, isDemoMode, authStatus, currentUser.uid]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('stm_demo_notifs', JSON.stringify(notifications));
    } else if (authStatus === 'authenticated') {
      localStorage.setItem(`stm_real_notifs_${currentUser.uid}`, JSON.stringify(notifications));
    }
  }, [notifications, isDemoMode, authStatus, currentUser.uid]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('stm_demo_reports', JSON.stringify(reports));
    }
  }, [reports, isDemoMode]);

  // Toast Helper
  const showToast = useCallback((text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Meetup (약속잡기) Modal State
  const [isMeetupModalOpen, setIsMeetupModalOpen] = useState(false);
  const [activeMeetupId, setActiveMeetupId] = useState<string | null>(null);
  const [prefilledFriendUidForMeetup, setPrefilledFriendUidForMeetup] = useState<string | null>(null);

  const onPlanTripTogether = useCallback((targetUid: string, recordId?: string) => {
    setPrefilledFriendUidForMeetup(targetUid);
    setIsMeetupModalOpen(true);
  }, []);

  const sendMeetupInviteToFriends = useCallback((groupId: string, meetupName: string, friendUids: string[]) => {
    const now = new Date().toISOString();
    friendUids.forEach((fUid) => {
      const notif: NotificationItem = {
        id: `notif-${Date.now()}-${fUid}`,
        type: 'meeting_invite',
        fromUid: currentUser.uid,
        fromName: currentUser.name,
        fromPhotoURL: currentUser.photoURL,
        targetMeetupId: groupId,
        message: `${currentUser.name}님이 "${meetupName}" 약속에 초대했습니다.`,
        isRead: false,
        createdAt: now,
      };
      setNotifications((prev) => [notif, ...prev]);
      if (!isDemoMode) {
        saveRealNotification(fUid, notif);
      }
    });
  }, [currentUser, isDemoMode]);

  // Helper Checkers
  const isFriend = useCallback((targetUid: string) => {
    if (targetUid === currentUser.uid) return true;
    return friendships.some((f) => f.uids.includes(currentUser.uid) && f.uids.includes(targetUid));
  }, [friendships, currentUser.uid]);

  const isBlocked = useCallback((targetUid: string) => {
    return !!blocks[targetUid];
  }, [blocks]);

  const isBookmarked = useCallback((recordId: string) => {
    return bookmarks.some((b) => b.recordId === recordId && b.ownerUid === currentUser.uid);
  }, [bookmarks, currentUser.uid]);

  // Profile Sync
  const syncPublicProfile = useCallback((uid: string, updates: Partial<PublicProfile>) => {
    setPublicProfiles((prev) => ({
      ...prev,
      [uid]: {
        ...prev[uid],
        ...updates,
        uid,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      const next = { ...prev, ...updates };
      // Sync to publicProfile
      syncPublicProfile(next.uid, {
        name: next.name,
        photoURL: next.photoURL,
        bio: next.bio,
        isPublicAccount: next.isPublicAccount,
        likeCountVisible: next.likeCountVisible,
        bubblePopReactionCountVisible: next.bubblePopReactionCountVisible,
      });
      if (!isDemoMode && next.uid) {
        saveRealUserProfile(next);
      }
      return next;
    });
    showToast('프로필 및 설정이 저장되었습니다.', 'success');
  }, [syncPublicProfile, isDemoMode, showToast]);

  // Country / Region Visit & Wishlist Toggles (+ / - counter logic)
  const toggleCountryVisit = useCallback((code: string, name: string) => {
    setCountryVisits((prev) => {
      const current = prev[code] || {
        code,
        name,
        visited: false,
        visitCount: 0,
        wishlist: false,
        photos: [],
      };
      // Initial registration sets visitCount to 1 and visited to true
      const updated: CountryVisit = {
        ...current,
        visited: true,
        visitCount: Math.max(1, current.visitCount || 1),
        lastVisitedAt: new Date().toISOString(),
      };
      if (!isDemoMode && currentUser.uid) {
        saveRealCountryVisit(currentUser.uid, code, updated);
      }
      return {
        ...prev,
        [code]: updated,
      };
    });
  }, [isDemoMode, currentUser.uid]);

  const incrementCountryVisit = useCallback((code: string, name: string) => {
    setCountryVisits((prev) => {
      const current = prev[code] || {
        code,
        name,
        visited: false,
        visitCount: 0,
        wishlist: false,
        photos: [],
      };
      const nextCount = (current.visitCount || 0) + 1;
      const updated: CountryVisit = {
        ...current,
        visited: true,
        visitCount: nextCount,
        lastVisitedAt: new Date().toISOString(),
      };
      if (!isDemoMode && currentUser.uid) {
        saveRealCountryVisit(currentUser.uid, code, updated);
      }
      return {
        ...prev,
        [code]: updated,
      };
    });
  }, [isDemoMode, currentUser.uid]);

  const decrementCountryVisit = useCallback((code: string, name: string) => {
    setCountryVisits((prev) => {
      const current = prev[code];
      if (!current || (current.visitCount || 0) <= 0) return prev;
      const nextCount = (current.visitCount || 0) - 1;
      const willVisit = nextCount > 0;
      const updated: CountryVisit = {
        ...current,
        visited: willVisit,
        visitCount: nextCount,
      };
      if (!isDemoMode && currentUser.uid) {
        saveRealCountryVisit(currentUser.uid, code, updated);
      }
      return {
        ...prev,
        [code]: updated,
      };
    });
  }, [isDemoMode, currentUser.uid]);

  const toggleCountryWishlist = useCallback((code: string, name: string) => {
    setCountryVisits((prev) => {
      const current = prev[code] || {
        code,
        name,
        visited: false,
        visitCount: 0,
        wishlist: false,
        photos: [],
      };
      const updated: CountryVisit = {
        ...current,
        wishlist: !current.wishlist,
      };
      if (!isDemoMode && currentUser.uid) {
        saveRealCountryVisit(currentUser.uid, code, updated);
      }
      return {
        ...prev,
        [code]: updated,
      };
    });
  }, [isDemoMode, currentUser.uid]);

  const toggleRegionVisit = useCallback((code: string, name: string) => {
    setRegionVisits((prev) => {
      const current = prev[code] || {
        code,
        name,
        visited: false,
        visitCount: 0,
        wishlist: false,
        photos: [],
      };
      // Initial registration sets visitCount to 1 and visited to true
      const updated: RegionVisit = {
        ...current,
        visited: true,
        visitCount: Math.max(1, current.visitCount || 1),
        lastVisitedAt: new Date().toISOString(),
      };
      if (!isDemoMode && currentUser.uid) {
        saveRealRegionVisit(currentUser.uid, code, updated);
      }
      return {
        ...prev,
        [code]: updated,
      };
    });
  }, [isDemoMode, currentUser.uid]);

  const incrementRegionVisit = useCallback((code: string, name: string) => {
    setRegionVisits((prev) => {
      const current = prev[code] || {
        code,
        name,
        visited: false,
        visitCount: 0,
        wishlist: false,
        photos: [],
      };
      const nextCount = (current.visitCount || 0) + 1;
      const updated: RegionVisit = {
        ...current,
        visited: true,
        visitCount: nextCount,
        lastVisitedAt: new Date().toISOString(),
      };
      if (!isDemoMode && currentUser.uid) {
        saveRealRegionVisit(currentUser.uid, code, updated);
      }
      return {
        ...prev,
        [code]: updated,
      };
    });
  }, [isDemoMode, currentUser.uid]);

  const decrementRegionVisit = useCallback((code: string, name: string) => {
    setRegionVisits((prev) => {
      const current = prev[code];
      if (!current || (current.visitCount || 0) <= 0) return prev;
      const nextCount = (current.visitCount || 0) - 1;
      const willVisit = nextCount > 0;
      const updated: RegionVisit = {
        ...current,
        visited: willVisit,
        visitCount: nextCount,
      };
      if (!isDemoMode && currentUser.uid) {
        saveRealRegionVisit(currentUser.uid, code, updated);
      }
      return {
        ...prev,
        [code]: updated,
      };
    });
  }, [isDemoMode, currentUser.uid]);

  const toggleRegionWishlist = useCallback((code: string, name: string) => {
    setRegionVisits((prev) => {
      const current = prev[code] || {
        code,
        name,
        visited: false,
        visitCount: 0,
        wishlist: false,
        photos: [],
      };
      const updated: RegionVisit = {
        ...current,
        wishlist: !current.wishlist,
      };
      if (!isDemoMode && currentUser.uid) {
        saveRealRegionVisit(currentUser.uid, code, updated);
      }
      return {
        ...prev,
        [code]: updated,
      };
    });
  }, [isDemoMode, currentUser.uid]);

  const addPhotoToLocation = useCallback((type: 'country' | 'region', code: string, photoURL: string, caption?: string) => {
    const photoId = `photo-${Date.now()}`;
    const newPhoto = {
      id: photoId,
      storagePath: `users/${currentUser.uid}/${type === 'country' ? 'countries' : 'regions'}/${code}/photos/${photoId}.jpg`,
      downloadURL: photoURL,
      hidden: false,
      createdAt: new Date().toISOString(),
      caption,
    };

    if (type === 'country') {
      setCountryVisits((prev) => {
        const item = prev[code] || { code, name: code, visited: true, visitCount: 1, wishlist: false, photos: [] };
        return {
          ...prev,
          [code]: {
            ...item,
            visited: true,
            photos: [...(item.photos || []), newPhoto],
          },
        };
      });
    } else {
      setRegionVisits((prev) => {
        const item = prev[code] || { code, name: code, visited: true, visitCount: 1, wishlist: false, photos: [] };
        return {
          ...prev,
          [code]: {
            ...item,
            visited: true,
            photos: [...(item.photos || []), newPhoto],
          },
        };
      });
    }
    showToast('사진이 추가되었습니다 📸', 'success');
  }, [currentUser.uid, showToast]);

  // Travel Records CRUD
  const createTravelRecord = useCallback((recordData: Omit<TravelRecord, 'id' | 'createdAt' | 'updatedAt' | 'likeCount' | 'commentCount' | 'hidden' | 'authorUid' | 'authorName' | 'authorPhotoURL' | 'randomSeed'>) => {
    const newRecordId = `record-${Date.now()}`;
    const now = new Date().toISOString();
    const newRecord: TravelRecord = {
      ...recordData,
      id: newRecordId,
      authorUid: currentUser.uid,
      authorName: currentUser.name,
      authorPhotoURL: currentUser.photoURL,
      randomSeed: Math.random(),
      likeCount: 0,
      commentCount: 0,
      hidden: false,
      createdAt: now,
      updatedAt: now,
      likes: {},
      comments: [],
    };

    setTravelRecords((prev) => {
      if (!isDemoMode) {
        saveRealTravelRecord(newRecord);
      }
      return [newRecord, ...prev];
    });

    // Send notifications to companionUids (PART 17-2 & 21-4)
    if (recordData.companionUids && recordData.companionUids.length > 0) {
      recordData.companionUids.forEach((companionUid) => {
        const notif: NotificationItem = {
          id: `notif-${Date.now()}-${companionUid}`,
          type: 'tagged_in_record',
          fromUid: currentUser.uid,
          fromName: currentUser.name,
          fromPhotoURL: currentUser.photoURL,
          targetRecordId: newRecordId,
          message: `${currentUser.name}님이 여행 기록 "${newRecord.title}"에 함께한 사람으로 태그했습니다.`,
          isRead: false,
          createdAt: now,
        };
        setNotifications((prev) => [notif, ...prev]);
      });
    }

    showToast('새로운 여행 기록이 등록되었습니다 ✨', 'success');
  }, [currentUser, showToast]);

  const updateTravelRecord = useCallback((id: string, updates: Partial<TravelRecord>) => {
    setTravelRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === id) {
          return {
            ...rec,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        return rec;
      })
    );
    showToast('여행 기록이 수정되었습니다.', 'success');
  }, [showToast]);

  const deleteTravelRecord = useCallback((id: string) => {
    if (!isDemoMode) {
      deleteRealTravelRecord(id);
    }
    setTravelRecords((prev) => prev.filter((r) => r.id !== id));
    setBookmarks((prev) => prev.filter((b) => b.recordId !== id));
    showToast('여행 기록이 삭제되었습니다.', 'info');
  }, [isDemoMode, showToast]);

  const toggleLikeRecord = useCallback((recordId: string) => {
    const myUid = currentUser.uid;
    setTravelRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === recordId) {
          const currentLikes = rec.likes || {};
          const isCurrentlyLiked = !!currentLikes[myUid];
          const newLikes = { ...currentLikes };
          let newCount = rec.likeCount;

          if (isCurrentlyLiked) {
            delete newLikes[myUid];
            newCount = Math.max(0, newCount - 1);
          } else {
            newLikes[myUid] = true;
            newCount += 1;

            // Notify author if not self (PART 17-2)
            if (rec.authorUid !== myUid) {
              const notif: NotificationItem = {
                id: `notif-${Date.now()}-like`,
                type: 'like',
                fromUid: currentUser.uid,
                fromName: currentUser.name,
                fromPhotoURL: currentUser.photoURL,
                targetRecordId: recordId,
                message: `${currentUser.name}님이 회원님의 여행 기록을 좋아합니다.`,
                isRead: false,
                createdAt: new Date().toISOString(),
              };
              setNotifications((nPrev) => [notif, ...nPrev]);
            }
          }

          return {
            ...rec,
            likes: newLikes,
            likeCount: newCount,
          };
        }
        return rec;
      })
    );
  }, [currentUser]);

  // Comment with 5-Second Cooldown (PART 11-7 & 25-5-3)
  const addCommentToRecord = useCallback(async (recordId: string, content: string): Promise<boolean> => {
    const now = Date.now();
    const lastCommentTime = currentUser.lastCommentAt ? new Date(currentUser.lastCommentAt).getTime() : 0;
    const diffSeconds = (now - lastCommentTime) / 1000;

    if (diffSeconds < 5) {
      showToast(`댓글은 5초에 한 번만 작성할 수 있습니다. (${Math.ceil(5 - diffSeconds)}초 후 가능)`, 'warning');
      return false;
    }

    const commentId = `comment-${now}`;
    const commentItem = {
      id: commentId,
      authorUid: currentUser.uid,
      authorName: currentUser.name,
      authorPhotoURL: currentUser.photoURL,
      content: content.trim(),
      createdAt: new Date(now).toISOString(),
    };

    // Update current user lastCommentAt
    setCurrentUser((prev) => ({
      ...prev,
      lastCommentAt: new Date(now).toISOString(),
    }));

    setTravelRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === recordId) {
          const updatedComments = [...(rec.comments || []), commentItem];
          // Notify author if not self
          if (rec.authorUid !== currentUser.uid) {
            const notif: NotificationItem = {
              id: `notif-${now}-comment`,
              type: 'comment',
              fromUid: currentUser.uid,
              fromName: currentUser.name,
              fromPhotoURL: currentUser.photoURL,
              targetRecordId: recordId,
              message: `${currentUser.name}님이 댓글을 남겼습니다: "${content.slice(0, 30)}${content.length > 30 ? '...' : ''}"`,
              isRead: false,
              createdAt: new Date(now).toISOString(),
            };
            setNotifications((nPrev) => [notif, ...nPrev]);
          }

          return {
            ...rec,
            comments: updatedComments,
            commentCount: updatedComments.length,
          };
        }
        return rec;
      })
    );

    showToast('댓글이 등록되었습니다 💬', 'success');
    return true;
  }, [currentUser, showToast]);

  const deleteComment = useCallback((recordId: string, commentId: string) => {
    setTravelRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === recordId) {
          const updatedComments = (rec.comments || []).filter((c) => c.id !== commentId);
          return {
            ...rec,
            comments: updatedComments,
            commentCount: updatedComments.length,
          };
        }
        return rec;
      })
    );
    showToast('댓글이 삭제되었습니다.', 'info');
  }, [showToast]);

  // Social Connections & Requests (PART 7-6 ~ 7-8 & PART 25)
  const sendFriendRequest = useCallback((toUid: string): { success: boolean; error?: string } => {
    // Check if 24h cooldown applies if previously rejected
    const existingReq = friendRequests.find(
      (r) => r.fromUid === currentUser.uid && r.toUid === toUid
    );

    if (existingReq) {
      if (existingReq.status === 'pending') {
        return { success: false, error: '이미 친구 요청을 보낸 상태입니다.' };
      }
      if (existingReq.status === 'rejected' && existingReq.respondedAt) {
        const cooldownRemaining = 24 * 3600000 - (Date.now() - new Date(existingReq.respondedAt).getTime());
        if (cooldownRemaining > 0) {
          const hoursLeft = Math.ceil(cooldownRemaining / 3600000);
          return { success: false, error: `거절된 요청은 24시간 후 재요청 가능합니다. (${hoursLeft}시간 남음)` };
        }
      }
    }

    const requestId = `${currentUser.uid}_${toUid}`;
    const newReq: FriendRequest = {
      id: requestId,
      fromUid: currentUser.uid,
      fromName: currentUser.name,
      fromPhotoURL: currentUser.photoURL,
      toUid,
      toName: publicProfiles[toUid]?.name || '사용자',
      toPhotoURL: publicProfiles[toUid]?.photoURL,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setFriendRequests((prev) => [newReq, ...prev.filter((r) => r.id !== requestId)]);
    saveRealFriendRequest(newReq);

    // Notification to recipient
    const notif: NotificationItem = {
      id: `notif-${Date.now()}-freq`,
      type: 'friend_request',
      fromUid: currentUser.uid,
      fromName: currentUser.name,
      fromPhotoURL: currentUser.photoURL,
      message: `${currentUser.name}님이 친구 요청을 보냈습니다.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    // Send notification to recipient only
    saveRealNotification(toUid, notif);

    showToast('친구 요청을 보냈습니다 🤝', 'success');
    return { success: true };
  }, [currentUser, friendRequests, publicProfiles, showToast]);

  const cancelFriendRequest = useCallback((requestId: string) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
    deleteRealFriendRequest(requestId);
    showToast('친구 요청을 취소했습니다.', 'info');
  }, [showToast]);

  const acceptFriendRequest = useCallback((requestIdOrFromUid: string) => {
    // 1. Find existing request by requestId or by fromUid
    let req = friendRequests.find(
      (r) => r.id === requestIdOrFromUid || r.fromUid === requestIdOrFromUid
    );

    const fromUid = req ? req.fromUid : requestIdOrFromUid;
    const toUid = currentUser.uid;

    if (!req) {
      const senderProfile = publicProfiles[fromUid];
      const notifItem = notifications.find((n) => n.fromUid === fromUid && n.type === 'friend_request');
      const senderName = senderProfile?.name || notifItem?.fromName || '여행자';
      const senderPhoto = senderProfile?.photoURL || notifItem?.fromPhotoURL;

      req = {
        id: `${fromUid}_${toUid}`,
        fromUid,
        fromName: senderName,
        fromPhotoURL: senderPhoto,
        toUid,
        toName: currentUser.name,
        toPhotoURL: currentUser.photoURL,
        status: 'pending',
        createdAt: notifItem?.createdAt || new Date().toISOString(),
      };
    }

    const uids: [string, string] = fromUid < toUid ? [fromUid, toUid] : [toUid, fromUid];
    const friendshipId = `${uids[0]}_${uids[1]}`;
    const acceptedReq: FriendRequest = {
      ...req,
      toUid,
      status: 'accepted',
      respondedAt: new Date().toISOString(),
    };
    const newFriendship: Friendship = {
      id: friendshipId,
      uids,
      since: new Date().toISOString(),
    };

    // Update friend requests list - completely remove accepted request so it no longer sits in pending or sent requests
    setFriendRequests((prev) => {
      return prev.filter(
        (r) =>
          !(
            r.id === acceptedReq.id ||
            r.id === req.id ||
            (r.fromUid === fromUid && (r.toUid === toUid || r.toUid === 'user-me')) ||
            (r.toUid === fromUid && (r.fromUid === toUid || r.fromUid === 'user-me'))
          )
      );
    });
    deleteRealFriendRequest(acceptedReq.id);

    // Create bilateral friendship
    setFriendships((prev) => [...prev.filter((f) => f.id !== friendshipId), newFriendship]);
    saveRealFriendship(newFriendship);

    // Mark notifications from this sender as read
    setNotifications((prev) =>
      prev.map((n) => (n.fromUid === fromUid && n.type === 'friend_request' ? { ...n, isRead: true } : n))
    );

    // Notify requester
    const notif: NotificationItem = {
      id: `notif-${Date.now()}-faccept`,
      type: 'friend_accepted',
      fromUid: currentUser.uid,
      fromName: currentUser.name,
      fromPhotoURL: currentUser.photoURL,
      message: `${currentUser.name}님과 친구가 되었습니다. 서로의 여행 지도를 확인할 수 있어요!`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    saveRealNotification(fromUid, notif);

    const partnerName = publicProfiles[fromUid]?.name || req.fromName || '친구';
    showToast(`${partnerName}님과 친구가 되었습니다 🎉`, 'success');
  }, [friendRequests, currentUser, publicProfiles, notifications, showToast]);

  const rejectFriendRequest = useCallback((requestIdOrFromUid: string) => {
    let req = friendRequests.find(
      (r) => r.id === requestIdOrFromUid || r.fromUid === requestIdOrFromUid
    );
    const fromUid = req ? req.fromUid : requestIdOrFromUid;
    const toUid = currentUser.uid;

    const rejectedReq: FriendRequest = req
      ? {
          ...req,
          toUid,
          status: 'rejected',
          respondedAt: new Date().toISOString(),
          rejectedAt: new Date().toISOString(),
        }
      : {
          id: `${fromUid}_${toUid}`,
          fromUid,
          toUid,
          fromName: publicProfiles[fromUid]?.name || '여행자',
          toName: currentUser.name,
          status: 'rejected',
          createdAt: new Date().toISOString(),
          respondedAt: new Date().toISOString(),
          rejectedAt: new Date().toISOString(),
        };

    setFriendRequests((prev) => {
      const filtered = prev.filter(
        (r) => !(r.id === rejectedReq.id || (r.fromUid === fromUid && (r.toUid === toUid || r.toUid === 'user-me')))
      );
      return [rejectedReq, ...filtered];
    });
    saveRealFriendRequest(rejectedReq);

    // Mark notifications as read
    setNotifications((prev) =>
      prev.map((n) => (n.fromUid === fromUid && n.type === 'friend_request' ? { ...n, isRead: true } : n))
    );

    showToast('친구 요청을 거절했습니다.', 'info');
  }, [friendRequests, currentUser, publicProfiles, showToast]);

  const simulateReceiveFriendRequest = useCallback((fromUid?: string) => {
    const availableUids = Object.keys(OTHER_USERS).filter(
      (uid) => uid !== currentUser.uid && uid !== 'user-doyun' && !isFriend(uid)
    );

    const senderUid = fromUid || availableUids[Math.floor(Math.random() * availableUids.length)] || 'user-stranger';
    const sender = publicProfiles[senderUid] || OTHER_USERS[senderUid] || {
      uid: senderUid,
      name: '동료 여행자',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };

    const reqId = `${senderUid}_${currentUser.uid}`;
    const newReq: FriendRequest = {
      id: reqId,
      fromUid: senderUid,
      fromName: sender.name,
      fromPhotoURL: sender.photoURL,
      toUid: currentUser.uid,
      toName: currentUser.name,
      toPhotoURL: currentUser.photoURL,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setFriendRequests((prev) => [newReq, ...prev.filter((r) => r.id !== reqId)]);
    saveRealFriendRequest(newReq);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}-freq-sim`,
      type: 'friend_request',
      fromUid: senderUid,
      fromName: sender.name,
      fromPhotoURL: sender.photoURL,
      message: `${sender.name}님이 회원님에게 친구 요청을 보냈습니다.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
    saveRealNotification(currentUser.uid, notif);

    showToast(`${sender.name}님으로부터 친구 요청이 도착했습니다! 📩`, 'info');
  }, [currentUser, isFriend, publicProfiles, showToast]);

  const simulateAcceptSentRequest = useCallback((requestId: string) => {
    const req = friendRequests.find((r) => r.id === requestId);
    if (!req) return;

    const recipientUid = req.toUid;
    const recipientName = req.toName || publicProfiles[recipientUid]?.name || '여행자';
    const uids: [string, string] = currentUser.uid < recipientUid ? [currentUser.uid, recipientUid] : [recipientUid, currentUser.uid];
    const friendshipId = `${uids[0]}_${uids[1]}`;

    const acceptedReq: FriendRequest = {
      ...req,
      status: 'accepted',
      respondedAt: new Date().toISOString(),
    };

    const newFriendship: Friendship = {
      id: friendshipId,
      uids,
      since: new Date().toISOString(),
    };

    // Remove accepted request from friendRequests list so it is removed from sent requests
    setFriendRequests((prev) =>
      prev.filter(
        (r) =>
          !(
            r.id === requestId ||
            (r.fromUid === currentUser.uid && r.toUid === recipientUid) ||
            (r.toUid === currentUser.uid && r.fromUid === recipientUid)
          )
      )
    );
    deleteRealFriendRequest(requestId);

    setFriendships((prev) => [...prev.filter((f) => f.id !== friendshipId), newFriendship]);
    saveRealFriendship(newFriendship);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}-faccept-sim`,
      type: 'friend_accepted',
      fromUid: recipientUid,
      fromName: recipientName,
      fromPhotoURL: req.toPhotoURL,
      message: `${recipientName}님이 친구 요청을 수락했습니다 🎉 서로의 여행 지도와 기록을 공유할 수 있습니다!`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
    saveRealNotification(currentUser.uid, notif);

    showToast(`${recipientName}님이 친구 요청을 수락했습니다 🎉`, 'success');
  }, [friendRequests, currentUser.uid, publicProfiles, showToast]);

  const removeFriendship = useCallback((targetUid: string) => {
    const uids: [string, string] = currentUser.uid < targetUid ? [currentUser.uid, targetUid] : [targetUid, currentUser.uid];
    const friendshipId = `${uids[0]}_${uids[1]}`;
    setFriendships((prev) =>
      prev.filter((f) => !(f.uids.includes(currentUser.uid) && f.uids.includes(targetUid)))
    );
    deleteRealFriendship(friendshipId);
    showToast('친구 관계를 삭제했습니다.', 'info');
  }, [currentUser.uid, showToast]);

  const blockUser = useCallback((targetUid: string) => {
    // 1. Remove active friendship
    setFriendships((prev) =>
      prev.filter((f) => !(f.uids.includes(currentUser.uid) && f.uids.includes(targetUid)))
    );
    // 2. Add to blocks
    setBlocks((prev) => ({
      ...prev,
      [targetUid]: { blockedAt: new Date().toISOString() },
    }));
    showToast('사용자를 차단했습니다.', 'info');
  }, [currentUser.uid, showToast]);

  const unblockUser = useCallback((targetUid: string) => {
    setBlocks((prev) => {
      const next = { ...prev };
      delete next[targetUid];
      return next;
    });
    showToast('차단을 해제했습니다. (이전 친구 관계는 자동 복원되지 않습니다)', 'info');
  }, [showToast]);

  // Bookmarks
  const toggleBookmark = useCallback((recordId: string) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.recordId === recordId && b.ownerUid === currentUser.uid);
      if (exists) {
        showToast('북마크에서 제거되었습니다.', 'info');
        return prev.filter((b) => !(b.recordId === recordId && b.ownerUid === currentUser.uid));
      } else {
        showToast('북마크에 저장되었습니다 🔖', 'success');
        return [
          {
            id: `bm-${Date.now()}`,
            ownerUid: currentUser.uid,
            recordId,
            savedAt: new Date().toISOString(),
          },
          ...prev,
        ];
      }
    });
  }, [currentUser.uid, showToast]);

  // Bubble Pop
  const createBubblePop = useCallback((post: { type: 'text' | 'photo'; text?: string; downloadURL?: string }) => {
    const postId = `bubble-${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 3600000).toISOString();

    const newPost: BubblePopPost = {
      id: postId,
      authorUid: currentUser.uid,
      authorName: currentUser.name,
      authorPhotoURL: currentUser.photoURL,
      type: post.type,
      text: post.text,
      downloadURL: post.downloadURL,
      createdAt: now.toISOString(),
      expiresAt,
      reactionCounts: {
        heart: 0,
        sad: 0,
        angry: 0,
        thumbsUp: 0,
      },
      reactions: {},
    };

    setBubblePops((prev) => [newPost, ...prev]);
    saveRealBubblePop(newPost);
    showToast('Bubble Pop 이야기가 등록되었습니다 🫧 (24시간 후 자동 만료)', 'success');
  }, [currentUser, showToast]);

  const deleteBubblePop = useCallback((id: string) => {
    setBubblePops((prev) => prev.filter((b) => b.id !== id));
    deleteRealBubblePop(currentUser.uid, id);
    showToast('Bubble Pop이 삭제되었습니다.', 'info');
  }, [currentUser.uid, showToast]);

  const reactToBubblePop = useCallback((postId: string, emoji: BubbleEmoji) => {
    const myUid = currentUser.uid;
    setBubblePops((prev) =>
      prev.map((bubble) => {
        if (bubble.id === postId) {
          const currentReactions = bubble.reactions || {};
          const existingEmoji = currentReactions[myUid];
          const newReactions = { ...currentReactions };
          const newCounts = { ...bubble.reactionCounts };

          if (existingEmoji === emoji) {
            // Cancel reaction
            delete newReactions[myUid];
            newCounts[emoji] = Math.max(0, newCounts[emoji] - 1);
          } else {
            // If already reacted with another emoji, decrease previous
            if (existingEmoji) {
              newCounts[existingEmoji] = Math.max(0, newCounts[existingEmoji] - 1);
            }
            newReactions[myUid] = emoji;
            newCounts[emoji] = (newCounts[emoji] || 0) + 1;

            // Notify author if not self
            if (bubble.authorUid !== myUid) {
              const emojiSymbol = emoji === 'heart' ? '❤️' : emoji === 'sad' ? '😢' : emoji === 'angry' ? '😡' : '👍';
              const notif: NotificationItem = {
                id: `notif-${Date.now()}-breact`,
                type: 'bubble_reaction',
                fromUid: currentUser.uid,
                fromName: currentUser.name,
                fromPhotoURL: currentUser.photoURL,
                targetBubbleId: postId,
                message: `${currentUser.name}님이 회원님의 Bubble Pop에 ${emojiSymbol} 반응을 남겼습니다.`,
                isRead: false,
                createdAt: new Date().toISOString(),
              };
              setNotifications((nPrev) => [notif, ...nPrev]);
              saveRealNotification(bubble.authorUid, notif);
            }
          }

          const updatedBubble: BubblePopPost = {
            ...bubble,
            reactions: newReactions,
            reactionCounts: newCounts,
          };
          saveRealBubblePop(updatedBubble);
          return updatedBubble;
        }
        return bubble;
      })
    );
  }, [currentUser]);

  // Notifications
  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('모든 알림을 읽음 처리했습니다.', 'info');
  }, [showToast]);

  // Reports (PART 7-12)
  const createReport = useCallback((targetType: ReportTargetType, targetPath: string, reason: ReportReason, reasonDetail?: string): { success: boolean; error?: string } => {
    // 20 per day limit check
    if (currentUser.reportCount >= 20) {
      return { success: false, error: '일일 신고 가능 횟수(20건)를 초과했습니다. 자정 이후 다시 시도해주세요.' };
    }

    // Duplicate check
    const existing = reports.find((r) => r.reporterUid === currentUser.uid && r.targetPath === targetPath && r.status === 'pending');
    if (existing) {
      return { success: false, error: '이미 접수된 신고가 처리 대기 중입니다.' };
    }

    const reportId = `rep-${Date.now()}`;
    const newReport: ReportItem = {
      id: reportId,
      reporterUid: currentUser.uid,
      targetType,
      targetPath,
      reason,
      reasonDetail,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setReports((prev) => [newReport, ...prev]);
    setCurrentUser((prev) => ({
      ...prev,
      reportCount: prev.reportCount + 1,
    }));

    showToast('신고가 접수되었습니다. 관리자 검토 후 조치됩니다.', 'success');
    return { success: true };
  }, [currentUser, reports, showToast]);

  const updateReportStatus = useCallback((reportId: string, status: 'reviewed' | 'dismissed', hideTarget: boolean = false) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status } : r))
    );

    if (hideTarget) {
      const rep = reports.find((r) => r.id === reportId);
      if (rep) {
        if (rep.targetType === 'record') {
          setTravelRecords((prev) =>
            prev.map((rec) => (rec.id === rep.targetPath ? { ...rec, hidden: true } : rec))
          );
        }
      }
    }
    showToast(`신고가 ${status === 'reviewed' ? '처리' : '반려'}되었습니다.`, 'info');
  }, [reports, showToast]);

  // Stats and Badges (PART 21-5)
  const userStats = useMemo<TravelStats>(() => {
    const visitedCountries = Object.values(countryVisits).filter((c: any) => c.visited).length;
    const visitedRegions = Object.values(regionVisits).filter((r: any) => r.visited).length;
    const myRecords = travelRecords.filter((r) => r.authorUid === currentUser.uid && !r.hidden);
    const totalPhotos = myRecords.reduce((acc, r) => acc + (r.photoIds?.length || 1), 0);

    return {
      visitedCountriesCount: visitedCountries,
      visitedRegionsCount: visitedRegions,
      totalRecordsCount: myRecords.length,
      totalPhotosCount: totalPhotos,
    };
  }, [countryVisits, regionVisits, travelRecords, currentUser.uid]);

  const userBadges = useMemo<TravelBadge[]>(() => {
    return BADGE_DEFINITIONS.map((badgeDef) => {
      const cond = badgeDef.condition({
        visitedCountries: userStats.visitedCountriesCount,
        visitedRegions: userStats.visitedRegionsCount,
        totalRecords: userStats.totalRecordsCount,
        totalPhotos: userStats.totalPhotosCount,
      });
      return {
        id: badgeDef.id,
        title: badgeDef.title,
        description: badgeDef.description,
        icon: badgeDef.icon,
        achieved: cond.achieved,
        progressText: cond.progressText,
      };
    });
  }, [userStats]);

  // Account Deletion Multi-Step Flow (PART 4-5)
  const deleteAccount = useCallback(async (password: string): Promise<boolean> => {
    if (!password || password.length < 4) {
      showToast('비밀번호를 정확히 입력해주세요.', 'error');
      return false;
    }

    const myUid = currentUser.uid;

    // 1. Delete user bookmarks, notifications, bubblePops
    setBookmarks((prev) => prev.filter((b) => b.ownerUid !== myUid));
    setNotifications((prev) => prev.filter((n) => n.fromUid !== myUid));
    setBubblePops((prev) => prev.filter((b) => b.authorUid !== myUid));

    // 2. Remove user friendships & friend requests
    setFriendships((prev) => prev.filter((f) => !f.uids.includes(myUid)));
    setFriendRequests((prev) => prev.filter((r) => r.fromUid !== myUid && r.toUid !== myUid));

    // 3. Remove user travel records and associated comments/likes
    setTravelRecords((prev) =>
      prev
        .filter((r) => r.authorUid !== myUid)
        .map((r) => ({
          ...r,
          comments: (r.comments || []).filter((c) => c.authorUid !== myUid),
          likes: Object.fromEntries(Object.entries(r.likes || {}).filter(([uid]) => uid !== myUid)),
        }))
    );

    // 4. Clear storage & reset
    localStorage.clear();
    showToast('회원 탈퇴가 안전하게 완료되었습니다.', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 1200);

    return true;
  }, [currentUser.uid, showToast]);

  // Account Management
  const [passwordResetCooldownSeconds, setPasswordResetCooldownSeconds] = useState(0);

  useEffect(() => {
    if (passwordResetCooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setPasswordResetCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [passwordResetCooldownSeconds]);

  const requestPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    if (!email || !email.includes('@')) {
      showToast('올바른 이메일 주소를 입력해주세요.', 'error');
      return false;
    }
    try {
      if (auth) {
        await sendPasswordResetEmail(auth, email);
      }
      setPasswordResetCooldownSeconds(60);
      showToast(`${email} 주소로 비밀번호 재설정 링크가 발송되었습니다 ✉️`, 'success');
      return true;
    } catch (err: any) {
      const errInfo = getFirebaseAuthErrorMessage(err);
      showToast(errInfo.message, 'error');
      return false;
    }
  }, [showToast]);

  const completeOnboarding = useCallback(() => {
    setCurrentUser((prev) => {
      const updated = { ...prev, onboardingSeen: true };
      localStorage.setItem('stm_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetTrialAccount = useCallback(async (): Promise<boolean> => {
    // 18-2 Trial Account Instant Reset (batch restore baseline and clean ghost records)
    setCurrentUser(CURRENT_USER);
    setCountryVisits(INITIAL_COUNTRIES);
    setRegionVisits(INITIAL_REGIONS);
    setTravelRecords(INITIAL_TRAVEL_RECORDS);
    setFriendships(INITIAL_FRIENDSHIPS);
    setFriendRequests(INITIAL_FRIEND_REQUESTS);
    setBookmarks(INITIAL_BOOKMARKS);
    setBubblePops(INITIAL_BUBBLE_POPS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setReports(INITIAL_REPORTS);

    localStorage.removeItem('stm_countries');
    localStorage.removeItem('stm_regions');
    localStorage.removeItem('stm_records');
    localStorage.removeItem('stm_friendships');
    localStorage.removeItem('stm_requests');
    localStorage.removeItem('stm_bookmarks');
    localStorage.removeItem('stm_bubblepops');
    localStorage.removeItem('stm_notifications');
    localStorage.removeItem('stm_reports');
    localStorage.setItem('stm_user', JSON.stringify(CURRENT_USER));

    showToast('체험 계정이 초기 스냅샷 상태로 즉시 초기화되었습니다.', 'success');
    return true;
  }, [showToast]);

  const loginWithFirebase = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (auth) {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCred.user;
        const profile = await getRealUserProfile(fbUser.uid);
        if (profile) {
          setCurrentUser(profile);
        } else {
          const newProfile = createDefaultUserProfile(
            fbUser.uid,
            fbUser.email || email,
            fbUser.displayName || email.split('@')[0]
          );
          await saveRealUserProfile(newProfile);
          setCurrentUser(newProfile);
        }
        await loadRealUserData(fbUser.uid);
        localStorage.setItem('stm_real_session', JSON.stringify({ uid: fbUser.uid, email }));
        localStorage.removeItem('stm_mode');
        setAuthStatus('authenticated');
        showToast('성공적으로 로그인되었습니다.', 'success');
        return { success: true };
      } else {
        const accountsRaw = localStorage.getItem('stm_real_accounts');
        const accounts: Record<string, { uid: string; email: string; password: string; name: string }> = accountsRaw ? JSON.parse(accountsRaw) : {};
        const acc = accounts[email.toLowerCase()];
        if (!acc || acc.password !== password) {
          return { success: false, error: '이메일 또는 비밀번호가 일치하지 않습니다.' };
        }
        const profile = (await getRealUserProfile(acc.uid)) || createDefaultUserProfile(acc.uid, acc.email, acc.name);
        await saveRealUserProfile(profile);
        setCurrentUser(profile);
        await loadRealUserData(acc.uid);
        localStorage.setItem('stm_real_session', JSON.stringify({ uid: acc.uid, email }));
        localStorage.removeItem('stm_mode');
        setAuthStatus('authenticated');
        showToast('성공적으로 로그인되었습니다.', 'success');
        return { success: true };
      }
    } catch (err: any) {
      const errInfo = getFirebaseAuthErrorMessage(err);
      return { success: false, error: errInfo.message };
    }
  }, [loadRealUserData, showToast]);

  const signupWithFirebase = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (auth) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCred.user;
        const newProfile = createDefaultUserProfile(
          fbUser.uid,
          fbUser.email || email,
          name || fbUser.displayName || email.split('@')[0]
        );
        await saveRealUserProfile(newProfile);
        setCurrentUser(newProfile);
        setCountryVisits({});
        setRegionVisits({});
        setTravelRecords([]);
        setFriendships([]);
        setFriendRequests([]);
        setBookmarks([]);
        setBubblePops([]);
        setNotifications([]);
        const realProfiles = await getRealPublicProfiles();
        setPublicProfiles(realProfiles);
        localStorage.setItem('stm_real_session', JSON.stringify({ uid: fbUser.uid, email }));
        localStorage.removeItem('stm_mode');
        setAuthStatus('authenticated');
        showToast('회원가입이 완료되었습니다!', 'success');
        return { success: true };
      } else {
        const accountsRaw = localStorage.getItem('stm_real_accounts');
        const accounts: Record<string, { uid: string; email: string; password: string; name: string }> = accountsRaw ? JSON.parse(accountsRaw) : {};
        if (accounts[email.toLowerCase()]) {
          return { success: false, error: '이미 등록된 이메일 주소입니다.' };
        }
        const uid = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
        accounts[email.toLowerCase()] = { uid, email, password, name };
        localStorage.setItem('stm_real_accounts', JSON.stringify(accounts));
        const newProfile = createDefaultUserProfile(uid, email, name);
        await saveRealUserProfile(newProfile);
        setCurrentUser(newProfile);
        setCountryVisits({});
        setRegionVisits({});
        setTravelRecords([]);
        setFriendships([]);
        setFriendRequests([]);
        setBookmarks([]);
        setBubblePops([]);
        setNotifications([]);
        localStorage.setItem('stm_real_session', JSON.stringify({ uid, email }));
        localStorage.removeItem('stm_mode');
        setAuthStatus('authenticated');
        showToast('회원가입이 완료되었습니다!', 'success');
        return { success: true };
      }
    } catch (err: any) {
      const errInfo = getFirebaseAuthErrorMessage(err);
      return { success: false, error: errInfo.message };
    }
  }, [showToast]);

  const logout = useCallback(async () => {
    isLoggingOutRef.current = true;
    localStorage.removeItem('stm_real_session');
    localStorage.removeItem('stm_mode');
    setIsSettingsOpen(false);
    setActiveRecordDetail(null);
    setIsFriendRequestsCenterOpen(false);
    setAuthStatus('unauthenticated');
    setCurrentUser(CURRENT_USER);

    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Signout error:', err);
      }
    }
    isLoggingOutRef.current = false;
    showToast('로그아웃되었습니다.', 'info');
  }, [showToast]);

  const enterDemoMode = useCallback(() => {
    localStorage.setItem('stm_mode', 'demo');
    loadDemoData();
    setAuthStatus('demo');
    showToast('체험하기 모드로 전환되었습니다. 샘플 데이터로 둘러보세요.', 'info');
  }, [loadDemoData, showToast]);

  const exitDemoMode = useCallback(() => {
    isLoggingOutRef.current = true;
    localStorage.removeItem('stm_mode');
    localStorage.removeItem('stm_real_session');
    setIsSettingsOpen(false);
    setActiveRecordDetail(null);
    setIsFriendRequestsCenterOpen(false);
    setAuthStatus('unauthenticated');
    setCurrentUser(CURRENT_USER);
    isLoggingOutRef.current = false;
    showToast('체험 모드를 종료하고 로그인 화면으로 전환했습니다.', 'info');
  }, [showToast]);

  return (
    <AppContext.Provider
      value={{
        authStatus,
        isDemoMode,
        loginWithFirebase,
        signupWithFirebase,
        logout,
        enterDemoMode,
        exitDemoMode,
        activeTab,
        setActiveTab,
        isSettingsOpen,
        setIsSettingsOpen,
        selectedUserProfileUid,
        setSelectedUserProfileUid,
        currentUser,
        publicProfiles,
        updateUserProfile,
        syncPublicProfile,
        countryVisits,
        regionVisits,
        toggleCountryVisit,
        incrementCountryVisit,
        decrementCountryVisit,
        toggleCountryWishlist,
        toggleRegionVisit,
        incrementRegionVisit,
        decrementRegionVisit,
        toggleRegionWishlist,
        addPhotoToLocation,
        travelRecords,
        activeRecordDetail,
        setActiveRecordDetail,
        activeRecordEditing,
        setActiveRecordEditing,
        isRecordComposerOpen,
        setIsRecordComposerOpen,
        composerPrefill,
        setComposerPrefill,
        createTravelRecord,
        updateTravelRecord,
        deleteTravelRecord,
        toggleLikeRecord,
        addCommentToRecord,
        deleteComment,
        friendships,
        friendRequests,
        blocks,
        isFriend,
        isBlocked,
        sendFriendRequest,
        cancelFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        simulateReceiveFriendRequest,
        simulateAcceptSentRequest,
        removeFriendship,
        removeFriend: removeFriendship,
        blockUser,
        unblockUser,
        bookmarks,
        isBookmarked,
        toggleBookmark,
        bubblePops,
        createBubblePop,
        deleteBubblePop,
        reactToBubblePop,
        hasUnreadBubblePops,
        setHasUnreadBubblePops,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        reports,
        createReport,
        updateReportStatus,
        isAdminReportModalOpen,
        setIsAdminReportModalOpen,
        toasts,
        showToast,
        onPlanTripTogether,
        isMeetupModalOpen,
        setIsMeetupModalOpen,
        activeMeetupId,
        setActiveMeetupId,
        prefilledFriendUidForMeetup,
        setPrefilledFriendUidForMeetup,
        sendMeetupInviteToFriends,
        userStats,
        userBadges,
        isFriendRequestsCenterOpen,
        setIsFriendRequestsCenterOpen,
        friendRequestsCenterTab,
        setFriendRequestsCenterTab,
        openFriendRequestsCenter,
        isPasswordResetModalOpen,
        setIsPasswordResetModalOpen,
        passwordResetCooldownSeconds,
        requestPasswordReset,
        isDeleteAccountModalOpen,
        setIsDeleteAccountModalOpen,
        deleteAccount,
        isHelpModalOpen,
        setIsHelpModalOpen,
        completeOnboarding,
        resetTrialAccount,
        theme,
        isDarkMode,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
