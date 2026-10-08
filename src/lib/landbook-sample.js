/**
 * landbook-sample.js — Headline figures from the LandBook sample report for
 * Monte da Ribeira (see full-report-preview.html), used by the homepage's
 * LandBook dashboard so the site shows the real report rather than mock data.
 *
 * Keep these in sync with the sample report when it is regenerated.
 */

export const SAMPLE_ESTATE = {
  name: 'Monte da Ribeira',
  place: 'São Teotónio, Odemira',
  areaHa: 17,
  naturalCapitalScore: 72,
  reportUrl: '/full-report-preview',
};

// Natural Capital Scorecard (report §04): score and regional average, out of 10
export const SCORECARD = [
  { label: 'Water', score: 7.8, regional: 5.5, basis: '2 springs, 1 well, 652 mm rain' },
  { label: 'Biodiversity', score: 8.5, regional: 5.5, basis: '287 species, 14 threatened' },
  { label: 'Soil', score: 7, regional: 6, basis: 'pH 5.8, organic carbon 18.4 g/kg' },
  { label: 'Carbon', score: 5.6, regional: 5, basis: '1,428 tCO₂e estimated' },
  { label: 'Resilience', score: 6, regional: 5.5, basis: 'Derived from risk scores' },
];

// Value Composition (report §03): annual ecosystem services, € per year
export const ECOSYSTEM_SERVICES = [
  { label: 'Water regulation', value: 7800 },
  { label: 'Food & fibre', value: 4200 },
  { label: 'Recreation & cultural', value: 3962 },
  { label: 'Nutrient cycling', value: 2500 },
];

// Natural capital by land cover (report §03)
export const LAND_COVER_VALUE = [
  { label: 'Agro-forestry', ha: 7.65, value: 7115 },
  { label: 'Sclerophyllous vegetation', ha: 5.1, value: 5763 },
  { label: 'Broad-leaved forest', ha: 2.55, value: 5610 },
  { label: 'Complex cultivation', ha: 1.7, value: 1360 },
];

// Climate Change Projections (report §14.3), from a 652 mm / 30-yr baseline
export const CLIMATE_PROJECTION = [
  { period: 'Today', rain: 652, temp: 0 },
  { period: '2025–34', rain: 632, temp: 0.8 },
  { period: '2035–44', rain: 606, temp: 1.4 },
  { period: '2045–50', rain: 580, temp: 1.9 },
];

// Revenue Opportunities, valuation scenarios (report §10.1)
export const VALUATION_SCENARIOS = [
  { label: 'Conservative', total: 365585, perHa: 21505, basis: 'Eurostat PT 2022' },
  { label: 'Market', total: 430100, perHa: 25300, basis: 'Eurostat PT 2022' },
  { label: 'Optimistic', total: 494615, perHa: 29095, basis: '+ natural capital premium' },
];
