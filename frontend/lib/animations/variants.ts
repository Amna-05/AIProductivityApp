/**
 * Framer Motion Animation Variants
 *
 * Reusable animation patterns for consistent motion throughout the app.
 * All animations use the dark theme + orange accents design system.
 */

import { Variants } from 'framer-motion';

// ============================================================
// PAGE TRANSITIONS
// ============================================================

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

// ============================================================
// CARD ANIMATIONS
// ============================================================

export const cardContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const cardItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

// ============================================================
// MODAL/DIALOG ANIMATIONS
// ============================================================

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

// ============================================================
// LIST & STAGGER ANIMATIONS
// ============================================================

export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -10,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

// ============================================================
// BUTTON & INTERACTIVE ANIMATIONS
// ============================================================

export const buttonVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 10px 25px rgba(255, 107, 53, 0.2)',
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.98,
  },
};

// ============================================================
// METRIC CARDS - COUNT UP ANIMATIONS
// ============================================================

export const metricCardVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

// ============================================================
// CHART ANIMATIONS
// ============================================================

export const chartContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const chartItemVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// ============================================================
// SIDEBAR ANIMATIONS
// ============================================================

export const sidebarVariants: Variants = {
  closed: {
    x: '-100%',
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
  open: {
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

export const navItemVariants: Variants = {
  rest: {
    x: 0,
    backgroundColor: 'transparent',
  },
  hover: {
    x: 4,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    transition: {
      duration: 0.2,
    },
  },
  active: {
    x: 4,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
  },
};

// ============================================================
// TASK CARD ANIMATIONS
// ============================================================

export const taskCardVariants: Variants = {
  rest: {
    y: 0,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
  },
  hover: {
    y: -4,
    boxShadow: '0 10px 20px rgba(255, 107, 53, 0.15)',
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  tap: {
    y: -2,
  },
};

export const taskCompletionVariants: Variants = {
  initial: {
    scale: 1,
    opacity: 1,
  },
  complete: {
    scale: 0.95,
    opacity: 0.6,
    transition: {
      duration: 0.3,
    },
  },
};

// ============================================================
// BADGE & SMALL ELEMENT ANIMATIONS
// ============================================================

export const badgeVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: 'backOut',
    },
  },
};

// ============================================================
// SKELETON ANIMATIONS
// ============================================================

export const skeletonVariants: Variants = {
  initial: {
    opacity: 0.6,
  },
  animate: {
    opacity: [0.6, 0.9, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ============================================================
// FLOATING ACTION BUTTON
// ============================================================

export const fabVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.1,
    y: -4,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.95,
  },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
    },
  },
};

// ============================================================
// NOTIFICATION ANIMATIONS
// ============================================================

export const notificationVariants: Variants = {
  initial: {
    opacity: 0,
    x: 300,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: 300,
    transition: {
      duration: 0.2,
    },
  },
};

// ============================================================
// SCROLL & REVEAL ANIMATIONS
// ============================================================

export const fadeInUpVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30,
  },
  inView: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// ============================================================
// CONFETTI & CELEBRATION
// ============================================================

export const confettiVariants: Variants = {
  initial: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  animate: {
    opacity: 0,
    scale: 0.5,
    y: -80,
    rotate: Math.random() * 360,
    transition: {
      duration: 1,
      ease: 'easeOut',
    },
  },
};
