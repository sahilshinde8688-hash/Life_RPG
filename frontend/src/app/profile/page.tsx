"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Trophy,
  Coins,
  Sparkles,
  Calendar,
  Check,
  Award,
  Crown,
  History,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api, InventoryItem, AchievementItem } from "../../lib/api";
import AttributeBar from "../../components/AttributeBar";

export default function CharacterSheet() {
  const { user, progress, attributes, refreshStats } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invData, achData] = await Promise.all([
        api.getInventory(),
        api.getAchievements(),
      ]);
      setInventory(invData);
      setAchievements(achData);
    } catch (e) {
      console.error("Failed to load character data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEquipToggle = async (invId: string, currentEquipped: boolean) => {
    try {
      await api.equipItem(invId, !currentEquipped);
      await Promise.all([fetchData(), refreshStats()]);
    } catch (e) {
      console.error("Failed to toggle equipped item:", e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Character Card */}
      <section className="p-6 sm:p-8 rounded-3xl glass-panel border border-purple-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="relative">
            <img
              src={user?.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=SahilBuilder"}
              alt="avatar"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-2 border-purple-400/50 bg-purple-950/50 object-cover shadow-xl"
            />
            <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:-right-2 px-3 py-1 text-xs font-black rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-purple-400/40 shadow-lg">
              LV {progress?.level || 1}
            </span>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {user?.display_name || "Adventurer"}
              </h1>
              <span className="px-3 py-1 text-xs font-extrabold rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {user?.character_title || "The Novice"}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400">
              Account registered: {user?.character_created_at ? new Date(user.character_created_at).toLocaleDateString() : "Active Member"}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs font-bold">
              <div className="flex items-center gap-1.5 text-purple-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>{progress?.total_xp || 0} Total XP (Ledger Sum)</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>{progress?.gold_balance || 0} Gold Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Priority Competency: 5 Core Mastery Bars */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              Competency Mastery Bars
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </h2>
            <p className="text-xs text-slate-400">
              Per-skill mastery progress (prioritized over raw level as competence signal)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {attributes.map((attr) => (
            <AttributeBar
              key={attr.id}
              name={attr.name}
              value={attr.value}
              masteryPercent={attr.mastery_percent}
              description={attr.description}
              iconName={attr.icon}
            />
          ))}
        </div>
      </section>

      {/* 2-Column Grid: Inventory & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Equipped Items & Inventory */}
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            Cosmetic Armory & Titles
            <Crown className="w-5 h-5 text-amber-400" />
          </h2>

          {inventory.length > 0 ? (
            <div className="space-y-3">
              {inventory.map((inv) => (
                <div
                  key={inv.inventory_id}
                  className="p-4 rounded-2xl glass-card border border-white/10 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{inv.name}</h4>
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                        {inv.type} · {inv.rarity}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleEquipToggle(inv.inventory_id, inv.equipped)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      inv.equipped
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                        : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {inv.equipped ? "Equipped ✓" : "Equip"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl glass-panel border border-white/5">
              <p className="text-xs text-slate-400">No cosmetics unlocked yet.</p>
              <p className="text-[11px] text-slate-500 mt-1">Visit the Bazaar to spend your earned Gold!</p>
            </div>
          )}
        </section>

        {/* Achievements Showcase */}
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            Achievements Showcase
            <Trophy className="w-5 h-5 text-purple-400" />
          </h2>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl glass-card border flex items-center justify-between gap-3 ${
                  ach.unlocked
                    ? "border-purple-500/30 bg-purple-950/20"
                    : "border-white/5 opacity-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      ach.unlocked
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{ach.name}</h4>
                    <p className="text-xs text-slate-400">{ach.description}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {ach.unlocked ? (
                    <span className="text-[11px] font-bold text-emerald-400 block">
                      Unlocked ✓
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      +{ach.reward_xp} XP
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Append-Only Ledger Audit Trail */}
      <section className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              Append-Only Ledger Audit Trail
            </h2>
            <p className="text-xs text-slate-400">
              Immutable ledger log verifying that balances are mathematically derived from transaction rows
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-purple-300 tracking-wider">
              Recent XP Ledger Entries
            </h4>
            <div className="space-y-1.5">
              {progress?.recent_xp_transactions?.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-300 font-medium capitalize">{t.source.replace("_", " ")}</span>
                  <span className="font-bold text-purple-400">+{t.amount} XP</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-amber-300 tracking-wider">
              Recent Gold Ledger Entries
            </h4>
            <div className="space-y-1.5">
              {progress?.recent_gold_transactions?.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-300 font-medium capitalize">{t.source.replace("_", " ")}</span>
                  <span className={`font-bold ${t.amount >= 0 ? "text-amber-400" : "text-rose-400"}`}>
                    {t.amount >= 0 ? `+${t.amount}` : t.amount} Gold
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
