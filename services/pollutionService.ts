import { Ward } from '../types';

// Updated Token from user
const API_TOKEN = '9de6c3294c823d7be3fbaca955c4a31925647f3e';

// Helper to estimate pollutant breakdown based on overall AQI
function estimatePollutantsFromAQI(aqi: number) {
  const pm25 = Math.round(aqi); 
  const pm10 = Math.round(aqi * (1.2 + Math.random() * 0.4));
  const severityFactor = aqi / 100;
  
  return {
    pm25: pm25,
    pm10: pm10,
    no2: Math.round(20 + (Math.random() * 40 * severityFactor)),
    so2: Math.round(5 + (Math.random() * 20 * severityFactor)),
    co: parseFloat((0.5 + (Math.random() * 2 * severityFactor)).toFixed(1)),
    o3: Math.round(20 + (Math.random() * 60))
  };
}

function determineSource(pm25: number, pm10: number, no2: number, so2: number): { primary: string, secondary: string } {
  if (so2 > 40) return { primary: 'Industrial Emissions', secondary: 'Power Plants' };
  if (no2 > 80) return { primary: 'Heavy Traffic', secondary: 'Diesel Generators' };
  if (pm10 > 250 && pm25 < 100) return { primary: 'Construction Dust', secondary: 'Road Dust' };
  if (pm25 > 150) return { primary: 'Crop Burning', secondary: 'Vehicular Emissions' };
  if (pm25 > 80) return { primary: 'Vehicular Traffic', secondary: 'Road Dust' };
  return { primary: 'Mixed Sources', secondary: 'Local Emissions' };
}

// Generate simulated data if API fails
const generateSimulatedWards = (lat: number, lng: number): Ward[] => {
  return Array.from({ length: 8 }).map((_, i) => { 
    const latOffset = (Math.random() - 0.5) * 0.15;
    const lngOffset = (Math.random() - 0.5) * 0.15;
    const baseAqi = 150 + Math.random() * 150;
    const pollutants = estimatePollutantsFromAQI(baseAqi);
    const sources = determineSource(pollutants.pm25, pollutants.pm10, pollutants.no2, pollutants.so2);

    return {
      id: `sim-local-${i}`,
      name: `Local Sensor Node ${String.fromCharCode(65 + i)}`,
      population: 5000 + Math.floor(Math.random() * 50000),
      aqi: Math.round(baseAqi),
      pollutants: pollutants,
      primarySource: sources.primary,
      secondarySource: sources.secondary,
      coordinates: { x: 0, y: 0 },
      location: { 
        lat: lat + latOffset, 
        lng: lng + lngOffset 
      },
      trend: Array.from({length: 7}, () => Math.round(baseAqi + (Math.random() * 40 - 20)))
    };
  });
};

const FALLBACK_DELHI_DATA: Ward[] = [
  {
    id: 'sim-1',
    name: 'Anand Vihar, Delhi',
    population: 250000,
    aqi: 412,
    pollutants: { pm25: 350, pm10: 480, no2: 110, so2: 30, co: 4.5, o3: 40 },
    primarySource: 'Heavy Transport Hub',
    secondarySource: 'Road Dust',
    coordinates: { x: 0, y: 0 },
    location: { lat: 28.6469, lng: 77.3160 },
    trend: [380, 395, 410, 405, 415, 420, 412]
  }
];

// Helper to validate AQI values
// Returns number if valid, null if invalid (missing, error code, or outlier)
const isValidAQI = (val: any): number | null => {
  if (val === undefined || val === null || val === '-') return null;
  const num = typeof val === 'number' ? val : parseInt(val, 10);
  
  // 999 is a common error code in WAQI; we also filter out NaN and negatives
  if (isNaN(num) || num < 0 || num >= 999) return null;
  
  return num;
};

// Helper to process raw API station data into Ward objects
const processStationData = (station: any): Ward | null => {
   const aqiVal = isValidAQI(station.aqi);
   
   // Strict filtering: If AQI is invalid (e.g. '-' or 999), skip this station entirely
   if (aqiVal === null) return null;

   const pollutants = estimatePollutantsFromAQI(aqiVal);
   const sources = determineSource(pollutants.pm25, pollutants.pm10, pollutants.no2, pollutants.so2);
   
   const cleanName = station.station.name.split(',')[0];
   
   const trend = Array.from({ length: 7 }, () => {
     const variance = (Math.random() * 40) - 20; 
     return Math.round(Math.max(20, Math.min(500, aqiVal + variance)));
   });
   trend[6] = aqiVal;

   return {
     id: `waqi-bounds-${station.uid}`,
     name: cleanName,
     population: 10000 + Math.floor(Math.random() * 90000),
     aqi: aqiVal,
     pollutants: pollutants,
     primarySource: sources.primary,
     secondarySource: sources.secondary,
     coordinates: { x: 0, y: 0 },
     location: { lat: station.lat, lng: station.lon },
     trend: trend
   };
};

// Fetch high-fidelity details for a single location using the Feed API
const fetchDetailedStation = async (lat?: number, lng?: number): Promise<Ward | null> => {
  try {
    let url = `https://api.waqi.info/feed/here/?token=${API_TOKEN}`;
    if (typeof lat === 'number' && typeof lng === 'number') {
      url = `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${API_TOKEN}`;
    }
    
    const res = await fetch(url);
    const json = await res.json();
    
    if (json.status !== 'ok' || !json.data) return null;
    
    const d = json.data;
    const currentAqi = isValidAQI(d.aqi);
    
    // If the detailed station has invalid AQI, we cannot use it
    if (currentAqi === null) return null;

    const iaqi = d.iaqi || {};
    
    const pollutants = {
       pm25: iaqi.pm25?.v || 0,
       pm10: iaqi.pm10?.v || 0,
       no2: iaqi.no2?.v || 0,
       so2: iaqi.so2?.v || 0,
       co: iaqi.co?.v || 0,
       o3: iaqi.o3?.v || 0
    };
    
    if (pollutants.pm25 === 0) {
        const est = estimatePollutantsFromAQI(currentAqi);
        if (pollutants.pm25 === 0) pollutants.pm25 = est.pm25;
        if (pollutants.pm10 === 0) pollutants.pm10 = est.pm10;
        if (pollutants.no2 === 0) pollutants.no2 = est.no2;
        if (pollutants.so2 === 0) pollutants.so2 = est.so2;
        if (pollutants.co === 0) pollutants.co = est.co;
        if (pollutants.o3 === 0) pollutants.o3 = est.o3;
    }

    const sources = determineSource(pollutants.pm25, pollutants.pm10, pollutants.no2, pollutants.so2);
    
    const trend = Array.from({ length: 7 }, () => {
        const variance = (Math.random() * 40) - 20; 
        const val = Math.max(20, Math.min(500, currentAqi + variance));
        return Math.round(val);
    });
    trend[6] = currentAqi;

    return {
      id: `waqi-detail-${d.idx}`,
      name: d.city?.name?.split(',')[0] || 'Local Station',
      population: 50000 + Math.floor(Math.random() * 50000),
      aqi: currentAqi,
      pollutants: pollutants,
      primarySource: sources.primary,
      secondarySource: sources.secondary,
      coordinates: { x: 0, y: 0 },
      location: {
        lat: d.city?.geo?.[0] || 0,
        lng: d.city?.geo?.[1] || 0
      },
      trend: trend
    };
  } catch (e) {
    console.warn("Failed to fetch detailed station", e);
    return null;
  }
};

export const fetchPollutionData = async (lat?: number, lng?: number): Promise<Ward[]> => {
  const hasCoords = typeof lat === 'number' && typeof lng === 'number';

  try {
    let detailedNode: Ward | null = null;
    let neighborWards: Ward[] = [];
    
    if (hasCoords) {
      // 1. Fetch Local Detailed Node
      detailedNode = await fetchDetailedStation(lat, lng);

      // 2. Fetch Local Neighbors (Small Bounds)
      const latMin = lat! - 1.0;
      const latMax = lat! + 1.0;
      const lngMin = lng! - 1.0;
      const lngMax = lng! + 1.0;
      const bounds = `${latMin},${lngMin},${latMax},${lngMax}`;
      
      const boundsUrl = `https://api.waqi.info/map/bounds/?latlng=${bounds}&token=${API_TOKEN}`;
      const response = await fetch(boundsUrl);
      if (response.ok) {
        const json = await response.json();
        if (json.status === 'ok' && json.data) {
          neighborWards = json.data
            .map(processStationData)
            .filter((w: Ward | null): w is Ward => w !== null);
        }
      }
    } else {
      // 3. WHOLE INDIA GRID FETCH
      // We divide India (approx Lat 6-38, Lng 68-98) into smaller grids to force the API 
      // to return more granular station data instead of sparse aggregation.
      const latStart = 6;
      const latEnd = 38;
      const lngStart = 68;
      const lngEnd = 98;
      
      // Use 8x8 degree chunks (roughly 12-16 requests)
      // This is a balance between coverage and request quantity
      const latStep = 8;
      const lngStep = 8;

      const gridBounds: string[] = [];
      for (let l = latStart; l < latEnd; l += latStep) {
        for (let n = lngStart; n < lngEnd; n += lngStep) {
           const l2 = Math.min(l + latStep, latEnd);
           const n2 = Math.min(n + lngStep, lngEnd);
           gridBounds.push(`${l},${n},${l2},${n2}`);
        }
      }

      // Execute fetches in parallel
      const responses = await Promise.all(
        gridBounds.map(b => fetch(`https://api.waqi.info/map/bounds/?latlng=${b}&token=${API_TOKEN}`).catch(e => null))
      );

      for (const res of responses) {
        if (res && res.ok) {
          try {
            const json = await res.json();
            if (json.status === 'ok' && json.data) {
              const chunkWards = json.data
                  .map(processStationData)
                  .filter((w: Ward | null): w is Ward => w !== null);
              neighborWards = [...neighborWards, ...chunkWards];
            }
          } catch (e) {
            // Ignore JSON parse errors for individual chunks
          }
        }
      }

      // Deduplicate by ID
      const uniqueIds = new Set();
      neighborWards = neighborWards.filter(w => {
        if (uniqueIds.has(w.id)) return false;
        uniqueIds.add(w.id);
        return true;
      });
    }

    // Merge Data
    let allWards = [...neighborWards];
    
    if (detailedNode) {
      // Remove the bounds version of the detailed node if it exists (deduplicate by proximity)
      allWards = allWards.filter(w => {
         const dLat = Math.abs(w.location.lat - detailedNode!.location.lat);
         const dLng = Math.abs(w.location.lng - detailedNode!.location.lng);
         return (dLat > 0.01 || dLng > 0.01);
      });
      // Add detailed node at the top
      allWards.unshift(detailedNode);
    }

    // Fallback if empty
    if (allWards.length === 0) {
      console.warn("No stations found. Using simulation.");
      return hasCoords ? generateSimulatedWards(lat!, lng!) : FALLBACK_DELHI_DATA;
    }

    return allWards;

  } catch (error) {
    console.warn("Network error fetching from WAQI, using fallback data.", error);
    if (hasCoords) return generateSimulatedWards(lat!, lng!);
    return FALLBACK_DELHI_DATA;
  }
};

export const searchStations = async (query: string): Promise<Ward[]> => {
  if (!query || query.length < 3) return [];
  
  try {
    const url = `https://api.waqi.info/search/?token=${API_TOKEN}&keyword=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const json = await res.json();
    
    if (json.status === 'ok' && Array.isArray(json.data)) {
        return json.data.map((item: any) => {
            const aqiVal = isValidAQI(item.aqi);
            // Strictly omit results with missing/invalid AQI
            if (aqiVal === null) return null;

            const est = estimatePollutantsFromAQI(aqiVal);
            const src = determineSource(est.pm25, est.pm10, est.no2, est.so2);
            
            // Generate synthetic trend
            const trend = Array.from({ length: 7 }, () => Math.max(20, Math.round(aqiVal + (Math.random() * 40 - 20))));
            trend[6] = aqiVal;
            
            return {
                id: `waqi-search-${item.uid}`,
                name: item.station.name,
                population: 20000 + Math.floor(Math.random() * 50000), // Estimate
                aqi: aqiVal,
                pollutants: est,
                primarySource: src.primary,
                secondarySource: src.secondary,
                location: {
                    lat: item.station.geo[0],
                    lng: item.station.geo[1]
                },
                coordinates: { x: 0, y: 0 },
                trend: trend
            } as Ward;
        }).filter((w: any) => w !== null) as Ward[];
    }
    return [];
  } catch (error) {
    console.error("Search failed", error);
    return [];
  }
};