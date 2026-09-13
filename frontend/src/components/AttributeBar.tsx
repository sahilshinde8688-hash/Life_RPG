"use client";

import React from "react";
import { Brain, Shield, Target, Flame, Zap, Award } from "lucide-react";

interface AttributeBarProps {
  name: string;
  value: number;
  masteryPercent: number;
  description?: string;
  iconName?: string;
}

export default function AttributeBar({
  name,
  value,
  masteryPercent,
  description,
  iconName,
}: AttributeBarProps) {
  const getIcon = () => {
    switch (name.toLowerCase()) {
      case "intellect":
        return Brain;
      case "strength":
        return Shield;
      case "focus":
        return Target;
      case "discipline":
        return Flame;
      case "energy":
        return Zap;
      default:
        return Award;
    }
  };

  const Icon = getIcon();

  const getTier = (percent: number) => {
    if (percent >= 80) return { label: "Grandmaster", color: "text-amber-400 border-amber-400/30 bg-amber-400/10" };
    if (percent >= 55) return { label: "Master", color: "text-purple-400 border-purple-400/30 bg-purple-400/10" };
    if (percent >= 30) return { label: "Adept", color: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10" };
    return { label: "Apprentice", color: "text-slate-400 border-slate-500/30 bg-slate-500/10" };
  };

  const tier = getTier(masteryPercent);

  return (
    <div className="p-4 rounded-xl glass-card border border-white/10 hover:border-purple-500/30 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">{name}</h4>
            {description && (
              <p className="text-[11px] text-slate-400 line-clamp-1">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${tier.color}`}>
            {tier.label}
          </span>
          <span className="font-black text-sm text-purple-300">
            {masteryPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden relative">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, Math.max(5, masteryPercent))}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-1.5 text-[11px] text-slate-400">
        <span>Raw Stat: {value} pts</span>
        <span>Target: 100% Mastery</span>
      </div>
    </div>
  );
}
