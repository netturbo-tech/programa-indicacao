function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const PALETTE = [
  "bg-primary-container text-on-primary-container",
  "bg-secondary text-secondary-foreground",
  "bg-surface-highest text-white border border-outline-variant/30",
  "bg-[#3d3d3d] text-[#ffffff]",
  "bg-[#4a5e00] text-[#f3ffca]",
];

function colorFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function Avatar({ name, size = "md", className = "", src }: { name: string; size?: "xs" | "sm" | "md" | "lg"; className?: string; src?: string | null }) {
  const dim =
    size === "xs"
      ? "h-6 w-6 text-[8px]"
      : size === "sm"
      ? "h-8 w-8 text-[10px]"
      : size === "lg"
      ? "h-14 w-14 text-base"
      : "h-10 w-10 text-xs";
  return (
    <div
      className={`grid place-items-center rounded-full font-bold shrink-0 overflow-hidden ${dim} ${colorFor(name)} ${className}`}
      title={name}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  );
}