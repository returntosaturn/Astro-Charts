import { useMemo } from 'react';
import type { BirthChart } from '@/astro/calculate';
import { PLANETS, ZODIAC_SIGNS, ELEMENT_COLORS } from '@/astro/zodiac';
interface Props {
  chart: BirthChart;
  size?: number;
}

const DEG = Math.PI / 180;

function lonToXY(radius: number, longitude: number, ascendant: number, cx: number, cy: number) {
  const angle = (ascendant - longitude + 360) % 360;
  // Rotate so the Ascendant (angle === 0) renders at 9 o'clock (left).
  // 180° offset maps angle 0 -> left; the Midheaven then lands at top (12).
  const rad = (180 - angle) * DEG;
  return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
}

function pointOnCircle(radius: number, longitude: number, ascendant: number, cx: number, cy: number) {
  return lonToXY(radius, longitude, ascendant, cx, cy);
}

function describeArc(rOuter: number, rInner: number, startLon: number, endLon: number, ascendant: number, cx: number, cy: number) {
  const startOuter = lonToXY(rOuter, startLon, ascendant, cx, cy);
  const endOuter = lonToXY(rOuter, endLon, ascendant, cx, cy);
  const startInner = lonToXY(rInner, endLon, ascendant, cx, cy);
  const endInner = lonToXY(rInner, startLon, ascendant, cx, cy);
  const largeArc = ((endLon - startLon + 360) % 360) > 180 ? 1 : 0;
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ');
}

export default function ChartWheel({ chart, size = 560 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 4;
  const rZodiac = rOuter - 2;
  const rZodiacInner = rOuter - 44;
  const rHouse = rZodiacInner - 4;
  const rHouseInner = rHouse - 56;
  const rPlanet = rHouseInner - 8;
  const rAspect = rHouseInner - 80;

  const planetPositions = useMemo(() => {
    return chart.planets.map((p) => {
      const pos = pointOnCircle(rPlanet, p.longitude, chart.ascendant, cx, cy);
      return { ...p, ...pos };
    });
  }, [chart, cx, cy]);

  const aspectLines = useMemo(() => {
    return chart.aspects.map((a, idx) => {
      const pa = planetPositions.find((p) => p.name === a.planetA)!;
      const pb = planetPositions.find((p) => p.name === a.planetB)!;
      const start = pointOnCircle(rAspect, pa.longitude, chart.ascendant, cx, cy);
      const end = pointOnCircle(rAspect, pb.longitude, chart.ascendant, cx, cy);
      return { ...a, start, end, idx };
    });
  }, [chart.aspects, chart.ascendant, cx, cy, planetPositions]);

  const zodiacSegments = useMemo(() => {
    return ZODIAC_SIGNS.map((sign, i) => {
      const startLon = i * 30;
      const endLon = (i + 1) * 30;
      const path = describeArc(rZodiac, rZodiacInner, startLon, endLon, chart.ascendant, cx, cy);
      const symbolPos = pointOnCircle((rZodiac + rZodiacInner) / 2, startLon + 15, chart.ascendant, cx, cy);
      return { sign, path, symbolPos, index: i };
    });
  }, [chart.ascendant, cx, cy]);

  const houseSegments = useMemo(() => {
    return chart.houses.map((house, i) => {
      const startLon = house.longitude;
      const endLon = chart.houses[(i + 1) % 12].longitude;
      const path = describeArc(rHouse, rHouseInner, startLon, endLon, chart.ascendant, cx, cy);
      const labelAngle = (startLon + 15) % 360;
      const labelPos = pointOnCircle((rHouse + rHouseInner) / 2, labelAngle, chart.ascendant, cx, cy);
      return { house, path, labelPos, index: i };
    });
  }, [chart.houses, chart.ascendant, cx, cy]);

  // Whole-sign house divider lines — always at 0° of each sign (thin).
  const cuspLines = useMemo(() => {
    return chart.houses.map((house, i) => {
      const outer = pointOnCircle(rHouse, house.longitude, chart.ascendant, cx, cy);
      const inner = pointOnCircle(rHouseInner, house.longitude, chart.ascendant, cx, cy);
      return { house, outer, inner, index: i };
    });
  }, [chart.houses, chart.ascendant, cx, cy, rHouse, rHouseInner]);

  // True angular axis lines (ASC/DSC/MC/IC) drawn from the actual computed
  // ascendant/midheaven — independent of the whole-sign house cusps, which
  // always sit at 0° of a sign and so would misplace the MC/IC badly.
  const angleLines = useMemo(() => {
    const angles = [
      { key: 'ASC', longitude: chart.ascendant },
      { key: 'DSC', longitude: (chart.ascendant + 180) % 360 },
      { key: 'MC', longitude: chart.midheaven },
      { key: 'IC', longitude: (chart.midheaven + 180) % 360 },
    ];
    return angles.map((a) => {
      const outer = pointOnCircle(rZodiacInner, a.longitude, chart.ascendant, cx, cy);
      const inner = pointOnCircle(rHouseInner, a.longitude, chart.ascendant, cx, cy);
      return { ...a, outer, inner };
    });
  }, [chart.ascendant, chart.midheaven, cx, cy, rZodiacInner, rHouseInner]);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" style={{ filter: 'drop-shadow(0 0 40px rgba(99,102,241,0.15))' }}>
      <defs>
        <radialGradient id="wheelBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="70%" stopColor="#0b1120" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(99,102,241,0.25)" />
          <stop offset="100%" stopColor="rgba(99,102,241,0)" />
        </radialGradient>
        {Object.entries(ELEMENT_COLORS).map(([el, color]) => (
          <linearGradient key={el} id={`grad-${el}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.08} />
          </linearGradient>
        ))}
      </defs>

      <circle cx={cx} cy={cy} r={rOuter} fill="url(#wheelBg)" stroke="rgba(148,163,184,0.25)" strokeWidth={1} />

      {zodiacSegments.map(({ sign, path, symbolPos, index }) => (
        <g key={`zod-${index}`}>
          <path d={path} fill={`url(#grad-${sign.element})`} stroke="rgba(148,163,184,0.2)" strokeWidth={0.5} />
          <text
            x={symbolPos.x}
            y={symbolPos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={size * 0.028}
            fill={ELEMENT_COLORS[sign.element]}
            style={{ fontWeight: 600 }}
          >
            {sign.symbol}
          </text>
        </g>
      ))}

      {Array.from({ length: 12 }).map((_, i) => {
        const signStart = i * 30;
        const lines = [];
        for (let d = 1; d < 30; d++) {
          const lon = signStart + d;
          const isMajor = d % 10 === 0;
          const isMid = d % 5 === 0;
          const r1 = rZodiacInner;
          const r2 = rZodiacInner - (isMajor ? 10 : isMid ? 6 : 3);
          const p1 = pointOnCircle(r1, lon, chart.ascendant, cx, cy);
          const p2 = pointOnCircle(r2, lon, chart.ascendant, cx, cy);
          lines.push(
            <line key={`tick-${i}-${d}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="rgba(148,163,184,0.35)" strokeWidth={isMajor ? 1 : 0.5} />
          );
        }
        return <g key={`ticks-${i}`}>{lines}</g>;
      })}

      <circle cx={cx} cy={cy} r={rZodiacInner} fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={rHouse} fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth={0.5} />
      <circle cx={cx} cy={cy} r={rHouseInner} fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth={1} />

      {houseSegments.map(({ house, path, labelPos, index }) => (
        <g key={`house-${index}`}>
          <path d={path} fill="rgba(15,23,42,0.4)" stroke="rgba(148,163,184,0.08)" strokeWidth={0.5} />
          <text
            x={labelPos.x}
            y={labelPos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={size * 0.022}
            fill="rgba(203,213,225,0.55)"
            style={{ fontWeight: 500 }}
          >
            {house.number}
          </text>
        </g>
      ))}

      {cuspLines.map(({ outer, inner, index }) => (
        <line
          key={`cusp-${index}`}
          x1={outer.x}
          y1={outer.y}
          x2={inner.x}
          y2={inner.y}
          stroke="rgba(148,163,184,0.25)"
          strokeWidth={0.5}
        />
      ))}

      {angleLines.map((a) => (
        <line
          key={`angle-${a.key}`}
          x1={a.outer.x}
          y1={a.outer.y}
          x2={a.inner.x}
          y2={a.inner.y}
          stroke="rgba(226,232,240,0.6)"
          strokeWidth={1.5}
        />
      ))}

      {aspectLines.map((a) => (
        <line
          key={`aspect-${a.idx}`}
          x1={a.start.x}
          y1={a.start.y}
          x2={a.end.x}
          y2={a.end.y}
          stroke={a.aspectColor}
          strokeWidth={Math.max(0.5, 2 - a.orb * 0.18)}
          strokeOpacity={Math.max(0.25, 0.85 - a.orb * 0.07)}
          strokeDasharray={a.aspectDashed ? '4 3' : undefined}
        />
      ))}

      {planetPositions.map((p) => {
        const info = PLANETS[p.name];
        return (
          <g key={`planet-${p.name}`}>
            <circle cx={p.x} cy={p.y} r={size * 0.018} fill={info.color} fillOpacity={0.18} stroke={info.color} strokeWidth={1} />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size * 0.026}
              fill={info.color}
              style={{ fontWeight: 700, textShadow: '0 0 8px rgba(0,0,0,0.8)' }}
            >
              {info.symbol}
            </text>
            {p.retrograde && (
              <text
                x={p.x + size * 0.022}
                y={p.y + size * 0.012}
                textAnchor="middle"
                fontSize={size * 0.016}
                fill="rgba(248,113,113,0.9)"
                style={{ fontWeight: 700 }}
              >
                R
              </text>
            )}
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={rAspect} fill="url(#centerGlow)" />

      <g>
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={size * 0.022} fill="rgba(203,213,225,0.7)" style={{ fontWeight: 600, letterSpacing: '0.1em' }}>
          ASC
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={size * 0.018} fill="rgba(148,163,184,0.6)">
          {chart.ascendantText}
        </text>
      </g>

      <g>
        {(() => {
          const mcPos = pointOnCircle(rHouseInner - 6, chart.midheaven, chart.ascendant, cx, cy);
          // The MC glyph sits just inside the 10th-house cusp; nudge it toward center so it doesn't clip the rim.
          const lx = cx + (mcPos.x - cx) * 0.92;
          const ly = cy + (mcPos.y - cy) * 0.92;
          return (
            <text x={lx} y={ly} textAnchor="middle" fontSize={size * 0.018} fill="rgba(203,213,225,0.5)" style={{ fontWeight: 600, letterSpacing: '0.1em' }}>
              MC
            </text>
          );
        })()}
      </g>
    </svg>
  );
}
