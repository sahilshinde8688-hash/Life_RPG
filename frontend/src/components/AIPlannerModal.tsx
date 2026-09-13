"use client";

import React, { useState } from "react";
import { X, Sparkles, Wand2, Clock, Check, Plus, ArrowRight } from "lucide-react";
import { api } from "../lib/api";

interface AIPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestsAdded: () => void;
}

export default function AIPlannerModal({ isOpen, onClose, onQuestsAdded }: AIPlannerModalProps) {
  const [goal, setGoal] = useState("");
  const [timeframe, setTimeframe] = useState(14);
  const [loading, setLoading] = useState(false);
  const [proposedQuests, setProposedQuests] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) {
      setError("Please state your real-world goal or target.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.aiQuestPlan(goal.trim(), Number(timeframe));
      setProposedQuests(res.proposed_quests);
    } catch (err: any) {
      setError(err.message || "Failed to generate quest roadmap.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onQuestsAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl glass-panel border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-600/20 text-purple-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">AI Quest Architect</h2>
              <p className="text-xs text-slate-400">Deconstruct any life goal into tactical RPG milestones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {!proposedQuests ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                What ambitious goal are you pursuing?
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Master system design for senior engineering interviews, or train to run a half-marathon under 2 hours..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 focus:border-purple-500 focus:outline-none text-white text-sm placeholder:text-slate-500 resize-none"
                required
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span className="uppercase tracking-wider">Target Timeframe</span>
                <span className="text-purple-400 font-bold">{timeframe} days</span>
              </div>
              <input
                type="range"
                min="7"
                max="90"
                step="7"
                value={timeframe}
                onChange={(e) => setTimeframe(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Roadmap...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Architect Quest Roadmap
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                {proposedQuests.length} Quests Forged
              </span>
              <span className="text-xs text-slate-400">Added to Drafts</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {proposedQuests.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/70 border border-purple-500/20 flex items-start gap-3"
                >
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-black shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-white truncate">{q.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{q.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                      <span className="text-purple-300">{q.category}</span>
                      <span className="capitalize font-semibold">{q.difficulty}</span>
                      <span>{q.estimated_duration_min} min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              View on Quest Board
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
