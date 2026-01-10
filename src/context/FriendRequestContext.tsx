import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "../hooks/useAuth";
import { friendApi } from "../api/friend.api";

interface FriendRequestContextType {
  pendingCount: number;
  refreshCount: () => Promise<void>;
  incrementCount: () => void;
  decrementCount: () => void;
}

const FriendRequestContext = createContext<
  FriendRequestContextType | undefined
>(undefined);

export const FriendRequestProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  const refreshCount = useCallback(async () => {
    if (!user) return;

    try {
      const requests = await friendApi.getPendingRequests();
      setPendingCount(requests.length);
    } catch (error) {
      console.error("Failed to fetch pending requests count:", error);
    }
  }, [user]);

  const incrementCount = useCallback(() => {
    setPendingCount((prev) => prev + 1);
  }, []);

  const decrementCount = useCallback(() => {
    setPendingCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Load initial count
  useEffect(() => {
    if (user) {
      refreshCount();
    }
  }, [user, refreshCount]);

  return (
    <FriendRequestContext.Provider
      value={{ pendingCount, refreshCount, incrementCount, decrementCount }}
    >
      {children}
    </FriendRequestContext.Provider>
  );
};

export const useFriendRequest = () => {
  const context = useContext(FriendRequestContext);
  if (context === undefined) {
    throw new Error(
      "useFriendRequest must be used within a FriendRequestProvider"
    );
  }
  return context;
};
