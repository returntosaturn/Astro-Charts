import * as Astronomy from 'astronomy-engine';
import {
  PLANET_ORDER,
  PlanetName,
  signFromLongitude,
  degreesInSign,
  formatLongitudeShort,
  aspectBetween,
  ZODIAC_SIGNS,
} from './zodiac';

export interface PlanetPosition {
  name: PlanetName;
  longitude: number;
  longitudeText: string;
  sign: number;
  degreeInSign: number;
  retrograde: boolean;
  speed: number;
}

export interface HouseCusp {
  number: number;
  longitude: number;
  longitudeText: string;
  sign: number;
}

export interface AspectResult {
  planetA: PlanetName;
  planetB: PlanetName;
  aspectName: string;
  aspectSymbol: string;
  aspectColor: string;
  aspectDashed: boolean;
  orb: number;
  exact: number;
}

export interface BirthChart {
  planets: PlanetPosition[];
  houses: HouseCusp[];
  ascendant: number;
  ascendantText: string;
  midheaven: number;
  midheavenText: string;
  aspects: AspectResult[];
  sunSignIndex: number;
  moonSignIndex: number;
  risingSignIndex: number;
}

const OBLIQUITY = 23.436;

function toAstronomyBody(name: PlanetName): Astronomy.Body {
  switch (name) {
    case 'Sun': return Astronomy.Body.Sun;
    case 'Moon': return Astronomy.Body.Moon;
    case 'Mercury': return Astronomy.Body.Mercury;
    case 'Venus': return Astronomy.Body.Venus;
    case 'Mars': return Astronomy.Body.Mars;
    case 'Jupiter': return Astronomy.Body.Jupiter;
    case 'Saturn': return Astronomy.Body.Saturn;
    case 'Uranus': return Astronomy.Body.Uranus;
    case 'Neptune': return Astronomy.Body.Neptune;
    case 'Pluto': return Astronomy.Body.Pluto;
    default: return Astronomy.Body.Sun;
  }
}

function eclipticLongitudeOf(body: Astronomy.Body, time: Astronomy.AstroTime): number {
  const vec = Astronomy.GeoVector(body, time, true);
  const ecl = Astronomy.Ecliptic(vec);
  return ((ecl.elon % 360) + 360) % 360;
}

function calcHouses(
  observer: Astronomy.Observer,
  time: Astronomy.AstroTime,
): { cusps: HouseCusp[]; ascendant: number; midheaven: number } {
  const stHours = Astronomy.SiderealTime(time);
  const ramcDeg = (stHours * 15 + observer.longitude) % 360;
  const ramcRad = ramcDeg * Math.PI / 180;
  const epsRad = OBLIQUITY * Math.PI / 180;
  const phiRad = observer.latitude * Math.PI / 180;

  const mcRad = Math.atan2(
    Math.sin(ramcRad),
    Math.cos(ramcRad) * Math.cos(epsRad),
  );
  const mcDeg = ((mcRad * 180 / Math.PI) % 360 + 360) % 360;

  // Meeus: tan(Asc) = cos(RAMC) / -(sin(eps)·tan(phi) + cos(eps)·sin(RAMC)).
  // Both numerator and denominator must carry the opposite sign from a naive
  // derivation, otherwise the result lands 180° away (in the Descendant's sign).
  const ascRad = Math.atan2(
    Math.cos(ramcRad),
    -(Math.sin(epsRad) * Math.tan(phiRad) + Math.cos(epsRad) * Math.sin(ramcRad)),
  );
  const ascDeg = ((ascRad * 180 / Math.PI) % 360 + 360) % 360;

  // Whole sign houses: house 1 begins at 0° of the sign containing the
  // Ascendant (not at the Ascendant's exact degree). Each following house
  // is simply the next sign in order, 30° per house.
  const ascSignIndex = signFromLongitude(ascDeg);
  const wholeSignHouseOneStart = ascSignIndex * 30;

  const cusps: HouseCusp[] = [];
  for (let i = 0; i < 12; i++) {
    const cuspDeg = (wholeSignHouseOneStart + i * 30) % 360;
    cusps.push({
      number: i + 1,
      longitude: cuspDeg,
      longitudeText: '',
      sign: signFromLongitude(cuspDeg),
    });
  }
  cusps.forEach((c) => {
    c.longitudeText = formatLongitudeShort(c.longitude);
  });

  return { cusps, ascendant: ascDeg, midheaven: mcDeg };
}

function isRetrograde(body: Astronomy.Body, time: Astronomy.AstroTime): { retro: boolean; speed: number } {
  const dt = 1 / 1440;
  const t1 = time.AddDays(-dt);
  const t2 = time.AddDays(dt);
  const lon1 = eclipticLongitudeOf(body, t1);
  let lon2 = eclipticLongitudeOf(body, t2);
  if (lon2 < lon1) lon2 += 360;
  const speed = (lon2 - lon1) / (2 * dt);
  return { retro: speed < 0, speed };
}

function meanNorthNode(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
  const T = jd / 36525;
  let omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000;
  omega = ((omega % 360) + 360) % 360;
  return (180 - omega + 360) % 360;
}

function chironLongitude(time: Astronomy.AstroTime): number {
  const jd = time.tt + 2451545.0;
  const T = jd / 36525;
  const M = ((170.961 + 239.95 * T) % 360 + 360) % 360 * Math.PI / 180;
  const lon = (204.585 + 177.0 * T + 7.0 * Math.sin(M) + 3.5 * Math.sin(2 * M)) % 360;
  return ((lon % 360) + 360) % 360;
}

export function calculateChart(
  date: Date,
  latitude: number,
  longitude: number,
): BirthChart {
  const time = new Astronomy.AstroTime(date);
  const observer = new Astronomy.Observer(latitude, longitude, 0);

  const { cusps, ascendant, midheaven } = calcHouses(observer, time);

  const planets: PlanetPosition[] = PLANET_ORDER.map((name) => {
    let longitude: number;
    let retro = false;
    let speed = 0;

    if (name === 'NorthNode') {
      longitude = meanNorthNode(date);
      speed = -0.053;
      retro = true;
    } else if (name === 'Chiron') {
      longitude = chironLongitude(time);
      speed = 0;
      retro = false;
    } else {
      const body = toAstronomyBody(name);
      longitude = eclipticLongitudeOf(body, time);
      const r = isRetrograde(body, time);
      retro = r.retro;
      speed = r.speed;
    }

    return {
      name,
      longitude,
      longitudeText: formatLongitudeShort(longitude),
      sign: signFromLongitude(longitude),
      degreeInSign: degreesInSign(longitude),
      retrograde: retro,
      speed,
    };
  });

  const chartPlanets = planets.filter((p) => p.name !== 'Chiron');
  const aspects: AspectResult[] = [];
  for (let i = 0; i < chartPlanets.length; i++) {
    for (let j = i + 1; j < chartPlanets.length; j++) {
      const a = chartPlanets[i];
      const b = chartPlanets[j];
      const result = aspectBetween(a.longitude, b.longitude);
      if (result) {
        aspects.push({
          planetA: a.name,
          planetB: b.name,
          aspectName: result.aspect.name,
          aspectSymbol: result.aspect.symbol,
          aspectColor: result.aspect.color,
          aspectDashed: result.aspect.dashed ?? false,
          orb: result.orb,
          exact: result.exact,
        });
      }
    }
  }

  return {
    planets,
    houses: cusps,
    ascendant,
    ascendantText: formatLongitudeShort(ascendant),
    midheaven,
    midheavenText: formatLongitudeShort(midheaven),
    aspects,
    sunSignIndex: planets.find((p) => p.name === 'Sun')!.sign,
    moonSignIndex: planets.find((p) => p.name === 'Moon')!.sign,
    risingSignIndex: signFromLongitude(ascendant),
  };
}

export { ZODIAC_SIGNS };
