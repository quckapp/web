import type { UserStatus } from '../../../types/chat';

interface OnlineStatusProps {
  status: UserStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
};

const statusLabels = {
  online: 'Online',
  offline: 'Offline',
  away: 'Away',
};

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
};

export default function OnlineStatus({
  status,
  showLabel = false,
  size = 'sm',
}: OnlineStatusProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`${sizeClasses[size]} ${statusColors[status]} rounded-full`} />
      {showLabel && (
        <span className="text-xs text-gray-500">{statusLabels[status]}</span>
      )}
    </div>
  );
}
