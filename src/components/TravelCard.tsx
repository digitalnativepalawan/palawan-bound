import { useState } from "react";
import { Plane, Ship, User, Trash2, X, Plus, Check } from "lucide-react";
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

const ModeIcon = ({ mode }: { mode: TransportMode | null }) => {
  if (mode === "Air") return <Plane className="h-3 w-3" />;
  if (mode === "Sea") return <Ship className="h-3 w-3" />;
  return <User className="h-3 w-3" />;
};

const TravelCard = ({ item, inTrip, isAdmin, onToggle, onUpdate, onDelete }: TravelCardProps) => {
  const [editing, setEditing] = useState(false);

  if (editing && isAdmin) {
    return (
      <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
        <EditView item={item} onSave={(p) => { onUpdate(p); setEditing(false); }} onDelete={onDelete} onClose={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-transform duration-300 active:scale-[0.98]">

      {/* ── CINEMATIC IMAGE ── */}
      <div className="relative h-[260px] w-full overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-teal-900 via-teal-700 to-emerald-500" />
        )}

        {/* cinematic gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* ADD button — top right on image */}
        <button
          onClick={onToggle}
          className={`absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold backdrop-blur-md border transition-all duration-200 active:scale-90 ${
            inTrip
              ? "bg-white text-black border-white"
              : "bg-black/30 border-white/30 text-white hover:bg-white hover:text-black"
          }`}
        >
          {inTrip ? <><Check className="h-3 w-3" />Added</> : <><Plus className="h-3 w-3" />Add</>}
        </button>

        {/* transport mode — top left */}
        {item.section === "transport" && item.transport_mode && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white">
            <ModeIcon mode={item.transport_mode} />
            {item.transport_mode}
          </div>
        )}

        {/* bottom text overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-2xl font-bold text-white leading-tight">
                {item.name}
              </h3>
              <p className="text-sm text-white/60 mt-1 leading-snug line-clamp-1">
                {item.short_info}
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-3 py-2">
              <p className="text-lg font-extrabold text-white leading-none">{money(item.price)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TRANSPORT PILLS ── */}
      {item.section === "transport" && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-white border-t border-zinc-100">
          {item.route_from && item.route_to && (
            <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-500">
              {item.route_from} → {item.route_to}
            </span>
          )}
          {item.duration && (
            <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-500">
              {item.duration}
            </span>
          )}
          {item.land_type && (
            <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-500">
              {item.land_type}
            </span>
          )}
          {isAdmin && (
            <button onClick={() => setEditing(true)} className="ml-auto rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-500 active:scale-90 transition">
              Edit
            </button>
          )}
        </div>
      )}

      {/* ── ADMIN EDIT (non-transport) ── */}
      {isAdmin && item.section !== "transport" && (
        <div className="px-4 py-2 bg-white border-t border-zinc-100">
          <button onClick={() => setEditing(true)} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-500 active:scale-90 transition">
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Edit View ────────────────────────────────────────────────────────────────

const EditView = ({ item, onSave, onDelete, onClose }: {
  item: TravelItem;
  onSave: (p: Partial<TravelItem>) => void;
  onDelete: () => void;
  onClose: () => void;
}) => {
  const [d, setD] = useState({ ...item });

  const f = (key: keyof TravelItem, label: string, type = "text") => (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</span>
      <input
        type={type}
        value={String(d[key] ?? "")}
        onChange={(e) => setD((c) => ({ ...c, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
        className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
      />
    </label>
  );

  return (
    <div className="px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">Edit item</h3>
        <button onClick={onClose} className="rounded-full bg-zinc-100 p-2 active:scale-90"><X className="h-3.5 w-3.5" /></button>
      </div>
      {f("name", "Name")}
      {f("price", "Price", "number")}
      {f("short_info", "Short info")}
      {f("image_url", "Image URL")}
      {item.section === "transport" && (
        <>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Mode</span>
            <select value={d.transport_mode ?? "Land"} onChange={(e) => setD((c) => ({ ...c, transport_mode: e.target.value as TransportMode }))} className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm">
              <option>Air</option><option>Sea</option><option>Land</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Land type</span>
            <select value={d.land_type ?? "Private"} onChange={(e) => setD((c) => ({ ...c, land_type: e.target.value as LandType }))} className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm">
              <option>Public</option><option>Private</option><option>Private with driver</option>
            </select>
          </label>
          {f("duration", "Duration")}
          {f("route_from", "Route from")}
          {f("route_to", "Route to")}
        </>
      )}
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(d)} className="flex-1 rounded-2xl bg-teal-700 py-3 text-sm font-bold text-white active:scale-95 transition">Save</button>
        <button onClick={onDelete} className="rounded-2xl border border-red-200 px-4 py-3 text-red-400 active:scale-95 transition"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
};

export default TravelCard;
