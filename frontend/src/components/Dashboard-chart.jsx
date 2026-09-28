import React, { useState } from 'react';

const CIRCUMFERENCE = 2 * Math.PI * 70; // ≈ 439.82

// ── Génère N couleurs bien distinctes, réparties sur toute la roue chromatique ──
const generateDistinctColors = (count) => {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => `hsl(${Math.round((360 / count) * i)}, 70%, 55%)`);
};

const DashboardChart = ({ darkMode, data, animateCharts }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const total  = data.reduce((sum, d) => sum + (d.value || 0), 0);
  const colors = generateDistinctColors(data.length); // ← une couleur unique par direction, toujours

  // ── Calcul dynamique des segments à partir de data (N éléments, pas figé) ──
  let cumulative = 0;
  const segments = data.map((item, idx) => {
    const length     = total > 0 ? (item.value / total) * CIRCUMFERENCE : 0;
    const dashOffset = -cumulative;
    cumulative += length;
    return {
      idx,
      dashArray: `${length} ${CIRCUMFERENCE}`,
      dashOffset,
      delay: `${idx * 0.15}s`,
    };
  });

  return (
    <div
      className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}
      style={{ minHeight: '280px' }}
    >
      <div className="p-5 flex flex-col h-full">
        {/* ── Titre ── */}
        <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <i className="bi bi-pie-chart-fill text-blue-500"></i>
          Véhicules par Direction
        </h3>

        {/* ── Donut SVG ── */}
        <div className="flex-1 flex items-center justify-center relative">
          <svg width="140" height="140" viewBox="0 0 200 200">
            {segments.map((seg) => (
              <circle
                key={seg.idx}
                cx="100" cy="100" r="70"
                fill="none"
                stroke={colors[seg.idx]}
                strokeWidth="32"
                strokeDasharray={seg.dashArray}
                strokeDashoffset={animateCharts ? seg.dashOffset : -CIRCUMFERENCE}
                onMouseEnter={() => setHoveredSegment(seg.idx)}
                onMouseLeave={() => setHoveredSegment(null)}
                className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                style={{ transition: `stroke-dashoffset 1s ease-out ${seg.delay}` }}
              />
            ))}
          </svg>

          {/* ── Tooltip ── */}
          {hoveredSegment !== null && data[hoveredSegment] && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg shadow-lg pointer-events-none z-10 whitespace-nowrap">
              <p className="text-sm font-bold">{data[hoveredSegment].label} : {data[hoveredSegment].value}</p>
            </div>
          )}
        </div>

        {/* ── Légende ── */}
        <div className="space-y-1 mt-2 overflow-y-auto" style={{ maxHeight: '140px' }}>
          {data.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between px-2 py-1 rounded transition-colors ${
                hoveredSegment === idx
                  ? darkMode ? 'bg-gray-800' : 'bg-gray-100'
                  : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[idx] }}></div>
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {item.label}
                </span>
              </div>
              <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardChart;