import { useEffect, useState } from 'react';
import { Trash2, Clock, Calendar, MapPin, Star } from 'lucide-react';
import { supabase, type SavedChart } from '@/lib/supabase';
import { ZODIAC_SIGNS } from '@/astro/zodiac';

interface Props {
  onSelect: (chart: SavedChart) => void;
  refreshKey: number;
  currentId: string | null;
}

export default function SavedCharts({ onSelect, refreshKey, currentId }: Props) {
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('birth_charts')
        .select('*')
        .order('created_at', { ascending: false });
      if (!cancelled) {
        if (!error && data) setCharts(data as SavedChart[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('birth_charts').delete().eq('id', id);
    setCharts((prev) => prev.filter((c) => c.id !== id));
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-800/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (charts.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <Star className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <p className="text-sm text-slate-500 leading-relaxed">
          Your saved charts will appear here. Generate a chart and save it to build your collection.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {charts.map((chart) => {
        const sun = ZODIAC_SIGNS[chart.chart_data.sunSignIndex];
        const moon = ZODIAC_SIGNS[chart.chart_data.moonSignIndex];
        const rising = ZODIAC_SIGNS[chart.chart_data.risingSignIndex];
        const isActive = chart.id === currentId;
        return (
          <button
            key={chart.id}
            onClick={() => onSelect(chart)}
            className={`w-full text-left group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
              isActive
                ? 'border-indigo-400/60 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                : 'border-slate-700/40 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-medium text-slate-100">{chart.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {new Date(chart.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(chart.id, e)}
                className="text-slate-600 hover:text-rose-400 transition opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg" title={`Sun in ${sun.name}`}>{sun.symbol}</span>
              <span className="text-lg" title={`Moon in ${moon.name}`}>{moon.symbol}</span>
              <span className="text-lg" title={`Rising ${rising.name}`}>{rising.symbol}</span>
              <span className="text-xs text-slate-500 ml-1">{sun.name} / {moon.name} / {rising.name}</span>
            </div>

            <div className="space-y-1 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                <span>{chart.birth_date}</span>
                <Clock className="w-3 h-3 ml-2" />
                <span>{chart.birth_time}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{chart.location_name}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
