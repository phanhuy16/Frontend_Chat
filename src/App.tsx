import { Toaster } from "react-hot-toast";
import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import { FriendRequestProvider } from "./context/FriendRequestContext";
import { CallProvider } from "./context/CallContext";
import AppRoutes from "./routes/Routes";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

import { ConfigProvider, theme as antdTheme } from "antd";

const AppContent = () => {
  const { accentColor, theme } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm:
          theme === "dark"
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: accentColor,
          borderRadius: 12,
        },
      }}
    >
      <AuthProvider>
        <ChatProvider>
          <CallProvider>
            <FriendRequestProvider>
              <AppRoutes />
            </FriendRequestProvider>
          </CallProvider>
        </ChatProvider>
      </AuthProvider>
    </ConfigProvider>
  );
};

function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Router>
        <GoogleOAuthProvider
          clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID as string}
        >
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </GoogleOAuthProvider>
      </Router>
    </>
  );
}

export default App;
