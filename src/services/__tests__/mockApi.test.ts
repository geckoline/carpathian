import { describe, it, expect } from 'vitest';
import { mockApi } from '@/services/mockApi';

const EXTERNAL_IMAGE_PATTERN = /^https?:\/\/(?!localhost)[^\s]+\.(jpg|jpeg|png|gif|webp|svg|ico)(\?.*)?$/i;
const EXAMPLE_COM_IMAGE_PATTERN = /example\.com\/.*\.(jpg|jpeg|png|gif|webp|svg)/i;

describe('mockApi data integrity', () => {
  it('contains no external image URLs that would cause OpaqueResponseBlocking', () => {
    const allData = [...mockExpertsData, ...mockProjectsData];
    const json = JSON.stringify(allData);
    expect(EXAMPLE_COM_IMAGE_PATTERN.test(json)).toBe(false);
  });

  it('contains no remote image URLs in any string field', () => {
    const allData = [...mockExpertsData, ...mockProjectsData];
    const strings = extractStrings(allData);
    const externalImages = strings.filter(s => EXTERNAL_IMAGE_PATTERN.test(s));
    expect(externalImages).toHaveLength(0);
  });

  it('has valid project data for all entries', async () => {
    const projects = await mockApi.getProjects();
    expect(projects.length).toBeGreaterThan(0);
    projects.forEach(p => {
      expect(p.id).toBeDefined();
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.regionLabel?.length).toBeGreaterThan(0);
      expect(p.cardSummary?.length).toBeGreaterThan(0);
      expect(p.focusSummary?.length).toBeGreaterThan(0);
      expect(p.outputsSummary?.length).toBeGreaterThan(0);
      expect(p.lat).toBeGreaterThanOrEqual(-90);
      expect(p.lat).toBeLessThanOrEqual(90);
      expect(p.lng).toBeGreaterThanOrEqual(-180);
      expect(p.lng).toBeLessThanOrEqual(180);
    });
  });

  it('has valid expert data for all entries', async () => {
    const experts = await mockApi.getExperts();
    expect(experts.length).toBeGreaterThan(0);
    experts.forEach(e => {
      expect(e.id).toBeDefined();
      expect(e.name.length).toBeGreaterThan(0);
      expect(e.headline?.length).toBeGreaterThan(0);
      expect(e.expertiseSubtitle?.length).toBeGreaterThan(0);
      expect(e.email || e.linkedin || e.scopus).toBeDefined();
    });
  });
});

const mockExpertsData = [
  { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Dr. Elena Popescu', institution: 'Univ. of Bucharest', country: 'Romania', degree: 'PhD, Ecology', bio: 'Leading research on Carpathian biodiversity for over 15 years.', expertise: ['Alpine Eco', 'Climate Resilience'], publications: 42, projects: 15, email: 'elena@example.com', linkedin: 'https://linkedin.com/in/elena', scopus: 'https://scopus.com/authid/elena' },
  { id: '123e4567-e89b-12d3-a456-426614174004', name: 'Dr. Andrei Ionescu', institution: 'Transylvania Univ.', country: 'Romania', degree: 'PhD, Zoology', bio: 'Specialist in large carnivore ecology and corridor conservation.', expertise: ['Wildlife Tracking', 'GIS'], publications: 28, projects: 9, email: 'andrei@example.com', linkedin: 'https://linkedin.com/in/andrei', scopus: 'https://scopus.com/authid/andrei' },
  { id: '123e4567-e89b-12d3-a456-426614174006', name: 'Dr. Marek Kowalski', institution: 'Jagiellonian Univ.', country: 'Poland', degree: 'PhD, Entomology', bio: 'Expert in pollinator ecology with focus on high-altitude meadow ecosystems.', expertise: ['Pollination Networks', 'Statistical Modeling'], publications: 35, projects: 12, email: 'marek@example.com', linkedin: 'https://linkedin.com/in/marek', scopus: 'https://scopus.com/authid/marek' },
  { id: '123e4567-e89b-12d3-a456-426614174009', name: 'Dr. Laura Munteanu', institution: 'Carpathian Wildlife Inst.', country: 'Romania', degree: 'PhD, Behavioral Ecology', bio: 'Studies wolf pack dynamics and apex predator impacts on trophic cascades.', expertise: ['Predator Ecology', 'GPS Tracking'], publications: 19, projects: 7, email: 'laura@example.com', linkedin: 'https://linkedin.com/in/laura', scopus: 'https://scopus.com/authid/laura' },
  { id: '123e4567-e89b-12d3-a456-426614174014', name: 'Dr. Jan Novak', institution: 'Slovak Academy of Sciences', country: 'Slovakia', degree: 'PhD, Hydrology', bio: 'Researches alpine hydrology and river restoration in mountainous catchments.', expertise: ['Hydrological Modeling', 'River Ecology'], publications: 31, projects: 11, email: 'jan@example.com', linkedin: 'https://linkedin.com/in/jan', scopus: 'https://scopus.com/authid/jan' },
  { id: '123e4567-e89b-12d3-a456-426614174015', name: 'Dr. Olena Shevchenko', institution: 'Lviv National Univ.', country: 'Ukraine', degree: 'PhD, Soil Science', bio: 'Specializes in soil carbon cycling and peatland restoration techniques.', expertise: ['Soil Chemistry', 'Carbon Sequestration'], publications: 24, projects: 8, email: 'olena@example.com', linkedin: 'https://linkedin.com/in/olena', scopus: 'https://scopus.com/authid/olena' },
  { id: '123e4567-e89b-12d3-a456-426614174016', name: 'Prof. Stefan Weber', institution: 'Vienna Institute of Technology', country: 'Austria', degree: 'Dr., Environmental Science', bio: 'Leads interdisciplinary teams on climate resilience and adaptation strategies.', expertise: ['Climate Modeling', 'Policy Analysis'], publications: 56, projects: 20, email: 'stefan@example.com', linkedin: 'https://linkedin.com/in/stefan', scopus: 'https://scopus.com/authid/stefan' },
  { id: '123e4567-e89b-12d3-a456-426614174017', name: 'Dr. Maria Horvath', institution: 'Budapest Univ.', country: 'Hungary', degree: 'PhD, Ornithology', bio: 'Tracks migratory raptor populations and conservation of breeding habitats.', expertise: ['Avian Ecology', 'Satellite Telemetry'], publications: 22, projects: 10, email: 'maria@example.com', linkedin: 'https://linkedin.com/in/maria', scopus: 'https://scopus.com/authid/maria' },
  { id: '123e4567-e89b-12d3-a456-426614174018', name: 'Dr. Viktor Petrenko', institution: 'Chernivtsi Univ.', country: 'Ukraine', degree: 'PhD, Geography', bio: 'Maps land use changes and traditional ecological knowledge in mountain regions.', expertise: ['Remote Sensing', 'Ethnoecology'], publications: 17, projects: 6, email: 'viktor@example.com', linkedin: 'https://linkedin.com/in/viktor', scopus: 'https://scopus.com/authid/viktor' },
  { id: '123e4567-e89b-12d3-a456-426614174019', name: 'Dr. Anna Nowak', institution: 'Warsaw Univ. of Life Sciences', country: 'Poland', degree: 'PhD, Conservation Biology', bio: 'Focuses on endangered species conservation and habitat connectivity planning.', expertise: ['Conservation Planning', 'Population Genetics'], publications: 29, projects: 13, email: 'anna@example.com', linkedin: 'https://linkedin.com/in/anna', scopus: 'https://scopus.com/authid/anna' },
];

const mockProjectsData = [
  { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Carpathian Forest Watch', status: 'active', field: 'Biodiversity', description: 'Monitoring deforestation rates and biodiversity loss across the northern Carpathian mountain range.', location: '3 Countries', yearRange: '2021-2025', leadExpertId: '123e4567-e89b-12d3-a456-426614174001', leadExpertName: 'Dr. E. Popescu', website: 'https://example.com/project', lat: 47.5, lng: 25.0, area: 'carpathians', country: 'Romania', contact: 'info@carpathian.org' },
  { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Alpine River Restoration', status: 'planned', field: 'Hydrology', description: 'Restoring natural flow regimes and riparian habitats in high-altitude catchments.', location: 'Slovakia', yearRange: '2024-2027', lat: 49.0, lng: 20.0, area: 'tatras', country: 'Slovakia' },
  { id: '123e4567-e89b-12d3-a456-426614174003', name: 'Bear Corridor Mapping', status: 'active', field: 'Wildlife', description: 'Tracking brown bear movement corridors to mitigate human-wildlife conflict.', location: 'Romania', yearRange: '2022-2026', leadExpertId: '123e4567-e89b-12d3-a456-426614174004', leadExpertName: 'Dr. A. Ionescu', lat: 46.5, lng: 25.5, area: 'carpathians', country: 'Romania' },
  { id: '123e4567-e89b-12d3-a456-426614174005', name: 'Meadow Pollinator Survey', status: 'active', field: 'Biodiversity', description: 'Documenting pollinator species diversity in Carpathian alpine meadows.', location: 'Poland', yearRange: '2023-2026', leadExpertId: '123e4567-e89b-12d3-a456-426614174006', leadExpertName: 'Dr. M. Kowalski', lat: 49.3, lng: 20.1, area: 'tatras', country: 'Poland' },
  { id: '123e4567-e89b-12d3-a456-426614174007', name: 'Soil Carbon Assessment', status: 'past', field: 'Climate', description: 'Measuring soil organic carbon stocks across elevation gradients.', location: 'Ukraine', yearRange: '2019-2023', lat: 48.3, lng: 24.5, area: 'carpathians', country: 'Ukraine' },
  { id: '123e4567-e89b-12d3-a456-426614174008', name: 'Wolf Pack Dynamics', status: 'active', field: 'Wildlife', description: 'Long-term study of wolf pack territory shifts and prey interactions.', location: 'Romania', yearRange: '2021-2025', leadExpertId: '123e4567-e89b-12d3-a456-426614174009', leadExpertName: 'Dr. L. Munteanu', lat: 46.8, lng: 25.8, area: 'carpathians', country: 'Romania' },
  { id: '123e4567-e89b-12d3-a456-426614174010', name: 'Glacial Lake Monitoring', status: 'planned', field: 'Hydrology', description: 'Tracking glacial lake formation and outburst flood risks in high peaks.', location: 'Slovakia', yearRange: '2025-2028', lat: 49.2, lng: 20.2, area: 'tatras', country: 'Slovakia' },
  { id: '123e4567-e89b-12d3-a456-426614174011', name: 'Traditional Land Use Archive', status: 'active', field: 'Climate', description: 'Preserving indigenous knowledge of sustainable land management practices.', location: 'Romania', yearRange: '2022-2025', leadExpertId: '123e4567-e89b-12d3-a456-426614174001', leadExpertName: 'Dr. E. Popescu', lat: 47.0, lng: 25.3, area: 'carpathians', country: 'Romania' },
  { id: '123e4567-e89b-12d3-a456-426614174012', name: 'Raptor Migration Study', status: 'past', field: 'Wildlife', description: 'Mapping seasonal raptor flyways and identifying critical stopover sites.', location: '3 Countries', yearRange: '2018-2022', lat: 47.8, lng: 23.5, area: 'carpathians', country: 'Romania' },
  { id: '123e4567-e89b-12d3-a456-426614174013', name: 'Peatland Restoration Pilot', status: 'planned', field: 'Biodiversity', description: 'Experimental rewetting of degraded peatlands to restore carbon sinks.', location: 'Ukraine', yearRange: '2025-2028', lat: 48.5, lng: 24.0, area: 'carpathians', country: 'Ukraine' },
];

function extractStrings(obj: unknown): string[] {
  const strings: string[] = [];
  if (typeof obj === 'string') strings.push(obj);
  else if (Array.isArray(obj)) obj.forEach(item => strings.push(...extractStrings(item)));
  else if (obj && typeof obj === 'object') Object.values(obj as Record<string, unknown>).forEach(val => strings.push(...extractStrings(val)));
  return strings;
}
