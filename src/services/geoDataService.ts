/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/services/geoDataService.ts
 * Real GeoJSON data service for Travel Log.
 * Loads and exposes actual geo data from:
 * - src/data/korea.geojson (17 provinces + 251 municipalities)
 * - src/data/world.geojson (177 sovereign countries + 572 cities)
 * - src/data/world_cities.geojson (7,342 world cities)
 */

import * as d3 from 'd3';
import rawKoreaGeoJson from '../data/korea.geojson';
import rawWorldGeoJson from '../data/world.geojson';
import rawWorldCitiesGeoJson from '../data/world_cities.geojson';

export interface GeoLocationMeta {
  code: string;
  iso2?: string;
  name_ko: string;
  name_en: string;
  continent?: string;
  coordinates: [number, number]; // [lng, lat]
  center?: [number, number];
  level: string;
  population?: number;
  capital?: boolean;
}

export interface GeoJsonFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: any;
}

export interface GeoJsonCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

// Cast raw imports
export const koreaGeoJson: GeoJsonCollection = rawKoreaGeoJson;
export const worldGeoJson: GeoJsonCollection = rawWorldGeoJson;
export const worldCitiesGeoJson: GeoJsonCollection = rawWorldCitiesGeoJson;

// Filter features
export const koreaProvinces = koreaGeoJson.features.filter(
  (f) => f.properties?.level === 'province'
);

export const koreaMunicipalities = koreaGeoJson.features.filter(
  (f) => f.properties?.level === 'municipality'
);

export const worldCountryFeatures = worldGeoJson.features.filter(
  (f) => f.properties?.level === 'country'
);

export const worldCityFeatures = worldCitiesGeoJson.features;

// Code mapping for Korea provinces:
// The GeoJSON uses codes '11', '21', '22', etc.
// Some legacy or user data might use 'KR-11', 'KR-26', etc.
const KOREA_CODE_ALIAS_MAP: Record<string, string> = {
  'KR-11': '11',
  'KR-26': '21',
  'KR-27': '22',
  'KR-28': '23',
  'KR-29': '24',
  'KR-30': '25',
  'KR-31': '26',
  'KR-50': '29', // Sejong
  'KR-41': '31',
  'KR-42': '32',
  'KR-43': '33',
  'KR-44': '34',
  'KR-45': '35',
  'KR-46': '36',
  'KR-47': '37',
  'KR-48': '38',
  'KR-49': '39', // Jeju
};

// Build normalized Korea Region metadata list
export const KOREA_PROVINCE_METAS: GeoLocationMeta[] = koreaProvinces.map((f) => {
  const code = String(f.properties.code);
  const centroid = d3.geoCentroid(f as any);
  return {
    code: code, // '11', '21', etc.
    iso2: `KR-${code}`,
    name_ko: f.properties.name,
    name_en: f.properties.nameEn || f.properties.name,
    level: 'province',
    coordinates: centroid,
    center: centroid,
  };
});

// Continent Korean translation helper
const CONTINENT_KO_MAP: Record<string, string> = {
  Asia: '아시아',
  Europe: '유럽',
  'North America': '북아메리카',
  'South America': '남아메리카',
  Africa: '아프리카',
  Oceania: '오세아니아',
  Antarctica: '남극',
  'Seven seas (open ocean)': '대양',
};

// Build normalized World Country metadata list (177 countries)
export const WORLD_COUNTRY_METAS: GeoLocationMeta[] = worldCountryFeatures.map((f) => {
  const p = f.properties;
  const centroid = d3.geoCentroid(f as any);
  const contEn = p.continent || 'Other';
  const contKo = CONTINENT_KO_MAP[contEn] || contEn;

  return {
    code: p.code, // ISO3, e.g. "KOR", "USA", "JPN"
    iso2: p.iso2, // ISO2, e.g. "KR", "US", "JP"
    name_ko: p.name,
    name_en: p.nameEn || p.name,
    continent: contKo,
    coordinates: centroid,
    center: centroid,
    level: 'country',
  };
});

// Major World Cities list
export const WORLD_CITY_METAS = worldCityFeatures.slice(0, 1000).map((f) => {
  const p = f.properties;
  const coords = f.geometry?.coordinates || [0, 0];
  return {
    name: p.name,
    nameEn: p.nameEn,
    countryCode: p.countryCode,
    capital: !!p.capital,
    population: p.population || 0,
    coordinates: coords as [number, number],
  };
});

// Lookup helpers
export function getKoreaRegionMeta(codeOrName: string): GeoLocationMeta | undefined {
  if (!codeOrName) return undefined;
  const normalizedCode = KOREA_CODE_ALIAS_MAP[codeOrName] || codeOrName;

  return KOREA_PROVINCE_METAS.find(
    (p) =>
      p.code === normalizedCode ||
      p.iso2 === codeOrName ||
      p.name_ko === codeOrName ||
      p.name_en?.toLowerCase() === codeOrName.toLowerCase()
  );
}

export function getWorldCountryMeta(codeOrName: string): GeoLocationMeta | undefined {
  if (!codeOrName) return undefined;
  const upper = codeOrName.toUpperCase();

  return WORLD_COUNTRY_METAS.find(
    (c) =>
      c.code.toUpperCase() === upper ||
      (c.iso2 && c.iso2.toUpperCase() === upper) ||
      c.name_ko === codeOrName ||
      c.name_en?.toLowerCase() === codeOrName.toLowerCase()
  );
}

// Projections & Path Generators
// Korea Map (D3 Mercator fitted to 800x1000 viewBox)
export const koreaProjection = d3
  .geoMercator()
  .fitExtent(
    [
      [40, 40],
      [760, 960],
    ],
    {
      type: 'FeatureCollection',
      features: koreaProvinces,
    } as any
  );

export const koreaGeoPath = d3.geoPath().projection(koreaProjection);

// World Map (D3 Equirectangular fitted to 1200x650 viewBox)
export const worldProjection = d3
  .geoEquirectangular()
  .fitExtent(
    [
      [20, 20],
      [1180, 630],
    ],
    {
      type: 'FeatureCollection',
      features: worldCountryFeatures,
    } as any
  );

export const worldGeoPath = d3.geoPath().projection(worldProjection);
