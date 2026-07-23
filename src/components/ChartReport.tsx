import { useMemo } from 'react';
import type { BirthChart } from '@/astro/calculate';
import { PLANETS, PLANET_ORDER, ZODIAC_SIGNS, HOUSES, ASPECTS } from '@/astro/zodiac';
import { getPlanetInSign, getPlanetInHouse, getRisingDescription, getAspectDescription } from '@/astro/interpretations';

interface Props {
  chart: BirthChart;
}

function houseForLongitude(longitude: number, houses: BirthChart['houses']): number {
  for (let i = 0; i < 12; i++) {
    const start = houses[i].longitude;
    const end = houses[(i + 1) % 12].longitude;
    if (start < end) {
      if (longitude >= start && longitude < end) return i + 1;
    } else {
      if (longitude >= start || longitude < end) return i + 1;
    }
  }
  return 1;
}

export default function ChartReport({ chart }: Props) {
  const planetRows = useMemo(() => {
    return PLANET_ORDER.map((name) => {
      const p = chart.planets.find((pl) => pl.name === name)!;
      const house = houseForLongitude(p.longitude, chart.houses);
      const signInfo = ZODIAC_SIGNS[p.sign];
      return { planet: p, house, signInfo, info: PLANETS[name] };
    });
  }, [chart]);

  const sun = chart.planets.find((p) => p.name === 'Sun')!;
  const moon = chart.planets.find((p) => p.name === 'Moon')!;
  const rising = ZODIAC_SIGNS[chart.risingSignIndex];

  const majorAspects = chart.aspects.filter((a) =>
    ['Conjunction', 'Opposition', 'Trine', 'Square', 'Sextile'].includes(a.aspectName)
  );

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-indigo-400 to-fuchsia-400 rounded-full" />
          The Big Three
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: 'Sun Sign', planet: sun, desc: 'Your core identity and essence' },
            { label: 'Moon Sign', planet: moon, desc: 'Your inner emotional world' },
            { label: 'Rising Sign', planet: { longitude: chart.ascendant, longitudeText: chart.ascendantText, sign: chart.risingSignIndex, degreeInSign: 0, retrograde: false, speed: 0, name: 'NorthNode' as const }, desc: 'How others perceive you' },
          ].map(({ label, planet, desc }) => {
            const sign = ZODIAC_SIGNS[planet.sign];
            return (
              <div key={label} className="relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-700/50 p-5 group hover:border-indigo-400/40 transition">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${ZODIAC_SIGNS[planet.sign].element === 'Fire' ? 'rgba(249,115,22,0.1)' : ZODIAC_SIGNS[planet.sign].element === 'Earth' ? 'rgba(132,204,22,0.1)' : ZODIAC_SIGNS[planet.sign].element === 'Air' ? 'rgba(56,189,248,0.1)' : 'rgba(99,102,241,0.1)'}, transparent)` }} />
                <div className="relative">
                  <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">{label}</div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl" style={{ color: label === 'Sun Sign' ? '#fbbf24' : label === 'Moon Sign' ? '#e2e8f0' : '#f0abfc' }}>
                      {sign.symbol}
                    </span>
                    <span className="text-xl font-semibold text-slate-100">{sign.name}</span>
                  </div>
                  <div className="text-xs text-slate-500 mb-3">{desc}</div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {label === 'Rising Sign' ? getRisingDescription(planet.sign) : getPlanetInSign(label === 'Sun Sign' ? 'Sun' : 'Moon', planet.sign)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-indigo-400 to-fuchsia-400 rounded-full" />
          Planetary Placements
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Planet</th>
                <th className="text-left px-4 py-3 font-medium">Sign</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Position</th>
                <th className="text-left px-4 py-3 font-medium">House</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {planetRows.map(({ planet, house, signInfo, info }) => (
                <tr key={planet.name} className="border-t border-slate-800/60 hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg" style={{ color: info.color }}>{info.symbol}</span>
                      <span className="text-slate-200 font-medium">{planet.name}</span>
                      {planet.retrograde && <span className="text-xs text-rose-400 font-semibold">R</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-300">{signInfo.symbol} {signInfo.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden sm:table-cell font-mono text-xs">{planet.longitudeText}</td>
                  <td className="px-4 py-3 text-slate-300">{house}</td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell max-w-xs">
                    <span className="text-xs leading-relaxed">{getPlanetInSign(planet.name, planet.sign)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-indigo-400 to-fuchsia-400 rounded-full" />
          House Cusps
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {chart.houses.map((house) => {
            const info = HOUSES[house.number - 1];
            const sign = ZODIAC_SIGNS[house.sign];
            return (
              <div key={house.number} className="rounded-xl bg-slate-900/40 border border-slate-700/40 p-3 hover:border-indigo-400/30 transition">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">House {house.number}</span>
                  <span className="text-sm text-slate-300">{sign.symbol} {sign.name}</span>
                </div>
                <div className="text-xs text-slate-400 font-mono mb-1">{house.longitudeText}</div>
                <div className="text-xs text-slate-500 leading-snug">{info.keyword}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-indigo-400 to-fuchsia-400 rounded-full" />
          Planetary Aspects
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {majorAspects.map((a, i) => (
            <div key={i} className="rounded-xl bg-slate-900/40 border border-slate-700/40 p-4 flex items-start gap-3 hover:border-slate-600 transition">
              <span className="text-2xl shrink-0" style={{ color: a.aspectColor }}>{a.aspectSymbol}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-slate-200 font-medium">{PLANETS[a.planetA].symbol} {a.planetA}</span>
                  <span className="text-xs text-slate-500">{a.aspectName}</span>
                  <span className="text-sm text-slate-200 font-medium">{PLANETS[a.planetB].symbol} {a.planetB}</span>
                  <span className="text-xs text-slate-500 ml-auto">orb {a.orb.toFixed(1)}\u00b0</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{getAspectDescription(a.aspectName, a.planetA, a.planetB)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-indigo-400 to-fuchsia-400 rounded-full" />
          Aspect Legend
        </h2>
        <div className="flex flex-wrap gap-3">
          {ASPECTS.map((a) => (
            <div key={a.name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/40 border border-slate-700/40">
              <span className="text-lg" style={{ color: a.color }}>{a.symbol}</span>
              <span className="text-sm text-slate-300">{a.name}</span>
              <span className="text-xs text-slate-500">{a.angle}\u00b0</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
