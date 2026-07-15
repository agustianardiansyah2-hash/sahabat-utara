function AlertBadge({ level, showLabel = true }) {
  const config = {
    danger: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
      label: 'Bahaya'
    },
    warning: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      dot: 'bg-yellow-500',
      label: 'Waspada'
    },
    safe: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      dot: 'bg-green-500',
      label: 'Normal'
    }
  };

  const style = config[level] || config.safe;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      {showLabel && style.label}
    </span>
  );
}

export function getAlertLevel(waterLevel, thresholds = { red: 80, yellow: 40 }) {
  if (waterLevel > thresholds.red) return 'danger';
  if (waterLevel > thresholds.yellow) return 'warning';
  return 'safe';
}

export function getWaterLevelColor(waterLevel, thresholds = { red: 80, yellow: 40 }) {
  if (waterLevel > thresholds.red) return '#ef4444';
  if (waterLevel > thresholds.yellow) return '#f59e0b';
  return '#22c55e';
}

export default AlertBadge;
