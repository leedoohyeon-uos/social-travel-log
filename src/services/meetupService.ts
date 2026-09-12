/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/services/meetupService.ts
 * Real & Demo service layer for Meetup (약속잡기) feature.
 * Integrates with Firebase Firestore:
 * - /groups/{groupId}
 * - /groups/{groupId}/responses/{userKey}
 * - /invitations/{code}
 */

import {
  db,
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from './firebase';
import { MeetupGroup, MeetupResponse, ScheduleAnswerStatus } from '../types';

// ============================================================
// Utilities
// ============================================================

/** Convert text to SHA-256 hex string for safe password comparison */
export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hashBuffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Generate an 8-character invite code */
export function makeInviteCode(len = 8): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/** Convert Date object to YYYY-MM-DD */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 30-minute time slots (09:00 - 23:30) */
export function buildTimeSlots(startHour = 9, endHour = 23): string[] {
  const slots: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

/** Status cycle: X -> O -> △ -> X */
export const STATUS_CYCLE: ScheduleAnswerStatus[] = ['X', 'O', '△'];
export function nextStatus(current: ScheduleAnswerStatus = 'X'): ScheduleAnswerStatus {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

/** Participant ratio to color matching requirement */
export function percentToColor(pct: number): string | null {
  if (pct >= 100) return '#1B7A3D'; // Dark green
  if (pct >= 75) return '#7FC97F';  // Light green
  if (pct >= 50) return '#F4C430';  // Yellow
  if (pct >= 25) return '#F2994A';  // Orange
  return null;
}

/** Format milliseconds remaining until deadline */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return '마감됨';
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  if (days > 0) return `${days}일 ${hours}시간 남음`;
  const min = totalMin % 60;
  return `${hours}시간 ${min}분 남음`;
}

// ============================================================
// Demo Mock Initial State
// ============================================================

const DEMO_GROUPS_KEY = 'stm_demo_meetup_groups';
const DEMO_RESPONSES_KEY = 'stm_demo_meetup_responses';
const DEMO_INVITES_KEY = 'stm_demo_meetup_invites';

function getDemoInitialGroups(currentUserUid: string): MeetupGroup[] {
  const now = Date.now();
  return [
    {
      id: 'demo-group-1',
      name: '제주도 3박 4일 일정 조율',
      type: 'date',
      passwordHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // empty
      periodDays: 7,
      deadlineAt: new Date(now + 5 * 24 * 3600000).toISOString(),
      createdBy: currentUserUid,
      creatorName: '나',
      createdAt: new Date(now - 2 * 24 * 3600000).toISOString(),
      members: [currentUserUid, 'user-2', 'user-3'],
      invitedFriendUids: ['user-2', 'user-3'],
      inviteCode: 'jeju2026',
    },
    {
      id: 'demo-group-2',
      name: '도쿄 디저트 투어 시간표',
      type: 'time',
      passwordHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      periodDays: 14,
      deadlineAt: new Date(now + 10 * 24 * 3600000).toISOString(),
      createdBy: 'user-2',
      creatorName: '김민수',
      createdAt: new Date(now - 1 * 24 * 3600000).toISOString(),
      members: ['user-2', currentUserUid],
      invitedFriendUids: [currentUserUid],
      inviteCode: 'tokyo026',
    },
  ];
}

function getDemoInitialResponses(currentUserUid: string): Record<string, MeetupResponse[]> {
  const today = new Date();
  const d1 = new Date(today); d1.setDate(today.getDate() + 2);
  const d2 = new Date(today); d2.setDate(today.getDate() + 3);
  const d3 = new Date(today); d3.setDate(today.getDate() + 4);

  const k1 = toDateKey(d1);
  const k2 = toDateKey(d2);
  const k3 = toDateKey(d3);

  return {
    'demo-group-1': [
      {
        userKey: currentUserUid,
        userName: '나',
        answers: { [k1]: 'O', [k2]: 'O', [k3]: '△' },
        updatedAt: new Date().toISOString(),
      },
      {
        userKey: 'user-2',
        userName: '김민수',
        answers: { [k1]: 'O', [k2]: 'O', [k3]: 'X' },
        updatedAt: new Date().toISOString(),
      },
      {
        userKey: 'user-3',
        userName: '박지훈',
        answers: { [k1]: '△', [k2]: 'O', [k3]: 'O' },
        updatedAt: new Date().toISOString(),
      },
    ],
    'demo-group-2': [
      {
        userKey: 'user-2',
        userName: '김민수',
        answers: {
          [`${k1}_14:00`]: 'O',
          [`${k1}_14:30`]: 'O',
          [`${k1}_15:00`]: '△',
        },
        updatedAt: new Date().toISOString(),
      },
    ],
  };
}

// ============================================================
// Service Methods
// ============================================================

/**
 * Fetch all groups the user is a member of or created
 */
export async function getUserMeetupGroups(
  userKey: string,
  isDemo: boolean
): Promise<MeetupGroup[]> {
  if (isDemo || !db) {
    const raw = localStorage.getItem(DEMO_GROUPS_KEY);
    const groups: MeetupGroup[] = raw ? JSON.parse(raw) : getDemoInitialGroups(userKey);
    if (!raw) {
      localStorage.setItem(DEMO_GROUPS_KEY, JSON.stringify(groups));
    }
    return groups.filter(
      (g) => g.members.includes(userKey) || g.createdBy === userKey || g.invitedFriendUids?.includes(userKey)
    );
  }

  try {
    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', userKey)
    );
    const snap = await getDocs(q);
    const groups: MeetupGroup[] = [];
    snap.forEach((d) => {
      groups.push({ id: d.id, ...d.data() } as MeetupGroup);
    });

    // Also fetch createdBy if not in members
    const q2 = query(
      collection(db, 'groups'),
      where('createdBy', '==', userKey)
    );
    const snap2 = await getDocs(q2);
    snap2.forEach((d) => {
      if (!groups.some((g) => g.id === d.id)) {
        groups.push({ id: d.id, ...d.data() } as MeetupGroup);
      }
    });

    // Sort by createdAt descending
    return groups.sort((a, b) => {
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });
  } catch (err) {
    console.warn('Firestore getUserMeetupGroups error, falling back to local cache:', err);
    const raw = localStorage.getItem(`stm_real_groups_${userKey}`);
    return raw ? JSON.parse(raw) : [];
  }
}

/**
 * Get a single meetup group by ID
 */
export async function getMeetupGroup(
  groupId: string,
  isDemo: boolean
): Promise<MeetupGroup | null> {
  if (isDemo || !db) {
    const raw = localStorage.getItem(DEMO_GROUPS_KEY);
    const groups: MeetupGroup[] = raw ? JSON.parse(raw) : [];
    return groups.find((g) => g.id === groupId) || null;
  }

  try {
    const snap = await getDoc(doc(db, 'groups', groupId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as MeetupGroup;
  } catch (err) {
    console.warn('Firestore getMeetupGroup error:', err);
    return null;
  }
}

/**
 * Search groups by exact or partial name
 */
export async function findMeetupGroupsByName(
  name: string,
  isDemo: boolean
): Promise<MeetupGroup[]> {
  const trimmed = name.trim();
  if (isDemo || !db) {
    const raw = localStorage.getItem(DEMO_GROUPS_KEY);
    const groups: MeetupGroup[] = raw ? JSON.parse(raw) : [];
    return groups.filter((g) => g.name.toLowerCase().includes(trimmed.toLowerCase()));
  }

  try {
    const q = query(collection(db, 'groups'), where('name', '==', trimmed));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MeetupGroup));
  } catch (err) {
    console.warn('Firestore findMeetupGroupsByName error:', err);
    return [];
  }
}

/**
 * Create a new meetup group + issue an invite code
 */
export async function createMeetupGroup(
  params: {
    name: string;
    passwordHash: string;
    type: 'date' | 'time';
    periodDays: number;
    createdBy: string;
    creatorName: string;
    invitedFriendUids?: string[];
  },
  isDemo: boolean
): Promise<{ groupId: string; inviteCode: string }> {
  const inviteCode = makeInviteCode();
  const deadlineMs = Date.now() + params.periodDays * 24 * 60 * 60 * 1000;

  if (isDemo || !db) {
    const groupId = `demo-group-${Date.now()}`;
    const newGroup: MeetupGroup = {
      id: groupId,
      name: params.name.trim(),
      type: params.type,
      passwordHash: params.passwordHash,
      periodDays: params.periodDays,
      deadlineAt: new Date(deadlineMs).toISOString(),
      createdBy: params.createdBy,
      creatorName: params.creatorName,
      createdAt: new Date().toISOString(),
      members: [params.createdBy],
      invitedFriendUids: params.invitedFriendUids || [],
      inviteCode,
    };

    const raw = localStorage.getItem(DEMO_GROUPS_KEY);
    const groups: MeetupGroup[] = raw ? JSON.parse(raw) : [];
    groups.unshift(newGroup);
    localStorage.setItem(DEMO_GROUPS_KEY, JSON.stringify(groups));

    // Save invite
    const rawInv = localStorage.getItem(DEMO_INVITES_KEY);
    const invites: Record<string, string> = rawInv ? JSON.parse(rawInv) : {};
    invites[inviteCode] = groupId;
    localStorage.setItem(DEMO_INVITES_KEY, JSON.stringify(invites));

    return { groupId, inviteCode };
  }

  // Real Firestore
  const deadlineAt = Timestamp.fromMillis(deadlineMs);
  const groupDocRef = doc(collection(db, 'groups'));
  const groupId = groupDocRef.id;

  const data = {
    name: params.name.trim(),
    type: params.type,
    passwordHash: params.passwordHash,
    periodDays: params.periodDays,
    deadlineAt,
    createdBy: params.createdBy,
    creatorName: params.creatorName,
    createdAt: serverTimestamp(),
    members: [params.createdBy],
    invitedFriendUids: params.invitedFriendUids || [],
    inviteCode,
  };

  await setDoc(groupDocRef, data);

  // Set invitation
  await setDoc(doc(db, 'invitations', inviteCode), {
    groupId,
    createdAt: serverTimestamp(),
  });

  return { groupId, inviteCode };
}

/**
 * Join group with password verification
 */
export async function joinMeetupGroup(
  groupId: string,
  password: string,
  userKey: string,
  isDemo: boolean
): Promise<MeetupGroup> {
  const pwHash = await sha256(password);
  const group = await getMeetupGroup(groupId, isDemo);
  if (!group) throw new Error('존재하지 않는 약속입니다.');

  if (group.passwordHash && group.passwordHash !== pwHash) {
    throw new Error('비밀번호가 일치하지 않습니다.');
  }

  if (!group.members.includes(userKey)) {
    if (isDemo || !db) {
      const raw = localStorage.getItem(DEMO_GROUPS_KEY);
      const groups: MeetupGroup[] = raw ? JSON.parse(raw) : [];
      const idx = groups.findIndex((g) => g.id === groupId);
      if (idx >= 0) {
        groups[idx].members.push(userKey);
        localStorage.setItem(DEMO_GROUPS_KEY, JSON.stringify(groups));
      }
    } else {
      await updateDoc(doc(db, 'groups', groupId), {
        members: arrayUnion(userKey),
      });
    }
    group.members.push(userKey);
  }

  return group;
}

/**
 * Resolve an invitation code to a groupId
 */
export async function resolveMeetupInviteCode(
  code: string,
  isDemo: boolean
): Promise<string | null> {
  const cleanCode = code.trim().toLowerCase();

  if (isDemo || !db) {
    const rawInv = localStorage.getItem(DEMO_INVITES_KEY);
    const invites: Record<string, string> = rawInv ? JSON.parse(rawInv) : {};
    if (invites[cleanCode]) return invites[cleanCode];

    // Check demo initial groups
    const raw = localStorage.getItem(DEMO_GROUPS_KEY);
    const groups: MeetupGroup[] = raw ? JSON.parse(raw) : [];
    const found = groups.find((g) => g.inviteCode?.toLowerCase() === cleanCode);
    return found ? found.id : null;
  }

  try {
    const snap = await getDoc(doc(db, 'invitations', cleanCode));
    if (!snap.exists()) {
      // Fallback search in groups collection
      const q = query(collection(db, 'groups'), where('inviteCode', '==', cleanCode));
      const snapG = await getDocs(q);
      if (!snapG.empty) return snapG.docs[0].id;
      return null;
    }
    return snap.data().groupId;
  } catch (err) {
    console.warn('Firestore resolveMeetupInviteCode error:', err);
    return null;
  }
}

/**
 * Save user's schedule answers
 */
export async function saveMeetupResponse(
  groupId: string,
  userKey: string,
  userName: string,
  answers: Record<string, ScheduleAnswerStatus>,
  isDemo: boolean
): Promise<void> {
  if (isDemo || !db) {
    const raw = localStorage.getItem(DEMO_RESPONSES_KEY);
    const allResp: Record<string, MeetupResponse[]> = raw
      ? JSON.parse(raw)
      : getDemoInitialResponses(userKey);
    const groupResp = allResp[groupId] || [];
    const idx = groupResp.findIndex((r) => r.userKey === userKey);
    const newResp: MeetupResponse = {
      userKey,
      userName,
      answers,
      updatedAt: new Date().toISOString(),
    };
    if (idx >= 0) {
      groupResp[idx] = newResp;
    } else {
      groupResp.push(newResp);
    }
    allResp[groupId] = groupResp;
    localStorage.setItem(DEMO_RESPONSES_KEY, JSON.stringify(allResp));
    return;
  }

  const ref = doc(db, 'groups', groupId, 'responses', userKey);
  await setDoc(
    ref,
    {
      userId: userKey,
      userKey,
      userName,
      answers,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Get current user's saved response
 */
export async function getMyMeetupResponse(
  groupId: string,
  userKey: string,
  isDemo: boolean
): Promise<MeetupResponse | null> {
  if (isDemo || !db) {
    const raw = localStorage.getItem(DEMO_RESPONSES_KEY);
    const allResp: Record<string, MeetupResponse[]> = raw
      ? JSON.parse(raw)
      : getDemoInitialResponses(userKey);
    const groupResp = allResp[groupId] || [];
    return groupResp.find((r) => r.userKey === userKey) || null;
  }

  try {
    const ref = doc(db, 'groups', groupId, 'responses', userKey);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as MeetupResponse) : null;
  } catch (err) {
    console.warn('Firestore getMyMeetupResponse error:', err);
    return null;
  }
}

/**
 * Get all responses for a group (for calculating results)
 */
export async function getAllMeetupResponses(
  groupId: string,
  isDemo: boolean
): Promise<MeetupResponse[]> {
  if (isDemo || !db) {
    const raw = localStorage.getItem(DEMO_RESPONSES_KEY);
    const allResp: Record<string, MeetupResponse[]> = raw
      ? JSON.parse(raw)
      : getDemoInitialResponses('demo-user');
    return allResp[groupId] || [];
  }

  try {
    const snap = await getDocs(collection(db, 'groups', groupId, 'responses'));
    return snap.docs.map((d) => ({ userKey: d.id, ...d.data() } as MeetupResponse));
  } catch (err) {
    console.warn('Firestore getAllMeetupResponses error:', err);
    return [];
  }
}
