"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useMemo } from "react";

function normalizePhone(raw: string): string {
  return String(raw || "").replace(/\D/g, "");
}

export function WhatsAppButton() {
  const phoneNumber = normalizePhone(process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "34693039422");

  const href = useMemo(() => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const message = encodeURIComponent(
      `Hola, me gustar\u00eda solicitar informaci\u00f3n sobre productos personalizados.\n\nURL: ${url}`
    );
    return `https://wa.me/${phoneNumber}?text=${message}`;
  }, [phoneNumber]);

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg transition-colors"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1, type: "spring" }}
      whileHover={{ scale: 1.1 }}
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
    </motion.a>
  );
}
