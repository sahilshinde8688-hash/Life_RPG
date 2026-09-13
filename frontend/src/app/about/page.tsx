import Link from "next/link";

export default function About() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
      <h1 className="text-4xl font-bold text-black dark:text-zinc-50 mb-4">About Life RPG</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl text-center">
        Life RPG is a gamified personal productivity platform that turns daily tasks into quests, awards experience points, and tracks progress with levels and achievements.
      </p>
      <Link href="/" className="mt-6 text-blue-600 dark:text-blue-400">← Back to Home</Link>
    </div>
  );
}
