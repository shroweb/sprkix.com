import Image from "next/image";

const GRADIENTS = [
  ["#7c3aed", "#4f46e5"], // violet → indigo
  ["#db2777", "#9d174d"], // pink → rose
  ["#ea580c", "#b45309"], // orange → amber
  ["#059669", "#0d9488"], // emerald → teal
  ["#0284c7", "#1d4ed8"], // sky → blue
  ["#c026d3", "#7e22ce"], // fuchsia → purple
  ["#65a30d", "#047857"], // lime → green
  ["#0891b2", "#1e40af"], // cyan → navy
  ["#dc2626", "#9f1239"], // red → rose
  ["#7c3aed", "#be185d"], // violet → pink
  ["#d97706", "#dc2626"], // amber → red
  ["#0284c7", "#059669"], // blue → emerald
];

function getGradient(seed: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length] as [string, string];
}

const sizeMap = {
  xs:  { container: "w-5 h-5",   text: "text-[8px]",  border: "" },
  sm:  { container: "w-7 h-7",   text: "text-[10px]", border: "" },
  md:  { container: "w-8 h-8",   text: "text-xs",     border: "" },
  lg:  { container: "w-10 h-10", text: "text-sm",     border: "" },
  xl:  { container: "w-16 h-16", text: "text-xl",     border: "border-2 border-background" },
  "2xl": { container: "w-24 h-24 sm:w-36 sm:h-36 md:w-48 md:h-48", text: "text-4xl sm:text-6xl md:text-8xl", border: "border-4 sm:border-8 border-background" },
};

export default function UserAvatar({
  name,
  avatarUrl,
  size = "md",
  className = "",
}: {
  name?: string | null;
  avatarUrl?: string | null;
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  const { container, text, border } = sizeMap[size];
  const seed = name || "user";
  const [from, to] = getGradient(seed);
  const initial = seed.charAt(0).toUpperCase();

  return (
    <div
      className={`${container} relative rounded-full overflow-hidden shrink-0 flex items-center justify-center font-black shadow-sm ${border} ${className}`}
      style={!avatarUrl ? { background: `linear-gradient(135deg, ${from}, ${to})` } : undefined}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name || "Avatar"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 96px, 192px"
        />
      ) : (
        <span className={`${text} text-white font-black select-none`}>{initial}</span>
      )}
    </div>
  );
}
