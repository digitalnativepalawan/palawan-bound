import { useState } from "react";
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

const TripHero = ({ destination, airport, isAdmin, onUpdateDestination }: TripHeroProps) => {
  const [imgDraft, setImgDraft] = useState(destination.image_url ?? "");

  return (
    <div className="relative w-full overflow-hidden rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.25)]">

      {/* ── FULL BLEED IMAGE ── */}
      <div className="relative h-[340px] w-full">
        {destination.image_url ? (
          <img
            src={destination.image_url}
            alt={destination.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-teal-700 to-cyan-500" />
        )}

        {/* heavy bottom gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* top: route context */}
        <div className="absolute top-5 left-5 flex items-center gap-2">
          <span className="rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1.5 text-xs font-bold text-white">
            {airport}
          </span>
          <span className="text-white/40 text-xs">→</span>
          <span className="rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1.5 text-xs font-bold text-white">
            Dest. {destination.code}
          </span>
        </div>

        {/* bottom: destination info */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 mb-1">
            Destination {destination.code}
          </p>

          <h2 className="font-display text-4xl font-bold text-white leading-none mb-2">
            {destination.name}
          </h2>

          {destination.map_hint && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-white/50" />
              <p className="text-sm text-white/60">{destination.map_hint}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── ADMIN IMAGE URL EDITOR ── */}
      {isAdmin && (
        <div className="bg-zinc-900 px-4 py-3 flex gap-2">
          <input
            value={imgDraft}
            onChange={(e) => setImgDraft(e.target.value)}
            placeholder="Image URL..."
            className="flex-1 rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
          />
          <button
            onClick={() => onUpdateDestination(destination.id, "image_url", imgDraft)}
            className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white active:scale-95 transition"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default TripHero;
