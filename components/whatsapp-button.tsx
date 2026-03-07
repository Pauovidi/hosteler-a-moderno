"use client";

import { motion } from "framer-motion";

export function WhatsAppButton() {
  return (
    <motion.a
      href="https://wa.me/34693039422"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[70] w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white flex items-center justify-center shadow-xl transition-colors"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1, type: "spring" }}
      whileHover={{ scale: 1.1 }}
      aria-label="WhatsApp"
    >
      <svg viewBox="0 0 32 32" className="w-7 h-7" aria-hidden="true" fill="currentColor">
        <path d="M16.04 3C8.84 3 3 8.74 3 15.82c0 2.45.72 4.85 2.08 6.92L3 29l6.44-2.02a13.2 13.2 0 0 0 6.58 1.77h.01C23.2 28.75 29 23 29 15.92 29 8.84 23.24 3 16.04 3Zm0 23.53h-.01c-2.03 0-4.03-.54-5.77-1.57l-.41-.24-3.82 1.2 1.24-3.7-.27-.43a10.6 10.6 0 0 1-1.64-5.66c0-5.87 4.83-10.65 10.77-10.65 2.88 0 5.58 1.1 7.61 3.1a10.47 10.47 0 0 1 3.16 7.48c0 5.88-4.84 10.67-10.86 10.67Zm5.9-8.02c-.32-.16-1.9-.93-2.2-1.04-.3-.1-.52-.16-.74.16-.22.32-.85 1.04-1.04 1.25-.2.22-.38.24-.7.08-.32-.16-1.37-.5-2.6-1.58-.96-.84-1.61-1.87-1.8-2.19-.19-.32-.02-.5.14-.66.14-.14.32-.38.48-.57.16-.2.21-.32.32-.54.1-.21.05-.4-.03-.56-.08-.16-.74-1.77-1.01-2.42-.27-.65-.55-.56-.74-.57h-.63c-.21 0-.56.08-.85.4-.3.32-1.13 1.1-1.13 2.67 0 1.58 1.16 3.1 1.32 3.31.16.21 2.26 3.42 5.48 4.8.77.33 1.37.53 1.84.68.77.24 1.48.2 2.04.12.62-.09 1.9-.78 2.17-1.53.27-.75.27-1.39.19-1.53-.08-.13-.3-.21-.62-.37Z" />
      </svg>
    </motion.a>
  );
}
