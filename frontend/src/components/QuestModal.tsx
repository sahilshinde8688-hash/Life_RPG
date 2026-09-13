"use client";

import React, { useState } from "react";
import { X, Sparkles, Coins, Clock, Check, Plus } from "lucide-react";
import { api } from "../lib/api";

interface QuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestCreated: () => void;
}

const DIFFICULTIES = [
  { id: "trivial", label: "Trivial", xp: 10, gold: 5, color: "hover:border-slate-400 text-slate-300" },
  { id: "easy", label: "Easy", xp: 25, gold: 10, color: "hover:border-emerald-400 text-emerald-300" },
  { id: "medium", label: "Medium", xp: 50, gold: 25, color: "hover:border-blue-400 text-blue-300" },
  { id: "hard", label: "Hard", xp: 90, gold: 45, color: "hover:border-amber-400 text-amber-300" },
  { id: "epic", label: "Epic", xp: 150, gold: 75, color: "hover:border-rose-400 text-rose-300" },
];

const CATEGORIES = [
  "Coding",
  "Health & Fitness",
  "Study & Deep Work",
  "Mind & Reading",
  "Life Ops",
];

export default function QuestModal({ isOpen, onClose, onQuestCreated }: QuestModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Coding");
  const [difficulty, setDifficulty] = useState("medium");
  const [duration, setDuration] = useState(30);
  const [recurrence, setRecurrence] = useState("none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedDiffObj = DIFFICULTIES.find((d) => d.id === difficulty) || DIFFICULTIES[2];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a quest objective title.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.createQuest({
        title: title.trim(),
        description: description.trim(),
        category_name: category,
        difficulty,
        estimated_duration: Number(duration),
        recurrence,
        status: "ACTIVE",
      });

      setTitle("");
      setDescription("");
      onQuestCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to forge quest.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl glass-panel border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-600/20 text-purple-400">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Forge New Quest</h2>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Quest Objective <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master React Server Components Architecture"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 focus:border-purple-500 focus:outline-none text-white text-sm placeholder:text-slate-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Milestone Criteria / Context
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail specific criteria for completion..."
              rows={2}
              className="w-full px-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 focus:border-purple-500 focus:outline-none text-white text-sm placeholder:text-slate-500 resize-none"
            />
          </div>

          {/* Category & Recurrence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Domain / Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 focus:border-purple-500 text-white text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Recurrence
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 focus:border-purple-500 text-white text-sm"
              >
                <option value="none">One-time Quest</option>
                <option value="daily">Daily Habit Quest</option>
                <option value="weekly">Weekly Campaign</option>
              </select>
            </div>
          </div>

          {/* Difficulty selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Difficulty Tier
            </label>
            <div className="grid grid-cols-5 gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                    difficulty === d.id
                      ? "border-purple-500 bg-purple-600/30 text-white shadow-md shadow-purple-600/20"
                      : "border-white/10 bg-slate-900/60 text-slate-400 hover:bg-white/5"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
              <span className="uppercase tracking-wider">Estimated Duration</span>
              <span className="text-purple-400 font-bold">{duration} minutes</span>
            </div>
            <input
              type="range"
              min="10"
              max="180"
              step="5"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Live Reward Preview Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs">
            <span className="text-slate-300 font-medium">Yield on Completion:</span>
            <div className="flex items-center gap-3 font-bold">
              <span className="flex items-center gap-1 text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                +{selectedDiffObj.xp} XP
              </span>
              <span className="flex items-center gap-1 text-amber-300">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                +{selectedDiffObj.gold} Gold
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Forging..." : "Forge Quest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
