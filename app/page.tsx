"use client";
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import LiquidBackground from '../components/LiquidBackground';

const HomePage: React.FC = () => {
  const [displayEvap, setDisplayEvap] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const targetEvap = useRef(0);
  const currentEvap = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      targetEvap.current = Math.min(scrollY / (vh * 1.5), 1);
      setScrollOffset(scrollY / vh);
    };

    let rafId: number;
    const update = () => {
      const lerpFactor = 0.06;
      currentEvap.current += (targetEvap.current - currentEvap.current) * lerpFactor;

      if (Math.abs(currentEvap.current - displayEvap) > 0.0001) {
        setDisplayEvap(currentEvap.current);
      }

      rafId = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    rafId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [displayEvap]);

  return (
    <>
      <motion.div
        className="relative bg-black text-white font-sans selection:bg-pink-500/30 selection:text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <LiquidBackground evaporation={displayEvap} scrollOffset={scrollOffset} />

        {/* Hero Section */}
        <motion.section
          className="relative h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <motion.div
            className="relative z-10"
            style={{ transform: `translateY(${displayEvap * -150}px)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <h1
              className="text-7xl md:text-[14rem] font-black tracking-tighter leading-none text-center mix-blend-overlay"
              style={{ opacity: 1 - displayEvap * 2 }}
            >
              LIQUID
            </h1>
            <h1
              className="text-7xl md:text-[14rem] font-thin tracking-tighter leading-none text-center mt-[-1rem] md:mt-[-3rem] italic opacity-80"
              style={{ opacity: 1 - displayEvap * 2 }}
            >
              BACKGROUND
            </h1>
          </motion.div>
        </motion.section>

        {/* Content Section */}
        <section
          className="relative h-screen flex flex-col items-center justify-center px-6"
        >
          <h1 className="text-7xl md:text-[14rem] font-thin text-white leading-none text-center">
            BOTTOM CONTENT
          </h1>
        </section>
      </motion.div >
    </>
  );
};

export default HomePage;

