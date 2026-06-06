// Motion system Widźwięku — jedno źródło timingów i presetów (Framer Motion + CSS).
// Zasada: animacje tłumaczą proces (upload → analiza → transkrypcja → WCAG → eksport),
// są subtelne, techniczne, premium. Respektujemy prefers-reduced-motion.
import type { Variants, Transition } from "framer-motion";

// --- Tokeny czasu (sekundy) ---
export const dur = {
  fast: 0.16,   // hover / focus / press        (120–180 ms)
  base: 0.28,   // karty, elementy UI            (240–320 ms)
  slow: 0.7,    // splash, page transition, reveal (500–900 ms)
} as const;

// --- Krzywe / transitiony ---
export const easeOut: Transition = { duration: dur.base, ease: [0.22, 1, 0.36, 1] };
export const easeIn: Transition = { duration: 0.2, ease: [0.4, 0, 1, 1] };
export const spring: Transition = { type: "spring", stiffness: 320, damping: 30, mass: 0.7 };
export const springSoft: Transition = { type: "spring", stiffness: 180, damping: 24 };

// Stagger między elementami listy (60–120 ms)
export const STAGGER = 0.08;

// --- Warianty ---
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: easeOut },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: easeOut },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: spring },
};

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER, delayChildren: 0.04 } },
};

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: easeOut },
  exit: { opacity: 0, y: -8, transition: easeIn },
};

// Mikrointerakcje
export const cardHover = { y: -4, transition: spring };
export const pressTap = { scale: 0.98 };

// Preset do wejść sekcji przy scrollu (sekcja wchodzi po ~20% viewportu)
export const inView = { once: true, amount: 0.2 } as const;

// Wejście całej strony przy zmianie route (template.tsx). Blur+slide+fade — premium, ale lekkie.
export const revealUp: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(7px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// TODO(motion): pełne scroll-triggered sekwencje, page transitions (AnimatePresence),
// animated waveform, gauge count-up, pipeline "drawing", parallax watermark — etap 2.
