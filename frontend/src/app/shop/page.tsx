"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Coins,
  Sparkles,
  Award,
  Crown,
  Sun,
  ShieldCheck,
  Filter,
} from "lucide-react";
import { api, ShopItem } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import ShopCard from "../../components/ShopCard";

const TYPES = ["All", "title", "frame", "theme", "badge"];

export default function GrandBazaar() {
  const { progress, refreshStats } = useAuth();
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("All");

  const fetchShop = async () => {
    try {
      setLoading(true);
      const res = await api.getShop();
      setShopItems(res.items);
    } catch (e) {
      console.error("Failed to load shop:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShop();
  }, []);

  const handlePurchased = async () => {
    await Promise.all([fetchShop(), refreshStats()]);
  };

  const filteredItems = shopItems.filter((i) =>
    selectedType === "All" ? true : i.type.toLowerCase() === selectedType.toLowerCase()
  );

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <section className="p-6 sm:p-8 rounded-3xl glass-panel border border-amber-500/30 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Virtual Cosmetic Economy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            The Grand Bazaar
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
            Spend your hard-earned Gold on prestige titles, holographic frames, themes, and badges. No real-money transactions — purely earned through real-world discipline.
          </p>
        </div>

        {/* User Treasury Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex items-center gap-4 shrink-0 shadow-lg shadow-amber-500/10">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
            <Coins className="w-8 h-8 animate-bounce" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-amber-300/80 tracking-wider block">
              Character Treasury
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-300">
              {progress?.gold_balance || 0}{" "}
              <span className="text-sm font-bold text-amber-400/70">Gold</span>
            </span>
          </div>
        </div>
      </section>

      {/* Filter Type Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 pl-1 pr-2">
          <Filter className="w-3.5 h-3.5" /> Item Type:
        </span>
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
              selectedType === t
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {t === "All" ? "All Cosmetics" : `${t}s`}
          </button>
        ))}
      </div>

      {/* Item Catalog Grid */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <ShopCard
              key={item.id}
              item={item}
              onPurchased={handlePurchased}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl glass-panel border border-white/5 space-y-2">
          <p className="text-sm text-slate-400 font-semibold">No cosmetics found in this category.</p>
        </div>
      )}
    </div>
  );
}
