import { useState, useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Log from './pages/Log';
import Plans from './pages/Plans';
import Stats from './pages/Stats';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import Settings from './pages/Settings';
import Splash from './pages/Splash';
import MedicineMode from './medicine/MedicineMode';
import Social from './pages/Social';
import Workout from './pages/Workout';
import { FoodScanner } from './components/FoodScanner';
import { Toaster } from 'sonner';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const theme = useAppStore(state => state.theme);

  useEffect(() => {
    const applyTheme = () => {
      let isDark = false;
      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for system changes if theme is 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <Splash />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/log" element={<Log />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/medicine" element={<MedicineMode />} />
          <Route path="/social" element={<Social />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/scanner" element={<FoodScanner />} />

        </Route>
      </Routes>
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          classNames: {
            toast: 'rounded-2xl border-none shadow-xl bg-white/90 backdrop-blur-md font-medium',
            title: 'text-base',
            description: 'text-slate-500',
            actionButton: 'bg-blue-500',
            cancelButton: 'bg-slate-200',
          },
          style: {
            borderRadius: '16px',
            padding: '16px',
          }
        }}
      />
    </Router>
  );
}

export default App;
