"use client";

import "./globals.css";
import { AuthProvider, useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import LevelUpModal from "../components/LevelUpModal";

function AppContent({ children }: { children: React.ReactNode }) {
  const { levelUpData, closeLevelUp } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0d18] text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        <p>Life RPG — Personal Progress Operating System. Level up your real-world stats.</p>
      </footer>

      {levelUpData && (
        <LevelUpModal
          oldLevel={levelUpData.oldLevel}
          newLevel={levelUpData.newLevel}
          onClose={closeLevelUp}
        />
      )}
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>Life RPG — Gamified Personal Productivity Operating System</title>
        <meta
          name="description"
          content="Transform real-world goals into RPG quests with verifiable character progression, append-only ledgers, and AI-assisted quest architecture."
        />
      </head>
      <body>
        <AuthProvider>
          <AppContent>{children}</AppContent>
        </AuthProvider>
      </body>
    </html>
  );
}
