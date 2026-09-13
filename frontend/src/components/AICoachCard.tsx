"use client";

import React, { useState, useEffect } from "react";
import { Bot, Sparkles, Plus, Check, RefreshCw, ArrowRight } from "lucide-react";
import { api } from "../lib/api";

interface AICoachCardProps {
  onQuestAdded?: () => void;
}

export default function AICoachCard({ onQuestAdded }: AICoachCardProps) {
  const [loading, setLoading] = useState(false);
  const [coachData, setCoachData] = useState<{
    sanitized_context: { level: number; streak: number; top_attribute: string; lowest_attribute: string; completion_rate: number };
    coach_insight: string;
    recommended_quest: { title: string; category: string; difficulty: string; estimated_duration: number };
  } | null>(null);
  const [accepted, setAccepted] = useState(false);

  const fetchAdvice = async () => {
    setLoading(true);
    setAccepted(false);
    try {
      const res = await api.aiDailyCoach();
      setCoachData(res);
    } catch (e) {
      console.error("Failed to load AI advice:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, []);

  const handleAccept = async () => {
    if (!coachData?.recommended_quest || accepted) return;
    try {
      await api.createQuest({
        title: coachData.recommended_quest.title,
        description: "Recommended by AI Coach to balance your character progression.",
        category_name: coachData.recommended_quest.category,
        difficulty: coachData.recommended_quest.difficulty,
        estimated_duration: coachData.recommended_quest.estimated_duration || 30,
        status: "ACTIVE",
      });
      setAccepted(true);
      if (onQuestAdded) onQuestAdded();
    } catch (e) {
      console.error("Failed to accept AI quest:", e);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl glass-card border border-purple-500/30 shadow-xl relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              AI Character Coach
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Gemini
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Tactical insights grounded in your character progression</p>
          </div>
        </div>

        <button
          onClick={fetchAdvice}
          disabled={loading}
          title="Regenerate coaching advice"
          className="p-1.5 text-slate-400 hover:text-purple-300 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Assembling sanitized progression context...</span>
        </div>
      ) : coachData ? (
        <div className="space-y-4">
          {/* Sanitized Context Pill Row */}
          <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-slate-300">
            <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
              Leading: <strong className="text-purple-300">{coachData.sanitized_context.top_attribute}</strong>
            </span>
            <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
              Growth Focus: <strong className="text-amber-300">{coachData.sanitized_context.lowest_attribute}</strong>
            </span>
            <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
              Streak: <strong className="text-rose-300">{coachData.sanitized_context.streak}d</strong>
            </span>
          </div>

          {/* Coach Insight */}
          <p className="text-sm text-slate-200 leading-relaxed bg-white/5 p-3.5 rounded-xl border border-white/5">
            "{coachData.coach_insight}"
          </p>

          {/* Recommended Micro-quest Box */}
          <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-purple-400 mb-0.5">
                <Sparkles className="w-3 h-3" />
                Suggested Priority Action
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                {coachData.recommended_quest.title}
              </h4>
              <span className="text-[11px] text-slate-400">
                {coachData.recommended_quest.category} · {coachData.recommended_quest.difficulty} · {coachData.recommended_quest.estimated_duration}m
              </span>
            </div>

            {accepted ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Check className="w-3.5 h-3.5" /> Added
              </span>
            ) : (
              <button
                onClick={handleAccept}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/30 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> Accept Quest
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400">Click refresh to load your daily tactical coach advice.</p>
      )}
    </div>
  );
}
