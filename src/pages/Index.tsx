import { useEffect, useMemo, useState } from "react";
import { Edit3, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import TripHero from "@/components/TripHero";
import TravelCard from "@/components/TravelCard";
import AdminPanel from "@/components/AdminPanel";

// ─── Types ───────────────────────────────────────────────────────────────────

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

const SECTIONS: { key: Section; label: string }[] = [
  { key: "stay", label: "Stay" },
  { key: "experiences", label: "Experiences" },
  { key: "lifestyle", label: "Lifestyle" },
  { key: "transport", label: "Transport" },
];

const AIRPORTS = ["Puerto Princesa", "El Nido", "Busuanga"];

export const money = (v: number) =>
  `₱${Number(v || 0).toLocaleString("en-PH")}`;

// ─── Main Page ────────────────────────────────────────────────────────────────

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

  const selectedDest =
    destinations.find((d) => d.id === destinationId) ?? destinations[0];

  const destItems = useMemo(
    () =>
      items.filter(
        (item) => item.destination_id === selectedDest?.id && item.active,
      ),
    [items, selectedDest],
  );

  const visibleSections =
    activeSection === "all"
      ? SECTIONS
      : SECTIONS.filter((s) => s.key === activeSection);

  const total = useMemo(
    () => trip.reduce((sum, item) => sum + Number(item.price), 0),
    [trip],
  );

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    void loadData();
  }, []);

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
    setItems(
      ((iRows ?? []) as TravelItem[]).map((i) => ({
        ...i,
        price: Number(i.price),
      })),
    );
    setIsLoading(false);
  };

  // ── Admin helpers ─────────────────────────────────────────────────────────

  const recordEdit = async (
    entityType: string,
    entityId: string,
    fieldName: string,
    oldValue: unknown,
    newValue: unknown,
  ) => {
    await db.from("admin_edits").insert({
      entity_type: entityType,
      entity_id: entityId,
      field_name: fieldName,
      old_value: String(oldValue ?? ""),
      new_value: String(newValue ?? ""),
    });
  };

  const updateDestination = async (
    id: string,
    field: keyof Pick<Destination, "name" | "image_url" | "map_hint">,
    value: string,
  ) => {
    const prev = destinations.find((d) => d.id === id)?.[field];
    setDestinations((cur) =>
      cur.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
    await db.from("destinations").update({ [field]: value }).eq("id", id);
    await recordEdit("destination", id, field, prev, value);
  };

  const updateItem = async (id: string, patch: Partial<TravelItem>) => {
    const prev = items.find((i) => i.id === id);
    const clean = {
      ...patch,
      price: patch.price !== undefined ? Number(patch.price) : undefined,
    };
    setItems((cur) =>
      cur.map((i) => (i.id === id ? { ...i, ...clean } : i)),
    );
    setTrip((cur) =>
      cur.map((i) => (i.id === id ? { ...i, ...clean } : i)),
    );
    await db.from("travel_items").update(clean).eq("id", id);
    const field = Object.keys(patch)[0] ?? "item";
    await recordEdit(
      "item",
      id,
      field,
      prev?.[field as keyof TravelItem],
      patch[field as keyof TravelItem],
    );
  };

  const addItem = async (section: Section) => {
    if (!selectedDest) return;
    const payload = {
      destination_id: selectedDest.id,
      section,
      name: section === "transport" ? "New route" : "New package",
      price: 0,
      short_info: "Add details.",
      transport_mode: section === "transport" ? "Land" : null,
      land_type: section === "transport" ? "Private" : null,
      duration: section === "transport" ? "1 hr" : null,
      route_from: section === "transport" ? airport : null,
      route_to: selectedDest.name,
      sort_order: items.length + 1,
      active: true,
    };
    const { data } = await db
      .from("travel_items")
      .insert(payload)
      .select("*")
      .single();
    if (data)
      setItems((cur) => [
        ...cur,
        { ...(data as TravelItem), price: Number(data.price) },
      ]);
  };

  const removeItem = async (id: string) => {
    setItems((cur) => cur.filter((i) => i.id !== id));
    setTrip((cur) => cur.filter((i) => i.id !== id));
    await db.from("travel_items").delete().eq("id", id);
  };

  // ── Trip ──────────────────────────────────────────────────────────────────

  const toggleTrip = (item: TravelItem) =>
    setTrip((cur) =>
      cur.some((t) => t.id === item.id)
        ? cur.filter((t) => t.id !== item.id)
        : [...cur, item],
    );

  // ── Admin auth ────────────────────────────────────────────────────────────

  const submitAdmin = () => {
    if (adminPass === "5309") {
      setIsAdmin(true);
      setAdminPass("");
      setAdminOpen(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-background font-sans text-foreground antialiased">

      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-4 bg-background/80 backdrop-blur-xl border-b border-white/10">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ocean/70">
            Palawan
          </p>
          <h1 className="font-display text-[1.35rem] font-bold leading-tight tracking-tight text-foreground">
            Build your island trip
          </h1>
        </div>
        <button
          aria-label="Admin"
          onClick={() => (isAdmin ? setIsAdmin(false) : setAdminOpen(true))}
          className={`rounded-full p-2.5 transition active:scale-90 ${isAdmin ? "bg-coral text-white" : "bg-white/70 backdrop-blur border border-border shadow-card"}`}
        >
          <Edit3 className="h-4 w-4" />
        </button>
      </header>

      <div className="mx-auto max-w-md space-y-0">

        {/* ── AIRPORT SELECTOR (trip context) ── */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white/70 backdrop-blur border border-border shadow-card px-4 py-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Flying from
            </span>
            <div className="flex gap-2 overflow-x-auto scrollbar-none flex-1">
              {AIRPORTS.map((ap) => (
                <button
                  key={ap}
                  onClick={() => setAirport(ap)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition active:scale-95 ${airport === ap ? "bg-ocean text-white" : "bg-muted text-muted-foreground"}`}
                >
                  {ap}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── DESTINATION PILLS ── */}
        <div className="px-5 pb-4">
          <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1">
            {destinations.map((d) => (
              <button
                key={d.id}
                onClick={() => setDestinationId(d.id)}
                className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-extrabold tracking-wide transition-all duration-200 active:scale-95 ${d.id === destinationId ? "bg-ocean text-white shadow-lift" : "bg-white/70 backdrop-blur border border-border text-foreground shadow-card"}`}
              >
                {d.code}
              </button>
            ))}
          </div>
        </div>

        {/* ── HERO DESTINATION CARD ── */}
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

        {/* ── CATEGORY FILTER TABS ── */}
        <div className="px-5 pb-5">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveSection("all")}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition active:scale-95 ${activeSection === "all" ? "bg-foreground text-background" : "bg-white/70 backdrop-blur border border-border text-muted-foreground"}`}
            >
              All
            </button>
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition active:scale-95 ${activeSection === s.key ? "bg-foreground text-background" : "bg-white/70 backdrop-blur border border-border text-muted-foreground"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── SECTIONS ── */}
        {isLoading ? (
          <div className="px-5 space-y-3 pb-36">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-8 px-5 pb-36">
            {visibleSections.map((s) => {
              const sectionItems = destItems.filter(
                (item) => item.section === s.key,
              );
              if (!isAdmin && sectionItems.length === 0) return null;
              return (
                <section key={s.key}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-display text-xl font-bold">
                      {s.label}
                    </h2>
                    {isAdmin && (
                      <button
                        onClick={() => addItem(s.key)}
                        className="rounded-full bg-ocean/10 px-3 py-1.5 text-xs font-bold text-ocean active:scale-95 transition"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {sectionItems.map((item) => (
                      <TravelCard
                        key={item.id}
                        item={item}
                        inTrip={trip.some((t) => t.id === item.id)}
                        isAdmin={isAdmin}
                        onToggle={() => toggleTrip(item)}
                        onUpdate={(patch) => updateItem(item.id, patch)}
                        onDelete={() => removeItem(item.id)}
                      />
                    ))}
                    {isAdmin && sectionItems.length === 0 && (
                      <div className="rounded-3xl border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                        No items yet — tap + Add
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
      <div className="fixed inset-x-0 bottom-0 z-30 px-5 pb-6 pt-3 bg-background/90 backdrop-blur-xl border-t border-white/10">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Trip total
            </p>
            <p className="text-2xl font-extrabold tracking-tight">
              {money(total)}
            </p>
            {trip.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {trip.length} item{trip.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <button
            onClick={() => setReviewOpen(true)}
            className="rounded-2xl bg-ocean px-7 py-4 font-bold text-white shadow-lift active:scale-95 transition-all duration-150"
          >
            Review Trip
          </button>
        </div>
      </div>

      {/* ── REVIEW SHEET ── */}
      {reviewOpen && (
        <ReviewSheet
          airport={airport}
          destination={selectedDest}
          trip={trip}
          total={total}
          onClose={() => setReviewOpen(false)}
          onRemove={(id) => setTrip((cur) => cur.filter((t) => t.id !== id))}
        />
      )}

      {/* ── ADMIN PASSKEY MODAL ── */}
      {adminOpen && !isAdmin && (
        <AdminPasskeyModal
          pass={adminPass}
          setPass={setAdminPass}
          onClose={() => setAdminOpen(false)}
          onSubmit={submitAdmin}
        />
      )}

      {/* ── ADMIN PANEL (slide from right) ── */}
      {isAdmin && selectedDest && (
        <AdminPanel
          destination={selectedDest}
          onUpdateDestination={updateDestination}
          onClose={() => setIsAdmin(false)}
        />
      )}
    </div>
  );
};

// ─── Review Bottom Sheet ──────────────────────────────────────────────────────

const ReviewSheet = ({
  airport,
  destination,
  trip,
  total,
  onClose,
  onRemove,
}: {
  airport: string;
  destination?: Destination;
  trip: TravelItem[];
  total: number;
  onClose: () => void;
  onRemove: (id: string) => void;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-end"
    onClick={onClose}
  >
    <div
      className="w-full max-h-[85vh] rounded-t-3xl bg-background/95 backdrop-blur-xl border-t border-white/10 shadow-lift overflow-hidden flex flex-col animate-soft-rise"
      onClick={(e) => e.stopPropagation()}
    >
      {/* drag handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
      </div>

      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Summary
          </p>
          <h2 className="font-display text-2xl font-bold">Your Trip</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-full bg-muted p-2.5 active:scale-90 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* trip context */}
      <div className="mx-5 mt-4 rounded-2xl bg-ocean/10 px-4 py-3 text-sm">
        <p className="font-bold text-ocean">
          {airport} → {destination?.name ?? "—"}
        </p>
      </div>

      {/* items list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {trip.length === 0 ? (
          <div className="rounded-3xl bg-muted p-8 text-center text-sm text-muted-foreground">
            No items added yet. Go back and pick some!
          </div>
        ) : (
          trip.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {item.section}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-extrabold text-ocean">
                  {money(item.price)}
                </span>
                <button
                  onClick={() => onRemove(item.id)}
                  className="rounded-full bg-muted p-1.5 active:scale-90 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* total footer */}
      <div className="px-5 pb-8 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-muted-foreground">Total</span>
          <span className="text-3xl font-extrabold text-ocean">
            {money(total)}
          </span>
        </div>
        <button className="w-full rounded-2xl bg-ocean py-4 font-bold text-white shadow-lift active:scale-95 transition">
          Confirm Trip
        </button>
      </div>
    </div>
  </div>
);

// ─── Admin Passkey Modal ──────────────────────────────────────────────────────

const AdminPasskeyModal = ({
  pass,
  setPass,
  onSubmit,
  onClose,
}: {
  pass: string;
  setPass: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-end"
    onClick={onClose}
  >
    <div
      className="w-full rounded-t-3xl bg-background/95 backdrop-blur-xl border-t border-white/10 px-5 pb-10 pt-6 shadow-lift animate-soft-rise"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-center mb-5">
        <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
      </div>
      <h2 className="font-display text-2xl font-bold mb-1">Admin access</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Enter passkey to edit content
      </p>
      <input
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        type="password"
        inputMode="numeric"
        placeholder="••••"
        className="w-full rounded-2xl border border-input bg-card px-4 py-4 text-lg text-center tracking-[0.4em] outline-none ring-ocean focus:ring-2 mb-3"
      />
      <button
        onClick={onSubmit}
        className="w-full rounded-2xl bg-ocean py-4 font-bold text-white active:scale-95 transition"
      >
        Enter
      </button>
    </div>
  </div>
);

export default Index;
