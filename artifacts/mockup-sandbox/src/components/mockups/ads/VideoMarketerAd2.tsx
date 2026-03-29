import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const wipeVariants = {
  initial: { clipPath: "polygon(140% 0%, 140% 0%, 120% 100%, 120% 100%)" },
  animate: { clipPath: "polygon(-20% 0%, 140% 0%, 120% 100%, -40% 100%)" },
  exit: { clipPath: "polygon(-20% 0%, -20% 0%, -40% 100%, -40% 100%)" }
};

const wipeTransition = { duration: 0.5, ease: [0.76, 0, 0.24, 1] };
const snapSpring = { type: 'spring', stiffness: 400, damping: 20 };

export default function VideoMarketerAd2() {
  const [scene, setScene] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScene((s) => (s + 1) % 5);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scene === 1) {
      let current = 0;
      const counterInterval = setInterval(() => {
        current += 215;
        if (current >= 3000) {
          current = 3000;
          clearInterval(counterInterval);
        }
        setCount(current);
      }, 50);
      return () => clearInterval(counterInterval);
    } else {
      setCount(0);
    }
  }, [scene]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0F1C3F',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: '"Cairo", sans-serif',
      direction: 'rtl',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
          * { box-sizing: border-box; }
        `}
      </style>
      
      {/* Background Teal Motifs - Consistent across scenes */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.08,
        backgroundImage: 'linear-gradient(#0F7BA0 2px, transparent 2px), linear-gradient(90deg, #0F7BA0 2px, transparent 2px)',
        backgroundSize: '8vw 8vw',
        backgroundPosition: 'center',
        zIndex: 0
      }} />
      <motion.div 
        animate={{ x: ['100%', '-100%'] }} 
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          bottom: '5%',
          left: 0,
          right: 0,
          height: '2px',
          backgroundColor: '#0F7BA0',
          boxShadow: '0 0 15px 2px #0F7BA0',
          zIndex: 1
        }}
      />

      <AnimatePresence mode="wait">
        {scene === 0 && (
          <motion.div
            key="scene0"
            variants={wipeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={wipeTransition}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2, padding: '20px' }}
          >
            <motion.h1 
              initial={{ x: 100, opacity: 0, rotate: -5 }} 
              animate={{ x: 0, opacity: 1, rotate: 0 }} 
              transition={{ ...snapSpring, delay: 0.1 }} 
              style={{ fontSize: '15vw', margin: 0, color: '#f59e0b', fontWeight: 900, textShadow: '0 5px 15px rgba(245, 158, 11, 0.4)' }}
            >
              مسوق؟
            </motion.h1>
            <motion.h1 
              initial={{ scale: 0, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              transition={{ ...snapSpring, delay: 0.4 }} 
              style={{ fontSize: '18vw', margin: '-5vw 0', color: '#fff', fontWeight: 900, zIndex: 3 }}
            >
              وسيط؟
            </motion.h1>
            <motion.h1 
              initial={{ y: 100, opacity: 0, rotate: 5 }} 
              animate={{ y: 0, opacity: 1, rotate: 0 }} 
              transition={{ ...snapSpring, delay: 0.7 }} 
              style={{ fontSize: '12vw', margin: 0, color: '#0F7BA0', fontWeight: 900, textShadow: '0 5px 15px rgba(15, 123, 160, 0.5)' }}
            >
              صاحب خدمة؟
            </motion.h1>
          </motion.div>
        )}

        {scene === 1 && (
          <motion.div
            key="scene1"
            variants={wipeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={wipeTransition}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2, padding: '20px', backgroundColor: '#0F1C3F' }}
          >
            {/* Teal glow pulse from center */}
            <motion.div 
              initial={{ scale: 0, opacity: 0 }} 
              animate={{ scale: [0, 1.2, 1], opacity: [0, 0.8, 0.5] }} 
              transition={{ duration: 1.2, ease: 'easeOut' }} 
              style={{ position: 'absolute', width: '80vw', height: '80vw', background: 'radial-gradient(circle, rgba(15,123,160,0.6) 0%, rgba(15,28,63,0) 70%)', borderRadius: '50%', zIndex: -1 }} 
            />
            
            <motion.h1 
              initial={{ scale: 0, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              transition={{ ...snapSpring, delay: 0.2 }} 
              style={{ fontSize: '20vw', margin: 0, color: '#fff', fontWeight: 900, textAlign: 'center', lineHeight: 1.1, textShadow: '0 10px 20px rgba(0,0,0,0.5)' }}
            >
              عملاؤك<br/>هنا
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.6, ...snapSpring }} 
              style={{ marginTop: '20px', fontSize: '10vw', color: '#f59e0b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <span style={{ fontFamily: 'monospace', fontWeight: 900 }}>{count.toLocaleString('ar-EG')}+</span> 
              <span>عميل يومياً</span>
            </motion.div>

            {/* Gold particle dots scattering */}
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const dist = 30 + Math.random() * 30; // vw
              return (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                  animate={{ 
                    x: Math.cos(angle) * dist + 'vw', 
                    y: Math.sin(angle) * dist + 'vw', 
                    opacity: 0, 
                    scale: Math.random() * 1.5 + 0.5 
                  }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 + Math.random() * 0.2 }}
                  style={{ position: 'absolute', width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '50%', zIndex: 0, boxShadow: '0 0 10px #f59e0b' }}
                />
              );
            })}
          </motion.div>
        )}

        {scene === 2 && (
          <motion.div
            key="scene2"
            variants={wipeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={wipeTransition}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4vh', zIndex: 2, padding: '20px', backgroundColor: '#0F1C3F' }}
          >
            <FeatureCard text="اعرض خدمتك" icon="🏠" color="#0F7BA0" borderColor="rgba(15,123,160,0.4)" delay={0.2} />
            <FeatureCard text="حلّل السوق" icon="📊" color="#0F7BA0" borderColor="#0F7BA0" delay={0.4} />
            <FeatureCard text="كبّر شغلك" icon="📈" color="#f59e0b" borderColor="rgba(245,158,11,0.6)" delay={0.6} />
          </motion.div>
        )}

        {scene === 3 && (
          <motion.div
            key="scene3"
            variants={wipeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={wipeTransition}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', zIndex: 2, background: 'radial-gradient(circle at center 30%, rgba(15,123,160,0.4) 0%, #0F1C3F 80%)' }}
          >
            <motion.div 
              initial={{ y: -50, opacity: 0, scale: 0.8 }} 
              animate={{ y: 0, opacity: 1, scale: 1 }} 
              transition={{ delay: 0.3, ...snapSpring }} 
              style={{ position: 'absolute', top: '15%', fontSize: '14vw', fontWeight: 900, color: '#fff', textShadow: '0 0 30px rgba(15,123,160,1)' }}
            >
              عقار إنسايت
            </motion.div>
            
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: '10%' }} 
              transition={{ delay: 0.5, ...snapSpring }} 
              style={{ width: '85vw', height: '60vh', backgroundColor: '#0a132b', borderTopLeftRadius: '25px', borderTopRightRadius: '25px', border: '3px solid #0F7BA0', borderBottom: 'none', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', overflow: 'hidden', boxShadow: '0 -15px 40px rgba(15,123,160,0.4)' }}
            >
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} style={{ flex: 1, height: '40px', backgroundColor: 'rgba(15,123,160,0.2)', borderRadius: '10px' }} />
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }} style={{ flex: 2, height: '40px', backgroundColor: 'rgba(15,123,160,0.1)', borderRadius: '10px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                {[...Array(6)].map((_, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, scale: 0.8, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    transition={{ delay: 1.0 + i * 0.1, type: 'spring', stiffness: 300, damping: 20 }} 
                    style={{ backgroundColor: '#13234a', borderRadius: '15px', height: '100px', border: '1px solid rgba(15,123,160,0.3)', display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px' }}
                  >
                    <div style={{ width: '100%', height: '50%', backgroundColor: 'rgba(15,123,160,0.2)', borderRadius: '8px' }} />
                    <div style={{ width: '60%', height: '10px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '5px' }} />
                    <div style={{ width: '40%', height: '10px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '5px' }} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {scene === 4 && (
          <motion.div
            key="scene4"
            variants={wipeVariants}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2, background: 'radial-gradient(circle at center, rgba(245,158,11,0.3) 0%, #0F1C3F 70%)' }}
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              transition={{ ...snapSpring, delay: 0.3 }} 
              style={{ position: 'relative', padding: '30px 40px' }}
            >
              <div style={{ fontSize: '22vw', fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1, textShadow: '0 10px 30px rgba(245,158,11,0.5)' }}>
                انضم الآن
              </div>
              
              <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}>
                <motion.rect 
                  x="0" y="0" width="100%" height="100%" 
                  fill="none" stroke="#f59e0b" strokeWidth="6" rx="20"
                  initial={{ pathLength: 0, opacity: 0 }} 
                  animate={{ pathLength: 1, opacity: 1 }} 
                  transition={{ duration: 1.2, delay: 0.6, ease: "easeInOut" }} 
                  style={{ filter: 'drop-shadow(0 0 10px #f59e0b)' }}
                />
              </svg>
            </motion.div>
            
            <motion.div 
              initial={{ y: 50, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: 0.8, ...snapSpring }} 
              style={{ marginTop: '8vh', textAlign: 'center' }}
            >
              <div style={{ fontSize: '10vw', color: '#f59e0b', fontWeight: 900 }}>عقار إنسايت</div>
              <div style={{ fontSize: '5vw', color: '#fff', marginTop: '5px', opacity: 0.8 }}>منصة العقاريين المحترفين</div>
            </motion.div>
            
            {/* Full gold flash at exactly 1.8s (since scene is 2s) */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: [0, 1, 0] }} 
              transition={{ duration: 0.4, delay: 1.6, ease: 'easeIn' }} 
              style={{ position: 'absolute', inset: 0, backgroundColor: '#f59e0b', zIndex: 10, pointerEvents: 'none' }} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeatureCard({ text, icon, color, borderColor, delay }: { text: string, icon: string, color: string, borderColor?: string, delay: number }) {
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25, delay }}
      style={{
        width: '85vw',
        padding: '20px 25px',
        backgroundColor: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '20px',
        border: `2px solid ${borderColor || color}`,
        boxShadow: `0 10px 30px rgba(0,0,0,0.3), inset 0 0 15px ${borderColor ? 'transparent' : color + '20'}`,
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        color: '#fff',
        fontSize: '7vw',
        fontWeight: '900'
      }}
    >
      <span style={{ fontSize: '10vw', filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.3))' }}>{icon}</span>
      <span style={{ color: color === '#f59e0b' ? '#f59e0b' : '#fff' }}>{text}</span>
    </motion.div>
  );
}
