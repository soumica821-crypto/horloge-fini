export const DIVISION_META = {
  king: { color: "#FFD700", label: "King" },
  slave: { color: "#C0C0C0", label: "Slave" },
  russian: { color: "#FF4444", label: "Russian" },
};

export const TIER_META = {
  og: { label: "OG", color: "#FF3B3B" },
  peak: { label: "Peak", color: "#FFD400" },
  high: { label: "High", color: "#B45CFF" },
  mid: { label: "Mid", color: "#FF2A85" },
};

export const money = (n) => `${Number(n) < 0 ? "-" : ""}$${Math.abs(Number(n || 0)).toFixed(2)}`;

export const timeAgo = (iso) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const remaining = (iso) => {
  if (!iso) return "∞";
  const s = Math.max(0, (new Date(iso).getTime() - Date.now()) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${sec}s`;
};

export const robloxJoinUrl = (placeId, jobId) =>
  `roblox://experiences/start?placeId=${placeId}&gameInstanceId=${jobId}`;
