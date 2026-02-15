interface TimestampProps {
  date: Date | string;
  format?: 'time' | 'date' | 'relative' | 'full';
  className?: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) {
    return 'Today';
  }
  if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  }

  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  if (date > oneWeekAgo) {
    return date.toLocaleDateString([], { weekday: 'long' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return formatDate(date);
}

function formatFull(date: Date): string {
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export default function Timestamp({ date, format = 'relative', className = '' }: TimestampProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  let formatted: string;
  switch (format) {
    case 'time':
      formatted = formatTime(dateObj);
      break;
    case 'date':
      formatted = formatDate(dateObj);
      break;
    case 'full':
      formatted = formatFull(dateObj);
      break;
    case 'relative':
    default:
      formatted = formatRelative(dateObj);
  }

  return (
    <time
      dateTime={dateObj.toISOString()}
      className={`text-xs text-gray-500 ${className}`}
      title={dateObj.toLocaleString()}
    >
      {formatted}
    </time>
  );
}
