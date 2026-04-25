import { useEffect, useMemo, useState } from "react";
import { Edit3, X, Plus, Minus, Check, Users, Calendar, MapPin, ShieldCheck, Trash2, Plane, Ship, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

const db = supabase as any;

const SECTIONS: { key: Section; label: string; emoji: string }[] = [
  { key: "stay", label: "Accommodation", emoji: "🏠" },
  { key: "experiences", label: "Experiences", emoji: "🤿" },
  { key: "lifestyle", label: "Lifestyle", emoji: "🌿" },
  { key: "transport", label: "Transport", emoji: "🚌" },
];

const AIRPORTS = ["Puerto Princesa", "El Nido", "Busuanga"];
const DAY_OPTIONS = [3, 5, 7];

const money = (v: number) => `₱${Number(v || 0).toLocaleString("en-PH")}`;

// ─── Main ─────────────────────────────────────────────────────────────────────

const Index = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [items, setItems] = useState<TravelItem[]>([]);
  const [airport, setAirport] = useState(AIRPORTS[0]);
  const [destinationId, setDestinationId] = useState("");
  const [days, setDays] = useState(3);
  const [guests, setGuests] = useState(2);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingItem, setEditingItem] = useState<TravelItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const selectedDest = destinations.find((d) => d.id === destinationId) ?? destinations[0];

  const destItems = useMemo(
    () => items.filter((i) => i.destination_id === selectedDest?.id && i.active),
    [items, selectedDest],
  );

  // base price = sum of all active items for this destination
  const basePerPersonPerDay = useMemo(
    () => destItems.reduce((s, i) => s + Number(i.price), 0),
    [destItems],
  );

  const totalPrice = useMemo(
    () => basePerPersonPerDay * days * guests,
    [basePerPersonPerDay, days, guests],
  );

  const pricePerPerson = useMemo(
    () => basePerPersonPerDay * days,
    [basePerPersonPerDay, days],
  );

  useEffect(() => { void loadData(); }, []);
  useEffect(() => {
    if (!destinationId && destinations[0]) setDestinationId(destinations[0].id);
  }, [destinations, destinationId]);

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
    await db.from("travel_items").update(clean).eq("id", id);
    const field = Object.keys(patch)[0] ?? "item";
    await recordEdit("item", id, field, prev?.[field as keyof TravelItem], patch[field as keyof TravelItem]);
  };

  const addItem = async (section: Section) => {
    if (!selectedDest) return;
    const payload = {
      destination_id: selectedDest.id, section,
      name: "New item", price: 0, short_info: "Add details.",
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
    await db.from("travel_items").delete().eq("id", id);
  };

  const submitAdmin = () => {
    if (adminPass === "5309") { setIsAdmin(true); setAdminPass(""); setAdminOpen(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-100">

      {/* ── PHONE FRAME (mobile-first, scales up) ── */}
      <div className="mx-auto w-full max-w-[480px] min-h-screen bg-white shadow-2xl flex flex-col md:my-0 md:min-h-screen">

        {/* HEADER */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-zinc-100 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-teal-600">Palawan</p>
            <h1 className="font-display text-xl font-bold text-zinc-900 leading-tight">Build your island trip</h1>
          </div>
          <button
            onClick={() => isAdmin ? setIsAdmin(false) : setAdminOpen(true)}
            className={`rounded-full p-2.5 border transition active:scale-90 ${isAdmin ? "bg-orange-500 border-orange-400 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-500"}`}
          >
            <Edit3 className="h-4 w-4" />
          </button>
        </header>

        {/* ADMIN BADGE */}
        {isAdmin && (
          <div className="bg-orange-50 border-b border-orange-100 px-5 py-2 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-xs font-bold text-orange-600">Admin mode active — tap Edit on any item</span>
            <button onClick={() => setIsAdmin(false)} className="ml-auto text-xs font-bold text-orange-400">Exit</button>
          </div>
        )}

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto pb-36">

          {/* AIRPORT */}
          <div className="px-5 pt-5 pb-3">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Flying from</p>
            <div className="flex gap-2 flex-wrap">
              {AIRPORTS.map((ap) => (
                <button key={ap} onClick={() => setAirport(ap)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition active:scale-95 ${airport === ap ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                  {ap}
                </button>
              ))}
            </div>
          </div>

          {/* DESTINATION */}
          <div className="px-5 pb-4">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Destination</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {destinations.map((d) => (
                <button key={d.id} onClick={() => setDestinationId(d.id)}
                  className={`shrink-0 rounded-2xl px-4 py-2.5 text-xs font-black transition-all active:scale-90 ${d.id === destinationId ? "bg-teal-700 text-white shadow-lg shadow-teal-700/25" : "bg-zinc-100 text-zinc-600"}`}>
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* HERO */}
          {selectedDest && (
            <div className="px-5 pb-5">
              <div className="relative overflow-hidden rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
                <div className="relative h-[300px] w-full">
                  {selectedDest.image_url ? (
                    <img src={selectedDest.image_url} alt={selectedDest.name} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-900 to-teal-600" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* route pills */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="rounded-full bg-white/15 backdrop-blur border border-white/20 px-3 py-1.5 text-xs font-bold text-white">{airport}</span>
                    <span className="text-white/40 text-xs">→</span>
                    <span className="rounded-full bg-white/15 backdrop-blur border border-white/20 px-3 py-1.5 text-xs font-bold text-white">{selectedDest.name}</span>
                  </div>

                  {/* bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
                    <h2 className="font-display text-3xl font-bold text-white leading-none mb-1">{selectedDest.name}</h2>
                    {selectedDest.map_hint && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-white/50" />
                        <p className="text-sm text-white/60">{selectedDest.map_hint}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ADMIN: image url */}
                {isAdmin && (
                  <div className="bg-zinc-900 px-4 py-3 flex gap-2">
                    <input
                      defaultValue={selectedDest.image_url ?? ""}
                      onBlur={(e) => updateDestination(selectedDest.id, "image_url", e.target.value)}
                      placeholder="Image URL..."
                      className="flex-1 rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                    />
                    <input
                      defaultValue={selectedDest.name}
                      onBlur={(e) => updateDestination(selectedDest.id, "name", e.target.value)}
                      placeholder="Name..."
                      className="w-32 rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PACKAGE CONFIGURATOR ── */}
          <div className="px-5 pb-5">
            <div className="rounded-3xl border border-zinc-100 bg-zinc-50 overflow-hidden">

              {/* days selector */}
              <div className="px-5 pt-5 pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-teal-600" />
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-zinc-500">Duration</p>
                </div>
                <div className="flex gap-2">
                  {DAY_OPTIONS.map((d) => (
                    <button key={d} onClick={() => setDays(d)}
                      className={`flex-1 rounded-2xl py-3 text-sm font-black transition active:scale-95 ${days === d ? "bg-teal-700 text-white shadow-md shadow-teal-700/20" : "bg-white border border-zinc-200 text-zinc-600"}`}>
                      {d} days
                    </button>
                  ))}
                </div>
              </div>

              {/* guests selector */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-teal-600" />
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-zinc-500">Guests</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setGuests((g) => Math.max(1, g - 1))}
                      className="h-10 w-10 rounded-full border border-zinc-200 bg-white flex items-center justify-center active:scale-90 transition">
                      <Minus className="h-4 w-4 text-zinc-600" />
                    </button>
                    <span className="text-2xl font-black text-zinc-900 w-8 text-center">{guests}</span>
                    <button onClick={() => setGuests((g) => Math.min(20, g + 1))}
                      className="h-10 w-10 rounded-full bg-teal-700 flex items-center justify-center active:scale-90 transition">
                      <Plus className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-400 font-medium">{money(pricePerPerson)} / person</p>
                    <p className="text-2xl font-black text-teal-700">{money(totalPrice)}</p>
                    <p className="text-xs text-zinc-400">total for {guests} guest{guests !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── WHAT'S INCLUDED ── */}
          <div className="px-5 pb-5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">What's included</p>

            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map((i) => <div key={i} className="h-48 rounded-3xl bg-zinc-100 animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-8">
                {SECTIONS.map((s) => {
                  const sItems = destItems.filter((i) => i.section === s.key);
                  if (!isAdmin && sItems.length === 0) return null;
                  return (
                    <div key={s.key}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{s.emoji}</span>
                          <h3 className="font-display text-lg font-bold text-zinc-900">{s.label}</h3>
                        </div>
                        {isAdmin && (
                          <button onClick={() => addItem(s.key)}
                            className="rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-bold text-teal-700 active:scale-95 transition">
                            + Add
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {sItems.map((item) => (
                          <IncludedCard
                            key={item.id}
                            item={item}
                            isAdmin={isAdmin}
                            onEdit={() => setEditingItem(item)}
                          />
                        ))}
                        {isAdmin && sItems.length === 0 && (
                          <div className="h-24 rounded-3xl border-2 border-dashed border-zinc-200 flex items-center justify-center text-sm text-zinc-400">
                            No items — tap + Add
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── STICKY BOTTOM BAR ── */}
        <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-xl border-t border-zinc-100 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">All-inclusive total</p>
              <p className="text-2xl font-black text-zinc-900">{money(totalPrice)}</p>
              <p className="text-xs text-zinc-400">{days} days · {guests} guest{guests !== 1 ? "s" : ""} · {money(pricePerPerson)}/person</p>
            </div>
            <button onClick={() => setReviewOpen(true)}
              className="rounded-2xl bg-teal-700 px-6 py-4 font-bold text-white text-sm shadow-lg shadow-teal-700/25 active:scale-95 transition">
              Book Now →
            </button>
          </div>
        </div>
      </div>

      {/* ── ITEM EDIT MODAL (admin) ── */}
      {editingItem && isAdmin && (
        <EditModal
          item={editingItem}
          onSave={(patch) => { updateItem(editingItem.id, patch); setEditingItem(null); }}
          onDelete={() => { removeItem(editingItem.id); setEditingItem(null); }}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* ── REVIEW / BOOK SHEET ── */}
      {reviewOpen && (
        <ReviewSheet
          airport={airport}
          destination={selectedDest}
          days={days}
          guests={guests}
          items={destItems}
          pricePerPerson={pricePerPerson}
          total={totalPrice}
          onClose={() => setReviewOpen(false)}
        />
      )}

      {/* ── ADMIN PASSKEY ── */}
      {adminOpen && !isAdmin && (
        <PasskeyModal pass={adminPass} setPass={setAdminPass} onClose={() => setAdminOpen(false)} onSubmit={submitAdmin} />
      )}
    </div>
  );
};

// ─── Included Card ────────────────────────────────────────────────────────────

const IncludedCard = ({ item, isAdmin, onEdit }: { item: TravelItem; isAdmin: boolean; onEdit: () => void }) => (
  <div className="group relative overflow-hidden rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition active:scale-[0.99]">
    <div className="relative h-48 w-full">
      {item.image_url ? (
        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-teal-800 to-teal-500" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

      {/* included badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-teal-500/90 backdrop-blur px-2.5 py-1">
        <Check className="h-3 w-3 text-white" />
        <span className="text-[10px] font-black text-white uppercase tracking-wide">Included</span>
      </div>

      {/* transport mode */}
      {item.section === "transport" && item.transport_mode && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur px-3 py-1.5 text-xs font-bold text-white">
          {item.transport_mode === "Air" ? <Plane className="h-3 w-3" /> : item.transport_mode === "Sea" ? <Ship className="h-3 w-3" /> : <User className="h-3 w-3" />}
          {item.transport_mode}
        </div>
      )}

      {/* name + info */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
        <h4 className="font-display text-lg font-bold text-white leading-tight">{item.name}</h4>
        <p className="text-xs text-white/60 mt-0.5 line-clamp-1">{item.short_info}</p>
      </div>
    </div>

    {/* transport pills */}
    {item.section === "transport" && (
      <div className="flex flex-wrap gap-1.5 px-4 py-2.5 bg-white border-t border-zinc-100">
        {item.route_from && item.route_to && (
          <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-[10px] font-semibold text-zinc-500">{item.route_from} → {item.route_to}</span>
        )}
        {item.duration && <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-[10px] font-semibold text-zinc-500">{item.duration}</span>}
        {item.land_type && <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-[10px] font-semibold text-zinc-500">{item.land_type}</span>}
      </div>
    )}

    {isAdmin && (
      <div className={`px-4 py-2 bg-white ${item.section !== "transport" ? "border-t border-zinc-100" : ""}`}>
        <button onClick={onEdit} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-500 active:scale-90 transition">Edit</button>
      </div>
    )}
  </div>
);

// ─── Edit Modal ───────────────────────────────────────────────────────────────

const EditModal = ({ item, onSave, onDelete, onClose }: {
  item: TravelItem; onSave: (p: Partial<TravelItem>) => void; onDelete: () => void; onClose: () => void;
}) => {
  const [d, setD] = useState({ ...item });
  const f = (key: keyof TravelItem, label: string, type = "text") => (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</span>
      <input type={type} value={String(d[key] ?? "")}
        onChange={(e) => setD((c) => ({ ...c, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
        className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
      />
    </label>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-[480px] max-h-[85vh] overflow-y-auto rounded-t-[28px] bg-white px-5 py-5 animate-soft-rise" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center mb-4"><div className="h-1 w-10 rounded-full bg-zinc-200" /></div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold">Edit item</h3>
          <button onClick={onClose} className="rounded-full bg-zinc-100 p-2 active:scale-90"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          {f("name", "Name")}
          {f("price", "Base price per person per day (₱)", "number")}
          {f("short_info", "Short description")}
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
              {f("route_from", "From")}
              {f("route_to", "To")}
            </>
          )}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={() => onSave(d)} className="flex-1 rounded-2xl bg-teal-700 py-3.5 text-sm font-bold text-white active:scale-95 transition">Save changes</button>
          <button onClick={onDelete} className="rounded-2xl border border-red-200 px-4 py-3.5 text-red-400 active:scale-95 transition"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
};

// ─── Review Sheet ─────────────────────────────────────────────────────────────

const ReviewSheet = ({ airport, destination, days, guests, items, pricePerPerson, total, onClose }: {
  airport: string; destination?: Destination; days: number; guests: number;
  items: TravelItem[]; pricePerPerson: number; total: number; onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
    <div className="w-full max-w-[480px] max-h-[88vh] rounded-t-[32px] bg-white flex flex-col animate-soft-rise" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-center pt-3 pb-1"><div className="h-1 w-10 rounded-full bg-zinc-200" /></div>

      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">All-inclusive package</p>
          <h2 className="font-display text-2xl font-bold text-zinc-900">{destination?.name}</h2>
        </div>
        <button onClick={onClose} className="rounded-full bg-zinc-100 p-2.5 active:scale-90 transition"><X className="h-4 w-4" /></button>
      </div>

      {/* summary pills */}
      <div className="px-6 py-4 flex gap-2 border-b border-zinc-100">
        <span className="rounded-full bg-teal-50 border border-teal-100 px-3 py-1.5 text-xs font-bold text-teal-700">{airport} → {destination?.name}</span>
        <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-600">{days} days</span>
        <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-600">{guests} guest{guests !== 1 ? "s" : ""}</span>
      </div>

      {/* included items */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">What's included</p>
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-3">
            {item.image_url && <img src={item.image_url} alt={item.name} className="h-10 w-10 rounded-xl object-cover shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-zinc-900 truncate">{item.name}</p>
              <p className="text-xs text-zinc-400 capitalize">{item.section}</p>
            </div>
            <Check className="h-4 w-4 text-teal-500 shrink-0" />
          </div>
        ))}
      </div>

      {/* pricing footer */}
      <div className="px-6 pb-8 pt-4 border-t border-zinc-100">
        <div className="flex items-end justify-between mb-1">
          <div>
            <p className="text-sm text-zinc-400">{money(pricePerPerson)} × {guests} guest{guests !== 1 ? "s" : ""}</p>
            <p className="text-xs text-zinc-400">{days} days all-inclusive</p>
          </div>
          <p className="text-3xl font-black text-zinc-900">{money(total)}</p>
        </div>
        <button className="mt-4 w-full rounded-2xl bg-teal-700 py-4 font-bold text-white shadow-lg shadow-teal-700/20 active:scale-95 transition">
          Confirm Booking
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
    <div className="w-full max-w-[480px] rounded-t-[32px] bg-white px-6 pb-10 pt-5 animate-soft-rise" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-center mb-5"><div className="h-1 w-10 rounded-full bg-zinc-200" /></div>
      <h2 className="font-display text-2xl font-bold text-zinc-900 mb-1">Admin access</h2>
      <p className="text-sm text-zinc-400 mb-5">Enter passkey to edit content</p>
      <input value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        type="password" inputMode="numeric" placeholder="••••"
        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-xl text-center tracking-[0.5em] outline-none focus:border-teal-500 mb-3"
      />
      <button onClick={onSubmit} className="w-full rounded-2xl bg-teal-700 py-4 font-bold text-white active:scale-95 transition">Enter</button>
    </div>
  </div>
);

export default Index;
