"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Plus, Sparkles, Undo2 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useMovieLists } from "@/hooks/useMovieLists";
import { useStampModal } from "@/components/StampProvider";
import GlassStampCard, { StampRecord } from "@/components/GlassStampCard";
import StampComposerPanel from "@/components/StampComposerPanel";
import StampReaderModal from "@/components/StampReaderModal";
import { useThemeMode } from "@/hooks/useThemeMode";
import { useToast } from "@/components/ToastProvider";

export default function StampPageClient() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { watched, listsReady } = useMovieLists();
  const { openStampModal } = useStampModal();
  const { pushToast } = useToast();
  const stamps = useQuery(api.stamps.getMyStamps, isAuthenticated ? {} : "skip") as StampRecord[] | undefined;
  const deleteStamp = useMutation(api.stamps.deleteStamp);
  const restoreStamp = useMutation(api.stamps.restoreStamp);
  const setStampVisibility = useMutation(api.stamps.setStampVisibility);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedStamp, setSelectedStamp] = useState<StampRecord | null>(null);
  const [busyStampId, setBusyStampId] = useState<string | null>(null);
  const [undoStamp, setUndoStamp] = useState<StampRecord | null>(null);
  const [undoSeconds, setUndoSeconds] = useState(0);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isGlass = useThemeMode() === "glass";
  const reduceMotion = useReducedMotion();

  const published = useMemo(() => (stamps ?? []).filter((stamp) => !stamp.isDraft), [stamps]);
  const drafts = useMemo(() => (stamps ?? []).filter((stamp) => stamp.isDraft), [stamps]);
  const unstampedWatchedCount = useMemo(() => {
    const stampedIds = new Set((stamps ?? []).map((stamp) => stamp.movieId));
    return watched.filter((movie) => !stampedIds.has(movie.id)).length;
  }, [stamps, watched]);

  const handleDelete = async (stamp: StampRecord) => {
    setBusyStampId(stamp._id);
    try {
      await deleteStamp({ stampId: stamp._id });
      setSelectedStamp(null);
      setUndoStamp(stamp);
      setUndoSeconds(5);
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Could not delete this stamp.");
    } finally {
      setBusyStampId(null);
    }
  };

  useEffect(() => {
    if (!undoStamp) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      setUndoSeconds(Math.max(0, 5 - Math.floor((Date.now() - startedAt) / 1000)));
    }, 250);
    undoTimerRef.current = setTimeout(() => {
      setUndoStamp(null);
      setUndoSeconds(0);
    }, 5000);
    return () => {
      clearInterval(interval);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, [undoStamp]);

  const handleUndo = async () => {
    if (!undoStamp) return;
    const stamp = undoStamp;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoStamp(null);
    setUndoSeconds(0);
    setBusyStampId(stamp._id);
    try {
      await restoreStamp({
        movieId: stamp.movieId,
        mediaType: stamp.mediaType,
        movieTitle: stamp.movieTitle,
        posterPath: stamp.posterPath,
        reviewText: stamp.reviewText,
        isPublic: stamp.isPublic,
        isDraft: stamp.isDraft,
        createdAt: stamp.createdAt,
      });
      pushToast("success", "Stamp restored.");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Could not restore this stamp.");
    } finally {
      setBusyStampId(null);
    }
  };

  const handleToggleVisibility = async (stamp: StampRecord) => {
    setBusyStampId(stamp._id);
    try {
      await setStampVisibility({ stampId: stamp._id, isPublic: !stamp.isPublic });
      setSelectedStamp((current) => current ? { ...current, isPublic: !current.isPublic } : current);
      pushToast("success", stamp.isPublic ? "Feeling is private now." : "Feeling is public now.");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Could not update stamp visibility.");
    } finally {
      setBusyStampId(null);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-[#020817]" />;
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#020817] px-5 pb-32 pt-16 text-white sm:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[30px] p-8 text-center sm:p-14" style={{ background: "rgba(8,20,50,0.72)", border: "1px solid rgba(125,211,252,0.20)", boxShadow: "0 24px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-blue-300/25 bg-blue-400/10 text-blue-200"><Sparkles className="h-7 w-7" /></div>
            <p className="mt-7 text-[10px] font-display font-semibold uppercase tracking-[0.25em] text-orange-200/70">Your cinema notebook</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Stamp what stayed with you.</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400">Sign in to keep the stamps and memories your films leave with you.</p>
            <Link href="/sign-in" className="mt-8 inline-flex items-center gap-2 rounded-full border border-blue-300/35 bg-blue-300/15 px-5 py-3 text-xs font-display font-semibold uppercase tracking-[0.14em] text-blue-100 transition-colors hover:bg-blue-300/25">Sign in to stamp <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen bg-[#01040c] px-4 pb-44 pt-7 text-white sm:px-8 sm:pb-32 sm:pt-14 ${isGlass ? "" : "bg-bg"}`} style={{ backgroundImage: "radial-gradient(circle at 72% 18%, rgba(30,64,175,0.16), transparent 28%), linear-gradient(180deg, #01040c 0%, #020817 100%)" }}>
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" aria-hidden="true">
        <motion.div
          className="absolute left-[8%] top-20 h-72 w-72 rounded-full bg-blue-600/[0.06] blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, 24, 0], y: [0, 18, 0], scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[8%] top-[42%] h-80 w-80 rounded-full bg-blue-900/[0.08] blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, -18, 0], y: [0, -26, 0], scale: [1, 1.05, 1], opacity: [0.65, 0.9, 0.65] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
      </div>

      <LayoutGroup id="published-stamps">
      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.header initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }}>
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3 sm:flex-row sm:gap-4 sm:pb-4">
            <Link href="/" aria-label="Back to CineBlock" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[10px] font-display font-semibold uppercase tracking-[0.16em] text-slate-300 transition-colors hover:border-blue-200/35 hover:bg-white/[0.09] hover:text-white sm:h-auto sm:w-auto sm:gap-2 sm:px-3.5 sm:py-2"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back to CineBlock</span></Link>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:w-auto sm:flex-none sm:gap-3">
              <div className="flex min-w-0 flex-1 items-center justify-start gap-1 whitespace-nowrap text-[10px] font-display font-semibold uppercase tracking-[0.03em] text-slate-500 sm:flex-none sm:gap-2 sm:text-[9px] sm:tracking-[0.12em]" aria-label="Stamp summary">
                <span><strong className="text-blue-100">{published.length}</strong><span> stamps</span></span>
                <span className="text-slate-700">/</span>
                <span><strong className="text-slate-200">{drafts.length}</strong><span> drafts</span></span>
                <span className="text-slate-700">/</span>
                <span><strong className="text-cyan-200">{unstampedWatchedCount}</strong><span className="sm:hidden"> to go</span><span className="hidden sm:inline"> to stamp</span></span>
              </div>
              <motion.button type="button" onClick={() => setComposerOpen(true)} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="group inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-200/30 bg-blue-300/10 px-2.5 py-2.5 text-[9px] font-display font-semibold uppercase tracking-[0.08em] text-blue-100 shadow-[0_0_28px_rgba(37,99,235,0.12)] transition-colors hover:border-cyan-200/55 hover:bg-blue-300/15 sm:gap-2 sm:px-3.5 sm:text-[10px] sm:tracking-[0.14em]">
                <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" /><span className="sm:hidden">Stamp</span><span className="hidden sm:inline">Stamp a film</span><ArrowRight className="hidden h-3.5 w-3.5 text-cyan-200 sm:block" />
              </motion.button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 py-6 sm:py-8">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <motion.div
                className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16"
                animate={reduceMotion ? undefined : { rotate: [0, 2, 0, -2, 0], scale: [1, 1.035, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image src="/stamps/stamped-glass.png" alt="" fill sizes="64px" className="object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.32)]" unoptimized />
              </motion.div>
              <div className="min-w-0">
                <p className="text-[10px] font-display font-semibold uppercase tracking-[0.24em] text-cyan-200/70">Your cinema notebook</p>
                <h1 className="mt-1 truncate font-display text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">What stayed with you.</h1>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500 sm:text-sm">A private place for the feeling a film leaves behind.</p>
              </div>
            </div>
            <Image src="/stamps/draft-glass.png" alt="" width={58} height={58} className="hidden shrink-0 opacity-80 drop-shadow-[0_0_18px_rgba(125,211,252,0.18)] sm:block" unoptimized />
          </div>
        </motion.header>

        {!listsReady || stamps === undefined ? (
          <div className="mt-9 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-[250px] animate-pulse rounded-[24px] border border-white/[0.07] bg-white/[0.04]" />)}</div>
        ) : stamps.length === 0 ? (
          <section className="mt-9 rounded-[24px] border border-dashed border-blue-200/20 bg-blue-400/[0.04] px-5 py-14 text-center sm:mt-12 sm:rounded-[28px] sm:px-10 sm:py-20">
            <div className="relative mx-auto flex h-24 w-32 items-center justify-center">
              <Image src="/stamps/draft-glass.png" alt="" width={72} height={72} className="absolute left-0 opacity-75 drop-shadow-[0_0_20px_rgba(125,211,252,0.16)]" unoptimized />
              <Image src="/stamps/stamped-glass.png" alt="" width={82} height={82} className="absolute right-0 drop-shadow-[0_0_24px_rgba(59,130,246,0.24)]" unoptimized />
            </div>
            <h2 className="mt-6 font-display text-3xl font-semibold tracking-[-0.04em] text-white">Nothing stamped yet.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">Start with a watched film, write what it made you feel, and decide whether the stamp stays private or goes public.</p>
            <button type="button" onClick={() => setComposerOpen(true)} className="mt-7 inline-flex items-center gap-2 rounded-full border border-blue-200/35 bg-blue-300/10 px-5 py-3 text-xs font-display font-semibold uppercase tracking-[0.14em] text-blue-100 hover:bg-blue-300/20"><Plus className="h-4 w-4" /> Write the first one</button>
          </section>
        ) : (
          <>
            {published.length > 0 && <StampSection title="Stamped films" icon="/stamps/stamped-glass.png" stamps={published} onOpen={setSelectedStamp} reduceMotion={Boolean(reduceMotion)} />}
            {drafts.length > 0 && <StampSection title="Still becoming" icon="/stamps/draft-glass.png" stamps={drafts} onOpen={setSelectedStamp} reduceMotion={Boolean(reduceMotion)} />}
          </>
        )}
      </div>

      {composerOpen && <StampComposerPanel stamps={stamps ?? []} onClose={() => setComposerOpen(false)} />}
      <AnimatePresence>
        {selectedStamp && <StampReaderModal key={selectedStamp._id} stamp={selectedStamp} busy={busyStampId === selectedStamp._id} onClose={() => setSelectedStamp(null)} onContinue={(stamp) => { setSelectedStamp(null); openStampModal({ id: stamp.movieId, title: stamp.movieTitle, posterPath: stamp.posterPath }); }} onToggleVisibility={(stamp) => void handleToggleVisibility(stamp)} onDelete={(stamp) => void handleDelete(stamp)} />}
      </AnimatePresence>
      <AnimatePresence>
        {undoStamp && (
          <motion.div role="status" aria-live="polite" className="fixed bottom-24 left-1/2 z-[1250] flex w-[min(92vw,360px)] -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-cyan-200/25 bg-[#061433]/95 px-3.5 py-3 text-white shadow-[0_18px_60px_rgba(0,0,0,0.55),0_0_30px_rgba(34,211,238,0.12)] backdrop-blur-xl sm:bottom-6" initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.96 }}>
            <div className="flex min-w-0 items-center gap-2.5">
              <Undo2 className="h-4 w-4 shrink-0 text-cyan-200" />
              <span className="truncate text-xs font-medium text-slate-200">Stamp deleted</span>
              <span className="shrink-0 text-[10px] font-display uppercase tracking-[0.12em] text-slate-500">{undoSeconds}s</span>
            </div>
            <button type="button" onClick={() => void handleUndo()} className="shrink-0 rounded-full border border-cyan-200/30 bg-cyan-200/10 px-3 py-1.5 text-[10px] font-display font-semibold uppercase tracking-[0.13em] text-cyan-100 transition-colors hover:bg-cyan-200/20">Undo</button>
          </motion.div>
        )}
      </AnimatePresence>
      </LayoutGroup>
    </main>
  );
}

function StampSection({ title, icon, stamps, onOpen, reduceMotion }: { title: string; icon: string; stamps: StampRecord[]; onOpen: (stamp: StampRecord) => void; reduceMotion: boolean }) {
  return (
    <section className="mt-7 sm:mt-12" aria-labelledby={`stamp-section-${title}`}>
      <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5 sm:gap-4">
        <div className="flex items-center gap-2.5"><Image src={icon} alt="" width={30} height={30} className="object-contain drop-shadow-[0_0_12px_rgba(96,165,250,0.18)]" unoptimized /><h2 id={`stamp-section-${title}`} className="font-display text-2xl font-semibold tracking-[-0.04em] text-white">{title}</h2></div>
        <span className="text-[10px] font-display uppercase tracking-[0.18em] text-slate-600">{stamps.length} {stamps.length === 1 ? "stamp" : "stamps"}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stamps.map((stamp, index) => (
          <motion.div key={stamp._id} initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, delay: reduceMotion ? 0 : Math.min(index, 7) * 0.06, ease: "easeOut" }}>
            <GlassStampCard stamp={stamp} onOpen={onOpen} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
