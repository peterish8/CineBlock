"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { User, Mail, Calendar, LogOut, Pencil, Check, X, Heart, Bookmark, Eye, ArrowLeft, Palette, Trash2, AtSign, Globe } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function ProfilePage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const upsertUser = useMutation(api.users.upsertUser);
  const setUsername = useMutation(api.users.setUsername);
  const setPreferredLanguage = useMutation(api.users.setPreferredLanguage);
  const deleteAccount = useMutation(api.users.deleteAccount);
  const { signOut } = useAuthActions();
  const router = useRouter();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameValue, setUsernameValue] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [isNetflixTheme, setIsNetflixTheme] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setIsNetflixTheme(localStorage.getItem("theme") === "netflix");
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  const toggleTheme = () => {
    setIsNetflixTheme((prev) => {
      const next = !prev;
      if (next) {
        document.body.classList.add("theme-netflix");
        localStorage.setItem("theme", "netflix");
      } else {
        document.body.classList.remove("theme-netflix");
        localStorage.setItem("theme", "default");
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-4 border-brutal-yellow border-t-transparent animate-spin" />
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

  return (
    <div className="min-h-screen bg-bg pb-16 lg:pb-0">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-bg border-b-3 border-brutal-border px-4 sm:px-8 py-5 flex items-center justify-between">
        <Link href="/" className="brutal-btn p-2.5">
          <ArrowLeft className="w-4 h-4" strokeWidth={3} />
        </Link>
        <span className="font-display font-black text-lg text-brutal-white tracking-tight">
          CINE<span className="text-brutal-yellow">BLOCK</span>
        </span>
        <button
          onClick={() => { void signOut(); router.push("/"); }}
          className="brutal-btn px-3 py-1.5 flex items-center gap-2 text-xs font-mono font-bold bg-brutal-red text-white border-brutal-red hover:opacity-80"
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span className="hidden sm:inline">SIGN OUT</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-6 animate-fade-in">

        {/* Hero card */}
        <div className="brutal-card p-0 overflow-hidden">
          {/* Accent strip */}
          <div className="h-3 w-full bg-brutal-yellow" />
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 shrink-0 bg-brutal-yellow border-4 border-brutal-border shadow-brutal flex items-center justify-center overflow-hidden">
              {user?.image ? (
                <Image src={user.image} alt={displayName} width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display font-black text-3xl text-black">{initials}</span>
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
                      className="brutal-input px-3 py-1.5 text-xl font-black font-display uppercase bg-bg text-brutal-white flex-1 min-w-0 focus:border-brutal-yellow focus:shadow-brutal-accent outline-none"
                      maxLength={40}
                    />
                    <button
                      onClick={() => void saveName()}
                      disabled={saving || !nameValue.trim()}
                      className="brutal-btn p-2 !bg-brutal-lime !text-black !border-brutal-lime disabled:opacity-40 shrink-0"
                    >
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </button>
                    <button onClick={cancelEdit} className="brutal-btn p-2 !bg-brutal-red !text-white !border-brutal-red shrink-0">
                      <X className="w-4 h-4" strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="font-display font-black text-2xl sm:text-3xl text-brutal-white uppercase tracking-tight truncate">
                      {displayName}
                    </h1>
                    <button
                      onClick={startEdit}
                      className="brutal-btn p-1.5 hover:!border-brutal-yellow hover:!text-brutal-yellow"
                      title="Edit name"
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </>
                )}
              </div>
              <p className="text-brutal-muted font-mono text-sm mt-1 truncate">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <Calendar className="w-3.5 h-3.5 text-brutal-dim" strokeWidth={2} />
                <span className="text-brutal-dim text-xs font-mono uppercase">Member since {memberSince}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: "LIKED", value: likedCount, icon: Heart, color: "text-brutal-red", bg: "bg-brutal-red", accent: "border-brutal-red" },
            { label: "WATCHLIST", value: watchlistCount, icon: Bookmark, color: "text-brutal-pink", bg: "bg-brutal-pink", accent: "border-brutal-pink" },
            { label: "WATCHED", value: watchedCount, icon: Eye, color: "text-brutal-lime", bg: "bg-brutal-lime", accent: "border-brutal-lime" },
          ].map(({ label, value, icon: Icon, color, bg, accent }) => (
            <div key={label} className={`brutal-card p-0 overflow-hidden border-2 ${accent}`}>
              <div className={`${bg} px-4 py-2 flex items-center gap-2`}>
                <Icon className="w-4 h-4 text-black fill-current" strokeWidth={2} />
                <span className="font-mono font-black text-[10px] text-black tracking-widest">{label}</span>
              </div>
              <div className="px-4 py-4 text-center">
                <span className={`font-display font-black text-2xl sm:text-4xl ${color}`}>{value}</span>
                <p className="text-brutal-dim text-[10px] font-mono mt-1">
                  {value === 1 ? "movie" : "movies"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Account details */}
        <div className="brutal-card p-6 space-y-4">
          <h2 className="text-[10px] font-mono font-black text-brutal-dim uppercase tracking-[0.2em]">Account Details</h2>

          <div className="space-y-3">
            {/* Name row */}
            <div className="flex items-center justify-between p-3 bg-surface-2 border-2 border-brutal-border">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-brutal-yellow shrink-0" strokeWidth={2.5} />
                <div>
                  <p className="text-[9px] font-mono font-bold text-brutal-dim uppercase tracking-widest">Display Name</p>
                  <p className="text-sm font-bold text-brutal-white">{displayName}</p>
                </div>
              </div>
              {!editingName && (
                <button onClick={startEdit} className="brutal-chip text-brutal-yellow border-brutal-yellow hover:bg-brutal-yellow hover:text-black transition-colors text-[9px] flex items-center gap-1">
                  <Pencil className="w-2.5 h-2.5" />
                  EDIT
                </button>
              )}
            </div>

            {/* Username row */}
            <div className="flex items-center justify-between p-3 bg-surface-2 border-2 border-brutal-border">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <AtSign className="w-4 h-4 text-brutal-lime shrink-0" strokeWidth={2.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-mono font-bold text-brutal-dim uppercase tracking-widest">Username</p>
                  {editingUsername ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-brutal-dim font-mono text-sm">@</span>
                      <input
                        autoFocus
                        value={usernameValue}
                        onChange={(e) => { setUsernameValue(e.target.value); setUsernameError(""); }}
                        onKeyDown={(e) => { if (e.key === "Enter") void saveUsername(); if (e.key === "Escape") cancelEditUsername(); }}
                        className="brutal-input px-2 py-1 text-sm font-bold bg-bg text-brutal-white flex-1 min-w-0 focus:border-brutal-lime outline-none"
                        maxLength={20}
                        placeholder="your_username"
                      />
                      <button onClick={() => void saveUsername()} disabled={savingUsername || !usernameValue.trim()} className="brutal-btn p-1.5 !bg-brutal-lime !text-black !border-brutal-lime disabled:opacity-40 shrink-0">
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      </button>
                      <button onClick={cancelEditUsername} className="brutal-btn p-1.5 !bg-brutal-red !text-white !border-brutal-red shrink-0">
                        <X className="w-3.5 h-3.5" strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-brutal-white">
                      {user?.username ? `@${user.username}` : <span className="text-brutal-dim italic">Not set</span>}
                    </p>
                  )}
                  {usernameError && <p className="text-brutal-red text-[10px] font-mono mt-1">{usernameError}</p>}
                </div>
              </div>
              {!editingUsername && (
                <button onClick={startEditUsername} className="brutal-chip text-brutal-lime border-brutal-lime hover:bg-brutal-lime hover:text-black transition-colors text-[9px] flex items-center gap-1 shrink-0">
                  <Pencil className="w-2.5 h-2.5" />
                  {user?.username ? "EDIT" : "SET"}
                </button>
              )}
            </div>

            {/* Email row */}
            <div className="flex items-center gap-3 p-3 bg-surface-2 border-2 border-brutal-border">
              <Mail className="w-4 h-4 text-brutal-cyan shrink-0" strokeWidth={2.5} />
              <div className="min-w-0">
                <p className="text-[9px] font-mono font-bold text-brutal-dim uppercase tracking-widest">Email</p>
                <p className="text-sm font-bold text-brutal-white truncate">{user?.email || "Not provided"}</p>
              </div>
            </div>

            {/* Member since row */}
            <div className="flex items-center gap-3 p-3 bg-surface-2 border-2 border-brutal-border">
              <Calendar className="w-4 h-4 text-brutal-pink shrink-0" strokeWidth={2.5} />
              <div>
                <p className="text-[9px] font-mono font-bold text-brutal-dim uppercase tracking-widest">Member Since</p>
                <p className="text-sm font-bold text-brutal-white">{memberSince}</p>
              </div>
            </div>

            {/* Theme row */}
            <div className="flex items-center justify-between p-3 bg-surface-2 border-2 border-brutal-border">
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 text-brutal-violet shrink-0" strokeWidth={2.5} />
                <div>
                  <p className="text-[9px] font-mono font-bold text-brutal-dim uppercase tracking-widest">Theme</p>
                  <p className="text-sm font-bold text-brutal-white">{isNetflixTheme ? "Netflix Dark" : "CineBlock Default"}</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`brutal-chip text-[9px] flex items-center gap-1 transition-all ${
                  isNetflixTheme
                    ? "bg-[#E50914] text-white border-[#E50914] hover:bg-brutal-yellow hover:text-black hover:border-brutal-yellow"
                    : "text-brutal-violet border-brutal-violet hover:bg-brutal-violet hover:text-black"
                }`}
              >
                <Palette className="w-2.5 h-2.5" />
                {isNetflixTheme ? "RESET" : "NETFLIX"}
              </button>
            </div>

            {/* Preferred Languages area */}
            <div className="flex flex-col gap-3 p-3 bg-surface-2 border-2 border-brutal-border">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-brutal-cyan shrink-0" strokeWidth={2.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-mono font-bold text-brutal-dim uppercase tracking-widest">Preferred Languages (Max 5)</p>
                  <p className="text-[10px] font-mono text-brutal-dim mt-0.5">Home page feeds will be curated for your selected languages.</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-2 border-t border-brutal-border/50">
                <button
                  onClick={() => void setPreferredLanguage({ language: "" })}
                  className={`brutal-chip text-[10px] uppercase transition-colors ${(user?.preferredLanguage || "") === "" ? "bg-brutal-cyan text-black border-brutal-cyan" : "text-brutal-dim border-brutal-border hover:bg-surface"}`}
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
                  
                  return (
                    <button
                      key={lang.value}
                      onClick={() => {
                        let newLangs = [...currentLangs];
                        if (isSelected) {
                          newLangs = newLangs.filter(l => l !== lang.value);
                        } else {
                          if (newLangs.length >= 5) return; // Enforce max 5 in UI
                          newLangs.push(lang.value);
                        }
                        void setPreferredLanguage({ language: newLangs.join(",") });
                      }}
                      className={`brutal-chip text-[10px] uppercase transition-colors ${isSelected ? "bg-brutal-cyan text-black border-brutal-cyan" : "text-brutal-white border-brutal-border " + (currentLangs.length >= 5 && !isSelected ? "opacity-30 cursor-not-allowed" : "hover:border-brutal-cyan hover:text-brutal-cyan")}`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: "/liked", label: "MY LIKED", color: "[@media(hover:hover)]:hover:!bg-brutal-red [@media(hover:hover)]:hover:!border-brutal-red [@media(hover:hover)]:hover:!text-black" },
            { href: "/watchlist", label: "MY WATCHLIST", color: "[@media(hover:hover)]:hover:!bg-brutal-pink [@media(hover:hover)]:hover:!border-brutal-pink [@media(hover:hover)]:hover:!text-black" },
            { href: "/watched", label: "MY WATCHED", color: "[@media(hover:hover)]:hover:!bg-brutal-lime [@media(hover:hover)]:hover:!border-brutal-lime [@media(hover:hover)]:hover:!text-black" },
          ].map(({ href, label, color }) => (
            <Link key={href} href={href} className={`brutal-btn py-3 text-xs font-mono font-black tracking-widest text-center block ${color}`}>
              {label}
            </Link>
          ))}
        </div>

        {/* Danger zone */}
        <div className="brutal-card p-6 border-2 border-brutal-red">
          <h2 className="text-[10px] font-mono font-black text-brutal-red uppercase tracking-[0.2em] mb-4">Danger Zone</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-brutal-white">Delete Account</p>
              <p className="text-[11px] font-mono text-brutal-muted mt-0.5">Wipes all your lists, blocks and data permanently.</p>
            </div>
            <button
              onClick={() => { setShowDeleteModal(true); setDeleteError(""); setDeleteConfirmText(""); }}
              className="brutal-btn px-3 py-2 text-xs font-mono font-bold !bg-brutal-red !text-white !border-brutal-red hover:opacity-80 flex items-center gap-2 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
              DELETE
            </button>
          </div>
        </div>

        {/* Delete confirmation modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/70">
            <div className="brutal-card w-full max-w-sm p-6 space-y-4 animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display font-black text-lg text-brutal-red uppercase tracking-tight">Delete Account</h3>
                  <p className="text-[11px] font-mono text-brutal-muted mt-1">This wipes everything permanently. Type DELETE to confirm.</p>
                </div>
                <button onClick={() => setShowDeleteModal(false)} className="brutal-btn p-1.5 shrink-0">
                  <X className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>

              {deleteError && (
                <div className="brutal-chip text-brutal-red border-brutal-red px-3 py-2 text-xs text-center w-full">
                  {deleteError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono font-bold text-brutal-muted uppercase tracking-[0.15em] mb-1.5">Type DELETE</label>
                <div className="brutal-input flex items-center px-3 py-2.5 focus-within:border-brutal-red">
                  <input
                    autoFocus
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void handleDeleteAccount(); }}
                    placeholder="DELETE"
                    className="flex-1 bg-transparent text-brutal-white text-sm font-body placeholder:text-brutal-dim outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmText.trim().toUpperCase() !== "DELETE"}
                  className="brutal-btn flex-1 py-2.5 text-xs font-mono font-bold !bg-brutal-red !text-white !border-brutal-red hover:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  {deleting ? "DELETING..." : "DELETE FOREVER"}
                </button>
                <button onClick={() => setShowDeleteModal(false)} className="brutal-btn px-4 py-2.5 text-xs font-mono font-bold">
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}





