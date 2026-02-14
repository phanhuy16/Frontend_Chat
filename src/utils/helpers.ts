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

export const getAvatarUrl = (avatarPath: string | null | undefined): string | undefined => {
  if (!avatarPath) return undefined;
  if (avatarPath.startsWith("http")) return avatarPath;
  const baseUrl = process.env.REACT_APP_AVATAR_URL || "";
  return `${baseUrl}${avatarPath}`;
};

export const formatLastActive = (lastActiveAt: string | null | undefined, t: (key: string, options?: any) => string): string => {
  if (!lastActiveAt) return t("status.recent");

  const lastActive = new Date(lastActiveAt);

  // Kiểm tra ngày không hợp lệ (NaN hoặc ngày mặc định từ C# như 0001-01-01)
  if (isNaN(lastActive.getTime()) || lastActive.getFullYear() < 1970) {
    return t("status.recent");
  }
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - lastActive.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return t("status.active_now");
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return t("status.active_min_ago", { count: diffInMinutes });
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return t("status.active_hour_ago", { count: diffInHours });
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Hoạt động ${diffInDays} ngày trước`;
  }

  return `Hoạt động ngày ${lastActive.toLocaleDateString('vi-VN')}`;
};

