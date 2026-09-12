/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'user' | 'admin';

export type MapType = 'world' | 'domestic';
export type MapMode = 'friend' | 'me';
export type RecordVisibility = 'public' | 'friends' | 'private';
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';
export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'comment'
  | 'like'
  | 'tagged_in_record'
  | 'bubble_reaction'
  | 'meeting_invite'
  | 'meeting_reminder';
export type BubbleEmoji = 'heart' | 'sad' | 'angry' | 'thumbsUp';
export type ReportTargetType = 'photo' | 'comment' | 'record';
export type ReportReason = 'inappropriate' | 'spam' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';

export interface MapSettings {
  myMapDefault: MapType;
  friendMapDefault: MapType;
  activityWindowDays: 1 | 7 | 30;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  role: UserRole;
  onboardingSeen: boolean;
  theme: 'light' | 'dark' | 'system';
  friendRequestCount: number;
  friendRequestResetAt: string;
  lastCommentAt?: string;
  reportCount: number;
  reportCountResetAt: string;
  mapSettings: MapSettings;
  likeCountVisible: boolean;
  bubblePopReactionCountVisible: boolean;
  isPublicAccount: boolean;
  bio: string;
  bubblePopComposerWarningDismissed: boolean;
  createdAt: string;
}

export interface PublicProfile {
  uid: string;
  name: string;
  photoURL?: string;
  bio?: string;
  isPublicAccount: boolean;
  likeCountVisible: boolean;
  bubblePopReactionCountVisible: boolean;
  updatedAt: string;
}

export interface LocationPhoto {
  id: string;
  storagePath: string;
  thumbnailPath?: string;
  downloadURL: string;
  thumbnailURL?: string;
  hidden: boolean;
  createdAt: string;
  caption?: string;
}

export interface CountryVisit {
  code: string;
  name: string;
  visited: boolean;
  visitCount: number;
  wishlist: boolean;
  photos: LocationPhoto[];
  lastVisitedAt?: string;
}

export interface RegionVisit {
  code: string;
  name: string;
  visited: boolean;
  visitCount: number;
  wishlist: boolean;
  photos: LocationPhoto[];
  lastVisitedAt?: string;
}

export interface CommentItem {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: string;
}

export interface TravelRecord {
  id: string;
  title: string;
  description: string;
  countryCode: string;
  countryName?: string;
  regionCode?: string | null;
  regionName?: string | null;
  cityName?: string | null;
  visitDate: string;
  photoIds: string[];
  photoURLs?: string[];
  coverPhotoId?: string;
  visibility: RecordVisibility;
  tags: string[];
  companionUids: string[];
  companionNames?: string[];
  randomSeed: number;
  likeCount: number;
  commentCount: number;
  hidden: boolean;
  authorUid: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: string;
  updatedAt: string;
  likes?: Record<string, boolean>;
  comments?: CommentItem[];
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromName: string;
  fromPhotoURL?: string;
  toUid: string;
  toName: string;
  toPhotoURL?: string;
  status: FriendRequestStatus;
  createdAt: string;
  respondedAt?: string | null;
}

export interface Friendship {
  id: string;
  uids: [string, string];
  since: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  fromUid: string;
  fromName: string;
  fromPhotoURL?: string;
  targetRecordId?: string | null;
  targetBubbleId?: string | null;
  targetMeetupId?: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface BookmarkItem {
  id: string;
  ownerUid: string;
  recordId: string;
  savedAt: string;
}

export interface BubbleReactionCounts {
  heart: number;
  sad: number;
  angry: number;
  thumbsUp: number;
}

export interface BubblePopPost {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhotoURL?: string;
  type: 'text' | 'photo';
  text?: string | null;
  storagePath?: string | null;
  downloadURL?: string | null;
  createdAt: string;
  expiresAt: string;
  reactionCounts: BubbleReactionCounts;
  reactions?: Record<string, BubbleEmoji>;
}

export interface ReportItem {
  id: string;
  reporterUid: string;
  targetType: ReportTargetType;
  targetPath: string;
  reason: ReportReason;
  reasonDetail?: string;
  status: ReportStatus;
  createdAt: string;
}

export interface TravelBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  achieved: boolean;
  progressText: string;
}

export interface TravelStats {
  visitedCountriesCount: number;
  visitedRegionsCount: number;
  totalRecordsCount: number;
  totalPhotosCount: number;
}

export interface NavItemConfig {
  id: 'search' | 'bubble' | 'map' | 'friend' | 'profile';
  icon: string;
  label: string;
  path: string;
  emphasize?: boolean;
}

// Meetup (약속잡기) Interfaces
export type ScheduleAnswerStatus = 'X' | 'O' | '△';

export interface MeetupGroup {
  id: string;
  name: string;
  type: 'date' | 'time';
  passwordHash: string;
  periodDays: number;
  deadlineAt: any; // ISO string or Firestore Timestamp
  createdBy: string; // author uid
  creatorName?: string;
  createdAt: any;
  members: string[]; // participant userKeys/uids
  invitedFriendUids?: string[];
  inviteCode?: string;
}

export interface MeetupResponse {
  userKey: string;
  userName: string;
  answers: Record<string, ScheduleAnswerStatus>;
  updatedAt?: any;
}

export interface MeetupInvitation {
  code: string;
  groupId: string;
  createdAt: any;
}
