import React, { useState } from 'react';

const DashboardChart = ({ darkMode, data, animateCharts }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const segments = [
    { key: 'generale',    dashArray: '131.95 439.82', dashOffset: 0,        delay: '0s'   },
    { key: 'technique',   dashArray: '105.56 439.82', dashOffset: -131.95,  delay: '0.2s' },
    { key: 'transport',   dashArray: '43.98 439.82',  dashOffset: -237.51,  delay: '0.4s' },
    { key: 'commerciale', dashArray: '26.39 439.82',  dashOffset: -281.49,  delay: '0.6s' },
    { key: 'autres',      dashArray: '131.95 439.82', dashOffset: -307.88,  delay: '0.8s' },
  ];

  const segMap = {
    generale:    { label: 'Dir. Générale',    idx: 0 },
    technique:   { label: 'Dir. Technique',   idx: 1 },
    transport:   { label: 'Transport Fonds',  idx: 2 },
    commerciale: { label: 'Dir. Commerciale', idx: 3 },
    autres:      { label: 'Autres',           idx: 4 },
  };

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
            {segments.map((seg, i) => (
              <circle
                key={seg.key}
                cx="100" cy="100" r="70"
                fill="none"
                stroke={data[i]?.color}
                strokeWidth="32"
                strokeDasharray={seg.dashArray}
                strokeDashoffset={animateCharts ? seg.dashOffset : -439.82}
                onMouseEnter={() => setHoveredSegment(seg.key)}
                onMouseLeave={() => setHoveredSegment(null)}
                className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                style={{ transition: `stroke-dashoffset 1s ease-out ${seg.delay}` }}
              />
            ))}
          </svg>

          {/* ── Tooltip ── */}
          {hoveredSegment && (() => {
            const { label, idx } = segMap[hoveredSegment];
            return (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg shadow-lg pointer-events-none z-10 whitespace-nowrap">
                <p className="text-sm font-bold">{label} : {data[idx]?.value}</p>
              </div>
            );
          })()}
        </div>

        {/* ── Légende ── */}
        <div className="space-y-1 mt-2">
          {data.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between px-2 py-1 rounded transition-colors ${
                hoveredSegment === segments[idx]?.key
                  ? darkMode ? 'bg-gray-800' : 'bg-gray-100'
                  : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
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