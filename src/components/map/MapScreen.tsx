/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../common/Header';
import { MapCanvas } from './MapCanvas';
import { MapSidebar } from './MapSidebar';
import { LocationDetailSheet } from './LocationDetailSheet';
import { MapType, TravelRecord } from '../../types';
import {
  Plus,
  Minus,
  RotateCcw,
  Globe,
  MapPin,
  CheckCircle,
  Star,
  Layers,
  Camera,
  EyeOff,
} from 'lucide-react';

export const MapScreen: React.FC = () => {
  const { currentUser, setActiveRecordDetail } = useApp();

  // Mode: friend | me (Default friend as per PART 22)
  const [mapMode, setMapMode] = useState<'friend' | 'me'>('friend');
  const [isModeTransitioning, setIsModeTransitioning] = useState(false);

  // Map type: world | domestic
  const [mapType, setMapType] = useState<MapType>(currentUser.mapSettings.myMapDefault || 'world');

  // Reset zoom & pan when map type changes
  useEffect(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, [mapType]);

  // 4 Filters: all | visited | wishlist | photo
  const [filterStatus, setFilterStatus] = useState<'all' | 'visited' | 'wishlist' | 'photo'>('all');

  // "내가 다녀온 곳만 보기" (Session only, not in localStorage)
  const [hideUnvisited, setHideUnvisited] = useState(false);

  // Zoom & Pan
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Selection
  const [selectedLocation, setSelectedLocation] = useState<{ type: 'country' | 'region'; code: string } | null>(null);

  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('stm_sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Crossfade transition between Friend/Me mode (200ms)
  const handleModeChange = (newMode: 'friend' | 'me') => {
    if (newMode === mapMode || isModeTransitioning) return;
    setIsModeTransitioning(true);
    setTimeout(() => {
      setMapMode(newMode);
      setIsModeTransitioning(false);
    }, 200);
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handlePinClick = (record: TravelRecord) => {
    setActiveRecordDetail(record);
  };

  return (
    <div className="relative w-full h-full pb-16 flex flex-col overflow-hidden select-none">
      {/* Slim Top Bar with Friend/Me Mode Segment Toggle */}
      <Header
        mapMode={mapMode}
        setMapMode={handleModeChange}
        isModeTransitioning={isModeTransitioning}
      />

      {/* Main Map Body Container */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar (나의log) */}
        {mapMode === 'me' && (
          <MapSidebar
            mapType={mapType}
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
        )}

        {/* Map Stage */}
        <div className={`relative flex-1 h-full transition-opacity duration-200 ${isModeTransitioning ? 'opacity-40' : 'opacity-100'}`}>
          {/* Top Center: Domestic / International Segment Toggle (Available in both Friend and My Map) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center p-1 bg-white/95 dark:bg-zinc-900/95 backdrop-blur rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-md pointer-events-auto">
            <button
              onClick={() => setMapType('domestic')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mapType === 'domestic'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              국내
            </button>
            <button
              onClick={() => setMapType('world')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mapType === 'world'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              해외
            </button>
          </div>

          {/* Top Right Floating Controls Bar (Me Mode Only Filters) */}
          {mapMode === 'me' && (
            <div className="absolute top-3 right-3 z-10 flex flex-wrap items-center gap-2 max-w-full">
              {/* 4 Status Filters (Me Mode Only) */}
              <div className="hidden md:flex items-center p-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-md">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === 'all'
                      ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setFilterStatus('visited')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === 'visited'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-emerald-600'
                  }`}
                >
                  <CheckCircle className="w-3 h-3" />
                  방문
                </button>
                <button
                  onClick={() => setFilterStatus('wishlist')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === 'wishlist'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-amber-500'
                  }`}
                >
                  <Star className="w-3 h-3" />
                  위시
                </button>
                <button
                  onClick={() => setFilterStatus('photo')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === 'photo'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-purple-600'
                  }`}
                >
                  <Camera className="w-3 h-3" />
                  사진모드
                </button>
              </div>

              {/* Session Only: 내가 다녀온 곳만 보기 Toggle (Me Mode) */}
              <button
                onClick={() => setHideUnvisited((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md backdrop-blur border ${
                  hideUnvisited
                    ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
                    : 'bg-white/90 dark:bg-zinc-900/90 border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
                title="다녀온 곳만 남기고 숨기기 (세션 임시)"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">다녀온 곳만</span>
              </button>
            </div>
          )}

          {/* SVG Map Canvas */}
          <MapCanvas
            mode={mapMode}
            mapType={mapType}
            filterStatus={filterStatus}
            hideUnvisited={hideUnvisited}
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
            zoomLevel={zoomLevel}
            panOffset={panOffset}
            onPanChange={setPanOffset}
            onPinClick={handlePinClick}
          />

          {/* Zoom / Pan Controls */}
          <div
            className={`absolute bottom-6 z-10 flex flex-col gap-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur p-1 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-lg transition-all duration-300 ${
              mapMode === 'me'
                ? isSidebarCollapsed
                  ? 'left-16'
                  : 'left-6 sm:left-[21rem]'
                : 'left-6'
            }`}
          >
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="확대"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="축소"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="전체보기 초기화"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Location Detail & Photo Gallery Slide Sheet */}
          {selectedLocation && (
            <LocationDetailSheet
              location={selectedLocation}
              onClose={() => setSelectedLocation(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
