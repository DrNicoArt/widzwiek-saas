// Wspólne presety animacji (Framer Motion). Spójny rytm: spring + krótkie czasy.
import type { Variants, Transition } from "framer-motion";

export const spring: Transition = { type: "spring", stiffness: 320, damping: 30, mass: 0.7 };
export const easeOut: Transition = { duration: 0.32, ease: [0.22, 1, 0.36, 1] };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: easeOut },
};

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: spring },
};

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: easeOut },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } },
};

export const cardHover = { y: -4, transition: spring };
