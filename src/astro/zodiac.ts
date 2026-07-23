export type Element = 'Fire' | 'Earth' | 'Air' | 'Water';
export type Modality = 'Cardinal' | 'Fixed' | 'Mutable';
export type Polarity = 'Positive' | 'Negative';

export interface SignInfo {
  name: string;
  symbol: string;
  element: Element;
  modality: Modality;
  polarity: Polarity;
  ruler: PlanetName;
  keyword: string;
  dates: string;
}

export const ZODIAC_SIGNS: SignInfo[] = [
  { name: 'Aries', symbol: '\u2648', element: 'Fire', modality: 'Cardinal', polarity: 'Positive', ruler: 'Mars', keyword: 'I am', dates: 'Mar 21 \u2013 Apr 19' },
  { name: 'Taurus', symbol: '\u2649', element: 'Earth', modality: 'Fixed', polarity: 'Negative', ruler: 'Venus', keyword: 'I have', dates: 'Apr 20 \u2013 May 20' },
  { name: 'Gemini', symbol: '\u264A', element: 'Air', modality: 'Mutable', polarity: 'Positive', ruler: 'Mercury', keyword: 'I think', dates: 'May 21 \u2013 Jun 20' },
  { name: 'Cancer', symbol: '\u264B', element: 'Water', modality: 'Cardinal', polarity: 'Negative', ruler: 'Moon', keyword: 'I feel', dates: 'Jun 21 \u2013 Jul 22' },
  { name: 'Leo', symbol: '\u264C', element: 'Fire', modality: 'Fixed', polarity: 'Positive', ruler: 'Sun', keyword: 'I will', dates: 'Jul 23 \u2013 Aug 22' },
  { name: 'Virgo', symbol: '\u264D', element: 'Earth', modality: 'Mutable', polarity: 'Negative', ruler: 'Mercury', keyword: 'I analyze', dates: 'Aug 23 \u2013 Sep 22' },
  { name: 'Libra', symbol: '\u264E', element: 'Air', modality: 'Cardinal', polarity: 'Positive', ruler: 'Venus', keyword: 'I balance', dates: 'Sep 23 \u2013 Oct 22' },
  { name: 'Scorpio', symbol: '\u264F', element: 'Water', modality: 'Fixed', polarity: 'Negative', ruler: 'Pluto', keyword: 'I desire', dates: 'Oct 23 \u2013 Nov 21' },
  { name: 'Sagittarius', symbol: '\u2650', element: 'Fire', modality: 'Mutable', polarity: 'Positive', ruler: 'Jupiter', keyword: 'I seek', dates: 'Nov 22 \u2013 Dec 21' },
  { name: 'Capricorn', symbol: '\u2651', element: 'Earth', modality: 'Cardinal', polarity: 'Negative', ruler: 'Saturn', keyword: 'I use', dates: 'Dec 22 \u2013 Jan 19' },
  { name: 'Aquarius', symbol: '\u2652', element: 'Air', modality: 'Fixed', polarity: 'Positive', ruler: 'Uranus', keyword: 'I know', dates: 'Jan 20 \u2013 Feb 18' },
  { name: 'Pisces', symbol: '\u2653', element: 'Water', modality: 'Mutable', polarity: 'Negative', ruler: 'Neptune', keyword: 'I believe', dates: 'Feb 19 \u2013 Mar 20' },
];

export const SIGN_NAMES = ZODIAC_SIGNS.map((s) => s.name);

export function signFromLongitude(longitude: number): number {
  return Math.floor(((longitude % 360) + 360) % 360 / 30);
}

export function degreesInSign(longitude: number): number {
  const norm = ((longitude % 360) + 360) % 360;
  return norm % 30;
}

export function formatLongitude(longitude: number): string {
  const signIndex = signFromLongitude(longitude);
  const deg = degreesInSign(longitude);
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  const s = Math.floor(((deg - d) * 60 - m) * 60);
  return `${d}\u00b0${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}" ${ZODIAC_SIGNS[signIndex].symbol}`;
}

export function formatLongitudeShort(longitude: number): string {
  const signIndex = signFromLongitude(longitude);
  const deg = degreesInSign(longitude);
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}\u00b0${String(m).padStart(2, '0')}'${ZODIAC_SIGNS[signIndex].symbol}`;
}

export const ELEMENT_COLORS: Record<Element, string> = {
  Fire: '#f97316',
  Earth: '#84cc16',
  Air: '#38bdf8',
  Water: '#6366f1',
};

export const ELEMENT_GLOW: Record<Element, string> = {
  Fire: 'rgba(249,115,22,0.35)',
  Earth: 'rgba(132,204,22,0.35)',
  Air: 'rgba(56,189,248,0.35)',
  Water: 'rgba(99,102,241,0.35)',
};

export type PlanetName =
  | 'Sun'
  | 'Moon'
  | 'Mercury'
  | 'Venus'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Uranus'
  | 'Neptune'
  | 'Pluto'
  | 'NorthNode'
  | 'Chiron';

export interface PlanetInfo {
  name: PlanetName;
  symbol: string;
  keyword: string;
  color: string;
  isLuminary?: boolean;
}

export const PLANETS: Record<PlanetName, PlanetInfo> = {
  Sun: { name: 'Sun', symbol: '\u2609', keyword: 'Identity, ego, vitality', color: '#fbbf24' },
  Moon: { name: 'Moon', symbol: '\u263D', keyword: 'Emotions, instincts, inner self', color: '#e2e8f0' },
  Mercury: { name: 'Mercury', symbol: '\u263F', keyword: 'Communication, mind, logic', color: '#a3e635' },
  Venus: { name: 'Venus', symbol: '\u2640', keyword: 'Love, values, beauty', color: '#fb7185' },
  Mars: { name: 'Mars', symbol: '\u2642', keyword: 'Action, drive, desire', color: '#ef4444' },
  Jupiter: { name: 'Jupiter', symbol: '\u2643', keyword: 'Expansion, wisdom, faith', color: '#f97316' },
  Saturn: { name: 'Saturn', symbol: '\u2644', keyword: 'Structure, discipline, limits', color: '#60a5fa' },
  Uranus: { name: 'Uranus', symbol: '\u2645', keyword: 'Rebellion, innovation, freedom', color: '#22d3ee' },
  Neptune: { name: 'Neptune', symbol: '\u2646', keyword: 'Dreams, illusion, spirituality', color: '#818cf8' },
  Pluto: { name: 'Pluto', symbol: '\u2647', keyword: 'Transformation, power, rebirth', color: '#a78bfa' },
  NorthNode: { name: 'NorthNode', symbol: '\u21A1', keyword: 'Soul direction, karmic path', color: '#f0abfc' },
  Chiron: { name: 'Chiron', symbol: '\u26B7', keyword: 'Wound, healing, integration', color: '#c084fc' },
};

export const PLANET_ORDER: PlanetName[] = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
  'NorthNode',
  'Chiron',
];

export interface HouseInfo {
  number: number;
  name: string;
  keyword: string;
  rulerFocus: string;
}

export const HOUSES: HouseInfo[] = [
  { number: 1, name: 'First House', keyword: 'Self, appearance, vitality', rulerFocus: 'how you present yourself and begin things' },
  { number: 2, name: 'Second House', keyword: 'Values, possessions, self-worth', rulerFocus: 'what you value and how you earn' },
  { number: 3, name: 'Third House', keyword: 'Communication, siblings, short trips', rulerFocus: 'how you think, learn, and connect locally' },
  { number: 4, name: 'Fourth House', keyword: 'Home, family, roots', rulerFocus: 'your foundation, family, and inner base' },
  { number: 5, name: 'Fifth House', keyword: 'Creativity, romance, children', rulerFocus: 'how you play, create, and love' },
  { number: 6, name: 'Sixth House', keyword: 'Work, health, daily routines', rulerFocus: 'how you serve and maintain your body and habits' },
  { number: 7, name: 'Seventh House', keyword: 'Partnerships, marriage, open enemies', rulerFocus: 'how you relate one-on-one and partner' },
  { number: 8, name: 'Eighth House', keyword: 'Transformation, shared resources, intimacy', rulerFocus: 'how you merge, risk, and transform' },
  { number: 9, name: 'Ninth House', keyword: 'Philosophy, travel, higher education', rulerFocus: 'what you seek and believe at the highest level' },
  { number: 10, name: 'Tenth House', keyword: 'Career, reputation, public role', rulerFocus: 'your calling and public standing' },
  { number: 11, name: 'Eleventh House', keyword: 'Community, friends, aspirations', rulerFocus: 'your hopes, networks, and ideals' },
  { number: 12, name: 'Twelfth House', keyword: 'Unconscious, solitude, spirituality', rulerFocus: 'what is hidden, healing, and transcendence' },
];

export interface AspectInfo {
  name: string;
  symbol: string;
  angle: number;
  orb: number;
  keyword: string;
  color: string;
  dashed?: boolean;
}

export const ASPECTS: AspectInfo[] = [
  { name: 'Conjunction', symbol: '\u260C', angle: 0, orb: 8, keyword: 'Fusion, intensification', color: '#fbbf24' },
  { name: 'Opposition', symbol: '\u2295', angle: 180, orb: 8, keyword: 'Tension, polarity, awareness', color: '#ef4444', dashed: true },
  { name: 'Trine', symbol: '\u25B3', angle: 120, orb: 7, keyword: 'Flow, harmony, ease', color: '#22c55e' },
  { name: 'Square', symbol: '\u25A2', angle: 90, orb: 7, keyword: 'Friction, challenge, growth', color: '#f97316', dashed: true },
  { name: 'Sextile', symbol: '\u26B9', angle: 60, orb: 6, keyword: 'Opportunity, cooperation', color: '#38bdf8' },
  { name: 'Quincunx', symbol: '\u26B6', angle: 150, orb: 3, keyword: 'Adjustment, awkward tension', color: '#a78bfa', dashed: true },
];

export function aspectBetween(a: number, b: number): { aspect: AspectInfo; exact: number; orb: number } | null {
  const diff = Math.abs(a - b) % 360;
  const d = diff > 180 ? 360 - diff : diff;
  for (const aspect of ASPECTS) {
    const orb = Math.abs(d - aspect.angle);
    if (orb <= aspect.orb) {
      return { aspect, exact: aspect.angle, orb };
    }
  }
  return null;
}
