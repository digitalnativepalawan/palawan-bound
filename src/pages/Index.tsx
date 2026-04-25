import { useEffect, useMemo, useState } from "react";
import { Edit3, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import TripHero from "@/components/TripHero";
import TravelCard from "@/components/TravelCard";
import AdminPanel from "@/components/AdminPanel";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Destination = {
  id: string;
  code: "A" | "B" | "C" | "D" | "E";
  name: string;
  image_url: string | null;
  map_hint: string | null;
  sort_order: number;
};

export type Section = "stay" | "experiences" | "lifestyle" | "transport";
export type TransportMode = "Air" | "Sea" | "Land";
export type LandType = "Public" | "Private" | "Private with driver";

export type TravelItem = {
  id: string;
  destination_id: string;
  section: Section;
  name: string;
  price: number;
  short_info: string;
  image_url: string | null;
  transport_mode: TransportMode | null;
  land_type: LandType | null;
  duration: string | null;
  route_from: string | null;
  route_to: string | null;
  sort_order: number;
  active: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const db = supabase as any;

const SECTIONS: { key: Section; label: string; emoji: string }[] = [
  { key: "stay", label: "Stay", emoji: "🏠" },
  { key: "experiences", label: "Experiences", emoji: "🤿" },
  { key: "lifestyle", label: "Lifestyle", emoji: "🌿" },
  { key: "transport", label: "Transport", emoji: "🚌" },
];

const AIRPORTS = ["Puerto Princesa", "El Nido", "Busuanga"];

export const money = (v: number) =>
  `₱${Number(v || 0).toLocaleString("en-PH")}`;

// ─── Main ─────────────────────────────────────────────────────────────────────

const Index = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [items, setItems] = useState<TravelItem[]>([]);
  const [airport, setAirport] = useState(AIRPORTS[0]);
  const [destinationId, setDestinationId] = useState("");
  const [activeSection, setActiveSection] = useState<Section | "all">("all");
  const [trip, setTrip] = useState<TravelItem[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const selectedDest = destinations.find((d) => d.id === destinationId) ?? destinations[0];

  const destItems = useMemo(
    () => items.filter((i) => i.destination_id === selectedDest?.id && i.active),
    [items, selectedDest],
  );

  const visibleSections = activeSection === "all" ? SECTIONS : SECTIONS.filter((s) => s.key === activeSection);
  const total = useMemo(() => trip.reduce((s, i) => s + Number(i.price), 0), [trip]);

  useEffect(() => { void loadData(); }, []);
  useEffect(() => { if (!destinationId && destinations[0]) setDestinationId(destinations[0].id); }, [destinations, destinationId]);

  const loadData = async () => {
    setIsLoading(true);
    const [{ data: dRows }, { data: iRows }] = await Promise.all([
      db.from("destinations").select("*").order("sort_order", { ascending: true }),
      db.from("travel_items").select("*").order("sort_order", { ascending: true }),
    ]);
    setDestinations((dRows ?? []) as Destination[]);
    setItems(((iRows ?? []) as TravelItem[]).map((i) => ({ ...i, price: Number(i.price) })));
    setIsLoading(false);
  };

  const recordEdit = async (entityType: string, entityId: string, fieldName: string, oldVal: unknown, newVal: unknown) => {
    await db.from("admin_edits").insert({ entity_type: entityType, entity_id: entityId, field_name: fieldName, old_value: String(oldVal ?? ""), new_value: String(newVal ?? "") });
  };

  const updateDestination = async (id: string, field: keyof Pick<Destination, "name" | "image_url" | "map_hint">, value: string) => {
    const prev = destinations.find((d) => d.id === id)?.[field];
    setDestinations((c) => c.map((d) => d.id === id ? { ...d, [field]: value } : d));
    await db.from("destinations").update({ [field]: value }).eq("id", id);
    await recordEdit("destination", id, field, prev, value);
  };

  const updateItem = async (id: string, patch: Partial<TravelItem>) => {
    const prev = items.find((i) => i.id === id);
    const clean = { ...patch, price: patch.price !== undefined ? Number(patch.price) : undefined };
    setItems((c) => c.map((i) => i.id === id ? { ...i, ...clean } : i));
    setTrip((c) => c.map((i) => i.id === id ? { ...i, ...clean } : i));
    await db.from("travel_items").update(clean).eq("id", id);
    const field = Object.keys(patch)[0] ?? "item";
    await recordEdit("item", id, field, prev?.[field as keyof TravelItem], patch[field as keyof TravelItem]);
  };

  const addItem = async (section: Section) => {
    if (!selectedDest) return;
    const payload = {
      destination_id: selectedDest.id, section,
      name: section === "transport" ? "New route" : "New package",
      price: 0, short_info: "Add details.",
      transport_mode: section === "transport" ? "Land" : null,
      land_type: section === "transport" ? "Private" : null,
      duration: section === "transport" ? "1 hr" : null,
      route_from: section === "transport" ? airport : null,
      route_to: selectedDest.name,
      sort_order: items.length + 1, active: true,
    };
    const { data } = await db.from("travel_items").insert(payload).select("*").single();
    if (data) setItems((c) => [...c, { ...(data as TravelItem), price: Number(data.price) }]);
  };

  const removeItem = async (id: string) => {
    setItems((c) => c.filter((i) => i.id !== id));
    setTrip((c) => c.filter((i) => i.id !== id));
    await db.from("travel_items").delete().eq("id", id);
  };

  const toggleTrip = (item: TravelItem) =>
    setTrip((c) => c.some((t) => t.id === item.id) ? c.filter((t) => t.id !== item.id) : [...c, item]);

  const submitAdmin = () => {
    if (adminPass === "5309") { setIsAdmin(true); setAdminPass(""); setAdminOpen(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    /* outer: full screen bg, centers the phone frame on desktop */
    <div className="min-h-screen bg-zinc-100 flex items-start justify-center">

      {/* phone frame: max 430px, white, full height */}
      <div className="relative w-full max-w-[430px] min-h-screen bg-white flex flex-col shadow-2xl">

        {/* ── STICKY HEADER ── */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-4 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-teal-600">Palawan</p>
            <h1 className="font-display text-[1.3rem] font-bold leading-tight text-zinc-900 tracking-tight">
              Build your island trip
            </h1>
          </div>
          <button
            aria-label="Admin"
            onClick={() => isAdmin ? setIsAdmin(false) : setAdminOpen(true)}
            className={`rounded-full p-2.5 transition active:scale-90 border ${isAdmin ? "bg-orange-500 border-orange-500 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-600"}`}
          >
            <Edit3 className="h-4 w-4" />
          </button>
        </header>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="flex-1 overflow-y-auto pb-32">

          {/* AIRPORT SELECTOR */}
          <div className="px-5 pt-5 pb-4">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Flying from</p>
            <div className="flex gap-2">
              {AIRPORTS.map((ap) => (
                <button
                  key={ap}
                  onClick={() => setAirport(ap)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition active:scale-95 ${airport === ap ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"}`}
                >
                  {ap}
                </button>
              ))}
            </div>
          </div>

          {/* DESTINATION PILLS */}
          <div className="px-5 pb-4">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Destination</p>
            <div className="flex gap-2.5 overflow-x-auto scrollbar-none">
              {destinations.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDestinationId(d.id)}
                  className={`shrink-0 h-12 w-12 rounded-2xl text-sm font-black transition-all duration-200 active:scale-90 ${
                    d.id === destinationId
                      ? "bg-teal-700 text-white shadow-lg shadow-teal-700/30"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {d.code}
                </button>
              ))}
            </div>
          </div>

          {/* HERO */}
          {selectedDest && (
            <div className="px-5 pb-5">
              <TripHero
                destination={selectedDest}
                airport={airport}
                isAdmin={isAdmin}
                onUpdateDestination={updateDestination}
              />
            </div>
          )}

          {/* CATEGORY FILTER */}
          <div className="px-5 pb-5">
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveSection("all")}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition active:scale-95 ${activeSection === "all" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"}`}
              >
                All
              </button>
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition active:scale-95 ${activeSection === s.key ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTIONS */}
          {isLoading ? (
            <div className="px-5 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-3xl bg-zinc-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="px-5 space-y-10">
              {visibleSections.map((s) => {
                const sItems = destItems.filter((i) => i.section === s.key);
                if (!isAdmin && sItems.length === 0) return null;
                return (
                  <section key={s.key}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{s.emoji}</span>
                        <h2 className="font-display text-xl font-bold text-zinc-900">{s.label}</h2>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => addItem(s.key)}
                          className="rounded-full bg-teal-50 border border-teal-200 px-3 py-1.5 text-xs font-bold text-teal-700 active:scale-95 transition"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {sItems.map((item) => (
                        <TravelCard
                          key={item.id}
                          item={item}
                          inTrip={trip.some((t) => t.id === item.id)}
                          isAdmin={isAdmin}
                          onToggle={() => toggleTrip(item)}
                          onUpdate={(p) => updateItem(item.id, p)}
                          onDelete={() => removeItem(item.id)}
                        />
                      ))}
                      {isAdmin && sItems.length === 0 && (
                        <div className="h-32 rounded-3xl border-2 border-dashed border-zinc-200 flex items-center justify-center text-sm text-zinc-400">
                          No items — tap + Add
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* ── STICKY BOTTOM BAR ── */}
        <div className="sticky bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl border-t border-zinc-100 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Trip total</p>
              <p className="text-2xl font-black text-zinc-900 tracking-tight">{money(total)}</p>
              {trip.length > 0 && (
                <p className="text-xs text-zinc-400">{trip.length} item{trip.length !== 1 ? "s" : ""} selected</p>
              )}
            </div>
            <button
              onClick={() => setReviewOpen(true)}
              className="rounded-2xl bg-teal-700 px-7 py-4 font-bold text-white text-sm shadow-lg shadow-teal-700/30 active:scale-95 transition-all duration-150"
            >
              Review Trip →
            </button>
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      {reviewOpen && (
        <ReviewSheet
          airport={airport}
          destination={selectedDest}
          trip={trip}
          total={total}
          onClose={() => setReviewOpen(false)}
          onRemove={(id) => setTrip((c) => c.filter((t) => t.id !== id))}
        />
      )}
      {adminOpen && !isAdmin && (
        <PasskeyModal pass={adminPass} setPass={setAdminPass} onClose={() => setAdminOpen(false)} onSubmit={submitAdmin} />
      )}
      {isAdmin && selectedDest && (
        <AdminPanel destination={selectedDest} onUpdateDestination={updateDestination} onClose={() => setIsAdmin(false)} />
      )}
    </div>
  );
};

// ─── Review Sheet ─────────────────────────────────────────────────────────────

const ReviewSheet = ({ airport, destination, trip, total, onClose, onRemove }: {
  airport: string; destination?: Destination; trip: TravelItem[];
  total: number; onClose: () => void; onRemove: (id: string) => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
    <div
      className="w-full max-w-[430px] max-h-[88vh] rounded-t-[32px] bg-white flex flex-col animate-soft-rise"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-center pt-3 pb-1">
        <div className="h-1 w-10 rounded-full bg-zinc-200" />
      </div>
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Summary</p>
          <h2 className="font-display text-2xl font-bold text-zinc-900">Your Trip</h2>
        </div>
        <button onClick={onClose} className="rounded-full bg-zinc-100 p-2.5 active:scale-90 transition">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-6 py-3">
        <div className="rounded-2xl bg-teal-50 border border-teal-100 px-4 py-3">
          <p className="text-sm font-bold text-teal-800">{airport} → {destination?.name ?? "—"}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-2 space-y-2">
        {trip.length === 0 ? (
          <div className="h-32 rounded-3xl bg-zinc-50 flex items-center justify-center text-sm text-zinc-400">
            No items yet — go explore!
          </div>
        ) : (
          trip.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
              {item.image_url && (
                <img src={item.image_url} alt={item.name} className="h-10 w-10 rounded-xl object-cover shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-zinc-900 truncate">{item.name}</p>
                <p className="text-xs text-zinc-400 capitalize">{item.section}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-black text-sm text-teal-700">{money(item.price)}</span>
                <button onClick={() => onRemove(item.id)} className="rounded-full bg-zinc-200 p-1.5 active:scale-90 transition">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-6 pb-8 pt-4 border-t border-zinc-100">
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-zinc-500">Total</span>
          <span className="text-3xl font-black text-zinc-900">{money(total)}</span>
        </div>
        <button className="w-full rounded-2xl bg-teal-700 py-4 font-bold text-white shadow-lg shadow-teal-700/20 active:scale-95 transition">
          Confirm Trip
        </button>
      </div>
    </div>
  </div>
);

// ─── Passkey Modal ────────────────────────────────────────────────────────────

const PasskeyModal = ({ pass, setPass, onSubmit, onClose }: {
  pass: string; setPass: (v: string) => void; onSubmit: () => void; onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
    <div
      className="w-full max-w-[430px] rounded-t-[32px] bg-white px-6 pb-10 pt-5 animate-soft-rise"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-center mb-5">
        <div className="h-1 w-10 rounded-full bg-zinc-200" />
      </div>
      <h2 className="font-display text-2xl font-bold text-zinc-900 mb-1">Admin access</h2>
      <p className="text-sm text-zinc-400 mb-5">Enter passkey to edit content</p>
      <input
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        type="password"
        inputMode="numeric"
        placeholder="••••"
        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-xl text-center tracking-[0.5em] outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 mb-3"
      />
      <button onClick={onSubmit} className="w-full rounded-2xl bg-teal-700 py-4 font-bold text-white active:scale-95 transition">
        Enter
      </button>
    </div>
  </div>
);

export default Index;
