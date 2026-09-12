/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  koreaProvinces,
  koreaGeoPath,
  koreaProjection,
  worldCountryFeatures,
  worldGeoPath,
  worldProjection,
  getKoreaRegionMeta,
  getWorldCountryMeta,
} from '../../services/geoDataService';
import { CountryVisit, RegionVisit, TravelRecord } from '../../types';
import { useApp } from '../../context/AppContext';
import { Compass } from 'lucide-react';

interface MapCanvasProps {
  mode: 'friend' | 'me';
  mapType: 'world' | 'domestic';
  filterStatus: 'all' | 'visited' | 'wishlist' | 'photo';
  hideUnvisited: boolean;
  selectedLocation: { type: 'country' | 'region'; code: string } | null;
  onSelectLocation: (loc: { type: 'country' | 'region'; code: string }) => void;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  onPanChange?: (offset: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  onPinClick: (record: TravelRecord) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  mode,
  mapType,
  filterStatus,
  hideUnvisited,
  selectedLocation,
  onSelectLocation,
  zoomLevel,
  panOffset,
  onPanChange,
  onPinClick,
}) => {
  const { countryVisits, regionVisits, travelRecords, isFriend } = useApp();
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [hoveredSubRecordId, setHoveredSubRecordId] = useState<string | null>(null);

  // Pan & Drag & Spacebar state
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const isSpacePressedRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const lastSpaceMousePosRef = useRef<{ x: number; y: number } | null>(null);

  // Synchronize refs with state for global event listeners
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    isSpacePressedRef.current = isSpacePressed;
  }, [isSpacePressed]);

  // Spacebar global keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
        isSpacePressedRef.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        isSpacePressedRef.current = false;
        lastSpaceMousePosRef.current = null;
      }
    };

    const handleBlur = () => {
      setIsSpacePressed(false);
      isSpacePressedRef.current = false;
      setIsDragging(false);
      isDraggingRef.current = false;
      lastSpaceMousePosRef.current = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Global mousemove and mouseup listeners for uninterrupted panning
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // 1) Spacebar is held: pan continuously as mouse moves
      if (isSpacePressedRef.current) {
        if (lastSpaceMousePosRef.current) {
          const dx = e.clientX - lastSpaceMousePosRef.current.x;
          const dy = e.clientY - lastSpaceMousePosRef.current.y;
          if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
            hasDraggedRef.current = true;
            onPanChange?.((prev) => ({
              x: prev.x + dx,
              y: prev.y + dy,
            }));
          }
        }
        lastSpaceMousePosRef.current = { x: e.clientX, y: e.clientY };
        return;
      } else {
        lastSpaceMousePosRef.current = null;
      }

      // 2) Normal mouse dragging (mouse down + move)
      if (isDraggingRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        if (Math.hypot(dx, dy) > 4) {
          hasDraggedRef.current = true;
        }
        onPanChange?.({
          x: panStartRef.current.x + dx,
          y: panStartRef.current.y + dy,
        });
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        isDraggingRef.current = false;
        // Keep hasDragged true briefly so that clicks ending a drag are ignored
        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 80);
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current && e.touches.length === 1) {
        const touch = e.touches[0];
        const dx = touch.clientX - dragStartRef.current.x;
        const dy = touch.clientY - dragStartRef.current.y;
        if (Math.hypot(dx, dy) > 4) {
          hasDraggedRef.current = true;
        }
        onPanChange?.({
          x: panStartRef.current.x + dx,
          y: panStartRef.current.y + dy,
        });
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        isDraggingRef.current = false;
        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 80);
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
    window.addEventListener('touchend', handleGlobalTouchEnd);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [onPanChange]);

  // Handle pointer down on map container
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary left mouse button
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...panOffset };
    setIsDragging(true);
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      dragStartRef.current = { x: touch.clientX, y: touch.clientY };
      panStartRef.current = { ...panOffset };
      setIsDragging(true);
      isDraggingRef.current = true;
      hasDraggedRef.current = false;
    }
  };

  // Active friend records for pins (PART 20-3)
  const friendRecords = useMemo(() => {
    return travelRecords.filter(
      (r) => !r.hidden && (r.visibility === 'public' || (r.visibility === 'friends' && isFriend(r.authorUid)))
    );
  }, [travelRecords, isFriend]);

  // Clustered pins for Friend Mode using real D3 projections
  const friendPins = useMemo(() => {
    if (mode !== 'friend') return [];

    const pins: {
      id: string;
      x: number;
      y: number;
      records: TravelRecord[];
      primaryRecord: TravelRecord;
    }[] = [];

    friendRecords.forEach((rec) => {
      let coords: [number, number] | null = null;

      if (mapType === 'domestic') {
        const reg = getKoreaRegionMeta(rec.regionCode || '');
        if (reg) {
          const pt = koreaProjection(reg.coordinates);
          if (pt) coords = pt;
        }
      } else {
        const country = getWorldCountryMeta(rec.countryCode || '');
        if (country) {
          const pt = worldProjection(country.coordinates);
          if (pt) coords = pt;
        }
      }

      if (!coords) return;
      const [x, y] = coords;

      // Proximity clustering threshold
      const existing = pins.find((p) => Math.hypot(p.x - x, p.y - y) < 45);
      if (existing) {
        existing.records.push(rec);
      } else {
        pins.push({
          id: rec.id,
          x,
          y,
          records: [rec],
          primaryRecord: rec,
        });
      }
    });

    return pins;
  }, [mode, mapType, friendRecords]);

  // Memoized Korea province items
  const renderedKoreaProvinces = useMemo(() => {
    return koreaProvinces.map((feature) => {
      const code = String(feature.properties.code);
      const iso2 = `KR-${code}`;
      const name = feature.properties.name;
      const pathD = koreaGeoPath(feature as any) || '';
      const centroid = koreaGeoPath.centroid(feature as any);
      const cx = isNaN(centroid[0]) ? 0 : centroid[0];
      const cy = isNaN(centroid[1]) ? 0 : centroid[1];

      return {
        feature,
        code,
        iso2,
        name,
        pathD,
        cx,
        cy,
      };
    });
  }, []);

  // Memoized World country items
  const renderedWorldCountries = useMemo(() => {
    return worldCountryFeatures.map((feature) => {
      const p = feature.properties;
      const code = p.code;
      const iso2 = p.iso2;
      const name = p.name;
      const pathD = worldGeoPath(feature as any) || '';
      const centroid = worldGeoPath.centroid(feature as any);
      const cx = isNaN(centroid[0]) ? 0 : centroid[0];
      const cy = isNaN(centroid[1]) ? 0 : centroid[1];

      return {
        feature,
        code,
        iso2,
        name,
        pathD,
        cx,
        cy,
      };
    });
  }, []);

  const viewBox = mapType === 'domestic' ? '0 0 800 1000' : '0 0 1200 650';

  const cursorClass = isDragging
    ? 'cursor-grabbing'
    : isSpacePressed
    ? 'cursor-grab'
    : zoomLevel > 1
    ? 'cursor-grab active:cursor-grabbing'
    : 'cursor-grab active:cursor-grabbing';

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`relative w-full h-full bg-[#f8fafc] dark:bg-[#090d14] overflow-hidden select-none ${cursorClass}`}
    >
      {/* Decorative Compass / Current View Badge */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur border border-zinc-200/80 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm pointer-events-none">
        <Compass className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
        <span>{mapType === 'world' ? '세계 지도 (World 177)' : '대한민국 (Korea 17)'}</span>
      </div>

      {/* Spacebar Pan Hint Pill */}
      {isSpacePressed && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600/90 text-white text-[11px] font-bold shadow-lg pointer-events-none animate-pulse">
          <span>스페이스바 이동 모드</span>
        </div>
      )}

      <svg
        className="w-full h-full transition-transform duration-75 ease-out"
        viewBox={viewBox}
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: 'center center',
        }}
      >
        <defs>
          {/* Glass Pin Outer Body Gradient - Holographic Cyan to Fuchsia/Pink */}
          <linearGradient id="glassPinOuterGrad" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#818cf8" stopOpacity="0.9" />
            <stop offset="68%" stopColor="#c084fc" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.98" />
          </linearGradient>

          {/* Glass Pin Translucent Web (Lower Body) */}
          <linearGradient id="glassPinWebGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#c084fc" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#f472b6" stopOpacity="0.65" />
          </linearGradient>

          {/* Glass Pin Outer Rim Highlight Gradient */}
          <linearGradient id="glassPinRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#c084fc" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f472b6" stopOpacity="0.95" />
          </linearGradient>

          {/* Glass Pin Inner Hole Rim Gradient */}
          <linearGradient id="glassPinInnerRimGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#c084fc" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
          </linearGradient>

          {/* 3D Glass Drop Shadow & Neon Glow */}
          <filter id="glassPinGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#a855f7" floodOpacity="0.4" />
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.25" />
          </filter>

          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              className="text-zinc-200/40 dark:text-zinc-800/30"
              strokeWidth="0.5"
            />
          </pattern>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* DOMESTIC MAP (Actual GeoJSON 17 Regions) */}
        {mapType === 'domestic' && (
          <g>
            {renderedKoreaProvinces.map((prov) => {
              const visit = regionVisits[prov.code] || regionVisits[prov.iso2];
              const isVisited = !!visit?.visited;
              const isWishlist = !!visit?.wishlist;
              const isSelected =
                selectedLocation?.code === prov.code || selectedLocation?.code === prov.iso2;
              const isHovered = hoveredLocation === prov.code;

              // Filters
              if (hideUnvisited && !isVisited) return null;
              if (filterStatus === 'visited' && !isVisited) return null;
              if (filterStatus === 'wishlist' && !isWishlist) return null;
              if (filterStatus === 'photo' && (!isVisited || !visit?.photos?.length)) return null;

              let fillColor = 'fill-white dark:fill-zinc-900/90';
              let strokeColor = 'stroke-zinc-300 dark:stroke-zinc-700';

              if (mode === 'me') {
                if (isVisited) {
                  fillColor = isSelected
                    ? 'fill-indigo-600 dark:fill-indigo-500'
                    : 'fill-indigo-500/80 dark:fill-indigo-600/80 hover:fill-indigo-500';
                  strokeColor = 'stroke-indigo-400 dark:stroke-indigo-300';
                } else if (isWishlist) {
                  fillColor = isSelected
                    ? 'fill-amber-400 dark:fill-amber-500'
                    : 'fill-amber-300/80 dark:fill-amber-500/60 hover:fill-amber-400';
                  strokeColor = 'stroke-amber-400 dark:stroke-amber-300';
                }
              }

              if (isSelected) {
                strokeColor = 'stroke-indigo-600 dark:stroke-indigo-400';
              }

              return (
                <g
                  key={prov.code}
                  onClick={() => {
                    if (hasDraggedRef.current) return;
                    onSelectLocation({ type: 'region', code: prov.code });
                  }}
                  onMouseEnter={() => setHoveredLocation(prov.code)}
                  onMouseLeave={() => setHoveredLocation(null)}
                  className="cursor-pointer transition-all duration-150 group"
                >
                  {/* Real GeoJSON Polygon Path */}
                  <path
                    d={prov.pathD}
                    className={`${fillColor} ${strokeColor} transition-colors ${
                      isSelected ? 'stroke-[2.5]' : isHovered ? 'stroke-[2]' : 'stroke-[1.2]'
                    }`}
                  />

                  {/* Photo mode badge or photo in centroid */}
                  {mode === 'me' && filterStatus === 'photo' && visit?.photos?.[0] && (
                    <g>
                      <clipPath id={`clip-kr-${prov.code}`}>
                        <circle cx={prov.cx} cy={prov.cy} r={20} />
                      </clipPath>
                      <circle
                        cx={prov.cx}
                        cy={prov.cy}
                        r={22}
                        className="fill-white stroke-indigo-600 stroke-2"
                      />
                      <image
                        href={visit.photos[0].downloadURL}
                        x={prov.cx - 20}
                        y={prov.cy - 20}
                        width={40}
                        height={40}
                        clipPath={`url(#clip-kr-${prov.code})`}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    </g>
                  )}

                  {/* Province Name Label */}
                  {prov.cx > 0 && prov.cy > 0 && filterStatus !== 'photo' && (
                    <text
                      x={prov.cx}
                      y={prov.cy}
                      textAnchor="middle"
                      className={`text-[11px] font-bold pointer-events-none select-none ${
                        mode === 'me' && isVisited
                          ? 'fill-white'
                          : 'fill-zinc-800 dark:fill-zinc-200'
                      }`}
                    >
                      {prov.name}
                    </text>
                  )}

                  {/* Visit Count Badge */}
                  {mode === 'me' && isVisited && filterStatus !== 'photo' && (
                    <g transform={`translate(${prov.cx - 15}, ${prov.cy + 6})`}>
                      <rect width="30" height="15" rx="7.5" fill="#ffffff" fillOpacity="0.95" />
                      <text
                        x="15"
                        y="11"
                        textAnchor="middle"
                        className="fill-indigo-700 text-[9px] font-black"
                      >
                        ✓ {visit?.visitCount || 1}회
                      </text>
                    </g>
                  )}

                  {/* Wishlist Star */}
                  {mode === 'me' && !isVisited && isWishlist && (
                    <text
                      x={prov.cx}
                      y={prov.cy + 15}
                      textAnchor="middle"
                      className="fill-amber-500 text-[13px] font-bold pointer-events-none"
                    >
                      ★
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* WORLD MAP (Actual GeoJSON 177 Countries) */}
        {mapType === 'world' && (
          <g>
            {renderedWorldCountries.map((country) => {
              const visit =
                countryVisits[country.code] || (country.iso2 ? countryVisits[country.iso2] : undefined);
              const isVisited = !!visit?.visited;
              const isWishlist = !!visit?.wishlist;
              const isSelected =
                selectedLocation?.code === country.code ||
                (country.iso2 && selectedLocation?.code === country.iso2);
              const isHovered = hoveredLocation === country.code;

              // Filters
              if (hideUnvisited && !isVisited) return null;
              if (filterStatus === 'visited' && !isVisited) return null;
              if (filterStatus === 'wishlist' && !isWishlist) return null;
              if (filterStatus === 'photo' && (!isVisited || !visit?.photos?.length)) return null;

              let fillColor = 'fill-zinc-100 dark:fill-zinc-800/80';
              let strokeColor = 'stroke-zinc-300 dark:stroke-zinc-700';

              if (mode === 'me') {
                if (isVisited) {
                  fillColor = isSelected
                    ? 'fill-indigo-600 dark:fill-indigo-500'
                    : 'fill-indigo-500/85 dark:fill-indigo-600/85 hover:fill-indigo-500';
                  strokeColor = 'stroke-indigo-400 dark:stroke-indigo-300';
                } else if (isWishlist) {
                  fillColor = isSelected
                    ? 'fill-amber-400 dark:fill-amber-500'
                    : 'fill-amber-300/80 dark:fill-amber-500/60 hover:fill-amber-400';
                  strokeColor = 'stroke-amber-400 dark:stroke-amber-300';
                }
              }

              if (isSelected) {
                strokeColor = 'stroke-indigo-600 dark:stroke-indigo-400';
              }

              return (
                <g
                  key={country.code}
                  onClick={() => {
                    if (hasDraggedRef.current) return;
                    onSelectLocation({ type: 'country', code: country.code });
                  }}
                  onMouseEnter={() => setHoveredLocation(country.code)}
                  onMouseLeave={() => setHoveredLocation(null)}
                  className="cursor-pointer transition-all duration-150 group"
                >
                  {/* Real GeoJSON Country Polygon Path */}
                  <path
                    d={country.pathD}
                    className={`${fillColor} ${strokeColor} transition-colors ${
                      isSelected ? 'stroke-[2]' : isHovered ? 'stroke-[1.5]' : 'stroke-[0.7]'
                    }`}
                  />

                  {/* Photo mode badge */}
                  {mode === 'me' && filterStatus === 'photo' && visit?.photos?.[0] && country.cx > 0 && (
                    <g>
                      <clipPath id={`clip-world-${country.code}`}>
                        <circle cx={country.cx} cy={country.cy} r={18} />
                      </clipPath>
                      <circle
                        cx={country.cx}
                        cy={country.cy}
                        r={20}
                        className="fill-white stroke-indigo-600 stroke-2"
                      />
                      <image
                        href={visit.photos[0].downloadURL}
                        x={country.cx - 18}
                        y={country.cy - 18}
                        width={36}
                        height={36}
                        clipPath={`url(#clip-world-${country.code})`}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    </g>
                  )}

                  {/* Country Name Label (Centered at Centroid) */}
                  {country.cx > 0 && country.cy > 0 && filterStatus !== 'photo' && (
                    <text
                      x={country.cx}
                      y={country.cy}
                      textAnchor="middle"
                      className={`text-[9px] font-bold pointer-events-none select-none ${
                        mode === 'me' && isVisited
                          ? 'fill-white'
                          : 'fill-zinc-800 dark:fill-zinc-200'
                      }`}
                    >
                      {country.name}
                    </text>
                  )}

                  {/* Visit Badge */}
                  {mode === 'me' && isVisited && country.cx > 0 && filterStatus !== 'photo' && (
                    <g transform={`translate(${country.cx - 14}, ${country.cy + 5})`}>
                      <rect width="28" height="13" rx="6.5" fill="#ffffff" fillOpacity="0.95" />
                      <text
                        x="14"
                        y="9.5"
                        textAnchor="middle"
                        className="fill-indigo-700 text-[8px] font-black"
                      >
                        ✓ {visit?.visitCount || 1}
                      </text>
                    </g>
                  )}

                  {/* Wishlist Star */}
                  {mode === 'me' && !isVisited && isWishlist && country.cx > 0 && (
                    <text
                      x={country.cx}
                      y={country.cy + 13}
                      textAnchor="middle"
                      className="fill-amber-500 text-[11px] font-bold pointer-events-none"
                    >
                      ★
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* FRIEND MODE PINS & CLUSTERS */}
        {mode === 'friend' && (
          <g>
            {friendPins.map((pin) => {
              const isCluster = pin.records.length > 1;
              const isExpanded = expandedClusterId === pin.id;
              const isHovered = hoveredPinId === pin.id;

              return (
                <g key={pin.id} className="cursor-pointer">
                  {/* Subtle ground contact shadow */}
                  <ellipse
                    cx={pin.x}
                    cy={pin.y + 1}
                    rx={7}
                    ry={2.5}
                    className="fill-purple-900/25 dark:fill-purple-400/20 pointer-events-none"
                  />

                  {/* Pulsing Aura Ring around Pin Base (pointer-events-none) */}
                  <circle
                    cx={pin.x}
                    cy={pin.y - 26}
                    r={22}
                    className="fill-pink-500/15 dark:fill-pink-400/20 animate-ping pointer-events-none"
                  />

                  {/* VISUAL PIN GRAPHICS (pointer-events-none prevents any hover jitter) */}
                  <g
                    className="pointer-events-none transition-transform duration-200"
                    style={{
                      transformOrigin: `${pin.x}px ${pin.y}px`,
                      transform: isHovered ? 'scale(1.15) translateY(-2px)' : 'scale(1)',
                    }}
                  >
                    {/* Lower translucent glass web filling the teardrop taper */}
                    <path
                      d={`M ${pin.x - 9} ${pin.y - 26} C ${pin.x - 9} ${pin.y - 18}, ${pin.x - 4} ${pin.y - 8}, ${pin.x} ${pin.y} C ${pin.x + 4} ${pin.y - 8}, ${pin.x + 9} ${pin.y - 18}, ${pin.x + 9} ${pin.y - 26} Z`}
                      fill="url(#glassPinWebGrad)"
                    />

                    {/* Main Holographic Glass Teardrop Pin Body with Center Hole */}
                    <path
                      d={`M ${pin.x} ${pin.y} C ${pin.x - 3} ${pin.y - 4}, ${pin.x - 17} ${pin.y - 15}, ${pin.x - 17} ${pin.y - 27} A 17 17 0 1 1 ${pin.x + 17} ${pin.y - 27} C ${pin.x + 17} ${pin.y - 15}, ${pin.x + 3} ${pin.y - 4}, ${pin.x} ${pin.y} Z M ${pin.x} ${pin.y - 36.5} A 9.5 9.5 0 1 0 ${pin.x} ${pin.y - 17.5} A 9.5 9.5 0 1 0 ${pin.x} ${pin.y - 36.5} Z`}
                      fillRule="evenodd"
                      fill="url(#glassPinOuterGrad)"
                      filter="url(#glassPinGlow)"
                    />

                    {/* Outer Edge Rim Light Stroke */}
                    <path
                      d={`M ${pin.x} ${pin.y} C ${pin.x - 3} ${pin.y - 4}, ${pin.x - 17} ${pin.y - 15}, ${pin.x - 17} ${pin.y - 27} A 17 17 0 1 1 ${pin.x + 17} ${pin.y - 27} C ${pin.x + 17} ${pin.y - 15}, ${pin.x + 3} ${pin.y - 4}, ${pin.x} ${pin.y} Z`}
                      fill="none"
                      stroke="url(#glassPinRimGrad)"
                      strokeWidth={1.2}
                    />

                    {/* Inner Circular Hole Glowing Rim */}
                    <circle
                      cx={pin.x}
                      cy={pin.y - 27}
                      r={9.5}
                      fill="none"
                      stroke="url(#glassPinInnerRimGrad)"
                      strokeWidth={1.4}
                    />

                    {/* Glossy Top-Left Specular Reflection (Glass Shine) */}
                    <path
                      d={`M ${pin.x - 12} ${pin.y - 35} A 14 14 0 0 1 ${pin.x + 4} ${pin.y - 41}`}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      opacity={0.88}
                    />

                    {/* Lower Inner Glass Reflection */}
                    <path
                      d={`M ${pin.x - 5} ${pin.y - 22} A 7 7 0 0 1 ${pin.x + 5} ${pin.y - 22}`}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth={0.9}
                      strokeLinecap="round"
                      opacity={0.65}
                    />

                    {/* Friend Profile Avatar Inside the Glass Ring */}
                    <clipPath id={`avatar-clip-${pin.id}`}>
                      <circle cx={pin.x} cy={pin.y - 27} r={8.5} />
                    </clipPath>

                    {pin.primaryRecord.authorPhotoURL ? (
                      <image
                        href={pin.primaryRecord.authorPhotoURL}
                        x={pin.x - 8.5}
                        y={pin.y - 35.5}
                        width={17}
                        height={17}
                        clipPath={`url(#avatar-clip-${pin.id})`}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    ) : (
                      <g>
                        <circle cx={pin.x} cy={pin.y - 27} r={8.5} fill="#4c1d95" />
                        <text
                          x={pin.x}
                          y={pin.y - 24}
                          textAnchor="middle"
                          className="fill-pink-100 text-[8px] font-black select-none"
                        >
                          {pin.primaryRecord.authorName[0]}
                        </text>
                      </g>
                    )}

                    {/* Glass Avatar Rim */}
                    <circle
                      cx={pin.x}
                      cy={pin.y - 27}
                      r={8.5}
                      fill="none"
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth={0.8}
                    />

                    {/* Cluster Badge */}
                    {isCluster && (
                      <g transform={`translate(${pin.x + 8}, ${pin.y - 38})`}>
                        <rect
                          x={0}
                          y={0}
                          width={18}
                          height={14}
                          rx={7}
                          className="fill-pink-500 stroke-white dark:stroke-zinc-900"
                          strokeWidth={1.5}
                        />
                        <text
                          x={9}
                          y={10.5}
                          textAnchor="middle"
                          className="fill-white text-[8px] font-black"
                        >
                          +{pin.records.length}
                        </text>
                      </g>
                    )}
                  </g>

                  {/* FIXED INVISIBLE HIT TARGET: 
                      Guarantees zero cursor jitter / vibration because hit area size and position NEVER change */}
                  <circle
                    cx={pin.x}
                    cy={pin.y - 22}
                    r={26}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPinId(pin.id)}
                    onMouseLeave={() => setHoveredPinId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasDraggedRef.current) return;
                      if (isCluster && !isExpanded) {
                        setExpandedClusterId(pin.id);
                      } else {
                        onPinClick(pin.primaryRecord);
                      }
                    }}
                  />

                  {/* HOVER TOOLTIP CARD: Displays Friend Name and Face without moving hit zone */}
                  {isHovered && (
                    <g
                      transform={`translate(${pin.x}, ${pin.y - 58})`}
                      className="pointer-events-none animate-fadeIn filter drop-shadow-xl"
                    >
                      {/* Tooltip Card Pill */}
                      <rect
                        x={-72}
                        y={-20}
                        width={144}
                        height={40}
                        rx={20}
                        className="fill-zinc-950/95 dark:fill-zinc-900/95 stroke-pink-500/50"
                        strokeWidth={1.2}
                      />
                      {/* Pointer Arrow */}
                      <polygon
                        points="-5,20 5,20 0,26"
                        className="fill-zinc-950/95 dark:fill-zinc-900/95"
                      />

                      {/* Avatar inside tooltip */}
                      <g transform="translate(-48, 0)">
                        <circle cx={0} cy={0} r={14} className="fill-zinc-800 stroke-pink-400 stroke-[1.5]" />
                        <clipPath id={`tt-clip-${pin.id}`}>
                          <circle cx={0} cy={0} r={13} />
                        </clipPath>
                        {pin.primaryRecord.authorPhotoURL ? (
                          <image
                            href={pin.primaryRecord.authorPhotoURL}
                            x={-13}
                            y={-13}
                            width={26}
                            height={26}
                            clipPath={`url(#tt-clip-${pin.id})`}
                            preserveAspectRatio="xMidYMid slice"
                          />
                        ) : (
                          <text
                            x={0}
                            y={4.5}
                            textAnchor="middle"
                            className="fill-white text-xs font-bold"
                          >
                            {pin.primaryRecord.authorName[0]}
                          </text>
                        )}
                      </g>

                      {/* Friend Name */}
                      <text
                        x={-28}
                        y={-2}
                        className="fill-white text-[11px] font-bold select-none"
                      >
                        {pin.primaryRecord.authorName}
                        {isCluster ? ` 외 ${pin.records.length - 1}명` : ''}
                      </text>
                      {/* Location / Post snippet */}
                      <text
                        x={-28}
                        y={12}
                        className="fill-pink-300 dark:fill-pink-400 text-[9px] font-medium select-none"
                      >
                        {pin.primaryRecord.placeName || pin.primaryRecord.title || '여행 기록 보기'}
                      </text>
                    </g>
                  )}

                  {/* Expanded Cluster Avatars with Holographic Glass Rings */}
                  {isCluster && isExpanded && (
                    <g className="animate-fadeIn">
                      {/* Connecting dotted lines between parent pin and expanded avatars */}
                      {pin.records.slice(0, 5).map((rec, i) => {
                        const offsetX = (i - (Math.min(pin.records.length, 5) - 1) / 2) * 36;
                        const posY = pin.y - 48;
                        return (
                          <line
                            key={`line-${rec.id}`}
                            x1={pin.x}
                            y1={pin.y - 27}
                            x2={pin.x + offsetX}
                            y2={posY}
                            stroke="url(#glassPinOuterGrad)"
                            strokeWidth={1.5}
                            strokeDasharray="2 2"
                            className="opacity-50 pointer-events-none"
                          />
                        );
                      })}

                      {/* Sub-avatars */}
                      {pin.records.slice(0, 5).map((rec, i) => {
                        const offsetX = (i - (Math.min(pin.records.length, 5) - 1) / 2) * 36;
                        const posY = pin.y - 48;
                        const isSubHovered = hoveredSubRecordId === rec.id;

                        return (
                          <g
                            key={rec.id}
                            transform={`translate(${pin.x + offsetX}, ${posY})`}
                            className="cursor-pointer"
                          >
                            {/* Visual Avatar Element (pointer-events-none ensures NO boundary shift or vibration) */}
                            <g
                              className="pointer-events-none transition-transform duration-150"
                              style={{
                                transform: isSubHovered ? 'scale(1.2)' : 'scale(1)',
                                transformOrigin: '0px 0px',
                              }}
                            >
                              <circle
                                cx={0}
                                cy={0}
                                r={16}
                                fill="url(#glassPinOuterGrad)"
                                stroke="#ffffff"
                                strokeWidth={1.5}
                                filter="url(#glassPinGlow)"
                              />
                              <clipPath id={`sub-clip-${rec.id}`}>
                                <circle cx={0} cy={0} r={13} />
                              </clipPath>
                              {rec.authorPhotoURL ? (
                                <image
                                  href={rec.authorPhotoURL}
                                  x={-13}
                                  y={-13}
                                  width={26}
                                  height={26}
                                  clipPath={`url(#sub-clip-${rec.id})`}
                                  preserveAspectRatio="xMidYMid slice"
                                />
                              ) : (
                                <text
                                  x={0}
                                  y={4}
                                  textAnchor="middle"
                                  className="fill-white text-[10px] font-bold select-none"
                                >
                                  {rec.authorName[0]}
                                </text>
                              )}
                            </g>

                            {/* FIXED TRANSPARENT HIT TARGET: Position and radius never change on hover */}
                            <circle
                              cx={0}
                              cy={0}
                              r={22}
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredSubRecordId(rec.id)}
                              onMouseLeave={() => setHoveredSubRecordId(null)}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (hasDraggedRef.current) return;
                                onPinClick(rec);
                              }}
                            />

                            {/* Sub-avatar Tooltip (Friend Name) */}
                            {isSubHovered && (
                              <g
                                transform="translate(0, -28)"
                                className="pointer-events-none animate-fadeIn filter drop-shadow-md"
                              >
                                <rect
                                  x={-36}
                                  y={-12}
                                  width={72}
                                  height={20}
                                  rx={10}
                                  className="fill-zinc-950/95 dark:fill-zinc-900/95 stroke-pink-500/50"
                                  strokeWidth={1}
                                />
                                <polygon
                                  points="-4,8 4,8 0,12"
                                  className="fill-zinc-950/95 dark:fill-zinc-900/95"
                                />
                                <text
                                  x={0}
                                  y={2}
                                  textAnchor="middle"
                                  className="fill-white text-[10px] font-bold select-none"
                                >
                                  {rec.authorName}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
};
