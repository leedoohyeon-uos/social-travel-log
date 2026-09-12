/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/services/firebaseDataService.ts
 * Real Firebase data service for Travel Log.
 * Handles reading & writing real user collections:
 * - /users/{uid}
 * - /users/{uid}/countries/{code}
 * - /users/{uid}/regions/{code}
 * - /users/{uid}/travelRecords/{recordId}
 * - /travelRecords/{recordId}
 * - /users/{uid}/bookmarks/{bookmarkId}
 * - /users/{uid}/notifications/{id}
 * - /friendships/{friendshipId}
 * - /friendRequests/{requestId}
 * - /publicProfiles/{uid}
 * - /bubblePops/{postId}
 * - /reports/{reportId}
 */

import {
  auth,
  db,
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from './firebase';
import {
  UserProfile,
  PublicProfile,
  CountryVisit,
  RegionVisit,
  TravelRecord,
  Friendship,
  FriendRequest,
  NotificationItem,
  BookmarkItem,
  BubblePopPost,
  ReportItem,
} from '../types';
import { OTHER_USERS } from '../data/mockInitialState';

export const isLiveFirestore = Boolean(db);

/**
 * Strips or converts undefined values to null to ensure Firestore setDoc does not throw
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return null as any;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(data as Record<string, any>)) {
      if (v !== undefined) {
        clean[k] = sanitizeForFirestore(v);
      } else {
        clean[k] = null;
      }
    }
    return clean as any;
  }
  return data;
}

/**
 * Fetch or initialize real user profile from Firestore
 */
export async function getRealUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) {
    const raw = localStorage.getItem(`stm_real_user_${uid}`);
    return raw ? JSON.parse(raw) : null;
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn('Firestore getRealUserProfile error:', err);
    const raw = localStorage.getItem(`stm_real_user_${uid}`);
    return raw ? JSON.parse(raw) : null;
  }
}

/**
 * Save real user profile
 */
export async function saveRealUserProfile(profile: UserProfile): Promise<void> {
  localStorage.setItem(`stm_real_user_${profile.uid}`, JSON.stringify(profile));

  if (db) {
    try {
      await setDoc(doc(db, 'users', profile.uid), {
        ...profile,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Keep publicProfiles in sync
      await setDoc(doc(db, 'publicProfiles', profile.uid), {
        uid: profile.uid,
        name: profile.name,
        photoURL: profile.photoURL || '',
        bio: profile.bio || '',
        isPublicAccount: profile.isPublicAccount ?? true,
        likeCountVisible: profile.likeCountVisible ?? true,
        bubblePopReactionCountVisible: profile.bubblePopReactionCountVisible ?? true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore saveRealUserProfile error:', err);
    }
  }
}

/**
 * Fetch real public profiles for user discovery and friend lists
 */
export async function getRealPublicProfiles(): Promise<Record<string, PublicProfile>> {
  const merged: Record<string, PublicProfile> = { ...OTHER_USERS };
  if (!db) {
    const raw = localStorage.getItem('stm_real_profiles');
    if (raw) {
      try {
        Object.assign(merged, JSON.parse(raw));
      } catch (e) {
        console.warn('Failed to parse stm_real_profiles:', e);
      }
    }
    return merged;
  }

  try {
    const snap = await getDocs(collection(db, 'publicProfiles'));
    snap.forEach((d) => {
      merged[d.id] = { uid: d.id, ...d.data() } as PublicProfile;
    });
    return merged;
  } catch (err) {
    console.warn('Firestore getRealPublicProfiles error:', err);
    const raw = localStorage.getItem('stm_real_profiles');
    if (raw) {
      try {
        Object.assign(merged, JSON.parse(raw));
      } catch (e) {}
    }
    return merged;
  }
}

/**
 * Fetch real user country visits
 */
export async function getRealCountryVisits(uid: string): Promise<Record<string, CountryVisit>> {
  if (!db) {
    const raw = localStorage.getItem(`stm_real_countries_${uid}`);
    return raw ? JSON.parse(raw) : {};
  }

  try {
    const snap = await getDocs(collection(db, 'users', uid, 'countries'));
    const visits: Record<string, CountryVisit> = {};
    snap.forEach((docSnap) => {
      visits[docSnap.id] = docSnap.data() as CountryVisit;
    });
    return visits;
  } catch (err) {
    console.warn('Firestore getRealCountryVisits error:', err);
    const raw = localStorage.getItem(`stm_real_countries_${uid}`);
    return raw ? JSON.parse(raw) : {};
  }
}

/**
 * Save real country visit
 */
export async function saveRealCountryVisit(
  uid: string,
  code: string,
  visit: CountryVisit
): Promise<void> {
  const current = await getRealCountryVisits(uid);
  current[code] = visit;
  localStorage.setItem(`stm_real_countries_${uid}`, JSON.stringify(current));

  if (db) {
    try {
      await setDoc(doc(db, 'users', uid, 'countries', code), visit, { merge: true });
    } catch (err) {
      console.warn('Firestore saveRealCountryVisit error:', err);
    }
  }
}

/**
 * Fetch real user region visits
 */
export async function getRealRegionVisits(uid: string): Promise<Record<string, RegionVisit>> {
  if (!db) {
    const raw = localStorage.getItem(`stm_real_regions_${uid}`);
    return raw ? JSON.parse(raw) : {};
  }

  try {
    const snap = await getDocs(collection(db, 'users', uid, 'regions'));
    const visits: Record<string, RegionVisit> = {};
    snap.forEach((docSnap) => {
      visits[docSnap.id] = docSnap.data() as RegionVisit;
    });
    return visits;
  } catch (err) {
    console.warn('Firestore getRealRegionVisits error:', err);
    const raw = localStorage.getItem(`stm_real_regions_${uid}`);
    return raw ? JSON.parse(raw) : {};
  }
}

/**
 * Save real region visit
 */
export async function saveRealRegionVisit(
  uid: string,
  code: string,
  visit: RegionVisit
): Promise<void> {
  const current = await getRealRegionVisits(uid);
  current[code] = visit;
  localStorage.setItem(`stm_real_regions_${uid}`, JSON.stringify(current));

  if (db) {
    try {
      await setDoc(doc(db, 'users', uid, 'regions', code), visit, { merge: true });
    } catch (err) {
      console.warn('Firestore saveRealRegionVisit error:', err);
    }
  }
}

/**
 * Fetch real travel records (public + friend/accessible records)
 */
export async function getRealTravelRecords(uid: string): Promise<TravelRecord[]> {
  if (!db) {
    const raw = localStorage.getItem('stm_real_travel_records');
    return raw ? JSON.parse(raw) : [];
  }

  try {
    const snap = await getDocs(collection(db, 'travelRecords'));
    const records: TravelRecord[] = [];
    snap.forEach((d) => {
      records.push({ id: d.id, ...d.data() } as TravelRecord);
    });
    return records;
  } catch (err) {
    // Fallback to user subcollection
    try {
      const userSnap = await getDocs(collection(db, 'users', uid, 'travelRecords'));
      const records: TravelRecord[] = [];
      userSnap.forEach((d) => {
        records.push({ id: d.id, ...d.data() } as TravelRecord);
      });
      return records;
    } catch (err2) {
      console.warn('Firestore getRealTravelRecords error:', err);
      const raw = localStorage.getItem('stm_real_travel_records');
      return raw ? JSON.parse(raw) : [];
    }
  }
}

/**
 * Save or update real travel record
 */
export async function saveRealTravelRecord(record: TravelRecord): Promise<void> {
  const current = await getRealTravelRecords(record.authorUid);
  const idx = current.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    current[idx] = record;
  } else {
    current.unshift(record);
  }
  localStorage.setItem('stm_real_travel_records', JSON.stringify(current));

  if (db) {
    try {
      // Save to top-level collection for explore / search
      await setDoc(doc(db, 'travelRecords', record.id), record, { merge: true });
      // Also save to user subcollection matching firebase-blueprint.json
      await setDoc(doc(db, 'users', record.authorUid, 'travelRecords', record.id), record, { merge: true });
    } catch (err) {
      console.warn('Firestore saveRealTravelRecord error:', err);
    }
  }
}

/**
 * Delete real travel record
 */
export async function deleteRealTravelRecord(recordId: string, authorUid?: string): Promise<void> {
  const raw = localStorage.getItem('stm_real_travel_records');
  if (raw) {
    const current: TravelRecord[] = JSON.parse(raw);
    const updated = current.filter((r) => r.id !== recordId);
    localStorage.setItem('stm_real_travel_records', JSON.stringify(updated));
  }

  if (db) {
    try {
      await deleteDoc(doc(db, 'travelRecords', recordId));
      if (authorUid) {
        await deleteDoc(doc(db, 'users', authorUid, 'travelRecords', recordId));
      }
    } catch (err) {
      console.warn('Firestore deleteRealTravelRecord error:', err);
    }
  }
}

/**
 * Notifications
 */
export async function getRealNotifications(uid: string): Promise<NotificationItem[]> {
  if (!db) {
    const raw = localStorage.getItem(`stm_real_notifs_${uid}`);
    return raw ? JSON.parse(raw) : [];
  }

  try {
    const snap = await getDocs(collection(db, 'users', uid, 'notifications'));
    const notifs: NotificationItem[] = [];
    snap.forEach((d) => {
      notifs.push({ id: d.id, ...d.data() } as NotificationItem);
    });
    return notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.warn('Firestore getRealNotifications error:', err);
    const raw = localStorage.getItem(`stm_real_notifs_${uid}`);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveRealNotification(uid: string, notif: NotificationItem): Promise<void> {
  const sanitized = sanitizeForFirestore(notif);
  const key = `stm_real_notifs_${uid}`;
  const raw = localStorage.getItem(key);
  const current: NotificationItem[] = raw ? JSON.parse(raw) : [];
  current.unshift(sanitized);
  localStorage.setItem(key, JSON.stringify(current));

  if (db) {
    try {
      await setDoc(doc(db, 'users', uid, 'notifications', notif.id), sanitized, { merge: true });
    } catch (err) {
      console.warn('Firestore saveRealNotification error:', err);
    }
  }
}

/**
 * Friendships
 */
export async function getRealFriendships(uid: string): Promise<Friendship[]> {
  if (!db) {
    const raw = localStorage.getItem(`stm_real_friendships_${uid}`);
    return raw ? JSON.parse(raw) : [];
  }

  try {
    const q = query(collection(db, 'friendships'), where('uids', 'array-contains', uid));
    const snap = await getDocs(q);
    const list: Friendship[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Friendship));
    return list;
  } catch (err) {
    console.warn('Firestore getRealFriendships error:', err);
    const raw = localStorage.getItem(`stm_real_friendships_${uid}`);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveRealFriendship(friendship: Friendship): Promise<void> {
  const sanitized = sanitizeForFirestore(friendship);
  for (const uid of friendship.uids) {
    if (uid) {
      const key = `stm_real_friendships_${uid}`;
      const raw = localStorage.getItem(key);
      const current: Friendship[] = raw ? JSON.parse(raw) : [];
      const updated = [sanitized, ...current.filter((f) => f.id !== friendship.id)];
      localStorage.setItem(key, JSON.stringify(updated));
    }
  }
  if (!db) return;
  try {
    await setDoc(doc(db, 'friendships', friendship.id), sanitized, { merge: true });
  } catch (err) {
    console.warn('Firestore saveRealFriendship error:', err);
  }
}

export async function deleteRealFriendship(friendshipId: string): Promise<void> {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'friendships', friendshipId));
  } catch (err) {
    console.warn('Firestore deleteRealFriendship error:', err);
  }
}

/**
 * Friend Requests
 */
export async function getRealFriendRequests(uid: string): Promise<FriendRequest[]> {
  if (!db) {
    const raw = localStorage.getItem(`stm_real_friend_requests_${uid}`);
    return raw ? JSON.parse(raw) : [];
  }

  try {
    const qTo = query(collection(db, 'friendRequests'), where('toUid', '==', uid));
    const snapTo = await getDocs(qTo);
    const qFrom = query(collection(db, 'friendRequests'), where('fromUid', '==', uid));
    const snapFrom = await getDocs(qFrom);
    const map = new Map<string, FriendRequest>();
    snapTo.forEach((d) => map.set(d.id, { id: d.id, ...d.data() } as FriendRequest));
    snapFrom.forEach((d) => map.set(d.id, { id: d.id, ...d.data() } as FriendRequest));
    return Array.from(map.values());
  } catch (err) {
    console.warn('Firestore getRealFriendRequests error:', err);
    const raw = localStorage.getItem(`stm_real_friend_requests_${uid}`);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveRealFriendRequest(req: FriendRequest): Promise<void> {
  const sanitized = sanitizeForFirestore(req);
  for (const targetUid of [req.toUid, req.fromUid]) {
    if (targetUid) {
      const key = `stm_real_friend_requests_${targetUid}`;
      const raw = localStorage.getItem(key);
      const current: FriendRequest[] = raw ? JSON.parse(raw) : [];
      const updated = [sanitized, ...current.filter((r) => r.id !== req.id)];
      localStorage.setItem(key, JSON.stringify(updated));
    }
  }
  if (!db) return;
  try {
    await setDoc(doc(db, 'friendRequests', req.id), sanitized, { merge: true });
  } catch (err) {
    console.warn('Firestore saveRealFriendRequest error:', err);
  }
}

export async function deleteRealFriendRequest(requestId: string): Promise<void> {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'friendRequests', requestId));
  } catch (err) {
    console.warn('Firestore deleteRealFriendRequest error:', err);
  }
}

/**
 * Bubble Pops
 */
export async function getRealBubblePops(uid: string): Promise<BubblePopPost[]> {
  if (!db) {
    const raw = localStorage.getItem(`stm_real_bubbles_${uid}`);
    return raw ? JSON.parse(raw) : [];
  }

  try {
    const snap = await getDocs(collection(db, 'bubblePops'));
    const bubbles: BubblePopPost[] = [];
    snap.forEach((d) => {
      bubbles.push({ id: d.id, ...d.data() } as BubblePopPost);
    });
    return bubbles;
  } catch (err) {
    console.warn('Firestore getRealBubblePops error:', err);
    const raw = localStorage.getItem(`stm_real_bubbles_${uid}`);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveRealBubblePop(post: BubblePopPost): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, 'bubblePops', post.id), post, { merge: true });
    await setDoc(doc(db, 'users', post.authorUid, 'bubblePops', post.id), post, { merge: true });
  } catch (err) {
    console.warn('Firestore saveRealBubblePop error:', err);
  }
}

export async function deleteRealBubblePop(authorUid: string, postId: string): Promise<void> {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'bubblePops', postId));
    await deleteDoc(doc(db, 'users', authorUid, 'bubblePops', postId));
  } catch (err) {
    console.warn('Firestore deleteRealBubblePop error:', err);
  }
}

/**
 * Bookmarks
 */
export async function getRealBookmarks(uid: string): Promise<BookmarkItem[]> {
  if (!db) {
    const raw = localStorage.getItem(`stm_real_bookmarks_${uid}`);
    return raw ? JSON.parse(raw) : [];
  }

  try {
    const snap = await getDocs(collection(db, 'users', uid, 'bookmarks'));
    const bms: BookmarkItem[] = [];
    snap.forEach((d) => {
      bms.push({ id: d.id, ...d.data() } as BookmarkItem);
    });
    return bms;
  } catch (err) {
    console.warn('Firestore getRealBookmarks error:', err);
    const raw = localStorage.getItem(`stm_real_bookmarks_${uid}`);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveRealBookmark(uid: string, item: BookmarkItem): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, 'users', uid, 'bookmarks', item.id), item, { merge: true });
  } catch (err) {
    console.warn('Firestore saveRealBookmark error:', err);
  }
}

export async function deleteRealBookmark(uid: string, bookmarkId: string): Promise<void> {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'bookmarks', bookmarkId));
  } catch (err) {
    console.warn('Firestore deleteRealBookmark error:', err);
  }
}

/**
 * Reports
 */
export async function saveRealReport(report: ReportItem): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, 'reports', report.id), report);
  } catch (err) {
    console.warn('Firestore saveRealReport error:', err);
  }
}

export async function getRealReports(): Promise<ReportItem[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, 'reports'));
    const list: ReportItem[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ReportItem));
    return list;
  } catch (err) {
    console.warn('Firestore getRealReports error:', err);
    return [];
  }
}
