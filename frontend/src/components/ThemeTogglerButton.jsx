import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeTogglerButton = ({
  variant = 'default',
  size = 'default',
  modes = ['light', 'dark'],
  direction = 'ltr',
  onImmediateChange,
  ...props
}) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    if (onImmediateChange) onImmediateChange(theme);
  }, [theme, onImmediateChange]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-8 h-8';
      case 'lg': return 'w-12 h-12';
      default: return 'w-10 h-10';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'outline': return 'border border-white/20 bg-transparent hover:bg-white/5';
      case 'ghost': return 'bg-transparent hover:bg-white/5';
      default: return 'bg-white/10 hover:bg-white/20 border border-white/10';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`relative rounded-full flex items-center justify-center transition-all overflow-hidden backdrop-blur-sm ${getSizeClasses()} ${getVariantClasses()}`}
      aria-label="Toggle theme"
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'light' ? (
          <motion.div
            key="sun"
            initial={{ y: direction === 'ltr' ? 20 : -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: direction === 'ltr' ? -20 : 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Sun className="text-white w-5 h-5" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ y: direction === 'ltr' ? 20 : -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: direction === 'ltr' ? -20 : 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Moon className="text-white w-5 h-5" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Visual background ripple effect on toggle */}
      <motion.div
        className="absolute inset-0 bg-white/10 pointer-events-none"
        initial={false}
        animate={theme === 'dark' ? { scale: [1, 1.5, 1], opacity: [0, 0.5, 0] } : { scale: [1, 1.5, 1], opacity: [0, 0.5, 0] }}
        key={theme}
      />
    </button>
  );
};

export default ThemeTogglerButton;
