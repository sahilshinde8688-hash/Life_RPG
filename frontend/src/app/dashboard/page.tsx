"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Coins,
  Flame,
  Plus,
  Wand2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Brain,
  Target,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api, QuestItem } from "../../lib/api";
import QuestCard from "../../components/QuestCard";
import AttributeBar from "../../components/AttributeBar";
import QuestModal from "../../components/QuestModal";
import AIPlannerModal from "../../components/AIPlannerModal";
import AICoachCard from "../../components/AICoachCard";

export default function Dashboard() {
  const { user, progress, streak, attributes, refreshStats } = useAuth();
  const [activeQuests, setActiveQuests] = useState<QuestItem[]>([]);
  const [loadingQuests, setLoadingQuests] = useState(true);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [isAIPlannerOpen, setIsAIPlannerOpen] = useState(false);

  const fetchQuests = async () => {
    try {
      setLoadingQuests(true);
      const data = await api.getQuests("ACTIVE");
      setActiveQuests(data.slice(0, 4)); // top 3-4 today's quests
    } catch (e) {
      console.error("Failed to fetch quests:", e);
    } finally {
      setLoadingQuests(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  const handleQuestAction = async () => {
    await Promise.all([fetchQuests(), refreshStats()]);
  };

  return (
    <div className="space-y-8">
      {/* 5-Questions Top Header Banner */}
      <section className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Question 1: Who am I? */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={user?.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=SahilBuilder"}
                alt="avatar"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-purple-400/40 bg-purple-950/40 object-cover shadow-lg"
              />
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 text-[11px] font-black rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-purple-400/30 shadow-md">
                LV {progress?.level || 1}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {user?.display_name || "Adventurer"}
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {user?.character_title || "The Architect"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Total Accrued XP:{" "}
                <strong className="text-purple-300 font-bold">{progress?.total_xp || 0} XP</strong> ·{" "}
                Treasury:{" "}
                <strong className="text-amber-300 font-bold">{progress?.gold_balance || 0} Gold</strong>
              </p>
            </div>
          </div>

          {/* Question 4: How am I doing? (Streak & Momentum) */}
          <div className="flex items-center gap-4">
            <div className="p-3 sm:p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 animate-pulse">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-300 tracking-wider block">
                  Active Momentum
                </span>
                <span className="text-lg sm:text-xl font-black text-white">
                  {streak?.current_count || 1} Days
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setIsQuestModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/25 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Forge Quest
              </button>

              <button
                onClick={() => setIsAIPlannerOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-purple-300 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/30 transition-all cursor-pointer whitespace-nowrap"
              >
                <Wand2 className="w-4 h-4" /> AI Roadmap
              </button>
            </div>
          </div>
        </div>

        {/* Question 2: How am I progressing? (XP Bar) */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Progression to Level {(progress?.level || 1) + 1}
            </span>
            <span className="text-purple-300">
              {progress?.current_level_xp || 0} / {progress?.xp_for_next_level || 100} XP ({progress?.xp_progress_percent || 0}%)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden relative shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-400 transition-all duration-700 ease-out xp-glow"
              style={{ width: `${Math.min(100, Math.max(2, progress?.xp_progress_percent || 0))}%` }}
            />
          </div>
        </div>
      </section>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Question 3: What should I do now? (Quests) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                Active Objectives
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {activeQuests.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Targeted real-world actions waiting for completion</p>
            </div>

            <Link
              href="/quests"
              className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              View Quest Board <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingQuests ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeQuests.length > 0 ? (
            <div className="space-y-3.5">
              {activeQuests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  onCompleted={handleQuestAction}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl glass-panel border border-white/5 space-y-3">
              <p className="text-sm text-slate-300 font-semibold">No active quests right now!</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Forge a new quest or use our AI Architect to generate custom milestones.
              </p>
              <button
                onClick={() => setIsQuestModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 cursor-pointer shadow-md"
              >
                Create Quest
              </button>
            </div>
          )}

          {/* AI Coach Integrated Card */}
          <AICoachCard onQuestAdded={handleQuestAction} />
        </div>

        {/* Right 1 Column: Question 5: What am I becoming? (Attributes Mastery) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                Domain Mastery
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </h2>
              <p className="text-xs text-slate-400">Direct competency progression</p>
            </div>
            <Link
              href="/profile"
              className="text-xs font-bold text-purple-400 hover:text-purple-300"
            >
              Sheet
            </Link>
          </div>

          <div className="space-y-3">
            {attributes.length > 0 ? (
              attributes.map((attr) => (
                <AttributeBar
                  key={attr.id}
                  name={attr.name}
                  value={attr.value}
                  masteryPercent={attr.mastery_percent}
                  description={attr.description}
                  iconName={attr.icon}
                />
              ))
            ) : (
              <p className="text-xs text-slate-500">Loading attributes...</p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <QuestModal
        isOpen={isQuestModalOpen}
        onClose={() => setIsQuestModalOpen(false)}
        onQuestCreated={handleQuestAction}
      />

      <AIPlannerModal
        isOpen={isAIPlannerOpen}
        onClose={() => setIsAIPlannerOpen(false)}
        onQuestsAdded={handleQuestAction}
      />
    </div>
  );
}
