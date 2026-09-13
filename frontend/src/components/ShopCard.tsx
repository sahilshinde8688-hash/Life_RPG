"use client";

import React, { useState } from "react";
import { Coins, Check, Sparkles, AlertCircle, Award, Crown, Sun, ShieldCheck, Flame } from "lucide-react";
import { ShopItem, api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface ShopCardProps {
  item: ShopItem;
  onPurchased: () => void;
}

export default function ShopCard({ item, onPurchased }: ShopCardProps) {
  const { progress, refreshStats } = useAuth();
  const [buying, setBuying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getRarityBadge = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "legendary":
        return "text-amber-300 border-amber-400/40 bg-amber-400/10";
      case "epic":
        return "text-purple-300 border-purple-400/40 bg-purple-400/10";
      case "rare":
        return "text-cyan-300 border-cyan-400/40 bg-cyan-400/10";
      default:
        return "text-slate-300 border-slate-400/30 bg-slate-400/10";
    }
  };

  const getItemIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "frame":
        return Sparkles;
      case "title":
        return Crown;
      case "theme":
        return Sun;
      case "badge":
        return ShieldCheck;
      default:
        return Award;
    }
  };

  const Icon = getItemIcon(item.type);
  const userGold = progress?.gold_balance || 0;
  const canAfford = userGold >= item.price_gold;
  const shortfall = Math.max(0, item.price_gold - userGold);

  const handlePurchase = async () => {
    if (buying || item.is_owned || !canAfford) return;
    setBuying(true);
    setErrorMsg(null);

    try {
      await api.purchaseItem(item.id);
      await refreshStats();
      onPurchased();
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to purchase item.");
    } finally {
      setBuying(false);
    }
  };

  return (
    <div
      className={`p-5 rounded-2xl glass-card border transition-all flex flex-col justify-between ${
        item.is_owned
          ? "border-emerald-500/30 bg-emerald-950/10"
          : canAfford
          ? "border-white/10 hover:border-amber-400/40"
          : "border-white/5 opacity-80"
      }`}
    >
      <div>
        {/* Top badges */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${getRarityBadge(item.rarity)}`}>
            {item.rarity}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {item.type}
          </span>
        </div>

        {/* Center Icon & Title */}
        <div className="flex items-center gap-3 my-2">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 text-amber-400 shrink-0">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">{item.name}</h4>
            <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{item.description}</p>
          </div>
        </div>
      </div>

      {/* Bottom Buy / Owned Section */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm font-extrabold text-amber-300">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{item.price_gold} Gold</span>
          </div>

          {item.is_owned ? (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Check className="w-3.5 h-3.5" /> Acquired
            </span>
          ) : canAfford ? (
            <button
              onClick={handlePurchase}
              disabled={buying}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {buying ? "Transacting..." : "Purchase"}
            </button>
          ) : (
            <div className="text-right">
              <span className="text-[11px] font-semibold text-rose-400 block">
                Need {shortfall} more Gold
              </span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mt-2 text-[11px] text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
