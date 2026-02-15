import type { UserStatus } from '../../../types/chat';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: UserStatus;
  showStatus?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

const statusClasses = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
};

const statusSizeClasses = {
  sm: 'w-2.5 h-2.5 -right-0.5 -bottom-0.5',
  md: 'w-3 h-3 -right-0.5 -bottom-0.5',
  lg: 'w-3.5 h-3.5 -right-0.5 -bottom-0.5',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColorFromName(name?: string): string {
  if (!name) return 'bg-gray-500';
  const colors = [
    'bg-indigo-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-cyan-500',
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default function Avatar({
  src,
  name,
  size = 'md',
  status,
  showStatus = false,
}: AvatarProps) {
  return (
    <div className="relative inline-block">
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} ${getColorFromName(name)} rounded-full flex items-center justify-center text-white font-medium`}
        >
          {getInitials(name)}
        </div>
      )}
      {showStatus && status && (
        <span
          className={`absolute ${statusSizeClasses[size]} ${statusClasses[status]} rounded-full border-2 border-white`}
        />
      )}
    </div>
  );
}
