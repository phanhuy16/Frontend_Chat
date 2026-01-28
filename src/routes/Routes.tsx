import React, { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AuthPage from "../pages/AuthPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import ChatPage from "../pages/ChatPage";
import FriendRequestsPage from "../pages/FriendRequestsPage";
import FriendsListPage from "../pages/FriendsListPage";
import NotFoundPage from "../pages/NotFoundPage";
import SettingsPage from "../pages/SettingsPage";
import ProfilePage from "../pages/ProfilePage";
import ArchivedChatsPage from "../pages/ArchivedChatsPage";
import MainLayout from "../components/Layout/MainLayout";

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
  const { isAuthenticated } = useAuth();
  const [pendingRequestCount] = useState(0);

  // ... (effect stays the same)

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ChatPage pendingRequestCount={pendingRequestCount} />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:conversationId"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ChatPage pendingRequestCount={pendingRequestCount} />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/archived"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ArchivedChatsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/archived/:conversationId"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ArchivedChatsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <MainLayout>
              <SettingsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/friends/requests"
        element={
          <ProtectedRoute>
            <MainLayout>
              <FriendRequestsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/friends/list"
        element={
          <ProtectedRoute>
            <MainLayout>
              <FriendsListPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:userId"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProfilePage />
            </MainLayout>
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
