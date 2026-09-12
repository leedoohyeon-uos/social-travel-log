/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  KOREA_REGIONS,
  WORLD_COUNTRIES,
  CONTINENTS,
} from '../../data/geoData';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Star,
  Layers,
} from 'lucide-react';

interface MapSidebarProps {
  mapType: 'world' | 'domestic';
  selectedLocation: { type: 'country' | 'region'; code: string } | null;
  onSelectLocation: (loc: { type: 'country' | 'region'; code: string }) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const MapSidebar: React.FC<MapSidebarProps> = ({
  mapType,
  selectedLocation,
  onSelectLocation,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { countryVisits, regionVisits } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContinent, setSelectedContinent] = useState('전체');

  // Stats calculation
  const stats = useMemo(() => {
    if (mapType === 'domestic') {
      const visitedCount = Object.values(regionVisits).filter((r) => (r as any).visited).length;
      const total = KOREA_REGIONS.length;
      const percent = Math.round((visitedCount / total) * 100);
      return { visited: visitedCount, total, percent };
    } else {
      const visitedCount = Object.values(countryVisits).filter((c) => (c as any).visited).length;
      const total = WORLD_COUNTRIES.length; // Real sovereign country count from GeoJSON
      const percent = total > 0 ? ((visitedCount / total) * 100).toFixed(1) : '0.0';
      return { visited: visitedCount, total, percent };
    }
  }, [mapType, countryVisits, regionVisits]);

  // Filtered List
  const filteredList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (mapType === 'domestic') {
      return KOREA_REGIONS.filter((reg) => {
        const matchesSearch =
          !term ||
          reg.name_ko.toLowerCase().includes(term) ||
          reg.name_en.toLowerCase().includes(term);
        return matchesSearch;
      });
    } else {
      return WORLD_COUNTRIES.filter((country) => {
        const matchesContinent =
          selectedContinent === '전체' || country.continent === selectedContinent;
        const matchesSearch =
          !term ||
          country.name_ko.toLowerCase().includes(term) ||
          country.name_en.toLowerCase().includes(term) ||
          country.code.toLowerCase().includes(term);
        return matchesContinent && matchesSearch;
      });
    }
  }, [mapType, searchTerm, selectedContinent]);

  return (
    <aside
      className={`absolute left-0 top-0 bottom-0 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 flex flex-col shadow-xl ${
        isCollapsed ? 'w-12' : 'w-72 sm:w-80'
      }`}
    >
      {/* Header */}
      <div className="h-14 px-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">나의log</span>
          </div>
        )}
        <button
          onClick={() => {
            const next = !isCollapsed;
            setIsCollapsed(next);
            localStorage.setItem('stm_sidebar_collapsed', JSON.stringify(next));
          }}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors mx-auto"
          title={isCollapsed ? '사이드바 열기' : '사이드바 접기'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Progress Gauge */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              <span className="text-zinc-600 dark:text-zinc-400">
                {mapType === 'domestic' ? '국내 탐방 달성도' : '세계 탐방 달성도'}
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {stats.visited}/{stats.total} ({stats.percent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Number(stats.percent))}%` }}
              />
            </div>
          </div>

          {/* Search Input */}
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={mapType === 'domestic' ? '지역 검색 (예: 서울, 제주)' : '국가 검색 (예: 일본, 프랑스)'}
                className="w-full pl-9 pr-8 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Continent Chips (World Only) */}
          {mapType === 'world' && (
            <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar border-b border-zinc-100 dark:border-zinc-800">
              {CONTINENTS.map((cont) => (
                <button
                  key={cont}
                  onClick={() => setSelectedContinent(cont)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                    selectedContinent === cont
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {cont}
                </button>
              ))}
            </div>
          )}

          {/* Location List (40px Rows) */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/40 pb-4">
            {filteredList.map((item) => {
              const code = item.code;
              const iso2 = (item as any).iso2;
              const visit =
                mapType === 'domestic'
                  ? regionVisits[code] || (iso2 ? regionVisits[iso2] : undefined)
                  : countryVisits[code] || (iso2 ? countryVisits[iso2] : undefined);
              const isVisited = !!visit?.visited;
              const isWishlist = !!visit?.wishlist;
              const isSelected = selectedLocation?.code === code || (iso2 && selectedLocation?.code === iso2);

              return (
                <button
                  key={code}
                  onClick={() => onSelectLocation({ type: mapType === 'domestic' ? 'region' : 'country', code })}
                  className={`w-full h-10 px-3.5 flex items-center justify-between text-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60 ${
                    isSelected ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate">{item.name_ko}</span>
                    <span className="text-[10px] text-zinc-400">({item.name_en})</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isVisited && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        {visit.visitCount || 1}회
                      </span>
                    )}
                    {isWishlist && !isVisited && (
                      <span className="flex items-center text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};
