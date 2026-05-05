import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export const HoverEffect = ({ items, className }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 py-10 ${className || ""}`}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="relative group block p-2 h-full w-full cursor-pointer"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-purple-600/20 block rounded-3xl"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.15 } }}
                exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.2 } }}
              />
            )}
          </AnimatePresence>
          <div className="rounded-2xl h-full w-full p-4 overflow-hidden bg-[#1a1a2e]/40 backdrop-blur-3xl border border-white/10 group-hover:border-purple-500/50 relative z-20 transition-all duration-300">
            <div className="relative z-50 p-4">
              <div className="mb-4">{item.icon}</div>
              <h4 className="text-white font-black text-xl tracking-tight mt-4">
                {item.title}
              </h4>
              <p className="mt-4 text-gray-400 tracking-wide leading-relaxed text-sm font-medium">
                {item.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
