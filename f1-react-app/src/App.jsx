import { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import HeroCanvas from './components/HeroCanvas';
import CursorTrail from './components/CursorTrail';
import { api } from './api/client';

// Lazy load heavy components so initial page load is near-instant (< 100ms)
const AboutPage = lazy(() => import('./components/AboutPage'));
const Simulator = lazy(() => import('./components/Simulator'));
const DriverPage = lazy(() => import('./components/DriverPage'));

function ViewLoadingSkeleton() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid rgba(255, 24, 68, 0.2)',
          borderTopColor: 'var(--red)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.72rem',
          letterSpacing: '0.15em',
          color: 'var(--text-3)',
          textTransform: 'uppercase',
        }}
      >
        Loading Telemetry Engine...
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'sim' | 'drivers'
  const [simPreset, setSimPreset] = useState(null); // {driverId, constructorId} when launched from drivers page
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        await api.health();
        if (mounted) setBackendStatus('online');
      } catch (err) {
        if (mounted) setBackendStatus('offline');
      }
    };
    checkHealth();
    const timer = setInterval(checkHealth, 15000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const handleSwitchView = (newView) => {
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLaunchFromDriver = (driverId, constructorId) => {
    setSimPreset({ driverId, constructorId });
    handleSwitchView('sim');
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--bg-void)' }}>
      {/* High-performance canvas cursor trail */}
      <CursorTrail />

      {/* Minimalist Floating Top Navbar */}
      <header
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '8px 20px',
          background: 'rgba(8, 9, 15, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 40,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Brand Logo & Name */}
        <div
          onClick={() => handleSwitchView('home')}
          className="clickable"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #ff1844, #990022)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 900,
              fontFamily: 'var(--font-display)',
              color: '#fff',
              boxShadow: '0 0 12px rgba(255, 24, 68, 0.5)',
            }}
          >
            F1
          </div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: '#fff',
            }}
          >
            LAPTIME<span style={{ color: 'var(--red)', marginLeft: 3 }}>AI</span>
          </span>
        </div>

        <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.12)' }} />

        {/* View Switcher Pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['home', 'drivers', 'sim'].map((v) => {
            const labels = { home: 'OVERVIEW', drivers: 'DRIVERS', sim: 'SIMULATOR' };
            const isActive = view === v;
            return (
              <button
                key={v}
                onClick={() => handleSwitchView(v)}
                style={{
                  background: isActive ? 'rgba(255, 24, 68, 0.18)' : 'transparent',
                  border: isActive ? '1px solid rgba(255, 24, 68, 0.4)' : '1px solid transparent',
                  color: isActive ? '#fff' : 'var(--text-3)',
                  borderRadius: 20,
                  padding: '5px 14px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {labels[v]}
              </button>
            );
          })}
        </div>

        <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.12)' }} />

        {/* Backend Status Dot */}
        <div
          title={`FastAPI backend: ${backendStatus}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span
            className={`status-dot ${
              backendStatus === 'online' ? 'online' : backendStatus === 'offline' ? 'offline' : 'loading'
            }`}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              color: backendStatus === 'online' ? 'var(--green)' : 'var(--gold)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {backendStatus}
          </span>
        </div>
      </header>

      {/* Main View Transition */}
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <HeroCanvas onLaunch={() => handleSwitchView('sim')} />

            <Suspense fallback={<ViewLoadingSkeleton />}>
              <AboutPage onLaunch={() => handleSwitchView('sim')} />
            </Suspense>

            {/* Clean Footer CTA */}
            <div
              style={{
                textAlign: 'center',
                padding: '80px 24px',
                background: 'var(--bg-void)',
                borderTop: '1px solid var(--glass-border)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)',
                  fontWeight: 900,
                  marginBottom: 12,
                  letterSpacing: '0.02em',
                }}
              >
                READY FOR THE TRACK?
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-3)',
                  marginBottom: 28,
                  fontSize: '0.95rem',
                }}
              >
                Trained on 120,000+ real Ergast telemetry laps. Real ML inference with 0 mock data.
              </p>
              <button
                className="btn-primary"
                onClick={() => handleSwitchView('sim')}
                style={{ padding: '16px 44px', fontSize: '0.82rem' }}
              >
                🏁 Launch Simulator
              </button>
            </div>

            <footer
              style={{
                textAlign: 'center',
                padding: '24px',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.74rem',
                color: 'var(--text-4)',
                borderTop: '1px solid var(--glass-border)',
                letterSpacing: '0.05em',
              }}
            >
              F1 Lap Time Simulator · XGBoost ML Model · Real Ergast F1 Telemetry Dataset
            </footer>
          </motion.div>
        )}

        {view === 'drivers' && (
          <motion.div
            key="drivers"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ paddingTop: 76 }}
          >
            <Suspense fallback={<ViewLoadingSkeleton />}>
              <DriverPage onLaunchSim={handleLaunchFromDriver} />
            </Suspense>
          </motion.div>
        )}

        {view === 'sim' && (
          <motion.div
            key="sim"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ paddingTop: 76 }}
          >
            <Suspense fallback={<ViewLoadingSkeleton />}>
              <Simulator onBack={() => handleSwitchView('home')} />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
