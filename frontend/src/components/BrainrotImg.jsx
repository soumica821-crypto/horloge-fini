import { useState } from "react";

export default function BrainrotImg({ src, name, size = 56 }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size };
  if (!src || broken)
    return <div style={style} className="grid place-items-center rounded-xl bg-white/5 text-[10px] text-zinc-500">{name?.slice(0, 3)}</div>;
  return (
    <img src={src} alt={name} style={style} referrerPolicy="no-referrer" loading="lazy" onError={() => setBroken(true)}
      className="brainrot-img object-contain" />
  );
}
