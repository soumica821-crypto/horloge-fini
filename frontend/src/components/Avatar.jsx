export default function Avatar({ src, name = "?", size = 36 }) {
  const style = { width: size, height: size };
  if (src) return <img src={src} alt={name} style={style} className="rounded-full object-cover ring-1 ring-white/10" />;
  return (
    <div style={style} className="grid place-items-center rounded-full bg-gradient-to-br from-[#FF2A85] to-[#7a0033] text-xs font-bold uppercase">
      {name.slice(0, 2)}
    </div>
  );
}
