/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  KOREA_PROVINCE_METAS,
  WORLD_COUNTRY_METAS,
  WORLD_CITY_METAS,
  getKoreaRegionMeta,
  getWorldCountryMeta,
} from '../services/geoDataService';

export interface GeoFeature {
  type: 'Feature';
  id: string;
  properties: {
    name: string;
    name_ko: string;
    code: string;
    continent?: string;
    capital?: string;
    coordinates?: [number, number]; // [lng, lat]
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoFeatureCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

export interface CityLocation {
  id: string;
  name: string;
  name_ko: string;
  countryCode: string;
  coordinates: [number, number]; // [lng, lat]
}

// 17 Korean Administrative Regions derived from actual korea.geojson
export const KOREA_REGIONS = KOREA_PROVINCE_METAS.map((p) => ({
  code: p.code,
  iso2: p.iso2 || `KR-${p.code}`,
  name_ko: p.name_ko,
  name_en: p.name_en,
  coordinates: p.coordinates,
  center: p.center || p.coordinates,
}));

// All 177 sovereign countries derived from actual world.geojson
export const WORLD_COUNTRIES = WORLD_COUNTRY_METAS.map((c) => ({
  code: c.code,
  iso2: c.iso2 || c.code,
  name_ko: c.name_ko,
  name_en: c.name_en,
  continent: c.continent || '기타',
  coordinates: c.coordinates,
}));

// World Cities derived from actual world_cities.geojson
export const WORLD_CITIES: CityLocation[] = WORLD_CITY_METAS.map((c, i) => ({
  id: `CITY-${i}-${c.countryCode}`,
  name: c.nameEn || c.name,
  name_ko: c.name,
  countryCode: c.countryCode,
  coordinates: c.coordinates,
}));

export { getKoreaRegionMeta, getWorldCountryMeta };


export const CONTINENTS = ['전체', '아시아', '유럽', '북아메리카', '남아메리카', '오세아니아', '아프리카'];

export const PRESET_TAGS = [
  '#힐링여행',
  '#맛집탐방',
  '#인생샷',
  '#뚜벅이',
  '#호캉스',
  '#자연속으로',
  '#역사투어',
  '#가성비',
  '#감성숙소',
  '#야경명소',
  '#카페투어',
  '#가족여행',
];

export const BADGE_DEFINITIONS: { id: string; title: string; description: string; icon: string; condition: (stats: { visitedCountries: number; visitedRegions: number; totalRecords: number; totalPhotos: number }) => { achieved: boolean; progressText: string } }[] = [
  {
    id: 'first_step',
    title: '첫 발자국',
    description: '첫 여행 기록을 등록했습니다.',
    icon: '🌱',
    condition: (stats) => ({
      achieved: stats.totalRecords >= 1,
      progressText: `${Math.min(stats.totalRecords, 1)}/1 기록`,
    }),
  },
  {
    id: 'globetrotter_bronze',
    title: '글로벌 여행자',
    description: '3개 이상의 국가를 방문했습니다.',
    icon: '✈️',
    condition: (stats) => ({
      achieved: stats.visitedCountries >= 3,
      progressText: `${Math.min(stats.visitedCountries, 3)}/3 개국`,
    }),
  },
  {
    id: 'korea_master',
    title: '대한민국 구석구석',
    description: '국내 5개 이상의 지역을 탐방했습니다.',
    icon: '🇰🇷',
    condition: (stats) => ({
      achieved: stats.visitedRegions >= 5,
      progressText: `${Math.min(stats.visitedRegions, 5)}/5 지역`,
    }),
  },
  {
    id: 'photo_collector',
    title: '추억 수집가',
    description: '10장 이상의 여행 사진을 남겼습니다.',
    icon: '📸',
    condition: (stats) => ({
      achieved: stats.totalPhotos >= 10,
      progressText: `${Math.min(stats.totalPhotos, 10)}/10 장`,
    }),
  },
  {
    id: 'storyteller',
    title: '여행 스토리텔러',
    description: '5개 이상의 여행기를 작성했습니다.',
    icon: '📖',
    condition: (stats) => ({
      achieved: stats.totalRecords >= 5,
      progressText: `${Math.min(stats.totalRecords, 5)}/5 기록`,
    }),
  },
];
