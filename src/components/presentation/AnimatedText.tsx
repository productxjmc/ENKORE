"use client";

import { motion } from "framer-motion";

// Ported verbatim from the Base44 app's src/components/presentation/AnimatedText.jsx.
export default function AnimatedText({
  text,
  className = "",
  delay = 0,
  stagger = 0.04,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const words = text.split(" ");
  return (
    <div className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: "0.5em" }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ delay: delay + i * stagger, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {word}&nbsp;
        </motion.span>
      ))}
    </div>
  );
}
