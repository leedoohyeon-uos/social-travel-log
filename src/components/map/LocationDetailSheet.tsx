/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getKoreaRegionMeta,
  getWorldCountryMeta,
} from '../../services/geoDataService';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  Star,
  Plus,
  Minus,
  PenTool,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';

interface LocationDetailSheetProps {
  location: { type: 'country' | 'region'; code: string } | null;
  onClose: () => void;
}

export const LocationDetailSheet: React.FC<LocationDetailSheetProps> = ({ location, onClose }) => {
  const {
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
    setIsRecordComposerOpen,
    setComposerPrefill,
  } = useApp();

  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!location) return null;

  const isDomestic = location.type === 'region';
  const meta = isDomestic
    ? getKoreaRegionMeta(location.code)
    : getWorldCountryMeta(location.code);

  if (!meta) return null;

  const visit = isDomestic
    ? regionVisits[location.code] || (meta.iso2 ? regionVisits[meta.iso2] : undefined)
    : countryVisits[location.code] || (meta.iso2 ? countryVisits[meta.iso2] : undefined);
  const visitCount = visit?.visitCount || 0;
  const isVisited = !!visit?.visited && visitCount > 0;
  const isWishlist = !!visit?.wishlist;
  const photos = visit?.photos || [];

  const handleRegisterVisit = () => {
    if (isDomestic) {
      toggleRegionVisit(location.code, meta.name_ko);
    } else {
      toggleCountryVisit(location.code, meta.name_ko);
    }
  };

  const handleIncrementVisit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDomestic) {
      incrementRegionVisit(location.code, meta.name_ko);
    } else {
      incrementCountryVisit(location.code, meta.name_ko);
    }
  };

  const handleDecrementVisit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDomestic) {
      decrementRegionVisit(location.code, meta.name_ko);
    } else {
      decrementCountryVisit(location.code, meta.name_ko);
    }
  };

  const handleToggleWishlist = () => {
    if (isDomestic) {
      toggleRegionWishlist(location.code, meta.name_ko);
    } else {
      toggleCountryWishlist(location.code, meta.name_ko);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setPhotoUrlInput(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddPhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrlInput.trim()) return;
    addPhotoToLocation(location.type, location.code, photoUrlInput.trim(), photoCaption.trim());
    setPhotoUrlInput('');
    setPhotoCaption('');
    setIsAddingPhoto(false);
  };

  const handleOpenStoryComposer = () => {
    setComposerPrefill({
      countryCode: isDomestic ? 'KR' : location.code,
      regionCode: isDomestic ? location.code : undefined,
      photoIds: photos.map((p) => p.id),
    });
    setIsRecordComposerOpen(true);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed sm:absolute right-0 top-14 sm:top-0 bottom-16 sm:bottom-0 z-30 w-full sm:w-96 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col"
      >
        {/* Top Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{meta.name_ko}</h2>
              <span className="text-xs text-zinc-400 font-medium">{meta.name_en}</span>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {isDomestic ? '대한민국 17개 시·도' : (meta as any).continent || '해외 국가'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons: Visit Check & Wishlist Star */}
        <div className="p-4 grid grid-cols-2 gap-2 border-b border-zinc-100 dark:border-zinc-800">
          {!isVisited || visitCount === 0 ? (
            <button
              onClick={handleRegisterVisit}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all shadow-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4 text-zinc-400" />
              <span>다녀온 곳 등록</span>
            </button>
          ) : (
            <div className="flex items-center justify-between py-1 px-1.5 rounded-xl font-bold text-xs transition-all shadow-sm bg-emerald-600 text-white shadow-emerald-500/20">
              <button
                type="button"
                onClick={handleDecrementVisit}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-emerald-700/70 active:scale-90 transition-all text-white font-black"
                title="방문 횟수 1회 감소"
                aria-label="방문 횟수 1회 감소"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <div className="flex items-center gap-1 px-1 select-none pointer-events-none">
                <CheckCircle2 className="w-3.5 h-3.5 text-white flex-shrink-0" />
                <span className="tabular-nums font-extrabold text-xs whitespace-nowrap">
                  다녀옴 {visitCount}회
                </span>
              </div>
              <button
                type="button"
                onClick={handleIncrementVisit}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-emerald-700/70 active:scale-90 transition-all text-white font-black"
                title="방문 횟수 1회 증가"
                aria-label="방문 횟수 1회 증가"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          )}

          <button
            onClick={handleToggleWishlist}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all shadow-sm ${
              isWishlist
                ? 'bg-amber-500 text-white shadow-amber-500/20'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Star className={`w-4 h-4 ${isWishlist ? 'fill-white text-white' : 'text-zinc-400'}`} />
            {isWishlist ? '위시리스트 담김' : '위시리스트 추가'}
          </button>
        </div>

        {/* Photos Grid & Gallery */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
              추억 갤러리 ({photos.length})
            </h3>
            <button
              onClick={() => setIsAddingPhoto((prev) => !prev)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 사진 추가
            </button>
          </div>

          {/* Add Photo Mini Form */}
          {isAddingPhoto && (
            <form onSubmit={handleAddPhotoSubmit} className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2.5">
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
                className={`p-2.5 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 bg-white/50 dark:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <Upload className="w-3.5 h-3.5 text-indigo-500" />
                  <span>사진 드래그 또는</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    파일 선택
                  </button>
                </div>
              </div>

              <input
                type="text"
                required
                placeholder="사진 이미지 URL 직접 입력 (또는 위 파일 선택)"
                value={photoUrlInput}
                onChange={(e) => setPhotoUrlInput(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <input
                type="text"
                placeholder="사진 캡션 (선택)"
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingPhoto(false)}
                  className="px-2.5 py-1 text-xs text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  저장
                </button>
              </div>
            </form>
          )}

          {/* 3-Column Photo Grid */}
          {photos.length === 0 ? (
            <div className="py-10 text-center rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-700">
              <p className="text-xs text-zinc-400">등록된 사진이 없습니다.</p>
              <button
                onClick={() => setIsAddingPhoto(true)}
                className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                + 첫 사진 남기기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-sm">
                  <img
                    src={photo.downloadURL}
                    alt={photo.caption || ''}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  {photo.caption && (
                    <div className="absolute inset-x-0 bottom-0 p-1 bg-black/60 text-white text-[9px] truncate">
                      {photo.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Action: Write Story with this Location */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80">
          <button
            onClick={handleOpenStoryComposer}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all active:scale-98"
          >
            <PenTool className="w-4 h-4" />
            이 여행 기록으로 스토리 쓰기
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
