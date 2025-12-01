import { Toaster } from "react-hot-toast";
import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import AppRoutes from "./routes/Routes";

function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Router>
        <AuthProvider>
          <ChatProvider>
            <AppRoutes />
          </ChatProvider>
        </AuthProvider>
      </Router>
    </>
  );
}

export default App;
