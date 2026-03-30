"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useToast } from "@/components/ToastProvider";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function useBlocks() {
  const { pushToast } = useToast();
  const myBlocks = useQuery(api.cineblocks.getUserBlocks);
  const mySavedBlocks = useQuery(api.cineblocks.getSavedBlocks);

  const createBlockMutation = useMutation(api.cineblocks.createBlock);
  const deleteBlockMutation = useMutation(api.cineblocks.deleteBlock);
  const addMovieMutation = useMutation(api.cineblocks.addMovieToBlock);
  const removeMovieMutation = useMutation(api.cineblocks.removeMovieFromBlock);
  const toggleSaveBlockMutation = useMutation(api.cineblocks.toggleSaveBlock);
  const updateBlockMutation = useMutation(api.cineblocks.updateBlock);
  const importPublicBlockMutation = useMutation(api.cineblocks.importPublicBlock);

  const createBlock = async (title: string, description?: string) => {
    try {
      const blockId = await createBlockMutation({ title, description });
      pushToast("success", "CineBlock created");
      return blockId;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to create CineBlock");
      pushToast("error", message);
      throw new Error(message);
    }
  };

  const deleteBlock = async (blockId: Id<"blocks">) => {
    try {
      await deleteBlockMutation({ blockId });
      pushToast("success", "CineBlock deleted");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to delete CineBlock");
      pushToast("error", message);
      throw new Error(message);
    }
  };

  const addMovieToBlock = async (
    blockId: Id<"blocks">,
    movieId: number,
    movieTitle: string,
    posterPath: string
  ) => {
    try {
      await addMovieMutation({ blockId, movieId, movieTitle, posterPath });
      pushToast("success", "Movie added to CineBlock");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to add movie to CineBlock");
      pushToast("error", message);
      throw new Error(message);
    }
  };

  const removeMovieFromBlock = async (blockId: Id<"blocks">, movieId: number) => {
    try {
      await removeMovieMutation({ blockId, movieId });
      pushToast("success", "Movie removed from CineBlock");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to remove movie");
      pushToast("error", message);
      throw new Error(message);
    }
  };

  const toggleSaveBlock = async (blockId: Id<"blocks">) => {
    try {
      const isSaved = await toggleSaveBlockMutation({ blockId });
      pushToast("success", isSaved ? "CineBlock saved" : "CineBlock unsaved");
      return isSaved;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update save status");
      pushToast("error", message);
      throw new Error(message);
    }
  };

  const updateBlock = async (
    blockId: Id<"blocks">,
    fields: { title?: string; description?: string; isPublic?: boolean }
  ) => {
    try {
      await updateBlockMutation({ blockId, ...fields });
      pushToast("success", "CineBlock settings saved");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to save CineBlock settings");
      pushToast("error", message);
      throw new Error(message);
    }
  };

  const importPublicBlock = async (sourceBlockId: Id<"blocks">) => {
    try {
      const importedBlockId = await importPublicBlockMutation({ sourceBlockId });
      pushToast("success", "Playlist imported to your CineBlocks");
      return importedBlockId;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to import playlist");
      pushToast("error", message);
      throw new Error(message);
    }
  };

  return {
    myBlocks,
    mySavedBlocks,
    createBlock,
    deleteBlock,
    addMovieToBlock,
    removeMovieFromBlock,
    toggleSaveBlock,
    updateBlock,
    importPublicBlock,
  };
}
