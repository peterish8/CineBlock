"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useThemeMode } from "@/hooks/useThemeMode";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextType = {
  pushToast: (type: ToastType, message: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DURATION_MS = 2600;

const glassConfig = {
  success: {
    border: "rgba(34,197,94,0.35)",
    glow: "rgba(34,197,94,0.15)",
    icon: "#4ADE80",
    bar: "#4ADE80",
  },
  error: {
    border: "rgba(239,68,68,0.40)",
    glow: "rgba(239,68,68,0.15)",
    icon: "#F87171",
    bar: "#F87171",
  },
  info: {
    border: "rgba(96,165,250,0.40)",
    glow: "rgba(96,165,250,0.15)",
    icon: "#93C5FD",
    bar: "linear-gradient(90deg,#60A5FA,#F97316)",
  },
};

const netflixConfig = {
  success: {
    border: "rgba(70,211,105,0.35)",
    glow: "rgba(70,211,105,0.16)",
    icon: "#46D369",
    bar: "#46D369",
  },
  error: {
    border: "rgba(229,9,20,0.55)",
    glow: "rgba(229,9,20,0.22)",
    icon: "#E50914",
    bar: "#E50914",
  },
  info: {
    border: "rgba(255,255,255,0.18)",
    glow: "rgba(255,255,255,0.08)",
    icon: "#FFFFFF",
    bar: "#E50914",
  },
};

const brutalBg = {
  success: "bg-brutal-lime text-black",
  error: "bg-red-600 text-white",
  info: "bg-brutal-cyan text-black",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<number, number>>(new Map());
  const theme = useThemeMode();
  const isGlass = theme === "glass";
  const isNetflix = theme === "netflix";

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
    };
  }, []);

  const pushToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, message }]);
    const timeoutId = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timeoutsRef.current.delete(id);
    }, DURATION_MS);
    timeoutsRef.current.set(id, timeoutId);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-3 top-3 z-[1200] flex w-[min(92vw,360px)] flex-col gap-2 sm:right-4 sm:top-4">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const glass = glassConfig[toast.type];
            const netflix = netflixConfig[toast.type];

            if (isGlass) {
              return (
                <motion.div
                  key={toast.id}
                  role="status"
                  aria-live="polite"
                  className="pointer-events-auto relative overflow-hidden"
                  style={{
                    background: "rgba(4,12,36,0.88)",
                    backdropFilter: "blur(22px) saturate(160%)",
                    border: `1px solid ${glass.border}`,
                    borderRadius: 16,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05), 0 0 20px ${glass.glow}`,
                  }}
                  initial={{ opacity: 0, y: -16, scale: 0.9, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, scale: 0.94, filter: "blur(4px)" }}
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                >
                  <div className="flex items-start gap-2.5 px-3.5 py-3">
                    {toast.type === "success" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: glass.icon }} />
                    ) : toast.type === "error" ? (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: glass.icon }} />
                    ) : (
                      <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: glass.icon }} />
                    )}
                    <span className="text-xs font-display font-medium leading-relaxed text-white/90">{toast.message}</span>
                  </div>
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px] rounded-b-2xl"
                    style={{ background: glass.bar }}
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: DURATION_MS / 1000, ease: "linear" }}
                  />
                </motion.div>
              );
            }

            if (isNetflix) {
              return (
                <motion.div
                  key={toast.id}
                  role="status"
                  aria-live="polite"
                  className="pointer-events-auto relative overflow-hidden rounded-md border px-4 py-3"
                  style={{
                    background: "#181818",
                    borderColor: netflix.border,
                    boxShadow: `0 18px 40px rgba(0,0,0,0.58), 0 0 22px ${netflix.glow}`,
                  }}
                  initial={{ opacity: 0, y: -12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                >
                  <div className="flex items-start gap-3">
                    {toast.type === "success" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: netflix.icon }} />
                    ) : toast.type === "error" ? (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: netflix.icon }} />
                    ) : (
                      <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: netflix.icon }} />
                    )}
                    <span className="text-[13px] font-semibold leading-relaxed text-white/92">{toast.message}</span>
                  </div>
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px]"
                    style={{ background: netflix.bar }}
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: DURATION_MS / 1000, ease: "linear" }}
                  />
                </motion.div>
              );
            }

            return (
              <motion.div
                key={toast.id}
                role="status"
                aria-live="polite"
                className={`pointer-events-auto flex items-start gap-2 border-2 border-brutal-border px-3 py-2 text-sm shadow-[4px_4px_0px_#000] motion-reduce:animate-none ${brutalBg[toast.type]}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {toast.type === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : toast.type === "error" ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span className="font-mono text-xs uppercase tracking-wide">{toast.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
