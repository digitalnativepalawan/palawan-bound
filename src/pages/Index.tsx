import { useEffect, useMemo, useState } from "react";
import { Edit3, MapPin, Plane, Plus, Ship, Trash2, UserRound, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Destination = {
  id: string;
  code: "A" | "B" | "C" | "D" | "E";
  name: string;
  image_url: string | null;
  map_hint: string | null;
  sort_order: number;
};

type Section = "stay" | "experiences" | "lifestyle" | "transport";
type TransportMode = "Air" | "Sea" | "Land";
type LandType = "Public" | "Private" | "Private with driver";

type TravelItem = {
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

const sectionLabels: Record<Section, string> = {
  stay: "Stay",
  experiences: "Experiences",
  lifestyle: "Lifestyle",
  transport: "Transport",
};

const sectionOrder: Section[] = ["stay", "experiences", "lifestyle", "transport"];
const airports = ["Puerto Princesa Airport", "El Nido Airport", "Busuanga Airport"];
const money = (value: number) => `₱${Number(value || 0).toLocaleString("en-PH")}`;

const Index = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [items, setItems] = useState<TravelItem[]>([]);
  const [origin, setOrigin] = useState("");
  const [airport, setAirport] = useState(airports[0]);
  const [destinationId, setDestinationId] = useState("");
  const [trip, setTrip] = useState<TravelItem[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const selectedDestination = destinations.find((destination) => destination.id === destinationId) ?? destinations[0];
  const destinationItems = items.filter((item) => item.destination_id === selectedDestination?.id && item.active);
  const total = useMemo(() => trip.reduce((sum, item) => sum + Number(item.price), 0), [trip]);

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!destinationId && destinations[0]) setDestinationId(destinations[0].id);
  }, [destinations, destinationId]);

  const loadData = async () => {
    setIsLoading(true);
    const [{ data: destinationRows }, { data: itemRows }] = await Promise.all([
      db.from("destinations").select("*").order("sort_order", { ascending: true }),
      db.from("travel_items").select("*").order("sort_order", { ascending: true }),
    ]);
    setDestinations((destinationRows ?? []) as Destination[]);
    setItems(((itemRows ?? []) as TravelItem[]).map((item) => ({ ...item, price: Number(item.price) })));
    setIsLoading(false);
  };

  const recordEdit = async (entityType: "destination" | "item", entityId: string, fieldName: string, oldValue: unknown, newValue: unknown) => {
    await db.from("admin_edits").insert({
      entity_type: entityType,
      entity_id: entityId,
      field_name: fieldName,
      old_value: String(oldValue ?? ""),
      new_value: String(newValue ?? ""),
    });
  };

  const updateDestination = async (id: string, field: keyof Pick<Destination, "name" | "image_url" | "map_hint">, value: string) => {
    const previous = destinations.find((destination) => destination.id === id)?.[field];
    setDestinations((current) => current.map((destination) => (destination.id === id ? { ...destination, [field]: value } : destination)));
    await db.from("destinations").update({ [field]: value }).eq("id", id);
    await recordEdit("destination", id, field, previous, value);
  };

  const updateItem = async (id: string, patch: Partial<TravelItem>) => {
    const previous = items.find((item) => item.id === id);
    const cleanPatch = { ...patch, price: patch.price === undefined ? undefined : Number(patch.price) };
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...cleanPatch } : item)));
    await db.from("travel_items").update(cleanPatch).eq("id", id);
    const changedField = Object.keys(patch)[0] ?? "item";
    await recordEdit("item", id, changedField, previous?.[changedField as keyof TravelItem], patch[changedField as keyof TravelItem]);
  };

  const addItem = async (section: Section) => {
    if (!selectedDestination) return;
    const payload = {
      destination_id: selectedDestination.id,
      section,
      name: section === "transport" ? "New route" : "New package",
      price: 0,
      short_info: "Add short details.",
      transport_mode: section === "transport" ? "Land" : null,
      land_type: section === "transport" ? "Private" : null,
      duration: section === "transport" ? "1 hr" : null,
      route_from: section === "transport" ? airport : null,
      route_to: selectedDestination.name,
      sort_order: items.length + 1,
      active: true,
    };
    const { data } = await db.from("travel_items").insert(payload).select("*").single();
    if (data) setItems((current) => [...current, { ...(data as TravelItem), price: Number(data.price) }]);
  };

  const removeItem = async (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    setTrip((current) => current.filter((item) => item.id !== id));
    await db.from("travel_items").delete().eq("id", id);
  };

  const toggleTripItem = (item: TravelItem) => {
    setTrip((current) => (current.some((tripItem) => tripItem.id === item.id) ? current.filter((tripItem) => tripItem.id !== item.id) : [...current, item]));
  };

  const submitAdmin = () => {
    if (adminPass === "5309") {
      setIsAdmin(true);
      setAdminPass("");
      setAdminOpen(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-28 text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Palawan planner</p>
            <h1 className="font-display text-2xl font-bold leading-tight">Build your island trip</h1>
          </div>
          <button className="rounded-full border border-border bg-card p-2 shadow-card" aria-label="Admin" onClick={() => setAdminOpen(true)}>
            <Edit3 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-xl space-y-5 px-4 py-5">
        <section className="soft-panel space-y-4 p-4 animate-soft-rise">
          <div className="grid grid-cols-1 gap-3">
            <label className="space-y-1 text-sm font-semibold">
              Origin
              <input value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="Where are you starting?" className="w-full rounded-xl border border-input bg-card px-3 py-3 text-base outline-none ring-ring focus:ring-2" />
            </label>
            <label className="space-y-1 text-sm font-semibold">
              Airport
              <select value={airport} onChange={(event) => setAirport(event.target.value)} className="w-full rounded-xl border border-input bg-card px-3 py-3 text-base outline-none ring-ring focus:ring-2">
                {airports.map((airportName) => (
                  <option key={airportName}>{airportName}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Destination</h2>
            {isLoading && <span className="text-sm text-muted-foreground">Loading</span>}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {destinations.map((destination) => (
              <button key={destination.id} onClick={() => setDestinationId(destination.id)} className={`rounded-2xl border px-3 py-3 text-center font-bold shadow-card transition ${destinationId === destination.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}>
                {destination.code}
              </button>
            ))}
          </div>
          {selectedDestination && (
            <div className="travel-card overflow-hidden">
              <ImageBlock destination={selectedDestination} />
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-primary">Destination {selectedDestination.code}</p>
                    {isAdmin ? <AdminInput value={selectedDestination.name} onSave={(value) => updateDestination(selectedDestination.id, "name", value)} /> : <h2 className="font-display text-2xl font-bold">{selectedDestination.name}</h2>}
                  </div>
                  <MapPin className="mt-2 h-5 w-5 text-primary" />
                </div>
                {isAdmin && (
                  <div className="grid gap-2">
                    <AdminInput label="Image URL" value={selectedDestination.image_url ?? ""} onSave={(value) => updateDestination(selectedDestination.id, "image_url", value)} />
                    <AdminInput label="Map hint" value={selectedDestination.map_hint ?? ""} onSave={(value) => updateDestination(selectedDestination.id, "map_hint", value)} />
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="soft-panel p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-full bg-secondary p-2 text-secondary-foreground"><MapPin className="h-4 w-4" /></div>
            <div>
              <h2 className="font-display text-xl font-bold">Map preview</h2>
              <p className="text-sm text-muted-foreground">{selectedDestination?.map_hint || "Simple route preview"}</p>
            </div>
          </div>
          <div className="relative h-36 overflow-hidden rounded-2xl border border-border bg-sand">
            <div className="absolute left-5 top-6 h-16 w-16 rounded-full bg-ocean/20" />
            <div className="absolute bottom-5 right-7 h-20 w-20 rounded-full bg-palm/20" />
            <div className="absolute left-10 right-10 top-1/2 border-t-2 border-dashed border-primary" />
            <div className="absolute left-6 top-[52px] rounded-full bg-card px-3 py-1 text-xs font-bold shadow-card">{airport.replace(" Airport", "")}</div>
            <div className="absolute right-6 top-[52px] rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">{selectedDestination?.code}</div>
          </div>
        </section>

        {sectionOrder.map((section) => (
          <section key={section} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">{sectionLabels[section]}</h2>
              {isAdmin && <button onClick={() => addItem(section)} className="rounded-full bg-secondary px-3 py-2 text-sm font-bold text-secondary-foreground"><Plus className="mr-1 inline h-4 w-4" />Add</button>}
            </div>
            <div className="space-y-3">
              {destinationItems.filter((item) => item.section === section).map((item) => (
                <article key={item.id} className="travel-card p-4">
                  {editingItemId === item.id && isAdmin ? (
                    <ItemEditor item={item} onClose={() => setEditingItemId(null)} onDelete={() => removeItem(item.id)} onSave={(patch) => updateItem(item.id, patch)} />
                  ) : (
                    <ItemCard item={item} inTrip={trip.some((tripItem) => tripItem.id === item.id)} isAdmin={isAdmin} onEdit={() => setEditingItemId(item.id)} onToggle={() => toggleTripItem(item)} />
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Trip total</p>
            <p className="text-xl font-extrabold">{money(total)}</p>
          </div>
          <button onClick={() => setReviewOpen(true)} className="rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground shadow-lift">Review Trip</button>
        </div>
      </div>

      {reviewOpen && <ReviewSheet origin={origin} airport={airport} destination={selectedDestination} trip={trip} total={total} onClose={() => setReviewOpen(false)} />}
      {adminOpen && !isAdmin && <AdminPasskey pass={adminPass} setPass={setAdminPass} onClose={() => setAdminOpen(false)} onSubmit={submitAdmin} />}
      {isAdmin && <button onClick={() => setIsAdmin(false)} className="fixed bottom-24 right-4 z-30 rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground shadow-lift">Exit admin</button>}
    </main>
  );
};

const ImageBlock = ({ destination }: { destination: Destination }) => (
  <div className="flex h-40 items-center justify-center bg-secondary text-secondary-foreground">
    {destination.image_url ? <img src={destination.image_url} alt={destination.name} className="h-full w-full object-cover" /> : <div className="text-center"><Ship className="mx-auto mb-2 h-8 w-8" /><p className="text-sm font-bold">Image editable in admin</p></div>}
  </div>
);

const ItemCard = ({ item, inTrip, isAdmin, onToggle, onEdit }: { item: TravelItem; inTrip: boolean; isAdmin: boolean; onToggle: () => void; onEdit: () => void }) => (
  <div className="space-y-3">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-lg font-extrabold">{item.name}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{item.short_info}</p>
      </div>
      <p className="shrink-0 font-extrabold text-primary">{money(item.price)}</p>
    </div>
    {item.section === "transport" && <TransportMeta item={item} />}
    <div className="flex gap-2">
      <button onClick={onToggle} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold ${inTrip ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}>{inTrip ? "Added" : "Add to trip"}</button>
      {isAdmin && <button onClick={onEdit} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold">Edit</button>}
    </div>
  </div>
);

const TransportMeta = ({ item }: { item: TravelItem }) => {
  const Icon = item.transport_mode === "Air" ? Plane : item.transport_mode === "Sea" ? Ship : UserRound;
  return <div className="flex flex-wrap gap-2 text-xs font-bold text-muted-foreground"><span className="rounded-full bg-muted px-3 py-1"><Icon className="mr-1 inline h-3 w-3" />{item.transport_mode}</span>{item.land_type && <span className="rounded-full bg-muted px-3 py-1">{item.land_type}</span>}{item.duration && <span className="rounded-full bg-muted px-3 py-1">{item.duration}</span>}</div>;
};

const AdminInput = ({ value, onSave, label }: { value: string; onSave: (value: string) => void; label?: string }) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <label className="block space-y-1 text-sm font-bold">{label}<input value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => onSave(draft)} className="w-full rounded-xl border border-input bg-card px-3 py-2 text-base outline-none ring-ring focus:ring-2" /></label>;
};

const ItemEditor = ({ item, onSave, onClose, onDelete }: { item: TravelItem; onSave: (patch: Partial<TravelItem>) => void; onClose: () => void; onDelete: () => void }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between"><h3 className="font-display text-xl font-bold">Edit item</h3><button onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button></div>
    <AdminInput value={item.name} label="Name" onSave={(value) => onSave({ name: value })} />
    <AdminInput value={String(item.price)} label="Price" onSave={(value) => onSave({ price: Number(value) })} />
    <AdminInput value={item.short_info} label="Short info" onSave={(value) => onSave({ short_info: value })} />
    <AdminInput value={item.image_url ?? ""} label="Image URL" onSave={(value) => onSave({ image_url: value })} />
    {item.section === "transport" && <TransportEditor item={item} onSave={onSave} />}
    <button onClick={onDelete} className="w-full rounded-xl border border-destructive px-4 py-3 font-bold text-destructive"><Trash2 className="mr-2 inline h-4 w-4" />Delete</button>
  </div>
);

const TransportEditor = ({ item, onSave }: { item: TravelItem; onSave: (patch: Partial<TravelItem>) => void }) => (
  <div className="grid gap-3">
    <label className="space-y-1 text-sm font-bold">Mode<select value={item.transport_mode ?? "Land"} onChange={(event) => onSave({ transport_mode: event.target.value as TransportMode })} className="w-full rounded-xl border border-input bg-card px-3 py-2"><option>Air</option><option>Sea</option><option>Land</option></select></label>
    <label className="space-y-1 text-sm font-bold">Land type<select value={item.land_type ?? "Private"} onChange={(event) => onSave({ land_type: event.target.value as LandType })} className="w-full rounded-xl border border-input bg-card px-3 py-2"><option>Public</option><option>Private</option><option>Private with driver</option></select></label>
    <AdminInput value={item.duration ?? ""} label="Duration" onSave={(value) => onSave({ duration: value })} />
    <AdminInput value={item.route_from ?? ""} label="Route from" onSave={(value) => onSave({ route_from: value })} />
  </div>
);

const ReviewSheet = ({ origin, airport, destination, trip, total, onClose }: { origin: string; airport: string; destination?: Destination; trip: TravelItem[]; total: number; onClose: () => void }) => (
  <div className="fixed inset-0 z-40 bg-foreground/30 p-4 backdrop-blur-sm"><div className="mx-auto mt-10 max-w-xl rounded-3xl bg-background p-5 shadow-lift"><div className="mb-4 flex items-start justify-between"><div><p className="text-sm font-bold text-primary">Summary</p><h2 className="font-display text-2xl font-bold">Your trip</h2></div><button onClick={onClose}><X className="h-5 w-5" /></button></div><div className="mb-4 rounded-2xl bg-surface p-3 text-sm"><p><b>Origin:</b> {origin || "Not set"}</p><p><b>Airport:</b> {airport}</p><p><b>Destination:</b> {destination?.name}</p></div><div className="max-h-72 space-y-2 overflow-y-auto">{trip.length === 0 ? <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">No items added yet.</p> : trip.map((item) => <div key={item.id} className="flex justify-between gap-3 rounded-2xl border border-border bg-card p-3 text-sm"><span>{item.name}</span><b>{money(item.price)}</b></div>)}</div><div className="mt-4 flex items-center justify-between border-t border-border pt-4"><span className="font-bold">Total</span><span className="text-2xl font-extrabold text-primary">{money(total)}</span></div></div></div>
);

const AdminPasskey = ({ pass, setPass, onSubmit, onClose }: { pass: string; setPass: (value: string) => void; onSubmit: () => void; onClose: () => void }) => (
  <div className="fixed inset-0 z-40 bg-foreground/30 p-4 backdrop-blur-sm"><div className="mx-auto mt-24 max-w-sm rounded-3xl bg-background p-5 shadow-lift"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-2xl font-bold">Admin</h2><button onClick={onClose}><X className="h-5 w-5" /></button></div><input value={pass} onChange={(event) => setPass(event.target.value)} inputMode="numeric" placeholder="Passkey" className="mb-3 w-full rounded-xl border border-input bg-card px-3 py-3 text-base outline-none ring-ring focus:ring-2" /><button onClick={onSubmit} className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground">Enter</button></div></div>
);

export default Index;