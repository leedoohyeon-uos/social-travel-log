/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/meetup/MeetupModal.tsx
 * Full-featured Meetup (약속잡기) modal integrated into TravelLog.
 * Supports:
 * - Friend selection with real Firebase friends (friendships -> users/publicProfiles)
 * - Meetup creation (Date vs Time mode, password, deadline period)
 * - Joining existing meetups (by invite code or name/password)
 * - Interactive Schedule picker with drag-paint (X, O, △ status cycling)
 * - Intermediate & final results with color-graded percentage bars and attendees list
 * - Real Firestore and Demo Mode support
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Clock,
  Users,
  Check,
  Plus,
  Lock,
  ChevronLeft,
  ChevronRight,
  Share2,
  Copy,
  BarChart3,
  Edit3,
  Sparkles,
  ArrowRight,
  UserCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { MeetupGroup, MeetupResponse, ScheduleAnswerStatus } from '../../types';
import {
  getUserMeetupGroups,
  getMeetupGroup,
  createMeetupGroup,
  joinMeetupGroup,
  resolveMeetupInviteCode,
  saveMeetupResponse,
  getMyMeetupResponse,
  getAllMeetupResponses,
  findMeetupGroupsByName,
  sha256,
  toDateKey,
  buildTimeSlots,
  nextStatus,
  percentToColor,
  formatRemaining,
  STATUS_CYCLE,
} from '../../services/meetupService';

type MeetupTab = 'list' | 'create_step1' | 'create_step2' | 'join' | 'schedule' | 'results';

export const MeetupModal: React.FC = () => {
  const {
    isMeetupModalOpen,
    setIsMeetupModalOpen,
    activeMeetupId,
    setActiveMeetupId,
    prefilledFriendUidForMeetup,
    setPrefilledFriendUidForMeetup,
    sendMeetupInviteToFriends,
    currentUser,
    publicProfiles,
    friendships,
    isDemoMode,
    showToast,
  } = useApp();

  // Navigation tab
  const [tab, setTab] = useState<MeetupTab>('list');
  const [loading, setLoading] = useState(false);

  // Group list
  const [myGroups, setMyGroups] = useState<MeetupGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState<MeetupGroup | null>(null);

  // Creation State
  const [selectedFriendUids, setSelectedFriendUids] = useState<string[]>([]);
  const [meetupName, setMeetupName] = useState('');
  const [meetupPassword, setMeetupPassword] = useState('');
  const [meetupType, setMeetupType] = useState<'date' | 'time'>('date');
  const [periodDays, setPeriodDays] = useState<number>(7);
  const [customPeriodDays, setCustomPeriodDays] = useState<string>('');

  // Join State
  const [joinTab, setJoinTab] = useState<'code' | 'search'>('code');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [searchNameInput, setSearchNameInput] = useState('');
  const [searchPasswordInput, setSearchPasswordInput] = useState('');
  const [foundGroups, setFoundGroups] = useState<MeetupGroup[]>([]);
  const [selectedGroupToJoin, setSelectedGroupToJoin] = useState<MeetupGroup | null>(null);

  // Schedule Input State
  const [answers, setAnswers] = useState<Record<string, ScheduleAnswerStatus>>({});
  const [isSavingAnswers, setIsSavingAnswers] = useState(false);
  const [activeDateIndex, setActiveDateIndex] = useState(0); // for time mode
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [dragPaintStatus, setDragPaintStatus] = useState<ScheduleAnswerStatus>('O');

  // Results State
  const [allResponses, setAllResponses] = useState<MeetupResponse[]>([]);

  // Real friends list derived from friendships
  const friendList = useMemo(() => {
    return friendships
      .map((f) => {
        const friendUid = f.uids.find((u) => u !== currentUser.uid) || f.uids[0];
        const profile = publicProfiles[friendUid];
        return {
          uid: friendUid,
          name: profile?.name || '친구',
          photoURL: profile?.photoURL,
          bio: profile?.bio,
        };
      })
      .filter((f) => f.uid !== currentUser.uid);
  }, [friendships, currentUser.uid, publicProfiles]);

  // Load user's meetups
  const loadMyGroups = useCallback(async () => {
    if (!currentUser.uid) return;
    setLoading(true);
    try {
      const groups = await getUserMeetupGroups(currentUser.uid, isDemoMode);
      setMyGroups(groups);
    } catch (err) {
      console.warn('loadMyGroups error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser.uid, isDemoMode]);

  // Handle open modal & prefill friend
  useEffect(() => {
    if (isMeetupModalOpen) {
      loadMyGroups();
      if (prefilledFriendUidForMeetup) {
        setSelectedFriendUids([prefilledFriendUidForMeetup]);
        setTab('create_step2');
        setPrefilledFriendUidForMeetup(null);
      } else if (activeMeetupId) {
        openMeetup(activeMeetupId);
      } else {
        setTab('list');
      }
    }
  }, [isMeetupModalOpen, prefilledFriendUidForMeetup, activeMeetupId, loadMyGroups]);

  // Open a specific meetup (for schedule or results)
  const openMeetup = async (groupId: string, targetTab: 'schedule' | 'results' = 'schedule') => {
    setLoading(true);
    try {
      const group = await getMeetupGroup(groupId, isDemoMode);
      if (!group) {
        showToast('약속을 찾을 수 없습니다.', 'error');
        return;
      }
      setCurrentGroup(group);

      // Check if expired
      const deadline = group.deadlineAt?.toDate
        ? group.deadlineAt.toDate()
        : new Date(group.deadlineAt);
      const isExpired = Date.now() > deadline.getTime();

      // Load my response
      const myResp = await getMyMeetupResponse(groupId, currentUser.uid, isDemoMode);
      setAnswers(myResp?.answers || {});

      // Load all responses
      const resps = await getAllMeetupResponses(groupId, isDemoMode);
      setAllResponses(resps);

      if (isExpired || targetTab === 'results') {
        setTab('results');
      } else {
        setTab('schedule');
      }
    } catch (err) {
      console.warn('openMeetup error:', err);
      showToast('약속 정보를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle friend selection in Step 1
  const toggleSelectFriend = (uid: string) => {
    setSelectedFriendUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  // Create Group submit
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetupName.trim()) {
      showToast('약속 이름을 입력해주세요.', 'error');
      return;
    }

    const effectiveDays = customPeriodDays ? parseInt(customPeriodDays, 10) : periodDays;
    if (isNaN(effectiveDays) || effectiveDays <= 0 || effectiveDays > 60) {
      showToast('입력 기간은 1일에서 60일 사이여야 합니다.', 'error');
      return;
    }

    setLoading(true);
    try {
      const pwHash = meetupPassword.trim() ? await sha256(meetupPassword.trim()) : '';
      const { groupId, inviteCode } = await createMeetupGroup(
        {
          name: meetupName.trim(),
          passwordHash: pwHash,
          type: meetupType,
          periodDays: effectiveDays,
          createdBy: currentUser.uid,
          creatorName: currentUser.name,
          invitedFriendUids: selectedFriendUids,
        },
        isDemoMode
      );

      // Send notifications to selected friends
      if (selectedFriendUids.length > 0) {
        sendMeetupInviteToFriends(groupId, meetupName.trim(), selectedFriendUids);
      }

      showToast(`'${meetupName}' 약속이 생성되었습니다! 🎉`, 'success');

      // Reset form
      setMeetupName('');
      setMeetupPassword('');
      setSelectedFriendUids([]);
      setCustomPeriodDays('');

      // Open newly created meetup
      await openMeetup(groupId, 'schedule');
    } catch (err: any) {
      console.error('createMeetupGroup error:', err);
      showToast(err?.message || '약속 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Join by Invite Code
  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteCodeInput.trim();
    if (!code) {
      showToast('초대 코드를 입력해주세요.', 'error');
      return;
    }

    setLoading(true);
    try {
      const groupId = await resolveMeetupInviteCode(code, isDemoMode);
      if (!groupId) {
        showToast('유효하지 않은 초대 코드입니다.', 'error');
        return;
      }
      // Join group
      await joinMeetupGroup(groupId, '', currentUser.uid, isDemoMode);
      showToast('약속에 참여했습니다! ✨', 'success');
      setInviteCodeInput('');
      await openMeetup(groupId, 'schedule');
    } catch (err: any) {
      console.warn('handleJoinByCode error:', err);
      showToast(err?.message || '참여할 수 없는 약속입니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Search by Name & Password
  const handleSearchGroups = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchNameInput.trim()) {
      showToast('약속 이름을 입력해주세요.', 'error');
      return;
    }
    setLoading(true);
    try {
      const found = await findMeetupGroupsByName(searchNameInput.trim(), isDemoMode);
      setFoundGroups(found);
      if (found.length === 0) {
        showToast('해당 이름의 약속을 찾을 수 없습니다.', 'info');
      }
    } catch (err) {
      console.warn('handleSearchGroups error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmJoinSearched = async (group: MeetupGroup) => {
    setLoading(true);
    try {
      await joinMeetupGroup(group.id, searchPasswordInput, currentUser.uid, isDemoMode);
      showToast(`'${group.name}' 약속에 참여했습니다!`, 'success');
      setSelectedGroupToJoin(null);
      setSearchPasswordInput('');
      setSearchNameInput('');
      setFoundGroups([]);
      await openMeetup(group.id, 'schedule');
    } catch (err: any) {
      showToast(err?.message || '비밀번호를 확인해주세요.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Copy invite link
  const handleCopyInviteCode = (group: MeetupGroup) => {
    const code = group.inviteCode || group.id;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      showToast(`초대 코드(${code})가 복사되었습니다! 친구에게 공유해보세요.`, 'success');
    } else {
      showToast(`초대 코드: ${code}`, 'info');
    }
  };

  // Schedule cell click/drag
  const handleCellClick = (key: string) => {
    const current = answers[key] || 'X';
    const next = nextStatus(current);
    setAnswers((prev) => ({ ...prev, [key]: next }));
  };

  const handleCellDragOver = (key: string) => {
    if (!isDragging) return;
    setAnswers((prev) => ({ ...prev, [key]: dragPaintStatus }));
  };

  // Save answers
  const handleSaveAnswers = async () => {
    if (!currentGroup) return;
    setIsSavingAnswers(true);
    try {
      await saveMeetupResponse(
        currentGroup.id,
        currentUser.uid,
        currentUser.name,
        answers,
        isDemoMode
      );
      showToast('나의 가능 일정이 저장되었습니다! 💾', 'success');
      // Refresh responses
      const updated = await getAllMeetupResponses(currentGroup.id, isDemoMode);
      setAllResponses(updated);
    } catch (err) {
      console.warn('saveMeetupResponse error:', err);
      showToast('일정 저장에 실패했습니다.', 'error');
    } finally {
      setIsSavingAnswers(false);
    }
  };

  // Calculate Dates for Group Period
  const groupDates = useMemo(() => {
    if (!currentGroup) return [];
    const created = currentGroup.createdAt?.toDate
      ? currentGroup.createdAt.toDate()
      : new Date(currentGroup.createdAt || Date.now());
    const count = Math.min(Math.max(currentGroup.periodDays || 7, 3), 30);
    const dates: Date[] = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(created);
      d.setDate(created.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [currentGroup]);

  // Calendar dates for Date-Type Meetup
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: { date: Date; isCurrentMonth: boolean; key: string }[] = [];
    // Prev padding
    const firstDayIndex = firstDay.getDay();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false, key: toDateKey(d) });
    }
    // Month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push({ date, isCurrentMonth: true, key: toDateKey(date) });
    }
    // Next padding
    const remainder = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainder; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false, key: toDateKey(d) });
    }
    return days;
  }, [calendarMonth]);

  // 30-min time slots for Time-Type Meetup
  const timeSlots = useMemo(() => buildTimeSlots(9, 23), []);

  // Compute Results summary
  const resultsData = useMemo(() => {
    if (!currentGroup) return [];
    const totalParticipants = allResponses.length;
    if (totalParticipants === 0) return [];

    const slotMap: Record<
      string,
      { key: string; oNames: string[]; triangleNames: string[]; score: number }
    > = {};

    allResponses.forEach((resp) => {
      Object.entries(resp.answers || {}).forEach(([key, status]) => {
        if (!slotMap[key]) {
          slotMap[key] = { key, oNames: [], triangleNames: [], score: 0 };
        }
        if (status === 'O') {
          slotMap[key].oNames.push(resp.userName);
          slotMap[key].score += 1;
        } else if (status === '△') {
          slotMap[key].triangleNames.push(resp.userName);
          slotMap[key].score += 0.5;
        }
      });
    });

    return Object.values(slotMap)
      .map((item) => {
        const pct = Math.round((item.score / totalParticipants) * 100);
        return {
          ...item,
          pct,
          color: percentToColor(pct) || '#71717A',
        };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [currentGroup, allResponses]);

  if (!isMeetupModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-100">
                  {currentGroup && (tab === 'schedule' || tab === 'results')
                    ? currentGroup.name
                    : '여행 약속잡기'}
                </h2>
                {currentGroup && (tab === 'schedule' || tab === 'results') && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      currentGroup.type === 'date'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                        : 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
                    }`}
                  >
                    {currentGroup.type === 'date' ? '날짜 조율' : '시간 조율'}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {currentGroup && (tab === 'schedule' || tab === 'results')
                  ? `${currentGroup.creatorName}님이 생성 · ${formatRemaining(
                      (currentGroup.deadlineAt?.toDate
                        ? currentGroup.deadlineAt.toDate().getTime()
                        : new Date(currentGroup.deadlineAt).getTime()) - Date.now()
                    )}`
                  : '친구들과 날짜·시간 투표로 완벽한 여행 일정을 찾으세요'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {currentGroup && (tab === 'schedule' || tab === 'results') && (
              <button
                onClick={() => handleCopyInviteCode(currentGroup)}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
                title="초대 코드 복사"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">초대코드</span>
              </button>
            )}
            <button
              onClick={() => {
                setIsMeetupModalOpen(false);
                setActiveMeetupId(null);
                setCurrentGroup(null);
              }}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Navigation Pill Tabs (When at top-level) */}
        {tab !== 'schedule' && tab !== 'results' && (
          <div className="px-4 sm:px-6 pt-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setTab('list')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                tab === 'list'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>나의 약속 ({myGroups.length})</span>
            </button>

            <button
              onClick={() => setTab('create_step1')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                tab === 'create_step1' || tab === 'create_step2'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 약속 만들기</span>
            </button>

            <button
              onClick={() => setTab('join')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                tab === 'join'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>약속 참여하기</span>
            </button>
          </div>
        )}

        {/* In-Meetup Switcher Bar */}
        {(tab === 'schedule' || tab === 'results') && (
          <div className="px-4 sm:px-6 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <button
              onClick={() => setTab('list')}
              className="text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>약속 목록으로</span>
            </button>

            <div className="flex items-center bg-zinc-200 dark:bg-zinc-700/60 p-1 rounded-xl">
              <button
                onClick={() => setTab('schedule')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  tab === 'schedule'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>내 일정 입력</span>
              </button>
              <button
                onClick={() => setTab('results')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  tab === 'results'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>결과 보기 ({allResponses.length}명)</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* ======================================================== */}
          {/* TAB 1: MY GROUPS LIST */}
          {/* ======================================================== */}
          {tab === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  내가 참여 중인 약속
                </h3>
                <button
                  onClick={() => setTab('create_step1')}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 약속 생성</span>
                </button>
              </div>

              {myGroups.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    아직 진행 중인 약속이 없어요
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                    친구들과 함께 떠날 여행 일정을 조율해보세요. 친구들을 초대하고 가능한 날짜를
                    투표할 수 있습니다.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setTab('create_step1')}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      새 약속 만들기
                    </button>
                    <button
                      onClick={() => setTab('join')}
                      className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition-all"
                    >
                      코드로 참여하기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {myGroups.map((grp) => {
                    const deadline = grp.deadlineAt?.toDate
                      ? grp.deadlineAt.toDate()
                      : new Date(grp.deadlineAt);
                    const remainingMs = deadline.getTime() - Date.now();
                    const isExpired = remainingMs <= 0;

                    return (
                      <div
                        key={grp.id}
                        onClick={() => openMeetup(grp.id)}
                        className="group p-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                grp.type === 'date'
                                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                                  : 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
                              }`}
                            >
                              {grp.type === 'date' ? '날짜 조율' : '시간 조율'}
                            </span>
                            <span
                              className={`text-[11px] font-bold ${
                                isExpired
                                  ? 'text-zinc-400'
                                  : remainingMs < 24 * 3600000
                                  ? 'text-rose-500'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {formatRemaining(remainingMs)}
                            </span>
                          </div>

                          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                            {grp.name}
                          </h4>

                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                            <span>방장: {grp.creatorName}</span>
                            <span>·</span>
                            <span>참여 {grp.members?.length || 1}명</span>
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                          <span>일정 입력 / 결과 확인</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: CREATE STEP 1 - FRIEND SELECTION */}
          {/* ======================================================== */}
          {tab === 'create_step1' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    함께할 친구 선택 (1단계)
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    현재 친구 목록에서 여행 일정을 함께 조율할 친구를 선택해주세요.
                  </p>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-extrabold">
                  선택됨 {selectedFriendUids.length}명
                </div>
              </div>

              {friendList.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-2">
                  <Users className="w-8 h-8 mx-auto text-zinc-400" />
                  <p className="font-bold text-xs text-zinc-700 dark:text-zinc-300">
                    아직 등록된 친구가 없어요
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    친구 없이도 약속을 생성한 후 초대 코드로 공유할 수 있습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {friendList.map((f) => {
                    const isSelected = selectedFriendUids.includes(f.uid);
                    return (
                      <div
                        key={f.uid}
                        onClick={() => toggleSelectFriend(f.uid)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400/80 shadow-sm'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-zinc-600 text-xs">
                            {f.photoURL ? (
                              <img
                                src={f.photoURL}
                                alt={f.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              f.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                              {f.name}
                            </h4>
                            {f.bio && (
                              <p className="text-[10px] text-zinc-400 line-clamp-1">{f.bio}</p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectFriend(f.uid);
                          }}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setTab('list')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-800"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => setTab('create_step2')}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                >
                  <span>다음: 약속 정보 입력</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: CREATE STEP 2 - MEETUP DETAILS */}
          {/* ======================================================== */}
          {tab === 'create_step2' && (
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  약속 상세 정보 입력 (2단계)
                </h3>
                <button
                  type="button"
                  onClick={() => setTab('create_step1')}
                  className="text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>친구 선택으로</span>
                </button>
              </div>

              {/* Selected Friends Badges */}
              {selectedFriendUids.length > 0 && (
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                    <span>초대할 친구 ({selectedFriendUids.length}명)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFriendUids.map((uid) => {
                      const name = publicProfiles[uid]?.name || '친구';
                      return (
                        <span
                          key={uid}
                          className="px-2 py-0.5 rounded-lg bg-amber-100/70 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1"
                        >
                          <span>{name}</span>
                          <button
                            type="button"
                            onClick={() => toggleSelectFriend(uid)}
                            className="hover:text-rose-500"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Meetup Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  약속 이름 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 서울에서 만나기, 제주도 우정여행"
                  value={meetupName}
                  onChange={(e) => setMeetupName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  그룹 비밀번호 (선택사항)
                </label>
                <input
                  type="password"
                  placeholder="공유용 비밀번호 (설정 시 참여 시 확인)"
                  value={meetupPassword}
                  onChange={(e) => setMeetupPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Type Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  조율 유형 선택
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setMeetupType('date')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      meetupType === 'date'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <Calendar
                      className={`w-5 h-5 mt-0.5 ${
                        meetupType === 'date' ? 'text-amber-500' : 'text-zinc-400'
                      }`}
                    />
                    <div>
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                        날짜 정하기
                      </h4>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        가능한 날짜만 하루 단위로 조율합니다.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setMeetupType('time')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      meetupType === 'time'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <Clock
                      className={`w-5 h-5 mt-0.5 ${
                        meetupType === 'time' ? 'text-amber-500' : 'text-zinc-400'
                      }`}
                    />
                    <div>
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                        시간 정하기
                      </h4>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        날짜 및 30분 단위 시간대를 함께 정합니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deadline Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  일정 입력 가능 기간
                </label>
                <div className="flex flex-wrap gap-2">
                  {[3, 7, 8, 14].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        setPeriodDays(days);
                        setCustomPeriodDays('');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        periodDays === days && !customPeriodDays
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                      }`}
                    >
                      {days}일
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    max="60"
                    placeholder="직접 입력 (일)"
                    value={customPeriodDays}
                    onChange={(e) => setCustomPeriodDays(e.target.value)}
                    className="w-28 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setTab('create_step1')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-800"
                >
                  이전
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {loading ? '약속 생성 중...' : '약속 생성하기 🎉'}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 4: JOIN MEETUP */}
          {/* ======================================================== */}
          {tab === 'join' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <button
                  onClick={() => setJoinTab('code')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    joinTab === 'code'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  초대 코드로 참여
                </button>
                <button
                  onClick={() => setJoinTab('search')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    joinTab === 'search'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  이름/비밀번호로 찾기
                </button>
              </div>

              {joinTab === 'code' ? (
                <form onSubmit={handleJoinByCode} className="space-y-3 py-2">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      8자리 초대 코드 입력
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: jeju2026"
                      value={inviteCodeInput}
                      onChange={(e) => setInviteCodeInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
                  >
                    {loading ? '확인 중...' : '약속 참여하기'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4 py-2">
                  <form onSubmit={handleSearchGroups} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="약속 이름 검색"
                      value={searchNameInput}
                      onChange={(e) => setSearchNameInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-zinc-800 dark:bg-zinc-700 text-white text-xs font-bold"
                    >
                      검색
                    </button>
                  </form>

                  {foundGroups.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs text-zinc-700 dark:text-zinc-300">
                        검색 결과 ({foundGroups.length}건)
                      </h4>
                      {foundGroups.map((g) => (
                        <div
                          key={g.id}
                          className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between"
                        >
                          <div>
                            <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                              {g.name}
                            </h5>
                            <span className="text-[10px] text-zinc-400">
                              생성자: {g.creatorName} · {g.type === 'date' ? '날짜 조율' : '시간 조율'}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedGroupToJoin(g)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold"
                          >
                            선택
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedGroupToJoin && (
                    <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 space-y-2">
                      <h5 className="font-bold text-xs text-amber-900 dark:text-amber-200">
                        '{selectedGroupToJoin.name}' 참여 비밀번호 입력
                      </h5>
                      <input
                        type="password"
                        placeholder="비밀번호가 없는 경우 빈칸으로 참여"
                        value={searchPasswordInput}
                        onChange={(e) => setSearchPasswordInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                      />
                      <button
                        onClick={() => handleConfirmJoinSearched(selectedGroupToJoin)}
                        disabled={loading}
                        className="w-full py-2 rounded-xl bg-amber-500 text-white text-xs font-bold"
                      >
                        입장 및 참여하기
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: SCHEDULE PICKER (DATE / TIME) */}
          {/* ======================================================== */}
          {tab === 'schedule' && currentGroup && (
            <div
              className="space-y-4 select-none"
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
            >
              {/* Legend & Instructions */}
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400 font-bold">상태 순환:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-zinc-400">
                    <span className="w-5 h-5 rounded-md bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px]">
                      X
                    </span>
                    <span>불가</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center text-[10px]">
                      O
                    </span>
                    <span>가능</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                    <span className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center text-[10px]">
                      △
                    </span>
                    <span>비선호</span>
                  </span>
                </div>

                <div className="text-[11px] text-zinc-400">
                  클릭하거나 드래그하여 연속 지정할 수 있습니다
                </div>
              </div>

              {/* DATE MODE: CALENDAR PICKER */}
              {currentGroup.type === 'date' && (
                <div className="space-y-3">
                  {/* Calendar Month Header */}
                  <div className="flex items-center justify-between px-2">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월
                    </h4>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarMonth(
                            new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                          )
                        }
                        className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarMonth(
                            new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                          )
                        }
                        className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Day of Week Headers */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-zinc-400">
                    <span className="text-rose-500">일</span>
                    <span>월</span>
                    <span>화</span>
                    <span>수</span>
                    <span>목</span>
                    <span>금</span>
                    <span className="text-blue-500">토</span>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {calendarDays.map((dayItem) => {
                      const status = answers[dayItem.key] || 'X';
                      const isToday = toDateKey(new Date()) === dayItem.key;

                      let cellBg = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400';
                      if (status === 'O') {
                        cellBg =
                          'bg-emerald-500 text-white font-black shadow-sm shadow-emerald-500/20';
                      } else if (status === '△') {
                        cellBg = 'bg-amber-500 text-white font-black shadow-sm shadow-amber-500/20';
                      }

                      return (
                        <div
                          key={dayItem.key}
                          onClick={() => handleCellClick(dayItem.key)}
                          onMouseEnter={() => handleCellDragOver(dayItem.key)}
                          className={`h-14 rounded-xl flex flex-col items-center justify-between p-1.5 cursor-pointer transition-all ${cellBg} ${
                            !dayItem.isCurrentMonth ? 'opacity-40' : ''
                          } ${isToday ? 'ring-2 ring-amber-400' : ''}`}
                        >
                          <span className="text-[10px] self-start leading-none font-medium">
                            {dayItem.date.getDate()}
                          </span>
                          <span className="text-base font-extrabold leading-none">{status}</span>
                          <span className="text-[9px] opacity-75 leading-none">
                            {status === 'O' ? '가능' : status === '△' ? '비선호' : '불가'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TIME MODE: DATE TABS + 30-MIN SLOTS GRID */}
              {currentGroup.type === 'time' && (
                <div className="space-y-4">
                  {/* Date Selector Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {groupDates.map((d, idx) => {
                      const k = toDateKey(d);
                      const isSelected = activeDateIndex === idx;
                      const dayName = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];

                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setActiveDateIndex(idx)}
                          className={`px-3 py-2 rounded-xl text-center min-w-[64px] transition-all flex flex-col items-center ${
                            isSelected
                              ? 'bg-amber-500 text-white shadow-sm font-bold'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                          }`}
                        >
                          <span className="text-[10px] opacity-80">{dayName}</span>
                          <span className="text-xs font-black">
                            {d.getMonth() + 1}.{d.getDate()}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 30-min Slots Grid */}
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-zinc-700 dark:text-zinc-300">
                      {groupDates[activeDateIndex] &&
                        `${groupDates[activeDateIndex].getMonth() + 1}월 ${groupDates[activeDateIndex].getDate()}일 가능한 시간대`}
                    </h5>

                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-72 overflow-y-auto pr-1">
                      {timeSlots.map((timeStr) => {
                        const dateObj = groupDates[activeDateIndex] || new Date();
                        const slotKey = `${toDateKey(dateObj)}_${timeStr}`;
                        const status = answers[slotKey] || 'X';

                        let slotBg =
                          'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 hover:bg-zinc-200';
                        if (status === 'O') {
                          slotBg = 'bg-emerald-500 text-white font-black shadow-sm';
                        } else if (status === '△') {
                          slotBg = 'bg-amber-500 text-white font-black shadow-sm';
                        }

                        return (
                          <div
                            key={slotKey}
                            onClick={() => handleCellClick(slotKey)}
                            onMouseEnter={() => handleCellDragOver(slotKey)}
                            className={`p-2 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5 ${slotBg}`}
                          >
                            <span className="text-[11px] font-bold">{timeStr}</span>
                            <span className="text-xs font-black">{status}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Bottom Bar */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setTab('results')}
                  className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>현재 투표 결과 보기</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAnswers}
                  disabled={isSavingAnswers}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {isSavingAnswers ? '저장 중...' : '나의 일정 저장하기 💾'}
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: RESULTS VIEW (INTERMEDIATE & FINAL) */}
          {/* ======================================================== */}
          {tab === 'results' && currentGroup && (
            <div className="space-y-5">
              {/* Top Summary Banner */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">
                    약속 참여 현황 ({allResponses.length}명 참여)
                  </h4>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {allResponses.map((r) => (
                      <span
                        key={r.userKey}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold border border-amber-200 dark:border-amber-800/80"
                      >
                        {r.userName}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block">
                    초대코드
                  </span>
                  <button
                    onClick={() => handleCopyInviteCode(currentGroup)}
                    className="text-xs font-black text-amber-600 dark:text-amber-300 hover:underline flex items-center gap-1"
                  >
                    <span>{currentGroup.inviteCode || currentGroup.id}</span>
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Ranked Slots List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                    가장 많이 모일 수 있는 날짜/시간 순위
                  </h4>
                  <span className="text-[10px] text-zinc-400">참여율 100% ~ 25% 색상 구분</span>
                </div>

                {resultsData.length === 0 ? (
                  <div className="py-12 text-center rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-1">
                    <p className="font-bold text-xs text-zinc-600 dark:text-zinc-400">
                      아직 등록된 일정이 없습니다.
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      일정을 먼저 입력하거나 친구들을 초대해보세요!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {resultsData.map((item, idx) => {
                      const allNames = [
                        ...item.oNames,
                        ...item.triangleNames.map((n) => `${n}(△)`),
                      ];

                      return (
                        <div
                          key={item.key}
                          className="p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                  idx === 0
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                                {item.key.replace('_', ' ')}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs font-black"
                                style={{ color: item.color }}
                              >
                                {item.pct}%
                              </span>
                              <span className="text-[11px] text-zinc-400">
                                ({item.oNames.length + item.triangleNames.length}/
                                {allResponses.length}명)
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar with Requirement Colors */}
                          <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${item.pct}%`,
                                backgroundColor: item.color,
                              }}
                            />
                          </div>

                          {/* Available Attendees names */}
                          {allNames.length > 0 && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                              가능: <span className="font-medium text-zinc-700 dark:text-zinc-300">{allNames.join(', ')}</span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Back Button */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setTab('schedule')}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>내 일정 수정하러 가기</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTab('list')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-800"
                >
                  약속 목록으로
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
