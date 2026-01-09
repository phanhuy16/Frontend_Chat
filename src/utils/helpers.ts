export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const truncateText = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const getAvatarUrl = (avatarPath: string | null | undefined): string => {
  if (!avatarPath) return "";
  if (avatarPath.startsWith("http")) return avatarPath;
  const baseUrl = process.env.REACT_APP_AVATAR_URL || "";
  return `${baseUrl}${avatarPath}`;
};

export const formatLastActive = (lastActiveAt: string | null | undefined): string => {
  if (!lastActiveAt) return "Hoạt động gần đây";

  const lastActive = new Date(lastActiveAt);

  // Kiểm tra ngày không hợp lệ (NaN hoặc ngày mặc định từ C# như 0001-01-01)
  if (isNaN(lastActive.getTime()) || lastActive.getFullYear() < 1970) {
    return "Hoạt động gần đây";
  }
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - lastActive.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Vừa mới hoạt động";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Hoạt động ${diffInMinutes} phút trước`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Hoạt động ${diffInHours} giờ trước`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Hoạt động ${diffInDays} ngày trước`;
  }

  return `Hoạt động ngày ${lastActive.toLocaleDateString('vi-VN')}`;
};

