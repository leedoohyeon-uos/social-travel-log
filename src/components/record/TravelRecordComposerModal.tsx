/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Trash2,
  Star,
  Users,
  Tag,
  Globe,
  Lock,
  Eye,
  Plus,
  Upload,
} from 'lucide-react';
import {
  WORLD_COUNTRIES,
  KOREA_REGIONS,
  PRESET_TAGS,
} from '../../data/geoData';
import { RecordVisibility, TravelRecord } from '../../types';

export const TravelRecordComposerModal: React.FC = () => {
  const {
    isRecordComposerOpen,
    setIsRecordComposerOpen,
    activeRecordEditing,
    setActiveRecordEditing,
    composerPrefill,
    setComposerPrefill,
    createTravelRecord,
    updateTravelRecord,
    friendships,
    currentUser,
    publicProfiles,
    showToast,
  } = useApp();

  const isEditing = !!activeRecordEditing;

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [countryCode, setCountryCode] = useState('KR');
  const [regionCode, setRegionCode] = useState<string | ''>('');
  const [cityName, setCityName] = useState('');
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [coverPhotoIdx, setCoverPhotoIdx] = useState(0);
  const [newPhotoUrlInput, setNewPhotoUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [visibility, setVisibility] = useState<RecordVisibility>('public');
  const [selectedCompanions, setSelectedCompanions] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');

  // Load friends for companion selection
  const myFriends = friendships
    .filter((f) => f.uids.includes(currentUser.uid))
    .map((f) => {
      const friendUid = f.uids.find((u) => u !== currentUser.uid)!;
      return {
        uid: friendUid,
        name: publicProfiles[friendUid]?.name || '친구',
        photoURL: publicProfiles[friendUid]?.photoURL,
      };
    });

  // Populate data if editing or prefilled
  useEffect(() => {
    if (activeRecordEditing) {
      setTitle(activeRecordEditing.title);
      setDescription(activeRecordEditing.description);
      setCountryCode(activeRecordEditing.countryCode);
      setRegionCode(activeRecordEditing.regionCode || '');
      setCityName(activeRecordEditing.cityName || '');
      setVisitDate(activeRecordEditing.visitDate);
      setPhotoUrls(activeRecordEditing.photoURLs || []);
      setVisibility(activeRecordEditing.visibility);
      setSelectedCompanions(activeRecordEditing.companionUids || []);
      setTags(activeRecordEditing.tags || []);
    } else if (composerPrefill) {
      if (composerPrefill.countryCode) setCountryCode(composerPrefill.countryCode);
      if (composerPrefill.regionCode) setRegionCode(composerPrefill.regionCode);
    } else {
      // Default reset
      setTitle('');
      setDescription('');
      setCountryCode('KR');
      setRegionCode('');
      setCityName('');
      setVisitDate(new Date().toISOString().split('T')[0]);
      setPhotoUrls([
        'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=80',
      ]);
      setCoverPhotoIdx(0);
      setVisibility('public');
      setSelectedCompanions([]);
      setTags(['#힐링여행']);
    }
  }, [activeRecordEditing, composerPrefill, isRecordComposerOpen]);

  if (!isRecordComposerOpen) return null;

  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          setPhotoUrls((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleAddPhoto = () => {
    if (!newPhotoUrlInput.trim()) return;
    setPhotoUrls((prev) => [...prev, newPhotoUrlInput.trim()]);
    setNewPhotoUrlInput('');
  };

  const handleMovePhoto = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= photoUrls.length) return;

    setPhotoUrls((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
    if (coverPhotoIdx >= index && coverPhotoIdx > 0) {
      setCoverPhotoIdx((prev) => prev - 1);
    }
  };

  const handleToggleCompanion = (uid: string) => {
    setSelectedCompanions((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleToggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 5 ? [...prev, tag] : prev
    );
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTagInput.trim()) {
      e.preventDefault();
      let formatted = customTagInput.trim();
      if (!formatted.startsWith('#')) formatted = '#' + formatted;
      if (!tags.includes(formatted) && tags.length < 5) {
        setTags((prev) => [...prev, formatted]);
      }
      setCustomTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('제목을 입력해주세요.', 'warning');
      return;
    }
    if (photoUrls.length === 0) {
      showToast('최소 한 장 이상의 사진을 등록해주세요.', 'warning');
      return;
    }

    const countryMeta = WORLD_COUNTRIES.find((c) => c.code === countryCode || (c as any).iso2 === countryCode);
    const regionMeta = KOREA_REGIONS.find((r) => r.code === regionCode || (r as any).iso2 === regionCode);

    const companionNames = selectedCompanions
      .map((uid) => publicProfiles[uid]?.name)
      .filter(Boolean) as string[];

    const recordPayload = {
      title: title.trim(),
      description: description.trim(),
      countryCode,
      countryName: countryMeta?.name_ko || countryCode,
      regionCode: regionCode || undefined,
      regionName: regionMeta?.name_ko || undefined,
      cityName: cityName.trim() || undefined,
      visitDate,
      photoIds: photoUrls.map((_, i) => `photo-${i}`),
      photoURLs: photoUrls,
      coverPhotoId: `photo-${coverPhotoIdx}`,
      visibility,
      tags,
      companionUids: selectedCompanions,
      companionNames,
    };

    if (isEditing && activeRecordEditing) {
      updateTravelRecord(activeRecordEditing.id, recordPayload);
    } else {
      createTravelRecord(recordPayload);
    }

    handleClose();
  };

  const handleClose = () => {
    setIsRecordComposerOpen(false);
    setActiveRecordEditing(null);
    setComposerPrefill(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              {isEditing ? '여행 기록 수정' : '새 여행 기록 작성'}
            </h2>
            <button
              onClick={handleClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                제목 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="여행의 테마나 소감을 한 줄로 담아보세요"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Location & Date Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  국가
                </label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-800 dark:text-zinc-200"
                >
                  {WORLD_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name_ko} ({c.name_en})
                    </option>
                  ))}
                </select>
              </div>

              {countryCode === 'KR' ? (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    국내 지역
                  </label>
                  <select
                    value={regionCode}
                    onChange={(e) => setRegionCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="">지역 선택</option>
                    {KOREA_REGIONS.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name_ko}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    도시/장소명
                  </label>
                  <input
                    type="text"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="예: 파리 센강"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  방문 일자
                </label>
                <input
                  type="date"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>

            {/* Photos Manager */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                여행 사진 관리 ({photoUrls.length}) <span className="text-rose-500">*</span>
              </label>

              {/* Add Photo Input & Drag-and-Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-3 rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-indigo-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>사진 파일을 여기로 드래그하거나</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    파일 찾아보기
                  </button>
                </div>

                <div className="w-full flex gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                  <input
                    type="url"
                    value={newPhotoUrlInput}
                    onChange={(e) => setNewPhotoUrlInput(e.target.value)}
                    placeholder="또는 이미지 URL 직접 입력"
                    className="flex-1 text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> URL 추가
                  </button>
                </div>
              </div>

              {/* Photos List with Reordering & Cover */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {photoUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 group"
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />

                    {/* Cover badge */}
                    {coverPhotoIdx === idx && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[9px] font-bold shadow-xs">
                        대표 사진
                      </span>
                    )}

                    {/* Reorder & Action overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded-lg bg-white/80 text-zinc-900 disabled:opacity-30"
                        title="앞으로 이동"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(idx, 'down')}
                        disabled={idx === photoUrls.length - 1}
                        className="p-1 rounded-lg bg-white/80 text-zinc-900 disabled:opacity-30"
                        title="뒤로 이동"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverPhotoIdx(idx)}
                        className="p-1 rounded-lg bg-amber-400 text-zinc-900"
                        title="대표 사진 설정"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="p-1 rounded-lg bg-rose-500 text-white"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                여행 이야기 (본문)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="여행지의 특별했던 감상이나 꿀팁을 자유롭게 적어보세요."
                className="w-full text-xs p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Companions (Friends Selection) */}
            {myFriends.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  함께한 친구 태그
                </label>
                <div className="flex flex-wrap gap-2">
                  {myFriends.map((friend) => {
                    const isSelected = selectedCompanions.includes(friend.uid);
                    return (
                      <button
                        key={friend.uid}
                        type="button"
                        onClick={() => handleToggleCompanion(friend.uid)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                        }`}
                      >
                        <span>{friend.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hashtags */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                해시태그 (최대 5개)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {PRESET_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                      tags.includes(tag)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={handleAddCustomTag}
                placeholder="직접 태그 입력 후 Enter (예: #도쿄카페)"
                className="w-full text-xs px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* Visibility Settings */}
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                공개 범위
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    visibility === 'public'
                      ? 'bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm border border-indigo-200 dark:border-indigo-800'
                      : 'text-zinc-500'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>전체 공개</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('friends')}
                  className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    visibility === 'friends'
                      ? 'bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm border border-indigo-200 dark:border-indigo-800'
                      : 'text-zinc-500'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>친구 공개</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    visibility === 'private'
                      ? 'bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm border border-indigo-200 dark:border-indigo-800'
                      : 'text-zinc-500'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>나만 보기</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/25"
              >
                {isEditing ? '수정 완료' : '등록하기'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
