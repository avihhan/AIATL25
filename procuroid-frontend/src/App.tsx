import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Suppliers from './pages/Suppliers';
import Calendar from './pages/Calendar';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/Signup';
import Home from './pages/Home'
import AccountSettings from './pages/AccountSettings';
import './cursor';
import SplashScreen from './components/SplashScreen';
import { useState } from 'react';
function App() {
  const [isSplashComplete, setIsSplashComplete] = useState(false);

  return (
    <Router>
      {!isSplashComplete ? (
        <SplashScreen onComplete={() => setIsSplashComplete(true)} />
      ) : (
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Protected routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/suppliers" element={<Suppliers />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/accountsettings" element={<AccountSettings />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      )}
    </Router>
  );
}

export default App;