import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VideoMarketerAd() {
  const [scene, setScene] = useState(0);

  useEffect(() => {
    const sceneDurations = [2500, 2500, 2500, 2500];
    
    let currentTimer: NodeJS.Timeout;
    const playScene = (index: number) => {
      setScene(index);
      currentTimer = setTimeout(() => {
        playScene((index + 1) % 4);
      }, sceneDurations[index]);
    };

    playScene(0);

    return () => clearTimeout(currentTimer);
  }, []);

  return (
    <div 
      className="relative w-[100vw] h-[100vh] overflow-hidden flex flex-col bg-[#0F1C3F] text-white"
      style={{ fontFamily: "'Cairo', sans-serif" }}
      dir="rtl"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
      `}</style>
      
      {/* Persistent Background Elements */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          className="absolute top-0 right-0 w-[150vw] h-[150vw] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #0F7BA0 0%, transparent 70%)' }}
          animate={{
            x: scene === 0 ? '-20vw' : scene === 1 ? '10vw' : scene === 2 ? '0vw' : '-10vw',
            y: scene === 0 ? '-20vh' : scene === 1 ? '10vh' : scene === 2 ? '-30vh' : '0vh',
            scale: scene === 2 ? 1.5 : 1,
          }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-[100vw] h-[100vw] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
          animate={{
            x: scene === 0 ? '10vw' : scene === 1 ? '-20vw' : scene === 2 ? '20vw' : '0vw',
            y: scene === 0 ? '10vh' : scene === 1 ? '-10vh' : scene === 2 ? '20vh' : '10vh',
            scale: scene === 3 ? 1.5 : 1,
          }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
        
        {/* City silhouette hint for scene 0 */}
        <AnimatePresence>
          {scene === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 0.15, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 1 }}
              className="absolute bottom-0 w-full h-[30vh] bg-bottom bg-repeat-x bg-contain"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1000 300\' preserveAspectRatio=\'none\'%3E%3Cpath fill=\'%230F7BA0\' d=\'M0,300 L0,200 L50,200 L50,150 L100,150 L100,220 L150,220 L150,100 L200,100 L200,180 L250,180 L250,120 L300,120 L300,250 L350,250 L350,170 L400,170 L400,80 L450,80 L450,190 L500,190 L500,140 L550,140 L550,210 L600,210 L600,110 L650,110 L650,230 L700,230 L700,160 L750,160 L750,90 L800,90 L800,200 L850,200 L850,130 L900,130 L900,240 L950,240 L950,180 L1000,180 L1000,300 Z\'/%3E%3C/svg%3E")',
                backgroundSize: '200% 100%'
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {/* SCENE 0: Opening hook */}
          {scene === 0 && (
            <motion.div
              key="scene0"
              className="flex flex-col items-center justify-center text-center w-full"
              initial={{ opacity: 0, scale: 0.8, rotateX: 45 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)", x: -50 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            >
              <motion.h1 
                className="text-5xl md:text-6xl font-black mb-4 leading-tight"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                هل أنت
                <br />
                <span className="text-[#0F7BA0] drop-shadow-[0_0_15px_rgba(15,123,160,0.5)]">مسوق عقاري؟</span>
              </motion.h1>
            </motion.div>
          )}

          {/* SCENE 1: Problem/Opportunity */}
          {scene === 1 && (
            <motion.div
              key="scene1"
              className="flex flex-col items-center justify-center text-center w-full"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, y: -50, filter: "blur(10px)" }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white/90">
                العملاء موجودون
              </h2>
              
              <motion.div 
                className="relative bg-[#0F7BA0]/20 border border-[#0F7BA0]/50 rounded-2xl p-8 w-full max-w-sm backdrop-blur-md"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", bounce: 0.5 }}
              >
                <motion.div
                  className="text-6xl md:text-7xl font-black text-[#f59e0b] drop-shadow-[0_0_20px_rgba(245,158,11,0.6)] dir-ltr"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: [1, 1.1, 1] }}
                  transition={{ delay: 0.6, duration: 0.5, times: [0, 0.5, 1] }}
                >
                  <Counter from={0} to={3000} duration={1} />+
                </motion.div>
                <div className="text-2xl mt-4 font-bold text-white/80">عميل يومياً</div>
              </motion.div>
            </motion.div>
          )}

          {/* SCENE 2: Solution Reveal */}
          {scene === 2 && (
            <motion.div
              key="scene2"
              className="flex flex-col items-center justify-center text-center w-full h-full"
              initial={{ opacity: 0, clipPath: "circle(0% at 50% 50%)" }}
              animate={{ opacity: 1, clipPath: "circle(150% at 50% 50%)" }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8, ease: "circOut" }}
            >
              <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mb-10"
              >
                <div className="text-[#0F7BA0] font-black text-6xl md:text-7xl drop-shadow-[0_0_25px_rgba(15,123,160,0.8)] tracking-tight">
                  عقار إنسايت
                </div>
              </motion.div>

              <motion.div
                className="w-72 h-[400px] bg-[#0A132B] border-t-4 border-[#0F7BA0] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(15,123,160,0.4)] relative"
                initial={{ y: 100, rotateX: -20, opacity: 0 }}
                animate={{ y: 0, rotateX: 0, opacity: 1 }}
                transition={{ delay: 0.6, type: "spring", bounce: 0.4 }}
                style={{ perspective: 1000 }}
              >
                {/* Mockup UI Elements */}
                <div className="w-full h-12 bg-white/5 flex items-center px-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <div className="p-6 flex flex-col gap-4">
                  <motion.div 
                    className="w-3/4 h-8 rounded bg-white/20"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  ></motion.div>
                  <motion.div 
                    className="w-1/2 h-4 rounded bg-white/10"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  ></motion.div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <motion.div className="h-24 rounded-lg bg-gradient-to-br from-[#0F7BA0]/40 to-[#0F7BA0]/10 border border-[#0F7BA0]/30"
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.0, type: "spring" }}
                    ></motion.div>
                    <motion.div className="h-24 rounded-lg bg-gradient-to-br from-[#0F7BA0]/40 to-[#0F7BA0]/10 border border-[#0F7BA0]/30"
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.1, type: "spring" }}
                    ></motion.div>
                    <motion.div className="h-24 rounded-lg bg-gradient-to-br from-[#f59e0b]/40 to-[#f59e0b]/10 border border-[#f59e0b]/30"
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.2, type: "spring" }}
                    ></motion.div>
                    <motion.div className="h-24 rounded-lg bg-gradient-to-br from-[#0F7BA0]/40 to-[#0F7BA0]/10 border border-[#0F7BA0]/30"
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.3, type: "spring" }}
                    ></motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* SCENE 3: Call to Action (Visual Only) */}
          {scene === 3 && (
            <motion.div
              key="scene3"
              className="flex flex-col items-center justify-center text-center w-full h-full"
              initial={{ opacity: 0, scale: 1.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, filter: "blur(20px)" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <motion.h2 
                className="text-[5rem] font-black mb-16 text-transparent bg-clip-text bg-gradient-to-br from-[#f59e0b] to-[#fde68a]"
                style={{ filter: 'drop-shadow(0 0 30px rgba(245,158,11,0.6))' }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
              >
                سجّل الآن
              </motion.h2>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="flex items-center gap-6 border-t border-white/20 pt-10"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0F7BA0] to-[#0A4D66] shadow-[0_0_25px_rgba(15,123,160,0.8)] flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <div className="text-4xl font-bold text-white tracking-wide">عقار إنسايت</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Bar (Full 10s loop) */}
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/10 z-20">
        <motion.div 
          key={scene}
          className="h-full bg-gradient-to-r from-[#0F7BA0] to-[#f59e0b]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.5, ease: "linear" }}
        />
      </div>
    </div>
  );
}

// Counter helper with easeOutExpo
function Counter({ from, to, duration }: { from: number; to: number; duration: number }) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.floor(from + (to - from) * easeProgress));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);

    return () => cancelAnimationFrame(animationFrame);
  }, [from, to, duration]);

  // Use ltr direction internally so the number formats correctly even in rtl context
  return <span dir="ltr">{count.toLocaleString('en-US')}</span>;
}
