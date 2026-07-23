import { useState, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';

export interface BirthInput {
  name: string;
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  locationName: string;
  utcDate: Date;
}

interface CityResult {
  name: string;
  country: string;
  admin?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface Props {
  onSubmit: (input: BirthInput) => void;
  loading: boolean;
}

function getTzOffsetMinutes(timezone: string, date: Date): number {
  const tzString = date.toLocaleString('en-US', { timeZone: timezone, hour12: false });
  const utcString = date.toLocaleString('en-US', { timeZone: 'UTC', hour12: false });
  return (new Date(tzString).getTime() - new Date(utcString).getTime()) / 60000;
}

function birthLocalToUTC(dateStr: string, timeStr: string, timezone: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const ref = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const offset = getTzOffsetMinutes(timezone, ref);
  return new Date(ref.getTime() - offset * 60000);
}

export default function BirthForm({ onSubmit, loading }: Props) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationName, setLocationName] = useState('');
  const [manualTz, setManualTz] = useState('');
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchCity = useCallback((query: string) => {
    if (query.trim().length < 3) {
      setCityResults([]);
      return;
    }
    setSearching(true);
    try {
      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`)
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.results)) {
            setCityResults(data.results as CityResult[]);
          } else {
            setCityResults([]);
          }
        })
        .catch(() => setCityResults([]))
        .finally(() => setSearching(false));
    } catch {
      setCityResults([]);
      setSearching(false);
    }
  }, []);

  const handleCityInput = (value: string) => {
    setCityQuery(value);
    setSelectedCity(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCity(value), 350);
  };

  const selectCity = (city: CityResult) => {
    setSelectedCity(city);
    setCityQuery(`${city.name}${city.admin ? ', ' + city.admin : ''}, ${city.country}`);
    setCityResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!date) { setError('Please enter a birth date.'); return; }
    if (!time) { setError('Please enter a birth time.'); return; }

    let lat: number, lon: number, locName: string, timezone: string;

    if (manualMode) {
      const latNum = parseFloat(latitude);
      const lonNum = parseFloat(longitude);
      if (isNaN(latNum) || isNaN(lonNum)) { setError('Please enter valid coordinates.'); return; }
      lat = latNum;
      lon = lonNum;
      locName = locationName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      const tzNum = parseFloat(manualTz);
      if (isNaN(tzNum)) { setError('Please enter a UTC offset (e.g. -5 or 5.5).'); return; }
      const [y, m, d] = date.split('-').map(Number);
      const [hh, mm] = time.split(':').map(Number);
      const ref = new Date(Date.UTC(y, m - 1, d, hh, mm));
      const utcDate = new Date(ref.getTime() + tzNum * 3600000);
      onSubmit({ name: name || 'Untitled', date, time, latitude: lat, longitude: lon, locationName: locName, utcDate });
      return;
    }

    if (!selectedCity) { setError('Please select a city from the search results.'); return; }
    lat = selectedCity.latitude;
    lon = selectedCity.longitude;
    locName = `${selectedCity.name}${selectedCity.admin ? ', ' + selectedCity.admin : ''}, ${selectedCity.country}`;
    timezone = selectedCity.timezone;
    const utcDate = birthLocalToUTC(date, time, timezone);
    onSubmit({ name: name || 'Untitled', date, time, latitude: lat, longitude: lon, locationName: locName, utcDate });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">Name (optional)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ada Lovelace"
          className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">Birth Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max="2100-12-31"
            min="1900-01-01"
            className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">Birth Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition [color-scheme:dark]"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs uppercase tracking-wider text-slate-400">Birth Location</label>
          <button
            type="button"
            onClick={() => { setManualMode(!manualMode); setSelectedCity(null); setCityResults([]); }}
            className="text-xs text-indigo-300 hover:text-indigo-200 transition"
          >
            {manualMode ? 'Search by city' : 'Enter coordinates manually'}
          </button>
        </div>

        {!manualMode ? (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => handleCityInput(e.target.value)}
                placeholder="Search for a city..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition"
              />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 animate-spin" />}
              {selectedCity && !searching && (
                <button type="button" onClick={() => { setSelectedCity(null); setCityQuery(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {cityResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-slate-800/95 backdrop-blur border border-slate-700/60 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                {cityResults.map((city, i) => (
                  <button
                    key={`${city.name}-${i}`}
                    type="button"
                    onClick={() => selectCity(city)}
                    className="w-full px-4 py-2.5 text-left hover:bg-indigo-500/15 transition flex items-center gap-3 border-b border-slate-700/30 last:border-0"
                  >
                    <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <div className="text-sm text-slate-100">{city.name}{city.admin ? `, ${city.admin}` : ''}</div>
                      <div className="text-xs text-slate-400">{city.country} &mdash; {city.latitude.toFixed(2)}, {city.longitude.toFixed(2)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Location name (optional)"
              className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number" step="any" value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="Latitude (-90 to 90)"
                className="px-4 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition"
              />
              <input
                type="number" step="any" value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="Longitude (-180 to 180)"
                className="px-4 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition"
              />
            </div>
            <input
              type="number" step="0.25" value={manualTz}
              onChange={(e) => setManualTz(e.target.value)}
              placeholder="UTC offset (e.g. -5, 5.5, 9)"
              className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Calculating...</>
        ) : (
          <>Generate Birth Chart</>
        )}
      </button>

      <p className="text-xs text-slate-500 text-center leading-relaxed">
        Birth time and location determine your rising sign and house placements. For best results, use the exact time from your birth certificate.
      </p>
    </form>
  );
}
