import { useState, useCallback } from 'react';
import { Sparkles, Save, Star, Download, Loader2 } from 'lucide-react';
import BirthForm, { type BirthInput } from '@/components/BirthForm';
import ChartWheel from '@/components/ChartWheel';
import ChartReport from '@/components/ChartReport';
import SavedCharts from '@/components/SavedCharts';
import { calculateChart, type BirthChart } from '@/astro/calculate';
import { ZODIAC_SIGNS } from '@/astro/zodiac';
import { supabase, isSupabaseConfigured, type SavedChart } from '@/lib/supabase';

interface ActiveChart {
  chart: BirthChart;
  input: BirthInput;
  savedId: string | null;
}

function App() {
  const [active, setActive] = useState<ActiveChart | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');

  const handleGenerate = useCallback((input: BirthInput) => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      try {
        const chart = calculateChart(input.utcDate, input.latitude, input.longitude);
        setActive({ chart, input, savedId: null });
        setSaved(false);
      } catch (err) {
        setError('Could not calculate the chart. Please check the birth details and try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);
  }, []);

  const handleSave = async () => {
    if (!active) return;
    if (!isSupabaseConfigured || !supabase) {
      setError('Saving requires Supabase. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file to enable it. The chart below is fully generated offline.');
      return;
    }
    setSaving(true);
    const { data, error: saveError } = await supabase
      .from('birth_charts')
      .insert({
        name: active.input.name,
        birth_date: active.input.date,
        birth_time: active.input.time,
        latitude: active.input.latitude,
        longitude: active.input.longitude,
        location_name: active.input.locationName,
        chart_data: active.chart,
      })
      .select('id')
      .single();
    setSaving(false);
    if (saveError) {
      setError('Could not save the chart. Please try again.');
    } else if (data) {
      setActive((prev) => prev ? { ...prev, savedId: data.id } : prev);
      setSaved(true);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleSelectSaved = (saved: SavedChart) => {
    const input: BirthInput = {
      name: saved.name,
      date: saved.birth_date,
      time: saved.birth_time,
      latitude: saved.latitude,
      longitude: saved.longitude,
      locationName: saved.location_name,
      utcDate: new Date(),
    };
    setActive({ chart: saved.chart_data as unknown as BirthChart, input, savedId: saved.id });
    setSaved(true);
  };

  const handleNew = () => {
    setActive(null);
    setSaved(false);
    setError('');
  };

  const sun = active ? ZODIAC_SIGNS[active.chart.sunSignIndex] : null;
  const moon = active ? ZODIAC_SIGNS[active.chart.moonSignIndex] : null;
  const rising = active ? ZODIAC_SIGNS[active.chart.risingSignIndex] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative">
        <header className="border-b border-slate-800/60 backdrop-blur-sm bg-slate-950/50 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Astral Chart</h1>
                <p className="text-xs text-slate-500">Birth Chart Generator</p>
              </div>
            </div>
            {active && (
              <button
                onClick={handleNew}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-slate-700/60 hover:border-slate-600 rounded-lg transition"
              >
                New Chart
              </button>
            )}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {!active ? (
            <div className="max-w-md mx-auto pt-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 mb-4">
                  <Star className="w-3 h-3" /> Real astronomical calculations
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Discover Your Birth Chart
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  Enter your birth details to generate a complete natal chart with planetary positions, house cusps, aspects, and personalized interpretations.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/40 border border-slate-800/60 p-6 backdrop-blur-sm">
                <BirthForm onSubmit={handleGenerate} loading={loading} />
              </div>

              {error && (
                <div className="mt-4 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div className="mt-12 grid grid-cols-3 gap-4 text-center">
                {[
                  { symbol: '\u2648', label: '12 Signs' },
                  { symbol: '\u2609', label: '10 Planets' },
                  { symbol: '\u260C', label: '6 Aspects' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-slate-900/30 border border-slate-800/40 p-4">
                    <div className="text-2xl text-indigo-400 mb-1">{item.symbol}</div>
                    <div className="text-xs text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[280px_1fr] gap-8">
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-indigo-400" /> Saved Charts
                  </h3>
                </div>
                <SavedCharts onSelect={handleSelectSaved} refreshKey={refreshKey} currentId={active.savedId} />
              </aside>

              <div className="space-y-8 min-w-0">
                <div className="rounded-2xl bg-slate-900/40 border border-slate-800/60 p-6 backdrop-blur-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">{active.input.name}</h2>
                      <p className="text-sm text-slate-400 mt-1">
                        {active.input.date} at {active.input.time} &middot; {active.input.locationName}
                      </p>
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving || saved}
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
                        saved
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 cursor-default'
                          : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25'
                      }`}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Star className="w-4 h-4 fill-emerald-300" /> : <Save className="w-4 h-4" />}
                      {saved ? 'Saved' : 'Save Chart'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-6">
                    {sun && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <span className="text-lg text-amber-400">{sun.symbol}</span>
                        <span className="text-sm text-slate-300">Sun in {sun.name}</span>
                      </div>
                    )}
                    {moon && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20">
                        <span className="text-lg text-slate-300">{moon.symbol}</span>
                        <span className="text-sm text-slate-300">Moon in {moon.name}</span>
                      </div>
                    )}
                    {rising && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20">
                        <span className="text-lg text-fuchsia-400">{rising.symbol}</span>
                        <span className="text-sm text-slate-300">Rising {rising.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 items-start">
                    <div className="aspect-square max-w-md mx-auto md:mx-0 w-full">
                      <ChartWheel chart={active.chart} />
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-800/30 border border-slate-700/40 p-3">
                          <div className="text-xs text-slate-500 uppercase tracking-wider">Ascendant</div>
                          <div className="text-lg font-semibold text-slate-200 mt-1">{active.chart.ascendantText}</div>
                        </div>
                        <div className="rounded-xl bg-slate-800/30 border border-slate-700/40 p-3">
                          <div className="text-xs text-slate-500 uppercase tracking-wider">Midheaven</div>
                          <div className="text-lg font-semibold text-slate-200 mt-1">{active.chart.midheavenText}</div>
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-800/30 border border-slate-700/40 p-4">
                        <h3 className="text-sm font-semibold text-slate-200 mb-3">Quick Stats</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Planets mapped</span>
                            <span className="text-slate-200">{active.chart.planets.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">House cusps</span>
                            <span className="text-slate-200">{active.chart.houses.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Aspects found</span>
                            <span className="text-slate-200">{active.chart.aspects.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Retrograde planets</span>
                            <span className="text-slate-200">{active.chart.planets.filter((p) => p.retrograde).length}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 leading-relaxed">
                        The chart wheel is oriented with your Ascendant on the left (9 o'clock) position. Planets are plotted at their exact ecliptic longitude. Lines inside the wheel show major aspects between planets.
                      </div>
                    </div>
                  </div>
                </div>

                <ChartReport chart={active.chart} />
              </div>
            </div>
          )}
        </main>

        <footer className="border-t border-slate-800/60 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-600">
            Calculations powered by Astronomy Engine. For educational and entertainment purposes.
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
