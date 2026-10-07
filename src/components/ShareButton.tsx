"use client";
import { BASE } from "@/lib/base";

export default function ShareButton({ text, path }: { text: string; path: string }) {
  const onClick = () => {
    const url = `${window.location.origin}${BASE}${path}`;
    const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  };
  return (
    <button onClick={onClick} className="rounded-full bg-white px-5 py-3 font-mono text-xs text-black transition hover:bg-[#FFC83D]">
      post it on X
    </button>
  );
}
