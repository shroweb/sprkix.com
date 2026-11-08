import {
  beltDataUri,
  parseChampionship,
  photoFor,
  type BeltStyle,
} from "@lib/belts";

interface BaseProps {
  /** Show the belt on a rounded plate (use for larger placements). */
  framed?: boolean;
  /** Rendered height in px; width follows the 320:124 artwork ratio. */
  height?: number;
  className?: string;
}

/** A belt with an explicit style and centre label (used for lineal titles). */
function Plate({
  framed,
  className,
  children,
}: {
  framed?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (!framed) return <>{children}</>;
  return (
    <span
      className={`inline-flex items-center justify-center bg-white/[0.04] ring-1 ring-white/10 px-4 py-2.5 ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

export function BeltArt({
  style,
  label,
  name,
  height = 56,
  className,
  framed,
}: BaseProps & { style: BeltStyle; label: string; name: string }) {
  const photo = photoFor(name);
  if (photo) {
    return (
      <Plate framed={framed} className={className}>
        <img
          src={photo}
          alt={`${name} belt`}
          height={height}
          loading="lazy"
          className={framed ? undefined : className}
          style={{
            height,
            width: "auto",
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.45))",
          }}
        />
      </Plate>
    );
  }
  return (
    <Plate framed={framed} className={className}>
      <img
        src={beltDataUri(style, label)}
        alt={`${name} belt`}
        height={height}
        width={Math.round(height * (320 / 124))}
        loading="lazy"
        className={framed ? undefined : className}
        style={{ height, width: "auto" }}
      />
    </Plate>
  );
}

/**
 * Belt for a match: detects the championship from the match type/title and
 * renders nothing when the match isn't for a title.
 */
export default function BeltImage({
  type,
  title,
  height = 56,
  className,
  framed,
}: BaseProps & { type?: string | null; title?: string | null }) {
  const champ = parseChampionship(type, title);
  if (!champ) return null;
  return (
    <BeltArt
      style={champ.style}
      label={champ.label}
      name={champ.name}
      height={height}
      className={className}
      framed={framed}
    />
  );
}
