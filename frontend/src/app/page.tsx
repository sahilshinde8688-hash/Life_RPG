"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Shield,
  Coins,
  Brain,
  Zap,
  Target,
  Flame,
  ArrowRight,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, demoLogin } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center space-y-16 sm:space-y-24 py-8">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold animate-pulse">
          <Sparkles className="w-4 h-4" />
          <span>Personal Progress Operating System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Turn Real-World Action into{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-amber-300">
            RPG Character Growth
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Traditional to-do apps fail because real-life payoff is slow. Life RPG closes that gap with server-verified XP, append-only ledgers, competency mastery bars, and AI quest architecture.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-purple-600/30 transition-all hover:scale-105"
          >
            <span>Enter Character Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/quests"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <span>Explore Quests</span>
          </Link>
        </div>
      </section>

      {/* 3 Core Architecture Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Pillar 1 */}
        <div className="p-6 rounded-2xl glass-panel border border-purple-500/20 hover:border-purple-500/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Append-Only Ledgers</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            XP and Gold are never stored as mutable numbers. Every completion appends an immutable transaction row. Anti-cheat, fully auditable, and mathematically sound.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="p-6 rounded-2xl glass-panel border border-purple-500/20 hover:border-purple-500/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center mb-4">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Mastery Over Raw Level</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Research shows users crave true competence. Track verified domain mastery across Intellect, Strength, Focus, Discipline, and Energy rather than empty points.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="p-6 rounded-2xl glass-panel border border-purple-500/20 hover:border-purple-500/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-4">
            <Brain className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">AI Quest Architect</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            State an ambitious real-world goal and let our Gemini engine deconstruct it into structured, difficulty-adapted RPG milestones with safe server-side validation.
          </p>
        </div>
      </section>

      {/* RPG Loop Demonstration Card */}
      <section className="w-full p-8 rounded-2xl glass-card border border-white/10 text-center space-y-6">
        <h2 className="text-2xl font-black text-white">The Verified Progression Loop</h2>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-bold">
          <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">1. Define Goal</span>
          <ArrowRight className="w-4 h-4 text-purple-400" />
          <span className="px-3 py-1.5 rounded-lg bg-purple-900/40 text-purple-300 border border-purple-500/30">2. Forge Quest</span>
          <ArrowRight className="w-4 h-4 text-purple-400" />
          <span className="px-3 py-1.5 rounded-lg bg-indigo-900/40 text-indigo-300 border border-indigo-500/30">3. Take Real Action</span>
          <ArrowRight className="w-4 h-4 text-purple-400" />
          <span className="px-3 py-1.5 rounded-lg bg-amber-900/40 text-amber-300 border border-amber-500/30">4. Ascend & Reward</span>
        </div>
      </section>
    </div>
  );
}
