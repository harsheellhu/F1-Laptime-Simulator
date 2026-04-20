import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import HeroCanvas from './components/HeroCanvas';
import AboutPage  from './components/AboutPage';
import Simulator  from './components/Simulator';

export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'sim'

  return (
    <AnimatePresence mode="wait">
      {view === 'home' ? (
        <motion.div key="home"
          initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,scale:0.97}}
          transition={{duration:0.4}}>
          <HeroCanvas onLaunch={() => setView('sim')} />
          <AboutPage  onLaunch={() => setView('sim')} />

          {/* Footer CTA */}
          <div style={{ textAlign:'center', padding:'60px 24px', background:'var(--bg-void)', borderTop:'1px solid var(--glass-border)' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.2rem,3vw,1.8rem)', fontWeight:800, marginBottom:12 }}>
              Ready to race?
            </div>
            <p style={{ fontFamily:'var(--font-body)', color:'var(--text-3)', marginBottom:24 }}>
              Real ML model · Real F1 data · No mock data.
            </p>
            <button className="btn-primary" onClick={() => setView('sim')} style={{ padding:'16px 48px' }}>
              🏁 Open Simulator
            </button>
          </div>

          <footer style={{
            textAlign:'center', padding:'20px 24px',
            fontFamily:'var(--font-ui)', fontSize:'0.72rem', color:'var(--text-4)',
            borderTop:'1px solid var(--glass-border)',
          }}>
            F1 Lap Time Simulator · XGBoost on Ergast F1 Dataset (Kaggle) · FastAPI + React
          </footer>
        </motion.div>
      ) : (
        <motion.div key="sim"
          initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}}
          transition={{duration:0.35}}>
          <Simulator onBack={() => setView('home')} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
