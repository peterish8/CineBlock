"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import AddToBlockModal from "./AddToBlockModal";

type MovieToBlock = {
  id: number;
  title: string;
  posterPath: string;
};

type BlockModalContextType = {
  openBlockModal: (movie: MovieToBlock) => void;
  closeBlockModal: () => void;
};

const BlockModalContext = createContext<BlockModalContextType | undefined>(undefined);

export function BlockModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [movie, setMovie] = useState<MovieToBlock | null>(null);

  const openBlockModal = (m: MovieToBlock) => {
    setMovie(m);
    setIsOpen(true);
  };

  const closeBlockModal = () => {
    setIsOpen(false);
    // Delay clearing movie so the modal stays mounted during its exit animation
    setTimeout(() => setMovie(null), 300);
  };

  return (
    <BlockModalContext.Provider value={{ openBlockModal, closeBlockModal }}>
      {children}
      {/* Global instance of the modal */}
      {movie && (
        <AddToBlockModal 
          isOpen={isOpen} 
          onClose={closeBlockModal} 
          movie={movie} 
        />
      )}
    </BlockModalContext.Provider>
  );
}

export function useBlockModal() {
  const context = useContext(BlockModalContext);
  if (context === undefined) {
    throw new Error("useBlockModal must be used within a BlockModalProvider");
  }
  return context;
}
