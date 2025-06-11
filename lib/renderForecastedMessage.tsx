import React from 'react';

export function renderForecastedMessage(message: string) {
  const sectionOrder = [
    { key: 'Heat', color: 'text-red-400' },
    { key: 'Frost', color: 'text-sky-300' },
    { key: 'Drought', color: 'text-orange-400' },
    { key: 'Wind', color: 'text-slate-400' },
    { key: 'Flood', color: 'text-amber-700' },
    { key: 'HeavyRain', color: 'text-blue-700' },
  ];
  const sectionRegex = /• (Heat|Frost|Drought|Wind|Flood|HeavyRain):/g;
  const parts = message.split(sectionRegex);
  let rendered: React.ReactNode[] = [];
  let i = 1;
  while (i < parts.length) {
    const section = parts[i];
    const content = parts[i + 1] || '';
    const color = sectionOrder.find(s => s.key === section)?.color || '';
    const contentLines = content.split('\n').map((line, idx) => {
      const dateMatch = line.match(/\((\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*)\)/);
      const valueMatch = line.match(/([\d.]+\s*[^\s)]+)$/);
      let before = line;
      let date = null;
      let value = null;
      if (dateMatch) {
        const dateIdx = line.indexOf(dateMatch[0]);
        before = line.slice(0, dateIdx);
        date = dateMatch[0];
        // Add timezone label
        let tzLabel = '';
        if (date.includes('+') || date.includes('-')) {
          tzLabel = ' (local time)';
        } else if (date.includes('Z')) {
          tzLabel = ' (UTC)';
        }
        date = `${date}${tzLabel}`;
      }
      if (valueMatch) {
        const valueIdx = line.lastIndexOf(valueMatch[1]);
        if (!date || valueIdx > (date ? line.indexOf(date) + (date?.length || 0) : 0)) {
          before = before.slice(0, valueIdx - (date ? 0 : 0));
          value = valueMatch[1];
        }
      }
      return (
        <div key={idx}>
          <span className="text-white">{before}</span>
          {date && <span className="italic text-gray-400">{date}</span>}
          {value && <span className={`font-semibold ${color}`}> {value}</span>}
        </div>
      );
    });
    rendered.push(
      <div key={section} className={`mb-3`}>
        <span className={`font-bold ${color}`}>• {section}:</span>
        <div className="pl-4">{contentLines}</div>
      </div>
    );
    i += 2;
  }
  if (parts[0].trim()) {
    rendered.unshift(<div key="intro" className="mb-2 whitespace-pre-line">{parts[0]}</div>);
  }
  let outroIdx = parts.findIndex(p => p && p.trim().startsWith('Please prepare'));
  if (outroIdx > 0) {
    parts[outroIdx] = '\n' + parts[outroIdx];
  }
  if (parts.length % 2 === 0 && parts[parts.length - 1].trim()) {
    rendered.push(<div key="outro" className="mt-2 whitespace-pre-line">{parts[parts.length - 1]}</div>);
  }
  return rendered;
} 