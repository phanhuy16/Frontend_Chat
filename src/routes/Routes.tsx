import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AuthPage from "../pages/AuthPage";
import ChatPage from "../pages/ChatPage";
import NotFoundPage from "../pages/NotFoundPage";
import SettingsPage from "../pages/SettingsPage";
import { friendApi } from "../api/friend.api";
import FriendRequestsPage from "../pages/FriendRequestsPage";
import FriendsListPage from "../pages/FriendsListPage";

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />;
};

export default function AppRoutes() {
  const { isAuthenticated, loading, user } = useAuth();
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  // Poll for pending friend requests periodically
  useEffect(() => {
    if (!user?.id) return;

    const fetchPendingCount = async () => {
      try {
        const requests = await friendApi.getPendingRequests();
        setPendingRequestCount(requests.length);
      } catch (err) {
        console.error("Error fetching pending requests:", err);
      }
    };

    // Fetch immediately
    fetchPendingCount();

    // Fetch every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage pendingRequestCount={pendingRequestCount} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/friends/requests"
        element={
          <ProtectedRoute>
            <FriendRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/friends/list"
        element={
          <ProtectedRoute>
            <FriendsListPage />
          </ProtectedRoute>
        }
      />
      <Route path="/404" element={<NotFoundPage />} />
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/chat" : "/auth"} />}
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
