"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Wand2,
  Filter,
  CheckCircle2,
  Clock,
  Flame,
  Search,
  CheckSquare,
} from "lucide-react";
import { api, QuestItem } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import QuestCard from "../../components/QuestCard";
import QuestModal from "../../components/QuestModal";
import AIPlannerModal from "../../components/AIPlannerModal";

const STATUS_TABS = [
  { id: "ACTIVE", label: "Active" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "DRAFT", label: "Drafts (AI)" },
  { id: "COMPLETED", label: "Completed" },
];

const CATEGORIES = [
  "All",
  "Coding",
  "Health & Fitness",
  "Study & Deep Work",
  "Mind & Reading",
  "Life Ops",
];

export default function QuestBoard() {
  const { refreshStats } = useAuth();
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ACTIVE");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [isAIPlannerOpen, setIsAIPlannerOpen] = useState(false);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      const catParam = selectedCategory === "All" ? undefined : selectedCategory;
      const data = await api.getQuests(activeTab, catParam);
      setQuests(data);
    } catch (e) {
      console.error("Failed to load quests:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, [activeTab, selectedCategory]);

  const handleActivateDraft = async (questId: string) => {
    try {
      await api.updateQuest(questId, { status: "ACTIVE" });
      fetchQuests();
      refreshStats();
    } catch (e) {
      console.error("Failed to activate draft:", e);
    }
  };

  const filteredQuests = quests.filter((q) =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-purple-400" />
            Quest Board
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-world productivity objectives structured as actionable RPG milestones
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsQuestModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Forge Quest
          </button>

          <button
            onClick={() => setIsAIPlannerOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-purple-300 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/30 transition-all cursor-pointer"
          >
            <Wand2 className="w-4 h-4" /> AI Goal Planner
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-2 rounded-2xl glass-panel border border-white/10">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search objectives..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 pl-1 pr-2">
          <Filter className="w-3.5 h-3.5" /> Domain:
        </span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? "bg-white/15 text-white border border-white/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Quest Cards Grid */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredQuests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuests.map((quest) => (
            <div key={quest.id} className="relative">
              <QuestCard
                quest={quest}
                onCompleted={fetchQuests}
              />
              {quest.status === "DRAFT" && (
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => handleActivateDraft(quest.id)}
                    className="px-3 py-1 text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-lg hover:bg-emerald-900/40 transition-colors"
                  >
                    Activate to Active Board →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl glass-panel border border-white/5 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No quests found in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Ready to take action? Forge a new custom quest or use the AI Goal Planner to decompose a project into sub-tasks.
          </p>
          <button
            onClick={() => setIsQuestModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md transition-all cursor-pointer"
          >
            Forge Quest
          </button>
        </div>
      )}

      {/* Modals */}
      <QuestModal
        isOpen={isQuestModalOpen}
        onClose={() => setIsQuestModalOpen(false)}
        onQuestCreated={fetchQuests}
      />

      <AIPlannerModal
        isOpen={isAIPlannerOpen}
        onClose={() => setIsAIPlannerOpen(false)}
        onQuestsAdded={fetchQuests}
      />
    </div>
  );
}
