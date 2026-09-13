"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Sparkles, Trophy, ArrowRight } from "lucide-react";

interface LevelUpModalProps {
  oldLevel: number;
  newLevel: number;
  onClose: () => void;
}

export default function LevelUpModal({ oldLevel, newLevel, onClose }: LevelUpModalProps) {
  useEffect(() => {
    // Fire confetti cannon
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899"],
      });
    } catch (e) {
      console.log("Confetti effect:", e);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md p-8 text-center rounded-2xl glass-panel border border-purple-500/40 shadow-2xl shadow-purple-500/20">
        {/* Glow Halo */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-purple-600/30 blur-2xl pointer-events-none" />

        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40 animate-bounce">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-sm font-semibold tracking-wider text-purple-400 uppercase">
          Threshold Crossed
        </h2>
        <h1 className="mt-1 text-3xl font-extrabold text-white tracking-tight">
          LEVEL UP!
        </h1>

        <div className="flex items-center justify-center gap-4 my-6">
          <div className="flex flex-col items-center p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 w-24">
            <span className="text-xs text-slate-400">Previous</span>
            <span className="text-2xl font-bold text-slate-300">LV {oldLevel}</span>
          </div>
          <ArrowRight className="w-6 h-6 text-purple-400" />
          <div className="flex flex-col items-center p-3 rounded-xl bg-purple-950/60 border border-purple-500/60 w-24 shadow-lg shadow-purple-500/20">
            <span className="text-xs text-purple-300 font-semibold">Ascended</span>
            <span className="text-3xl font-black text-purple-200">LV {newLevel}</span>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          Your real-world discipline has materialized into undeniable character ascension. Your multiplier on all future quests has increased!
        </p>

        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          Claim Ascension & Continue
        </button>
      </div>
    </div>
  );
}
