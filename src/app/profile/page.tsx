"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConvexAuth, useConvex } from "convex/react";
import { User, Mail, Calendar, LogOut, Pencil, Check, X, Heart, Bookmark, Eye, ArrowLeft, Palette, Trash2, AtSign, Globe, Stamp, Copy, Link2, Download, Upload } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import StampCard from "@/components/StampCard";
import { useStampModal } from "@/components/StampProvider";
import type { ThemeName } from "@/lib/types";
import { applyThemeToDocument, readStoredTheme, useThemeMode } from "@/hooks/useThemeMode";
import { getNextTheme, getThemeDisplayName } from "@/lib/themeConfig";

export default function ProfilePage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const upsertUser = useMutation(api.users.upsertUser);
  const setUsername = useMutation(api.users.setUsername);
  const setPreferredLanguage = useMutation(api.users.setPreferredLanguage);
  const deleteAccount = useMutation(api.users.deleteAccount);
  const myStamps = useQuery(api.stamps.getMyStamps);
  const deleteStamp = useMutation(api.stamps.deleteStamp);
  const setStampVisibility = useMutation(api.stamps.setStampVisibility);
  const importUserData = useMutation(api.dataExport.importUserData);
  const convex = useConvex();
  const { openStampModal } = useStampModal();
  const { signOut } = useAuthActions();
  const router = useRouter();

  const theme = useThemeMode();
  const isGlass = theme === "glass";

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameValue, setUsernameValue] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [currentTheme, setCurrentTheme] = useState<ThemeName>("default");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [copiedProfileLink, setCopiedProfileLink] = useState(false);
  const generateCliToken = useMutation(api.users.generateCliToken);
  const [cliTokenVisible, setCliTokenVisible] = useState(false);
  const [copiedCliToken, setCopiedCliToken] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);

  // Import/Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({ watched: true, liked: true, watchlist: true, blocks: true, stamps: true });
  const [isExporting, setIsExporting] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importDataPreview, setImportDataPreview] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");

  useEffect(() => {
    setCurrentTheme(readStoredTheme());
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  const toggleTheme = () => {
    setCurrentTheme((prev) => {
      const next = getNextTheme(prev);
      applyThemeToDocument(next);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isGlass ? "" : "bg-bg"}`}
        style={isGlass ? { background: "#020817" } : undefined}>
        <div className={isGlass
          ? "w-10 h-10 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin"
          : "w-10 h-10 border-4 border-brutal-yellow border-t-transparent animate-spin"} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const displayName = user?.name || "CineBlock User";
  const likedCount = user?.likedCount ?? 0;
  const watchlistCount = user?.watchlistCount ?? 0;
  const watchedCount = user?.watchedCount ?? 0;
  const initials = displayName.slice(0, 2).toUpperCase();
  const memberSince = user?._creationTime
    ? new Date(user._creationTime).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently joined";

  const startEdit = () => {
    setNameValue(user?.name || "");
    setEditingName(true);
  };

  const saveName = async () => {
    if (!nameValue.trim()) return;
    setSaving(true);
    try {
      await upsertUser({ name: nameValue.trim(), email: user?.email || "" });
      setEditingName(false);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingName(false);
    setNameValue("");
  };

  const startEditUsername = () => {
    setUsernameValue(user?.username || "");
    setUsernameError("");
    setEditingUsername(true);
  };

  const saveUsername = async () => {
    if (!usernameValue.trim()) return;
    setSavingUsername(true);
    setUsernameError("");
    try {
      await setUsername({ username: usernameValue.trim() });
      setEditingUsername(false);
    } catch (err: any) {
      setUsernameError(err.data ?? err.message?.replace("Uncaught Error: ", "") ?? "Failed to save username.");
    } finally {
      setSavingUsername(false);
    }
  };

  const cancelEditUsername = () => {
    setEditingUsername(false);
    setUsernameValue("");
    setUsernameError("");
  };

  const handleGenerateToken = async () => {
    setGeneratingToken(true);
    try {
      await generateCliToken();
      setCliTokenVisible(true);
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    setDeleting(true);
    try {
      await deleteAccount();
      await signOut();
      router.push("/");
    } catch {
      setDeleteError("Something went wrong. Please try again.");
      setDeleting(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await convex.query(api.dataExport.exportUserData, { options: exportOptions });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `cineblock-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowExportModal(false);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      alert("Export failed: " + msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");
    setImportDataPreview(null);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        if (!json.version) throw new Error("Invalid CineBlock backup file structure.");
        setImportDataPreview(json);
        setShowImportModal(true);
      } catch (err) {
        setImportError("Error parsing backup file. Make sure it's a valid JSON backup exported from CineBlock.");
        setShowImportModal(true);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImportData = async () => {
    if (!importDataPreview) return;
    setIsImporting(true);
    setImportError("");
    try {
      const stats = await importUserData({ payload: importDataPreview });
      alert(`Import completed successfully!\n\nAdded:\n${stats.watchedAdded} Watched Movies\n${stats.likedAdded} Liked Movies\n${stats.watchlistAdded} Watchlist Movies\n${stats.blocksAdded} CineBlocks\n${stats.stampsAdded} Stamps`);
      setShowImportModal(false);
      setImportDataPreview(null);
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || "Failed to parse and import data payload.");
    } finally {
      setIsImporting(false);
    }
  };

  // ── Glass style helpers ──────────────────────────────────────────────────────
  const glassCard = {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px) saturate(160%)",
    WebkitBackdropFilter: "blur(20px) saturate(160%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
  };

  const glassRow = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  const glassInput = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff",
    outline: "none",
  };

  const glassBtn = (color: "blue" | "red" | "green" | "orange" | "cyan" | "default" = "default") => {
    const colorMap = {
      blue:    { bg: "rgba(96,165,250,0.15)",  border: "rgba(96,165,250,0.40)",  shadow: "rgba(96,165,250,0.20)"  },
      red:     { bg: "rgba(239,68,68,0.18)",   border: "rgba(239,68,68,0.45)",   shadow: "rgba(239,68,68,0.20)"  },
      green:   { bg: "rgba(52,211,153,0.15)",  border: "rgba(52,211,153,0.40)",  shadow: "rgba(52,211,153,0.20)" },
      orange:  { bg: "rgba(249,115,22,0.18)",  border: "rgba(249,115,22,0.45)",  shadow: "rgba(249,115,22,0.20)" },
      cyan:    { bg: "rgba(34,211,238,0.15)",  border: "rgba(34,211,238,0.40)",  shadow: "rgba(34,211,238,0.20)" },
      default: { bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.18)", shadow: "rgba(0,0,0,0.2)"       },
    };
    const c = colorMap[color];
    return {
      background: c.bg,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${c.border}`,
      boxShadow: `0 4px 16px ${c.shadow}, inset 0 1px 0 rgba(255,255,255,0.10)`,
    };
  };

  const glassChip = (color: "blue" | "red" | "green" | "orange" | "cyan" | "default" = "default") => {
    const colorMap = {
      blue:    { bg: "rgba(96,165,250,0.15)",  border: "rgba(96,165,250,0.40)",  text: "#93C5FD" },
      red:     { bg: "rgba(239,68,68,0.18)",   border: "rgba(239,68,68,0.45)",   text: "#FCA5A5" },
      green:   { bg: "rgba(52,211,153,0.15)",  border: "rgba(52,211,153,0.40)",  text: "#6EE7B7" },
      orange:  { bg: "rgba(249,115,22,0.18)",  border: "rgba(249,115,22,0.45)",  text: "#FB923C" },
      cyan:    { bg: "rgba(34,211,238,0.15)",  border: "rgba(34,211,238,0.40)",  text: "#67E8F9" },
      default: { bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.18)", text: "#94A3B8" },
    };
    const c = colorMap[color];
    return { background: c.bg, border: `1px solid ${c.border}`, color: c.text };
  };
  // ──────────────────────────────────────────────────────────────────────────────

  return (
    <div
      className={`min-h-screen pb-16 lg:pb-0 ${isGlass ? "relative overflow-x-hidden" : "bg-bg"}`}
      style={isGlass ? { background: "#020817" } : undefined}
    >
      {/* Glass: ambient depth orbs */}
      {isGlass && (
        <>
          <div className="pointer-events-none fixed left-[-15%] top-[-10%] aspect-square w-[65vw] rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(96,165,250,0.18) 0%, transparent 70%)", filter: "blur(80px)", zIndex: 0 }} />
          <div className="pointer-events-none fixed bottom-[-15%] right-[-10%] aspect-square w-[70vw] rounded-full opacity-25" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.14) 0%, transparent 70%)", filter: "blur(100px)", zIndex: 0 }} />
        </>
      )}

      {/* Top bar */}
      <div
        className={`sticky top-0 z-50 px-4 sm:px-8 py-5 flex items-center justify-between ${isGlass ? "backdrop-blur" : "bg-bg border-b-3 border-brutal-border"}`}
        style={isGlass ? {
          background: "rgba(2,8,23,0.80)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          zIndex: 50,
        } : undefined}
      >
        <Link
          href="/"
          className={isGlass
            ? "flex items-center justify-center w-9 h-9 rounded-xl text-slate-300 hover:text-white transition-all duration-200 hover:scale-105"
            : "brutal-btn p-2.5"}
          style={isGlass ? glassBtn("default") : undefined}
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={isGlass ? 2 : 3} />
        </Link>

        <span className={`font-display font-black text-lg tracking-tight ${isGlass ? "text-white" : "text-brutal-white"}`}>
          CINE<span style={isGlass ? { color: "#60A5FA" } : undefined} className={isGlass ? "" : "text-brutal-yellow"}>BLOCK</span>
        </span>

        <button
          onClick={() => { void signOut(); router.push("/"); }}
          className={isGlass
            ? "flex items-center gap-2 px-3 py-1.5 rounded-xl text-red-300 text-xs font-semibold transition-all duration-200 hover:text-red-200"
            : "brutal-btn px-3 py-1.5 flex items-center gap-2 text-xs font-mono font-bold bg-brutal-red text-white border-brutal-red hover:opacity-80"}
          style={isGlass ? glassBtn("red") : undefined}
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span className="hidden sm:inline">{isGlass ? "Sign Out" : "SIGN OUT"}</span>
        </button>
      </div>

      <div className={`max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-6 ${isGlass ? "" : "animate-fade-in"}`} style={isGlass ? { position: "relative", zIndex: 1 } : undefined}>

        {/* ── Hero card ─────────────────────────────────────── */}
        <div
          className={isGlass ? "overflow-hidden rounded-2xl" : "brutal-card p-0 overflow-hidden"}
          style={isGlass ? glassCard : undefined}
        >
          {/* Accent strip — brutalist yellow / glass blue gradient */}
          {isGlass ? (
            <div className="h-px w-full" style={{ background: "linear-gradient(90deg, rgba(96,165,250,0.8), rgba(249,115,22,0.6), rgba(96,165,250,0.3))" }} />
          ) : (
            <div className="h-3 w-full bg-brutal-yellow" />
          )}

          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div
              className={isGlass
                ? "w-24 h-24 shrink-0 rounded-2xl overflow-hidden flex items-center justify-center"
                : "w-24 h-24 shrink-0 bg-brutal-yellow border-4 border-brutal-border shadow-brutal flex items-center justify-center overflow-hidden"}
              style={isGlass ? {
                background: "rgba(96,165,250,0.15)",
                border: "2px solid rgba(96,165,250,0.35)",
                boxShadow: "0 0 24px rgba(96,165,250,0.20)",
              } : undefined}
            >
              {user?.image ? (
                <Image src={user.image} alt={displayName} width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                <span className={isGlass ? "font-display font-black text-3xl text-blue-300" : "font-display font-black text-3xl text-black"}>
                  {initials}
                </span>
              )}
            </div>

            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                {editingName ? (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      autoFocus
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") void saveName(); if (e.key === "Escape") cancelEdit(); }}
                      className={isGlass
                        ? "px-3 py-1.5 text-xl font-black font-display rounded-xl flex-1 min-w-0 bg-transparent text-white placeholder:text-slate-500 transition-all"
                        : "brutal-input px-3 py-1.5 text-xl font-black font-display uppercase bg-bg text-brutal-white flex-1 min-w-0 focus:border-brutal-yellow focus:shadow-brutal-accent outline-none"}
                      style={isGlass ? { ...glassInput, borderRadius: "12px", padding: "6px 12px" } : undefined}
                      maxLength={40}
                    />
                    <button
                      onClick={() => void saveName()}
                      disabled={saving || !nameValue.trim()}
                      className={isGlass
                        ? "flex items-center justify-center w-9 h-9 rounded-xl text-emerald-300 disabled:opacity-40 shrink-0 transition-all"
                        : "brutal-btn p-2 !bg-brutal-lime !text-black !border-brutal-lime disabled:opacity-40 shrink-0"}
                      style={isGlass ? glassBtn("green") : undefined}
                    >
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className={isGlass
                        ? "flex items-center justify-center w-9 h-9 rounded-xl text-red-300 shrink-0 transition-all"
                        : "brutal-btn p-2 !bg-brutal-red !text-white !border-brutal-red shrink-0"}
                      style={isGlass ? glassBtn("red") : undefined}
                    >
                      <X className="w-4 h-4" strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className={`font-display font-black text-2xl sm:text-3xl uppercase tracking-tight truncate ${isGlass ? "text-white" : "text-brutal-white"}`}>
                      {displayName}
                    </h1>
                    <button
                      onClick={startEdit}
                      className={isGlass
                        ? "flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-blue-300 transition-all"
                        : "brutal-btn p-1.5 hover:!border-brutal-yellow hover:!text-brutal-yellow"}
                      style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" } : undefined}
                      title="Edit name"
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </>
                )}
              </div>
              <p className={`font-mono text-sm mt-1 truncate ${isGlass ? "text-slate-400" : "text-brutal-muted"}`}>{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <Calendar className={`w-3.5 h-3.5 ${isGlass ? "text-slate-500" : "text-brutal-dim"}`} strokeWidth={2} />
                <span className={`text-xs font-mono uppercase ${isGlass ? "text-slate-500" : "text-brutal-dim"}`}>Member since {memberSince}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ─────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: "LIKED",     value: likedCount,     icon: Heart,    brutalColor: "red",  brutalBg: "bg-brutal-red",  brutalAccent: "border-brutal-red",  glassColor: "#F87171", glassBorder: "rgba(239,68,68,0.35)",   glassText: "text-rose-400"    },
            { label: "WATCHLIST", value: watchlistCount, icon: Bookmark, brutalColor: "pink", brutalBg: "bg-brutal-pink", brutalAccent: "border-brutal-pink", glassColor: "#60A5FA", glassBorder: "rgba(96,165,250,0.35)",  glassText: "text-blue-400"    },
            { label: "WATCHED",   value: watchedCount,   icon: Eye,      brutalColor: "lime", brutalBg: "bg-brutal-lime", brutalAccent: "border-brutal-lime", glassColor: "#34D399", glassBorder: "rgba(52,211,153,0.35)",  glassText: "text-emerald-400" },
          ].map(({ label, value, icon: Icon, brutalColor, brutalBg, brutalAccent, glassColor, glassBorder, glassText }) => (
            isGlass ? (
              <div key={label} className="overflow-hidden rounded-2xl" style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: `1px solid ${glassBorder}`,
                boxShadow: `0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)`,
              }}>
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${glassBorder}`, background: "rgba(255,255,255,0.03)" }}>
                  <Icon className="w-4 h-4" style={{ color: glassColor }} strokeWidth={2} />
                  <span className="font-display font-semibold text-[10px] tracking-widest uppercase" style={{ color: glassColor }}>{label}</span>
                </div>
                <div className="px-4 py-4 text-center">
                  <span className={`font-display font-black text-2xl sm:text-4xl ${glassText}`}>{value}</span>
                  <p className="text-slate-500 text-[10px] font-mono mt-1">{value === 1 ? "movie" : "movies"}</p>
                </div>
              </div>
            ) : (
              <div key={label} className={`brutal-card p-0 overflow-hidden border-2 ${brutalAccent}`}>
                <div className={`${brutalBg} px-4 py-2 flex items-center gap-2`}>
                  <Icon className="w-4 h-4 text-black fill-current" strokeWidth={2} />
                  <span className="font-mono font-black text-[10px] text-black tracking-widest">{label}</span>
                </div>
                <div className="px-4 py-4 text-center">
                  <span className={`font-display font-black text-2xl sm:text-4xl text-brutal-${brutalColor}`}>{value}</span>
                  <p className="text-brutal-dim text-[10px] font-mono mt-1">{value === 1 ? "movie" : "movies"}</p>
                </div>
              </div>
            )
          ))}
        </div>

        {/* ── Account details ───────────────────────────────── */}
        <div
          className={isGlass ? "rounded-2xl p-6 space-y-4" : "brutal-card p-6 space-y-4"}
          style={isGlass ? glassCard : undefined}
        >
          <h2 className={isGlass
            ? "text-[10px] font-display font-semibold text-slate-400 uppercase tracking-[0.2em]"
            : "text-[10px] font-mono font-black text-brutal-dim uppercase tracking-[0.2em]"}>
            Account Details
          </h2>

          <div className="space-y-3">
            {/* Name row */}
            <div
              className={isGlass ? "flex items-center justify-between p-3 rounded-xl" : "flex items-center justify-between p-3 bg-surface-2 border-2 border-brutal-border"}
              style={isGlass ? glassRow : undefined}
            >
              <div className="flex items-center gap-3">
                <User className={`w-4 h-4 shrink-0 ${isGlass ? "text-blue-400" : "text-brutal-yellow"}`} strokeWidth={2.5} />
                <div>
                  <p className={`text-[9px] font-mono font-bold uppercase tracking-widest ${isGlass ? "text-slate-500" : "text-brutal-dim"}`}>Display Name</p>
                  <p className={`text-sm font-bold ${isGlass ? "text-white" : "text-brutal-white"}`}>{displayName}</p>
                </div>
              </div>
              {!editingName && (
                <button
                  onClick={startEdit}
                  className={isGlass
                    ? "text-[9px] font-display font-semibold flex items-center gap-1 px-2.5 py-1 rounded-full transition-all"
                    : "brutal-chip text-brutal-yellow border-brutal-yellow hover:bg-brutal-yellow hover:text-black transition-colors text-[9px] flex items-center gap-1"}
                  style={isGlass ? glassChip("blue") : undefined}
                >
                  <Pencil className="w-2.5 h-2.5" />
                  EDIT
                </button>
              )}
            </div>

            {/* Username row */}
            <div
              className={isGlass ? "flex items-center justify-between p-3 rounded-xl" : "flex items-center justify-between p-3 bg-surface-2 border-2 border-brutal-border"}
              style={isGlass ? glassRow : undefined}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <AtSign className={`w-4 h-4 shrink-0 ${isGlass ? "text-emerald-400" : "text-brutal-lime"}`} strokeWidth={2.5} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[9px] font-mono font-bold uppercase tracking-widest ${isGlass ? "text-slate-500" : "text-brutal-dim"}`}>Username</p>
                  {editingUsername ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`font-mono text-sm ${isGlass ? "text-slate-400" : "text-brutal-dim"}`}>@</span>
                      <input
                        autoFocus
                        value={usernameValue}
                        onChange={(e) => { setUsernameValue(e.target.value); setUsernameError(""); }}
                        onKeyDown={(e) => { if (e.key === "Enter") void saveUsername(); if (e.key === "Escape") cancelEditUsername(); }}
                        className={isGlass
                          ? "px-2 py-1 text-sm font-bold flex-1 min-w-0 rounded-lg bg-transparent text-white"
                          : "brutal-input px-2 py-1 text-sm font-bold bg-bg text-brutal-white flex-1 min-w-0 focus:border-brutal-lime outline-none"}
                        style={isGlass ? { ...glassInput, borderRadius: "8px", padding: "4px 8px" } : undefined}
                        maxLength={20}
                        placeholder="your_username"
                      />
                      <button onClick={() => void saveUsername()} disabled={savingUsername || !usernameValue.trim()}
                        className={isGlass ? "flex items-center justify-center w-8 h-8 rounded-lg text-emerald-300 disabled:opacity-40 shrink-0" : "brutal-btn p-1.5 !bg-brutal-lime !text-black !border-brutal-lime disabled:opacity-40 shrink-0"}
                        style={isGlass ? glassBtn("green") : undefined}>
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      </button>
                      <button onClick={cancelEditUsername}
                        className={isGlass ? "flex items-center justify-center w-8 h-8 rounded-lg text-red-300 shrink-0" : "brutal-btn p-1.5 !bg-brutal-red !text-white !border-brutal-red shrink-0"}
                        style={isGlass ? glassBtn("red") : undefined}>
                        <X className="w-3.5 h-3.5" strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <p className={`text-sm font-bold ${isGlass ? "text-white" : "text-brutal-white"}`}>
                      {user?.username ? `@${user.username}` : <span className={isGlass ? "text-slate-500 italic" : "text-brutal-dim italic"}>Not set</span>}
                    </p>
                  )}
                  {usernameError && <p className={`text-[10px] font-mono mt-1 ${isGlass ? "text-red-400" : "text-brutal-red"}`}>{usernameError}</p>}
                </div>
              </div>
              {!editingUsername && (
                <button onClick={startEditUsername}
                  className={isGlass
                    ? "text-[9px] font-display font-semibold flex items-center gap-1 px-2.5 py-1 rounded-full transition-all shrink-0"
                    : "brutal-chip text-brutal-lime border-brutal-lime hover:bg-brutal-lime hover:text-black transition-colors text-[9px] flex items-center gap-1 shrink-0"}
                  style={isGlass ? glassChip("green") : undefined}>
                  <Pencil className="w-2.5 h-2.5" />
                  {user?.username ? "EDIT" : "SET"}
                </button>
              )}
            </div>

            {/* Profile link row */}
            {user?.username && (
              <div
                className={isGlass ? "flex items-center justify-between p-3 rounded-xl" : "flex items-center justify-between p-3 bg-surface-2 border-2 border-brutal-border"}
                style={isGlass ? glassRow : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Link2 className={`w-4 h-4 shrink-0 ${isGlass ? "text-violet-400" : "text-brutal-violet"}`} strokeWidth={2.5} />
                  <div className="min-w-0">
                    <p className={`text-[9px] font-mono font-bold uppercase tracking-widest ${isGlass ? "text-slate-500" : "text-brutal-dim"}`}>Your Public Profile</p>
                    <p className={`text-sm font-bold truncate ${isGlass ? "text-white" : "text-brutal-white"}`}>moviex.app/u/{user.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(`${window.location.origin}/u/${user.username}`).then(() => {
                      setCopiedProfileLink(true);
                      setTimeout(() => setCopiedProfileLink(false), 2000);
                    });
                  }}
                  className={isGlass
                    ? "text-[9px] font-display font-semibold flex items-center gap-1 px-2.5 py-1 rounded-full transition-all shrink-0"
                    : "brutal-chip text-brutal-violet border-brutal-violet hover:bg-brutal-violet hover:text-black transition-colors text-[9px] flex items-center gap-1 shrink-0"}
                  style={isGlass ? { ...glassChip("default"), color: "#C4B5FD" } : undefined}
                >
                  {copiedProfileLink ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                  {copiedProfileLink ? "COPIED!" : "COPY"}
                </button>
              </div>
            )}

            {/* Email row */}
            <div
              className={isGlass ? "flex items-center gap-3 p-3 rounded-xl" : "flex items-center gap-3 p-3 bg-surface-2 border-2 border-brutal-border"}
              style={isGlass ? glassRow : undefined}
            >
              <Mail className={`w-4 h-4 shrink-0 ${isGlass ? "text-cyan-400" : "text-brutal-cyan"}`} strokeWidth={2.5} />
              <div className="min-w-0">
                <p className={`text-[9px] font-mono font-bold uppercase tracking-widest ${isGlass ? "text-slate-500" : "text-brutal-dim"}`}>Email</p>
                <p className={`text-sm font-bold truncate ${isGlass ? "text-white" : "text-brutal-white"}`}>{user?.email || "Not provided"}</p>
              </div>
            </div>

            {/* Member since row */}
            <div
              className={isGlass ? "flex items-center gap-3 p-3 rounded-xl" : "flex items-center gap-3 p-3 bg-surface-2 border-2 border-brutal-border"}
              style={isGlass ? glassRow : undefined}
            >
              <Calendar className={`w-4 h-4 shrink-0 ${isGlass ? "text-pink-400" : "text-brutal-pink"}`} strokeWidth={2.5} />
              <div>
                <p className={`text-[9px] font-mono font-bold uppercase tracking-widest ${isGlass ? "text-slate-500" : "text-brutal-dim"}`}>Member Since</p>
                <p className={`text-sm font-bold ${isGlass ? "text-white" : "text-brutal-white"}`}>{memberSince}</p>
              </div>
            </div>

            {/* Theme row */}
            <div
              className={isGlass ? "flex items-center justify-between p-3 rounded-xl" : "flex items-center justify-between p-3 bg-surface-2 border-2 border-brutal-border"}
              style={isGlass ? glassRow : undefined}
            >
              <div className="flex items-center gap-3">
                <Palette className={`w-4 h-4 shrink-0 ${isGlass ? "text-violet-400" : "text-brutal-violet"}`} strokeWidth={2.5} />
                <div>
                  <p className={`text-[9px] font-mono font-bold uppercase tracking-widest ${isGlass ? "text-slate-500" : "text-brutal-dim"}`}>Theme</p>
                  <p className={`text-sm font-bold ${isGlass ? "text-white" : "text-brutal-white"}`}>{getThemeDisplayName(currentTheme)}</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`text-[9px] flex items-center gap-1 transition-all px-2.5 py-1 rounded-full ${isGlass
                  ? "font-display font-semibold"
                  : `brutal-chip ${
                    currentTheme === "netflix"
                      ? "bg-[#E50914] text-white border-[#E50914] hover:bg-brutal-yellow hover:text-black hover:border-brutal-yellow"
                      : currentTheme === "glass"
                      ? "bg-blue-500/20 text-blue-300 border-blue-400/50 hover:bg-blue-500/30 hover:border-blue-400"
                      : "text-brutal-violet border-brutal-violet hover:bg-brutal-violet hover:text-black"
                  }`}`}
                style={isGlass ? glassChip("default") : undefined}
              >
                <Palette className="w-2.5 h-2.5" />
                {getNextTheme(currentTheme) === "glass" ? "GLASS" : getNextTheme(currentTheme) === "netflix" ? "NETFLIX" : "RESET"}
              </button>
            </div>

            {/* Preferred Languages */}
            <div
              className={isGlass ? "flex flex-col gap-3 p-3 rounded-xl" : "flex flex-col gap-3 p-3 bg-surface-2 border-2 border-brutal-border"}
              style={isGlass ? glassRow : undefined}
            >
              <div className="flex items-center gap-3">
                <Globe className={`w-4 h-4 shrink-0 ${isGlass ? "text-cyan-400" : "text-brutal-cyan"}`} strokeWidth={2.5} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[9px] font-mono font-bold uppercase tracking-widest ${isGlass ? "text-slate-500" : "text-brutal-dim"}`}>Preferred Languages (Max 5)</p>
                  <p className={`text-[10px] font-mono mt-0.5 ${isGlass ? "text-slate-500" : "text-brutal-dim"}`}>Home page feeds will be curated for your selected languages.</p>
                </div>
              </div>

              <div className={`flex flex-wrap gap-2 pt-2 ${isGlass ? "" : "border-t border-brutal-border/50"}`} style={isGlass ? { borderTop: "1px solid rgba(255,255,255,0.08)" } : undefined}>
                <button
                  onClick={() => void setPreferredLanguage({ language: "" })}
                  className={isGlass
                    ? `text-[10px] uppercase px-2.5 py-1 rounded-full font-display font-semibold transition-all ${(user?.preferredLanguage || "") === "" ? "" : "hover:border-cyan-400/50"}`
                    : `brutal-chip text-[10px] uppercase transition-colors ${(user?.preferredLanguage || "") === "" ? "bg-brutal-cyan text-black border-brutal-cyan" : "text-brutal-dim border-brutal-border hover:bg-surface"}`}
                  style={isGlass ? ((user?.preferredLanguage || "") === ""
                    ? { background: "rgba(34,211,238,0.20)", border: "1px solid rgba(34,211,238,0.50)", color: "#67E8F9" }
                    : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#64748B" }
                  ) : undefined}
                >
                  ALL LANGUAGES
                </button>
                {[
                  { value: "en", label: "English" },
                  { value: "hi", label: "Hindi" },
                  { value: "ta", label: "Tamil" },
                  { value: "te", label: "Telugu" },
                  { value: "ml", label: "Malayalam" },
                  { value: "kn", label: "Kannada" },
                  { value: "ko", label: "Korean" },
                  { value: "ja", label: "Japanese" },
                  { value: "zh", label: "Chinese" },
                  { value: "fr", label: "French" },
                  { value: "es", label: "Spanish" },
                  { value: "de", label: "German" },
                  { value: "it", label: "Italian" },
                  { value: "pt", label: "Portuguese" },
                  { value: "ru", label: "Russian" },
                  { value: "ar", label: "Arabic" },
                  { value: "tr", label: "Turkish" },
                  { value: "th", label: "Thai" },
                ].map((lang) => {
                  const currentLangs = (user?.preferredLanguage || "").split(',').filter(Boolean);
                  const isSelected = currentLangs.includes(lang.value);
                  const isMaxed = currentLangs.length >= 5 && !isSelected;

                  return (
                    <button
                      key={lang.value}
                      onClick={() => {
                        let newLangs = [...currentLangs];
                        if (isSelected) {
                          newLangs = newLangs.filter(l => l !== lang.value);
                        } else {
                          if (newLangs.length >= 5) return;
                          newLangs.push(lang.value);
                        }
                        void setPreferredLanguage({ language: newLangs.join(",") });
                      }}
                      className={isGlass
                        ? `text-[10px] uppercase px-2.5 py-1 rounded-full font-display font-semibold transition-all ${isMaxed ? "opacity-30 cursor-not-allowed" : ""}`
                        : `brutal-chip text-[10px] uppercase transition-colors ${isSelected ? "bg-brutal-cyan text-black border-brutal-cyan" : "text-brutal-white border-brutal-border " + (isMaxed ? "opacity-30 cursor-not-allowed" : "hover:border-brutal-cyan hover:text-brutal-cyan")}`}
                      style={isGlass ? (isSelected
                        ? { background: "rgba(34,211,238,0.20)", border: "1px solid rgba(34,211,238,0.50)", color: "#67E8F9" }
                        : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#64748B" }
                      ) : undefined}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick links ───────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: "/liked",      label: isGlass ? "My Liked"      : "MY LIKED",      glassColor: "rgba(239,68,68,0.18)",   glassBorder: "rgba(239,68,68,0.35)",   glassText: "#F87171",  brutalColor: "[@media(hover:hover)]:hover:!bg-brutal-red [@media(hover:hover)]:hover:!border-brutal-red [@media(hover:hover)]:hover:!text-black"   },
            { href: "/watchlist",  label: isGlass ? "My Watchlist"  : "MY WATCHLIST",  glassColor: "rgba(96,165,250,0.15)",  glassBorder: "rgba(96,165,250,0.35)",  glassText: "#93C5FD",  brutalColor: "[@media(hover:hover)]:hover:!bg-brutal-pink [@media(hover:hover)]:hover:!border-brutal-pink [@media(hover:hover)]:hover:!text-black" },
            { href: "/watched",    label: isGlass ? "My Watched"    : "MY WATCHED",    glassColor: "rgba(52,211,153,0.15)",  glassBorder: "rgba(52,211,153,0.35)",  glassText: "#6EE7B7",  brutalColor: "[@media(hover:hover)]:hover:!bg-brutal-lime [@media(hover:hover)]:hover:!border-brutal-lime [@media(hover:hover)]:hover:!text-black" },
          ].map(({ href, label, glassColor, glassBorder, glassText, brutalColor }) => (
            <Link
              key={href}
              href={href}
              className={isGlass
                ? "py-3 text-xs font-display font-semibold tracking-wider text-center block rounded-xl transition-all duration-200 hover:scale-[1.02]"
                : `brutal-btn py-3 text-xs font-mono font-black tracking-widest text-center block ${brutalColor}`}
              style={isGlass ? {
                background: glassColor,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: `1px solid ${glassBorder}`,
                color: glassText,
                boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.10)",
              } : undefined}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* ── Stamps section ────────────────────────────────── */}
        <div
          className={isGlass ? "rounded-2xl p-6 space-y-4" : "brutal-card p-6 space-y-4"}
          style={isGlass ? glassCard : undefined}
        >
          <div className="flex items-center gap-3">
            <Stamp className={`w-4 h-4 ${isGlass ? "text-amber-400" : "text-brutal-yellow"}`} strokeWidth={2.5} />
            <h2 className={`flex-1 ${isGlass ? "text-[10px] font-display font-semibold text-slate-400 uppercase tracking-[0.2em]" : "text-[10px] font-mono font-black text-brutal-dim uppercase tracking-[0.2em]"}`}>Stamps</h2>
            {myStamps && myStamps.length > 0 && (
              <span
                className={isGlass ? "text-[10px] font-display font-semibold px-2.5 py-0.5 rounded-full" : "brutal-chip text-brutal-yellow border-brutal-yellow text-[10px]"}
                style={isGlass ? { background: "rgba(251,191,36,0.18)", border: "1px solid rgba(251,191,36,0.40)", color: "#FCD34D" } : undefined}
              >
                {myStamps.length}
              </span>
            )}
          </div>

          {myStamps === undefined ? (
            <div className={`py-4 text-center font-mono text-xs uppercase ${isGlass ? "text-slate-500" : "text-brutal-dim"}`}>Loading stamps...</div>
          ) : myStamps.length === 0 ? (
            <div
              className={`py-6 text-center font-mono text-xs uppercase ${isGlass ? "text-slate-500 rounded-xl" : "border-2 border-dashed border-brutal-border text-brutal-dim"}`}
              style={isGlass ? { border: "1px dashed rgba(255,255,255,0.15)" } : undefined}
            >
              No stamps yet. Mark a film as watched to write your first stamp.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myStamps.map((stamp) => (
                <StampCard
                  key={stamp._id}
                  stamp={stamp}
                  isOwner={true}
                  onDelete={(stampId) => void deleteStamp({ stampId })}
                  onToggleVisibility={(stampId, isPublic) => void setStampVisibility({ stampId, isPublic })}
                  onContinue={(s) => openStampModal({ id: s.movieId, title: s.movieTitle, posterPath: s.posterPath })}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── CineBlock Terminal ────────────────────────────── */}
        {(() => {
          const todayStart = new Date();
          todayStart.setUTCHours(0, 0, 0, 0);
          const todaySearches = (user?.cliSearchesResetAt ?? 0) >= todayStart.getTime()
            ? (user?.cliSearchesUsed ?? 0)
            : 0;
          const remaining = Math.max(0, 15 - todaySearches);

          return (
            <div
              className={isGlass ? "rounded-2xl p-6 space-y-4" : "brutal-card p-6 space-y-4 border-2 border-brutal-yellow"}
              style={isGlass ? {
                ...glassCard,
                border: "1px solid rgba(96,165,250,0.30)",
                boxShadow: "0 4px 32px rgba(0,0,0,0.4), 0 0 40px rgba(96,165,250,0.08), inset 0 1px 0 rgba(255,255,255,0.08)",
              } : undefined}
            >
              <div className="flex items-center gap-3">
                <span className={`text-lg ${isGlass ? "" : "text-brutal-yellow"}`} style={isGlass ? { color: "#60A5FA" } : undefined}>⌨</span>
                <h2 className={`flex-1 ${isGlass ? "text-[10px] font-display font-semibold text-slate-400 uppercase tracking-[0.2em]" : "text-[10px] font-mono font-black text-brutal-dim uppercase tracking-[0.2em]"}`}>CineBlock Terminal</h2>
                <span
                  className={isGlass
                    ? "text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full"
                    : `brutal-chip text-[10px] font-mono font-black ${remaining > 0 ? "text-brutal-lime border-brutal-lime" : "text-brutal-red border-brutal-red"}`}
                  style={isGlass ? (remaining > 0
                    ? { background: "rgba(52,211,153,0.18)", border: "1px solid rgba(52,211,153,0.40)", color: "#6EE7B7" }
                    : { background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.40)", color: "#FCA5A5" }
                  ) : undefined}
                >
                  {todaySearches}/15 TODAY
                </span>
              </div>

              <p className={`text-[11px] font-mono ${isGlass ? "text-slate-400" : "text-brutal-muted"}`}>
                Use this token to search movies from your terminal. You get{" "}
                <span className={isGlass ? "text-blue-300 font-bold" : "text-brutal-yellow font-bold"}>15 searches per day</span>. Token resets at midnight UTC.
              </p>

              <div
                className={isGlass ? "p-3 rounded-xl font-mono text-[10px] space-y-1" : "p-3 bg-black/40 border border-brutal-border font-mono text-[10px] text-brutal-dim space-y-1"}
                style={isGlass ? { background: "rgba(0,0,0,0.40)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" } : undefined}
              >
                <p className={isGlass ? "text-slate-400" : "text-brutal-muted"}>$ npx cineblock</p>
                <p className={isGlass ? "text-slate-600" : "text-brutal-dim"}>or set env var manually:</p>
                <p className={isGlass ? "text-slate-400" : "text-brutal-muted"}>$ CINEBLOCK_TOKEN=cb_... npx cineblock</p>
              </div>

              {user?.cliToken ? (
                <div className="space-y-3">
                  <div
                    className={isGlass ? "flex items-center gap-2 p-3 rounded-xl font-mono text-sm" : "flex items-center gap-2 p-3 bg-surface-2 border-2 border-brutal-border font-mono text-sm"}
                    style={isGlass ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "12px" } : undefined}
                  >
                    <span className={`flex-1 truncate transition-all select-all ${isGlass ? "text-slate-300" : "text-brutal-white"} ${cliTokenVisible ? "" : "blur-sm select-none"}`}>
                      {user.cliToken}
                    </span>
                    <button
                      onClick={() => setCliTokenVisible(v => !v)}
                      className={isGlass ? "text-[9px] font-display font-semibold px-2 py-0.5 rounded-full shrink-0" : "brutal-chip text-brutal-dim border-brutal-border text-[9px] shrink-0"}
                      style={isGlass ? glassChip("default") : undefined}
                    >
                      {cliTokenVisible ? "HIDE" : "SHOW"}
                    </button>
                    <button
                      onClick={() => {
                        void navigator.clipboard.writeText(user.cliToken!).then(() => {
                          setCopiedCliToken(true);
                          setTimeout(() => setCopiedCliToken(false), 2000);
                        });
                      }}
                      className={isGlass
                        ? "text-[9px] font-display font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"
                        : "brutal-chip text-brutal-yellow border-brutal-yellow hover:bg-brutal-yellow hover:text-black transition-colors text-[9px] flex items-center gap-1 shrink-0"}
                      style={isGlass ? glassChip("blue") : undefined}
                    >
                      {copiedCliToken ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                      {copiedCliToken ? "COPIED!" : "COPY"}
                    </button>
                  </div>
                  <button
                    onClick={() => void handleGenerateToken()}
                    disabled={generatingToken}
                    className={isGlass
                      ? "px-3 py-2 text-[10px] font-display font-semibold rounded-xl text-slate-400 hover:text-blue-300 disabled:opacity-50 transition-all"
                      : "brutal-btn px-3 py-2 text-[10px] font-mono font-bold text-brutal-dim border-brutal-border hover:border-brutal-yellow hover:text-brutal-yellow disabled:opacity-50"}
                    style={isGlass ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" } : undefined}
                  >
                    {generatingToken ? "REGENERATING..." : "⟳ REGENERATE TOKEN"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => void handleGenerateToken()}
                  disabled={generatingToken}
                  className={isGlass
                    ? "w-full py-3 text-xs font-display font-semibold rounded-xl text-blue-300 hover:text-blue-200 disabled:opacity-50 transition-all"
                    : "brutal-btn w-full py-3 text-xs font-mono font-bold !bg-brutal-yellow !text-black !border-brutal-yellow hover:opacity-80 disabled:opacity-50"}
                  style={isGlass ? glassBtn("blue") : undefined}
                >
                  {generatingToken ? "GENERATING..." : "⌨ GENERATE CLI TOKEN"}
                </button>
              )}
            </div>
          );
        })()}

        {/* ── Data & Privacy ────────────────────────────────── */}
        <div
          className={isGlass ? "rounded-2xl p-6 space-y-4" : "brutal-card p-6 space-y-4"}
          style={isGlass ? glassCard : undefined}
        >
          <div className="flex items-center gap-3">
            <Download className={`w-4 h-4 ${isGlass ? "text-cyan-400" : "text-brutal-cyan"}`} strokeWidth={2.5} />
            <h2 className={`flex-1 ${isGlass ? "text-[10px] font-display font-semibold text-slate-400 uppercase tracking-[0.2em]" : "text-[10px] font-mono font-black text-brutal-dim uppercase tracking-[0.2em]"}`}>Data &amp; Privacy</h2>
          </div>
          <p className={`text-[11px] font-mono ${isGlass ? "text-slate-400" : "text-brutal-muted"}`}>
            Securely backup your library offline, or migrate your profile to a secondary node via raw JSON payloads.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => setShowExportModal(true)}
              className={isGlass
                ? "p-4 flex flex-col gap-2 items-start rounded-xl transition-all duration-200 hover:scale-[1.02] text-left group"
                : "brutal-btn p-4 flex flex-col gap-2 items-start border-2 border-brutal-border hover:border-brutal-cyan hover:bg-brutal-cyan/5 transition-all text-left group"}
              style={isGlass ? {
                background: "rgba(34,211,238,0.06)",
                border: "1px solid rgba(34,211,238,0.18)",
                borderRadius: "12px",
              } : undefined}
            >
              <div
                className={isGlass ? "w-8 h-8 rounded-full flex items-center justify-center" : "w-8 h-8 rounded-full bg-brutal-cyan/20 flex items-center justify-center group-hover:bg-brutal-cyan"}
                style={isGlass ? { background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.30)" } : undefined}
              >
                <Download className={isGlass ? "w-4 h-4 text-cyan-400" : "w-4 h-4 text-brutal-cyan group-hover:text-black"} />
              </div>
              <div>
                <h3 className={`font-display font-black ${isGlass ? "text-cyan-300" : "text-white group-hover:text-brutal-cyan"}`}>EXPORT BACKUP</h3>
                <p className={`font-mono text-[10px] mt-1 ${isGlass ? "text-slate-500" : "text-brutal-dim"}`}>Download local JSON file</p>
              </div>
            </button>

            <label
              className={isGlass
                ? "p-4 flex flex-col gap-2 items-start rounded-xl transition-all duration-200 hover:scale-[1.02] text-left group cursor-pointer"
                : "brutal-btn p-4 flex flex-col gap-2 items-start border-2 border-brutal-border hover:border-brutal-lime hover:bg-brutal-lime/5 transition-all text-left group cursor-pointer"}
              style={isGlass ? {
                background: "rgba(52,211,153,0.06)",
                border: "1px solid rgba(52,211,153,0.18)",
                borderRadius: "12px",
              } : undefined}
            >
              <input type="file" accept=".json" className="hidden" onChange={handleFileChange} />
              <div
                className={isGlass ? "w-8 h-8 rounded-full flex items-center justify-center" : "w-8 h-8 rounded-full bg-brutal-lime/20 flex items-center justify-center group-hover:bg-brutal-lime"}
                style={isGlass ? { background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.30)" } : undefined}
              >
                <Upload className={isGlass ? "w-4 h-4 text-emerald-400" : "w-4 h-4 text-brutal-lime group-hover:text-black"} />
              </div>
              <div>
                <h3 className={`font-display font-black ${isGlass ? "text-emerald-300" : "text-white group-hover:text-brutal-lime"}`}>IMPORT DATA</h3>
                <p className={`font-mono text-[10px] mt-1 ${isGlass ? "text-slate-500" : "text-brutal-dim"}`}>Merge JSON into account</p>
              </div>
            </label>
          </div>
        </div>

        {/* ── Danger zone ───────────────────────────────────── */}
        <div
          className={isGlass ? "rounded-2xl p-6" : "brutal-card p-6 border-2 border-brutal-red"}
          style={isGlass ? {
            ...glassCard,
            border: "1px solid rgba(239,68,68,0.30)",
            boxShadow: "0 4px 32px rgba(0,0,0,0.4), 0 0 40px rgba(239,68,68,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
          } : undefined}
        >
          <h2 className={`text-[10px] font-mono font-black uppercase tracking-[0.2em] mb-4 ${isGlass ? "text-red-400" : "text-brutal-red"}`}>Danger Zone</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-bold ${isGlass ? "text-white" : "text-brutal-white"}`}>Delete Account</p>
              <p className={`text-[11px] font-mono mt-0.5 ${isGlass ? "text-slate-400" : "text-brutal-muted"}`}>Wipes all your lists, blocks and data permanently.</p>
            </div>
            <button
              onClick={() => { setShowDeleteModal(true); setDeleteError(""); setDeleteConfirmText(""); }}
              className={isGlass
                ? "px-3 py-2 text-xs font-display font-semibold rounded-xl text-red-300 flex items-center gap-2 shrink-0 transition-all hover:scale-[1.02]"
                : "brutal-btn px-3 py-2 text-xs font-mono font-bold !bg-brutal-red !text-white !border-brutal-red hover:opacity-80 flex items-center gap-2 shrink-0"}
              style={isGlass ? glassBtn("red") : undefined}
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
              DELETE
            </button>
          </div>
        </div>

        {/* ── Delete confirmation modal ──────────────────────── */}
        {showDeleteModal && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            style={{ background: isGlass ? "rgba(2,6,23,0.75)" : "rgba(0,0,0,0.70)", backdropFilter: isGlass ? "blur(8px)" : undefined }}
          >
            <div
              className={isGlass ? "w-full max-w-sm p-6 space-y-4 rounded-2xl" : "brutal-card w-full max-w-sm p-6 space-y-4 animate-fade-in"}
              style={isGlass ? {
                background: "rgba(5,10,30,0.92)",
                backdropFilter: "blur(32px) saturate(160%)",
                WebkitBackdropFilter: "blur(32px) saturate(160%)",
                border: "1px solid rgba(239,68,68,0.25)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(239,68,68,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
                borderRadius: "20px",
              } : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className={`font-display font-black text-lg uppercase tracking-tight ${isGlass ? "text-red-400" : "text-brutal-red"}`}>Delete Account</h3>
                  <p className={`text-[11px] font-mono mt-1 ${isGlass ? "text-slate-400" : "text-brutal-muted"}`}>This wipes everything permanently. Type DELETE to confirm.</p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={isGlass ? "flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white transition-all shrink-0" : "brutal-btn p-1.5 shrink-0"}
                  style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" } : undefined}
                >
                  <X className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>

              {deleteError && (
                <div
                  className={isGlass ? "px-3 py-2 text-xs text-center w-full rounded-xl text-red-300" : "brutal-chip text-brutal-red border-brutal-red px-3 py-2 text-xs text-center w-full"}
                  style={isGlass ? glassChip("red") : undefined}
                >
                  {deleteError}
                </div>
              )}

              <div>
                <label className={`block text-[10px] font-mono font-bold uppercase tracking-[0.15em] mb-1.5 ${isGlass ? "text-slate-500" : "text-brutal-muted"}`}>Type DELETE</label>
                <div
                  className={isGlass ? "flex items-center px-3 py-2.5 rounded-xl" : "brutal-input flex items-center px-3 py-2.5 focus-within:border-brutal-red"}
                  style={isGlass ? { ...glassInput, borderRadius: "12px", borderColor: "rgba(239,68,68,0.35)" } : undefined}
                >
                  <input
                    autoFocus
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void handleDeleteAccount(); }}
                    placeholder="DELETE"
                    className={`flex-1 bg-transparent text-sm outline-none ${isGlass ? "text-white placeholder:text-slate-600" : "text-brutal-white placeholder:text-brutal-dim font-body"}`}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmText.trim().toUpperCase() !== "DELETE"}
                  className={isGlass
                    ? "flex-1 py-2.5 text-xs font-display font-semibold rounded-xl text-red-300 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                    : "brutal-btn flex-1 py-2.5 text-xs font-mono font-bold !bg-brutal-red !text-white !border-brutal-red hover:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"}
                  style={isGlass ? glassBtn("red") : undefined}
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  {deleting ? "DELETING..." : "DELETE FOREVER"}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={isGlass
                    ? "px-4 py-2.5 text-xs font-display font-semibold rounded-xl text-slate-300 transition-all"
                    : "brutal-btn px-4 py-2.5 text-xs font-mono font-bold"}
                  style={isGlass ? glassBtn("default") : undefined}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Export modal ──────────────────────────────────── */}
        {showExportModal && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            style={{ background: isGlass ? "rgba(2,6,23,0.75)" : "rgba(0,0,0,0.70)", backdropFilter: isGlass ? "blur(8px)" : undefined }}
          >
            <div
              className={isGlass ? "w-full max-w-sm p-6 space-y-5 rounded-2xl" : "brutal-card w-full max-w-sm p-6 space-y-5 animate-fade-in"}
              style={isGlass ? {
                background: "rgba(5,10,30,0.92)",
                backdropFilter: "blur(32px) saturate(160%)",
                WebkitBackdropFilter: "blur(32px) saturate(160%)",
                border: "1px solid rgba(34,211,238,0.20)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(34,211,238,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
                borderRadius: "20px",
              } : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className={`font-display font-black text-lg uppercase tracking-tight ${isGlass ? "text-cyan-300" : "text-brutal-cyan"}`}>Export Terminal</h3>
                  <p className={`text-[11px] font-mono mt-1 ${isGlass ? "text-slate-400" : "text-brutal-muted"}`}>Select sub-systems to bundle into payload.</p>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className={isGlass ? "flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white transition-all shrink-0" : "brutal-btn p-1.5 shrink-0 hover:!bg-brutal-cyan hover:!text-black hover:!border-brutal-cyan"}
                  style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" } : undefined}
                >
                  <X className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>

              <div
                className={isGlass ? "space-y-2 p-3 rounded-xl" : "space-y-2 border-2 border-dashed border-brutal-border p-3"}
                style={isGlass ? { background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: "12px" } : undefined}
              >
                {[
                  { key: "watched",   label: "Watched Movies (incl. Franchise Progress)", count: user?.watchedCount || 0 },
                  { key: "liked",     label: "Liked Movies",                              count: user?.likedCount || 0   },
                  { key: "watchlist", label: "Watchlist (Queue)",                         count: user?.watchlistCount || 0 },
                  { key: "stamps",    label: "Profile Stamps",                            count: myStamps?.length || 0   },
                  { key: "blocks",    label: "CineBlocks (Playlists)",                    count: "-"                     },
                ].map(({ key, label, count }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      className={`w-4 h-4 flex items-center justify-center transition-colors ${isGlass
                        ? "rounded-md"
                        : `border-2 ${exportOptions[key as keyof typeof exportOptions] ? "bg-brutal-cyan border-brutal-cyan" : "bg-bg border-brutal-dim group-hover:border-brutal-white"}`}`}
                      style={isGlass ? (exportOptions[key as keyof typeof exportOptions]
                        ? { background: "rgba(34,211,238,0.30)", border: "1px solid rgba(34,211,238,0.60)" }
                        : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)" }
                      ) : undefined}
                    >
                      {exportOptions[key as keyof typeof exportOptions] && <Check className={`w-3 h-3 ${isGlass ? "text-cyan-300" : "text-black"}`} strokeWidth={4} />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={exportOptions[key as keyof typeof exportOptions]}
                      onChange={(e) => setExportOptions({ ...exportOptions, [key]: e.target.checked })}
                    />
                    <div className="flex-1 flex justify-between gap-2">
                      <span className={`text-[11px] font-mono transition-colors ${isGlass ? "text-slate-300 group-hover:text-cyan-300" : "text-brutal-white group-hover:text-brutal-cyan"}`}>{label}</span>
                      <span className={`text-[10px] font-mono ${isGlass ? "text-slate-500" : "text-brutal-dim"}`}>{count}</span>
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={handleExportData}
                disabled={isExporting || !Object.values(exportOptions).some(v => v)}
                className={isGlass
                  ? "w-full py-3 text-xs font-display font-semibold rounded-xl text-cyan-300 disabled:opacity-50 transition-all hover:scale-[1.01]"
                  : "brutal-btn w-full py-3 text-xs font-mono font-bold !bg-brutal-cyan !text-black !border-brutal-cyan hover:opacity-80 disabled:opacity-50"}
                style={isGlass ? glassBtn("cyan") : undefined}
              >
                {isExporting ? "PACKAGING PAYLOAD..." : "DOWNLOAD JSON PAYLOAD"}
              </button>
            </div>
          </div>
        )}

        {/* ── Import modal ──────────────────────────────────── */}
        {showImportModal && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            style={{ background: isGlass ? "rgba(2,6,23,0.75)" : "rgba(0,0,0,0.70)", backdropFilter: isGlass ? "blur(8px)" : undefined }}
          >
            <div
              className={isGlass ? "w-full max-w-sm p-6 space-y-5 rounded-2xl relative overflow-hidden" : "brutal-card w-full max-w-sm p-6 space-y-5 animate-fade-in relative overflow-hidden"}
              style={isGlass ? {
                background: "rgba(5,10,30,0.92)",
                backdropFilter: "blur(32px) saturate(160%)",
                WebkitBackdropFilter: "blur(32px) saturate(160%)",
                border: "1px solid rgba(52,211,153,0.20)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(52,211,153,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
                borderRadius: "20px",
              } : undefined}
            >
              {!isGlass && <div className="absolute top-0 right-0 w-32 h-32 bg-brutal-lime/20 blur-3xl -mx-4 -my-4 pointer-events-none" />}
              {isGlass && <div className="pointer-events-none absolute top-0 right-0 w-40 h-40 rounded-full opacity-20" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.4) 0%, transparent 70%)", filter: "blur(30px)" }} />}

              <div className="flex items-start justify-between gap-3 relative z-10">
                <div>
                  <h3 className={`font-display font-black text-lg uppercase tracking-tight ${isGlass ? "text-emerald-300" : "text-brutal-lime"}`}>Import Terminal</h3>
                  <p className={`text-[11px] font-mono mt-1 ${isGlass ? "text-slate-400" : "text-brutal-muted"}`}>Merging external node data to local profile.</p>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className={isGlass ? "flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white transition-all shrink-0" : "brutal-btn p-1.5 shrink-0 hover:!bg-brutal-lime hover:!text-black hover:!border-brutal-lime"}
                  style={isGlass ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" } : undefined}
                >
                  <X className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>

              {importError ? (
                <div
                  className={isGlass ? "p-3 text-xs w-full rounded-xl text-red-300" : "brutal-chip text-brutal-red border-brutal-red p-3 text-xs w-full bg-black/50"}
                  style={isGlass ? glassChip("red") : undefined}
                >
                  {importError}
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className={isGlass ? "p-4 font-mono text-[10px] space-y-3 rounded-xl" : "bg-black/60 border border-brutal-border p-4 font-mono text-[10px] text-brutal-dim space-y-3"}
                    style={isGlass ? { background: "rgba(0,0,0,0.40)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" } : undefined}
                  >
                    <p className={`uppercase tracking-widest text-[9px] ${isGlass ? "text-slate-300" : "text-brutal-white"}`}>Payload Analyzed:</p>
                    <ul className={`space-y-1 ml-2 ${isGlass ? "text-slate-400" : "text-brutal-dim"}`}>
                      {importDataPreview?.watched?.length > 0 && <li><span className={isGlass ? "text-emerald-400" : "text-brutal-lime"}>+</span> {importDataPreview.watched.length} Watched records (Updates Franchise)</li>}
                      {importDataPreview?.liked?.length > 0 && <li><span className={isGlass ? "text-emerald-400" : "text-brutal-lime"}>+</span> {importDataPreview.liked.length} Liked records</li>}
                      {importDataPreview?.watchlist?.length > 0 && <li><span className={isGlass ? "text-emerald-400" : "text-brutal-lime"}>+</span> {importDataPreview.watchlist.length} Queue entries</li>}
                      {importDataPreview?.stamps?.length > 0 && <li><span className={isGlass ? "text-emerald-400" : "text-brutal-lime"}>+</span> {importDataPreview.stamps.length} Stamps</li>}
                      {importDataPreview?.blocks?.length > 0 && <li><span className={isGlass ? "text-emerald-400" : "text-brutal-lime"}>+</span> {importDataPreview.blocks.length} CineBlocks</li>}
                    </ul>
                    <p className={`text-[9px] pt-2 ${isGlass ? "text-slate-500" : "text-brutal-muted"}`} style={isGlass ? { borderTop: "1px solid rgba(255,255,255,0.08)" } : { borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px" }}>
                      New lists will merge existing items (duplicates skipped). New blocks will be generated separately.
                    </p>
                  </div>

                  <button
                    onClick={handleImportData}
                    disabled={isImporting}
                    className={isGlass
                      ? "w-full py-3 text-xs font-display font-semibold rounded-xl text-emerald-300 disabled:opacity-50 relative z-10 transition-all hover:scale-[1.01]"
                      : "brutal-btn w-full py-3 text-xs font-mono font-bold !bg-brutal-lime !text-black !border-brutal-lime hover:opacity-80 disabled:opacity-50 relative z-10"}
                    style={isGlass ? glassBtn("green") : undefined}
                  >
                    {isImporting ? "MERGING NODES..." : "CONFIRM MERGE PROTOCOL"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
