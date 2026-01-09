import { Toaster } from "react-hot-toast";
import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import AppRoutes from "./routes/Routes";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Router>
        <GoogleOAuthProvider
          clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID as string}
        >
          <ThemeProvider>
            <AuthProvider>
              <ChatProvider>
                <AppRoutes />
              </ChatProvider>
            </AuthProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </Router>
    </>
  );
}

export default App;
