"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Coins,
  Sparkles,
  Code,
  Activity,
  BookOpen,
  Compass,
  CheckSquare,
  Flame,
  AlertCircle,
} from "lucide-react";
import { QuestItem, api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface QuestCardProps {
  quest: QuestItem;
  onCompleted?: () => void;
  onDeleted?: () => void;
}

export default function QuestCard({ quest, onCompleted, onDeleted }: QuestCardProps) {
  const { refreshStats, triggerLevelUp } = useAuth();
  const [completing, setCompleting] = useState(false);
  const [completedAnim, setCompletedAnim] = useState(false);
  const [floatingReward, setFloatingReward] = useState<{ xp: number; gold: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getCategoryIcon = () => {
    switch (quest.category_name?.toLowerCase()) {
      case "coding":
        return Code;
      case "health & fitness":
        return Activity;
      case "study & deep work":
        return BookOpen;
      case "mind & reading":
        return Compass;
      default:
        return CheckSquare;
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff?.toLowerCase()) {
      case "trivial":
        return "text-slate-400 border-slate-500/30 bg-slate-500/10";
      case "easy":
        return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case "medium":
        return "text-blue-400 border-blue-500/30 bg-blue-500/10";
      case "hard":
        return "text-amber-400 border-amber-500/30 bg-amber-500/10";
      case "epic":
        return "text-rose-400 border-rose-500/30 bg-rose-500/10";
      default:
        return "text-purple-400 border-purple-500/30 bg-purple-500/10";
    }
  };

  const CategoryIcon = getCategoryIcon();
  const isDone = quest.status === "COMPLETED" || completedAnim;

  const handleComplete = async () => {
    if (completing || isDone) return;
    setCompleting(true);
    setErrorMsg(null);

    try {
      // Optimistic visual trigger
      setCompletedAnim(true);
      setFloatingReward({ xp: quest.preview_xp || 50, gold: quest.preview_gold || 25 });

      const res = await api.completeQuest(quest.id);

      // Refresh global context
      await refreshStats();

      // Check level up cascade
      if (res.level_up) {
        triggerLevelUp(res.old_level, res.new_level);
      }

      if (onCompleted) {
        setTimeout(onCompleted, 900);
      }
    } catch (e: any) {
      console.error("Failed to complete quest:", e);
      setCompletedAnim(false);
      setFloatingReward(null);
      setErrorMsg(e.message || "Failed to save quest completion.");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div
      className={`relative p-5 rounded-2xl glass-card transition-all duration-300 ${
        isDone
          ? "opacity-60 bg-emerald-950/20 border-emerald-500/30"
          : "border-white/10 hover:border-purple-500/40"
      }`}
    >
      {/* Floating Micro-animation */}
      {floatingReward && (
        <div className="absolute top-2 right-6 pointer-events-none z-30 animate-float-up flex items-center gap-3">
          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-purple-600 text-white shadow-lg shadow-purple-500/50">
            +{floatingReward.xp} XP
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-lg shadow-amber-500/50">
            +{floatingReward.gold} Gold
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        {/* Left icon & details */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-purple-400 mt-0.5 shrink-0">
            <CategoryIcon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-purple-300">
                {quest.category_name || "General"}
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${getDifficultyColor(quest.difficulty)}`}>
                {quest.difficulty}
              </span>
              {quest.recurrence !== "none" && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {quest.recurrence}
                </span>
              )}
            </div>

            <h3 className={`font-bold text-base tracking-tight text-white leading-snug ${isDone ? "line-through text-slate-400" : ""}`}>
              {quest.title}
            </h3>

            {quest.description && (
              <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {quest.description}
              </p>
            )}

            {/* Bottom Meta & Reward Previews */}
            <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-white/5 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{quest.estimated_duration} min</span>
              </div>

              <div className="flex items-center gap-1.5 font-semibold text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>+{quest.preview_xp || 50} XP</span>
              </div>

              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>+{quest.preview_gold || 25} Gold</span>
              </div>
            </div>
          </div>
        </div>

        {/* Complete Action Button */}
        <div className="shrink-0 flex flex-col items-end">
          {isDone ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Done</span>
            </div>
          ) : (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 shadow-md shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
