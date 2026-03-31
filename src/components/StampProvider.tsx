"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import StampModal from "./StampModal";
import StampNudge from "./StampNudge";

type StampMovie = {
  id: number;
  title: string;
  posterPath: string;
};

type StampModalContextType = {
  openStampModal: (movie: StampMovie) => void;
  openStampNudge: (movie: StampMovie) => void;
};

const StampModalContext = createContext<StampModalContextType | undefined>(undefined);

export function StampProvider({ children }: { children: ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMovie, setModalMovie] = useState<StampMovie | null>(null);

  const [nudgeMovie, setNudgeMovie] = useState<StampMovie | null>(null);

  const openStampModal = useCallback((m: StampMovie) => {
    setNudgeMovie(null);
    setModalMovie(m);
    setModalOpen(true);
  }, []);

  const openStampNudge = useCallback((m: StampMovie) => {
    // Dismiss any existing nudge first, then show new one
    setNudgeMovie(null);
    // small tick to allow re-mount if same movie
    setTimeout(() => setNudgeMovie(m), 50);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setTimeout(() => setModalMovie(null), 300);
  }, []);

  const handleNudgeOpen = useCallback(() => {
    const movie = nudgeMovie;
    setNudgeMovie(null);
    if (movie) {
      setModalMovie(movie);
      setModalOpen(true);
    }
  }, [nudgeMovie]);

  const dismissNudge = useCallback(() => {
    setNudgeMovie(null);
  }, []);

  return (
    <StampModalContext.Provider value={{ openStampModal, openStampNudge }}>
      {children}

      {/* Global stamp modal */}
      {modalMovie && (
        <StampModal isOpen={modalOpen} onClose={closeModal} movie={modalMovie} />
      )}

      {/* 5-sec nudge toast */}
      {nudgeMovie && (
        <StampNudge
          key={nudgeMovie.id}
          movie={nudgeMovie}
          onOpen={handleNudgeOpen}
          onDismiss={dismissNudge}
        />
      )}
    </StampModalContext.Provider>
  );
}

export function useStampModal() {
  const context = useContext(StampModalContext);
  if (context === undefined) {
    throw new Error("useStampModal must be used within a StampProvider");
  }
  return context;
}
