"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  Shield,
  Coins,
  Flame,
  User,
  LogOut,
  LayoutDashboard,
  CheckSquare,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, progress, streak, logout, demoLogin } = useAuth();

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Quest Board", href: "/quests", icon: CheckSquare },
    { name: "Character", href: "/profile", icon: Shield },
    { name: "Shop", href: "/shop", icon: ShoppingBag },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0a0d18]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-purple-300">
                LIFE RPG
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                OS
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-white bg-white/10 shadow-inner"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-purple-400" : "text-slate-400"}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Stats & Profile Bar */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user && progress ? (
            <>
              {/* Level & XP Mini-Bar */}
              <div className="hidden sm:flex flex-col gap-1 w-32 md:w-40">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-purple-300">LV {progress.level}</span>
                  <span className="text-slate-400 text-[11px]">
                    {progress.current_level_xp} / {progress.xp_for_next_level} XP
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, progress.xp_progress_percent))}%` }}
                  />
                </div>
              </div>

              {/* Gold Indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-xs sm:text-sm">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>{progress.gold_balance}</span>
              </div>

              {/* Streak Indicator */}
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 font-bold text-xs sm:text-sm">
                <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>{streak?.current_count || 1}d</span>
              </div>

              {/* User Dropdown / Profile link */}
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 transition-colors"
                  title="View Character Profile"
                >
                  <img
                    src={user.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=Adventurer"}
                    alt="avatar"
                    className="w-8 h-8 rounded-full border border-purple-400/40 bg-purple-950/40"
                  />
                  <span className="hidden lg:inline-block text-xs font-semibold text-slate-200">
                    {user.display_name}
                  </span>
                </Link>

                <button
                  onClick={logout}
                  title="Log out"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={demoLogin}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors shadow-sm shadow-purple-600/30"
              >
                Launch Demo Character
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="flex md:hidden border-t border-white/5 px-2 py-1 justify-around bg-[#0a0d18]">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center py-1 px-3 text-[11px] font-medium ${
                isActive ? "text-purple-400" : "text-slate-400"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              {link.name}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
