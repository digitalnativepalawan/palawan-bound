import { useState, useEffect } from "react";
import { Plane, Ship, User, Trash2, X, Check } from "lucide-react";
import type { TravelItem, TransportMode, LandType } from "@/pages/Index";
import { money } from "@/pages/Index";

interface TravelCardProps {
  item: TravelItem;
  inTrip: boolean;
  isAdmin: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<TravelItem>) => void;
  onDelete: () => void;
}

const TransportIcon = ({ mode }: { mode: TransportMode | null }) => {
  if (mode === "Air") return <Plane className="h-3.5 w-3.5" />;
  if (mode === "Sea") return <Ship className="h-3.5 w-3.5" />;
  return <User className="h-3.5 w-3.5" />;
};

const TravelCard = ({
  item,
  inTrip,
  isAdmin,
  onToggle,
  onUpdate,
  onDelete,
}: TravelCardProps) => {
  const [editing, setEditing] = useState(false);

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-transform duration-200 active:scale-[0.99]">
      {editing && isAdmin ? (
        <EditView
          item={item}
          onSave={(patch) => {
            onUpdate(patch);
            setEditing(false);
          }}
          onDelete={onDelete}
          onClose={() => setEditing(false)}
        />
      ) : (
        <ReadView
          item={item}
          inTrip={inTrip}
          isAdmin={isAdmin}
          onToggle={onToggle}
          onEdit={() => setEditing(true)}
        />
      )}
    </div>
  );
};

// ─── Read View ────────────────────────────────────────────────────────────────

const ReadView = ({
  item,
  inTrip,
  isAdmin,
  onToggle,
  onEdit,
}: {
  item: TravelItem;
  inTrip: boolean;
  isAdmin: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) => (
  <>
    {/* image */}
    <div className="relative h-48 w-full bg-secondary">
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <span className="text-2xl opacity-20">
            {item.section === "stay"
              ? "🏠"
              : item.section === "experiences"
              ? "🤿"
              : item.section === "lifestyle"
              ? "🌿"
              : "🚌"}
          </span>
        </div>
      )}

      {/* price badge */}
      <div className="absolute top-3 right-3 rounded-2xl bg-black/50 backdrop-blur px-3 py-1.5">
        <span className="text-sm font-extrabold text-white">
          {money(item.price)}
        </span>
      </div>

      {/* transport mode badge */}
      {item.section === "transport" && item.transport_mode && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-2xl bg-black/50 backdrop-blur px-3 py-1.5">
          <TransportIcon mode={item.transport_mode} />
          <span className="text-xs font-bold text-white">
            {item.transport_mode}
          </span>
        </div>
      )}
    </div>

    {/* content */}
    <div className="px-4 pb-4 pt-3 space-y-3">
      <div>
        <h3 className="font-bold text-base leading-snug">{item.name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
          {item.short_info}
        </p>
      </div>

      {/* transport meta */}
      {item.section === "transport" && (
        <div className="flex flex-wrap gap-1.5">
          {item.route_from && item.route_to && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
              {item.route_from} → {item.route_to}
            </span>
          )}
          {item.duration && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
              {item.duration}
            </span>
          )}
          {item.land_type && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
              {item.land_type}
            </span>
          )}
        </div>
      )}

      {/* actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onToggle}
          className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-all duration-150 active:scale-95 ${inTrip ? "bg-ocean/10 text-ocean border border-ocean/20" : "bg-ocean text-white shadow-lift"}`}
        >
          {inTrip ? (
            <>
              <Check className="h-4 w-4" />
              Added
            </>
          ) : (
            "Add to trip"
          )}
        </button>
        {isAdmin && (
          <button
            onClick={onEdit}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold active:scale-95 transition"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  </>
);

// ─── Edit View (admin only) ───────────────────────────────────────────────────

const EditView = ({
  item,
  onSave,
  onDelete,
  onClose,
}: {
  item: TravelItem;
  onSave: (patch: Partial<TravelItem>) => void;
  onDelete: () => void;
  onClose: () => void;
}) => {
  const [draft, setDraft] = useState({ ...item });

  const field = <K extends keyof TravelItem>(key: K, label: string, type = "text") => (
    <label className="block space-y-1">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={String(draft[key] ?? "")}
        onChange={(e) =>
          setDraft((cur) => ({
            ...cur,
            [key]: type === "number" ? Number(e.target.value) : e.target.value,
          }))
        }
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ocean focus:ring-2"
      />
    </label>
  );

  return (
    <div className="px-4 py-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display text-lg font-bold">Edit item</h3>
        <button onClick={onClose} className="rounded-full bg-muted p-2 active:scale-90 transition">
          <X className="h-4 w-4" />
        </button>
      </div>

      {field("name", "Name")}
      {field("price", "Price (PHP)", "number")}
      {field("short_info", "Short info")}
      {field("image_url", "Image URL")}

      {item.section === "transport" && (
        <>
          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Mode
            </span>
            <select
              value={draft.transport_mode ?? "Land"}
              onChange={(e) =>
                setDraft((cur) => ({
                  ...cur,
                  transport_mode: e.target.value as TransportMode,
                }))
              }
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
            >
              <option>Air</option>
              <option>Sea</option>
              <option>Land</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Land type
            </span>
            <select
              value={draft.land_type ?? "Private"}
              onChange={(e) =>
                setDraft((cur) => ({
                  ...cur,
                  land_type: e.target.value as LandType,
                }))
              }
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
            >
              <option>Public</option>
              <option>Private</option>
              <option>Private with driver</option>
            </select>
          </label>
          {field("duration", "Duration")}
          {field("route_from", "Route from")}
          {field("route_to", "Route to")}
        </>
      )}

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onSave(draft)}
          className="flex-1 rounded-2xl bg-ocean py-3 text-sm font-bold text-white active:scale-95 transition"
        >
          Save
        </button>
        <button
          onClick={onDelete}
          className="rounded-2xl border border-destructive px-4 py-3 text-sm font-bold text-destructive active:scale-95 transition"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default TravelCard;
