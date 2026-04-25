import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import type { Destination } from "@/pages/Index";

interface TripHeroProps {
  destination: Destination;
  airport: string;
  isAdmin: boolean;
  onUpdateDestination: (
    id: string,
    field: keyof Pick<Destination, "name" | "image_url" | "map_hint">,
    value: string,
  ) => void;
}

const TripHero = ({
  destination,
  airport,
  isAdmin,
  onUpdateDestination,
}: TripHeroProps) => {
  const [editingField, setEditingField] = useState<string | null>(null);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl shadow-lift">
      {/* ── Image / Fallback ── */}
      <div className="relative h-72 w-full bg-secondary">
        {destination.image_url ? (
          <img
            src={destination.image_url}
            alt={destination.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <MapPin className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}

        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* ── Bottom text overlay ── */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              {/* route pill */}
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-bold text-white/90">
                <span>{airport}</span>
                <span className="opacity-50">→</span>
                <span>Dest. {destination.code}</span>
              </div>

              {/* destination name */}
              {isAdmin && editingField === "name" ? (
                <AdminFieldInput
                  value={destination.name}
                  onSave={(v) => {
                    onUpdateDestination(destination.id, "name", v);
                    setEditingField(null);
                  }}
                  onCancel={() => setEditingField(null)}
                  className="text-white bg-white/20 backdrop-blur"
                />
              ) : (
                <h2
                  className={`font-display text-3xl font-bold text-white leading-tight ${isAdmin ? "cursor-pointer underline decoration-dotted decoration-white/40" : ""}`}
                  onClick={() => isAdmin && setEditingField("name")}
                >
                  {destination.name}
                </h2>
              )}

              {/* map hint */}
              {isAdmin && editingField === "map_hint" ? (
                <AdminFieldInput
                  value={destination.map_hint ?? ""}
                  onSave={(v) => {
                    onUpdateDestination(destination.id, "map_hint", v);
                    setEditingField(null);
                  }}
                  onCancel={() => setEditingField(null)}
                  className="text-white/80 bg-white/10 backdrop-blur mt-1"
                />
              ) : (
                <p
                  className={`mt-1 text-sm text-white/70 ${isAdmin ? "cursor-pointer underline decoration-dotted decoration-white/30" : ""}`}
                  onClick={() => isAdmin && setEditingField("map_hint")}
                >
                  {destination.map_hint || (isAdmin ? "Tap to add map hint" : "")}
                </p>
              )}
            </div>

            {/* Destination code badge */}
            <div className="shrink-0 rounded-2xl bg-white/20 backdrop-blur border border-white/30 px-4 py-3 text-center">
              <p className="text-2xl font-extrabold text-white leading-none">
                {destination.code}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Admin: image URL editor ── */}
      {isAdmin && (
        <div className="border-t border-border bg-card/80 backdrop-blur px-4 py-3">
          <label className="block text-xs font-bold text-muted-foreground mb-1.5">
            Image URL
          </label>
          <AdminFieldInput
            value={destination.image_url ?? ""}
            onSave={(v) => onUpdateDestination(destination.id, "image_url", v)}
            placeholder="https://..."
            className="bg-background text-foreground text-sm"
          />
        </div>
      )}
    </div>
  );
};

// ─── Inline admin field input ─────────────────────────────────────────────────

const AdminFieldInput = ({
  value,
  onSave,
  onCancel,
  placeholder,
  className = "",
}: {
  value: string;
  onSave: (v: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
}) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onSave(draft)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSave(draft);
        if (e.key === "Escape") onCancel?.();
      }}
      autoFocus
      placeholder={placeholder}
      className={`w-full rounded-xl border border-white/20 px-3 py-2 outline-none ring-ocean/50 focus:ring-2 ${className}`}
    />
  );
};

export default TripHero;
