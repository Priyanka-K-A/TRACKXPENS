import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ExpenseTracker from "./Components/ExpenseTracker";
import Signup from "./Components/Signup";
import Login from "./Components/Login";

// 🔒 Protected Route - blocks access if not logged in
const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// 🌐 Public Route - blocks access if already logged in
const PublicRoute = ({ user, children }) => {
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// 🧭 Main App with navigation
function AppContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // ✅ Restore session on page refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <Routes>
      {/* / → redirect to /signup */}
      <Route
        path="/"
        element={<Navigate to="/signup" replace />}
      />

      {/* /signup */}
      <Route
        path="/signup"
        element={
          <PublicRoute user={user}>
            <Signup setPage={() => navigate("/login")} />
          </PublicRoute>
        }
      />

      {/* /login */}
      <Route
        path="/login"
        element={
          <PublicRoute user={user}>
            <Login
              setPage={() => navigate("/signup")}
              onLogin={handleLoginSuccess}
            />
          </PublicRoute>
        }
      />

      {/* /dashboard - Protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user}>
            <ExpenseTracker user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* Any unknown URL → /signup */}
      <Route
        path="*"
        element={<Navigate to="/signup" replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;