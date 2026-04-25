// 🔥 UPDATED UI VERSION (SAFE – NO LOGIC BROKEN)

import { useEffect, useMemo, useState } from "react";
import { Edit3, MapPin, Plane, Plus, Ship, Trash2, UserRound, X } from "lucide-react";
import import { useEffect, useMemo, useState } from "react";
import { Editimport { useEffect, useMemo, useState } from "react";
import { Edit3, MapPin, Plane, Plus, Ship, Trash2, UserRound, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* TYPES */

type Destination = {
  id: string;
  code: "A" | "B" | "C" | "D" | "E";
  name: string;
  image_url: string | null;
  map_hint: string | null;
  sort_order: number;
};

type Section = "stay" | "experiences" | "lifestyle" | "transport";

type TravelItem = {
  id: string;
  destination_id: string;
  section: Section;
  name: string;
  price: number;
  short_info: string;
  image_url: string | null;
  transport_mode: string | null;
  land_type: string | null;
  duration: string | null;
  route_from: string | null;
  route_to: string | null;
  sort_order: number;
  active: boolean;
};

const db = supabase as any;

const sectionLabels = {
  stay: "Stay",
  experiences: "Experiences",
  lifestyle: "Lifestyle",
  transport: "Transport",
};

const sectionOrder: Section[] = ["stay", "experiences", "lifestyle", "transport"];
const airports = ["Puerto Princesa Airport", "El Nido Airport", "Busuanga Airport"];
const money = (v: number) => `₱${Number(v || 0).toLocaleString("en-PH")}`;

/* MAIN */

const Index = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [items, setItems] = useState<TravelItem[]>([]);
  const [airport, setAirport] = useState(airports[0]);
  const [destinationId, setDestinationId] = useState("");
  const [trip, setTrip] = useState<TravelItem[]>([]);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const selected =
    destinations.find((d) => d.id === destinationId) ?? destinations[0];

  const filtered = items.filter(
    (i) => i.destination_id === selected?.id && i.active
  );

  const total = useMemo(
    () => trip.reduce((sum, i) => sum + Number(i.price), 0),
    [trip]
  );

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!destinationId && destinations[0]) setDestinationId(destinations[0].id);
  }, [destinations]);

  const load = async () => {
    const { data: d } = await db.from("destinations").select("*").order("sort_order");
    const { data: i } = await db.from("travel_items").select("*").order("sort_order");
    setDestinations(d || []);
    setItems((i || []).map((x: any) => ({ ...x, price: Number(x.price) })));
  };

  const toggleTrip = (item: TravelItem) => {
    setTrip((cur) =>
      cur.some((t) => t.id === item.id)
        ? cur.filter((t) => t.id !== item.id)
        : [...cur, item]
    );
  };

  const login = () => {
    if (adminPass === "5309") {
      setIsAdmin(true);
      setAdminOpen(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-28">

      {/* HEADER */}
      <header className="sticky top-0 bg-white/80 backdrop-blur border-b px-4 py-3">
        <div className="max-w-xl mx-auto flex justify-between">
          <div>
            <p className="text-xs text-primary font-bold">PALAWAN</p>
            <h1 className="text-xl font-bold">Build your island trip</h1>
          </div>
          <button onClick={() => setAdminOpen(true)}>
            <Edit3 size={18} />
          </button>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-5 space-y-5">

        {/* HERO */}
        {selected && (
          <div className="relative rounded-2xl overflow-hidden shadow">
            <img
              src={selected.image_url || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"}
              className="h-44 w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute bottom-3 left-3 text-white">
              <div className="text-sm">Destination {selected.code}</div>
              <div className="text-lg font-bold">{selected.name}</div>
              <div className="text-xs">From {airport}</div>
            </div>
          </div>
        )}

        {/* SELECTOR */}
        <div className="flex gap-2 overflow-x-auto">
          {destinations.map((d) => (
            <button
              key={d.id}
              onClick={() => setDestinationId(d.id)}
              className={`px-4 py-2 rounded-full text-sm ${
                d.id === selected?.id ? "bg-black text-white" : "bg-gray-200"
              }`}
            >
              {d.code}
            </button>
          ))}
        </div>

        {/* SECTIONS */}
        {sectionOrder.map((section) => (
          <div key={section} className="space-y-3">
            <h2 className="font-bold">{sectionLabels[section]}</h2>

            {filtered
              .filter((i) => i.section === section)
              .map((item) => (
                <div key={item.id} className="border rounded-xl p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.short_info}
                      </p>
                    </div>
                    <b>{money(item.price)}</b>
                  </div>

                  <button
                    onClick={() => toggleTrip(item)}
                    className="mt-3 w-full bg-black text-white py-2 rounded-xl"
                  >
                    Add to trip
                  </button>
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* TOTAL */}
      <div className="fixed bottom-0 w-full bg-white border-t p-4">
        <div className="max-w-xl mx-auto flex justify-between">
          <b>{money(total)}</b>
          <button className="bg-black text-white px-4 py-2 rounded-xl">
            Review
          </button>
        </div>
      </div>

      {/* ADMIN */}
      {adminOpen && !isAdmin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white p-5 rounded-xl">
            <input
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              placeholder="Passkey"
              className="border p-2 mb-2"
            />
            <button onClick={login} className="bg-black text-white px-3 py-2">
              Enter
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Index;3, MapPin, Plane, Plus, Ship, Trash2, UserRound, X } from "lucide-react";
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

  const selectedDestination =
    destinations.find((d) => d.id === destinationId) ?? destinations[0];

  const destinationItems = items.filter(
    (item) => item.destination_id === selectedDestination?.id && item.active
  );

  const total = useMemo(
    () => trip.reduce((sum, item) => sum + Number(item.price), 0),
    [trip]
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!destinationId && destinations[0]) setDestinationId(destinations[0].id);
  }, [destinations]);

  const loadData = async () => {
    setIsLoading(true);
    const [{ data: d }, { data: i }] = await Promise.all([
      db.from("destinations").select("*").order("sort_order"),
      db.from("travel_items").select("*").order("sort_order"),
    ]);
    setDestinations(d ?? []);
    setItems((i ?? []).map((x: any) => ({ ...x, price: Number(x.price) })));
    setIsLoading(false);
  };

  const toggleTripItem = (item: TravelItem) => {
    setTrip((cur) =>
      cur.some((t) => t.id === item.id)
        ? cur.filter((t) => t.id !== item.id)
        : [...cur, item]
    );
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

      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur px-4 py-3">
        <div className="flex justify-between max-w-xl mx-auto">
          <div>
            <p className="text-xs font-bold text-primary uppercase">
              Palawan planner
            </p>
            <h1 className="text-xl font-bold">
              Build your island trip
            </h1>
          </div>
          <button onClick={() => setAdminOpen(true)}>
            <Edit3 />
          </button>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-5 space-y-5">

        {/* HERO */}
        <div className="space-y-3">

          <div className="soft-panel p-3">
            <div className="text-sm font-medium">
              {origin || "Origin"} → {airport.replace(" Airport", "")}
            </div>
            <div className="text-xs text-muted-foreground">
              Destination {selectedDestination?.code}
            </div>
          </div>

          {selectedDestination && (
            <div className="relative rounded-2xl overflow-hidden shadow-card">
              <img
                src={
                  selectedDestination.image_url ||
                  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
                }
                className="w-full h-44 object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute bottom-3 left-3 text-white">
                <div className="text-sm opacity-80">
                  Destination {selectedDestination.code}
                </div>
                <div className="text-lg font-semibold">
                  {selectedDestination.name}
                </div>
                <div className="text-xs opacity-80">
                  From {airport.replace(" Airport", "")}
                </div>
              </div>
            </div>
          )}

          {/* 🔥 2027 selector */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {destinations.map((d) => (
              <button
                key={d.id}
                onClick={() => setDestinationId(d.id)}
                className={`min-w-[70px] rounded-full px-4 py-2 text-sm font-semibold transition ${
                  d.id === selectedDestination?.id
                    ? "bg-primary text-white shadow-lift"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {d.code}
              </button>
            ))}
          </div>

        </div>

        {/* SECTIONS */}
        {sectionOrder.map((section) => (
          <section key={section} className="space-y-3">
            <h2 className="text-lg font-bold">{sectionLabels[section]}</h2>

            {destinationItems
              .filter((i) => i.section === section)
              .map((item) => (
                <div key={item.id} className="travel-card p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.short_info}
                      </p>
                    </div>
                    <b>{money(item.price)}</b>
                  </div>

                  <button
                    onClick={() => toggleTripItem(item)}
                    className="mt-3 w-full bg-primary text-white py-2 rounded-xl"
                  >
                    Add to trip
                  </button>
                </div>
              ))}
          </section>
        ))}
      </div>

      {/* BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="flex justify-between max-w-xl mx-auto">
          <b>{money(total)}</b>
          <button
            onClick={() => setReviewOpen(true)}
            className="bg-black text-white px-4 py-2 rounded-xl"
          >
            Review
          </button>
        </div>
      </div>

      {adminOpen && !isAdmin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white p-5 rounded-2xl">
            <input
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              placeholder="Passkey"
              className="border p-2 mb-2"
            />
            <button onClick={submitAdmin} className="bg-black text-white px-3 py-2">
              Enter
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Index;{ supabase } from "@/integrations/supabase/client";

/* ---------- TYPES (unchanged) ---------- */

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

/* ---------- MAIN ---------- */

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

  const selectedDestination =
    destinations.find((d) => d.id === destinationId) ?? destinations[0];

  const destinationItems = items.filter(
    (item) => item.destination_id === selectedDestination?.id && item.active
  );

  const total = useMemo(
    () => trip.reduce((sum, item) => sum + Number(item.price), 0),
    [trip]
  );

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!destinationId && destinations[0]) setDestinationId(destinations[0].id);
  }, [destinations]);

  const loadData = async () => {
    setIsLoading(true);
    const [{ data: d }, { data: i }] = await Promise.all([
      db.from("destinations").select("*").order("sort_order"),
      db.from("travel_items").select("*").order("sort_order"),
    ]);
    setDestinations(d ?? []);
    setItems((i ?? []).map((x: any) => ({ ...x, price: Number(x.price) })));
    setIsLoading(false);
  };

  const toggleTripItem = (item: TravelItem) => {
    setTrip((cur) =>
      cur.some((t) => t.id === item.id)
        ? cur.filter((t) => t.id !== item.id)
        : [...cur, item]
    );
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

      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur px-4 py-3">
        <div className="flex justify-between max-w-xl mx-auto">
          <div>
            <p className="text-xs font-bold text-primary uppercase">
              Palawan planner
            </p>
            <h1 className="text-xl font-bold">
              Build your island trip
            </h1>
          </div>
          <button onClick={() => setAdminOpen(true)}>
            <Edit3 />
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="max-w-xl mx-auto px-4 py-5 space-y-5">

        {/* 🔥 NEW CLEAN TOP */}
        <div className="space-y-3">

          {/* Trip Header */}
          <div className="soft-panel p-3">
            <div className="text-sm font-medium">
              {origin || "Origin"} → {airport.replace(" Airport", "")}
            </div>
            <div className="text-xs text-muted-foreground">
              Destination {selectedDestination?.code}
            </div>
          </div>

          {/* Destination Hero */}
          {selectedDestination && (
            <div className="relative rounded-2xl overflow-hidden shadow-card">
              <img
                src={
                  selectedDestination.image_url ||
                  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
                }
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute bottom-3 left-3 text-white">
                <div className="text-sm opacity-80">
                  Destination {selectedDestination.code}
                </div>
                <div className="text-lg font-semibold">
                  {selectedDestination.name}
                </div>
                <div className="text-xs opacity-80">
                  From {airport.replace(" Airport", "")}
                </div>
              </div>
            </div>
          )}

          {/* Destination Selector */}
          <div className="grid grid-cols-5 gap-2">
            {destinations.map((d) => (
              <button
                key={d.id}
                onClick={() => setDestinationId(d.id)}
                className={`rounded-xl py-2 text-sm font-bold ${
                  d.id === selectedDestination?.id
                    ? "bg-primary text-white"
                    : "bg-card border"
                }`}
              >
                {d.code}
              </button>
            ))}
          </div>

        </div>

        {/* SECTIONS */}
        {sectionOrder.map((section) => (
          <section key={section} className="space-y-3">
            <h2 className="text-lg font-bold">{sectionLabels[section]}</h2>

            {destinationItems
              .filter((i) => i.section === section)
              .map((item) => (
                <div key={item.id} className="travel-card p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.short_info}
                      </p>
                    </div>
                    <b>{money(item.price)}</b>
                  </div>

                  <button
                    onClick={() => toggleTripItem(item)}
                    className="mt-3 w-full bg-primary text-white py-2 rounded-xl"
                  >
                    Add to trip
                  </button>
                </div>
              ))}
          </section>
        ))}
      </div>

      {/* BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="flex justify-between max-w-xl mx-auto">
          <b>{money(total)}</b>
          <button
            onClick={() => setReviewOpen(true)}
            className="bg-black text-white px-4 py-2 rounded-xl"
          >
            Review
          </button>
        </div>
      </div>

      {adminOpen && !isAdmin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white p-5 rounded-2xl">
            <input
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              placeholder="Passkey"
              className="border p-2 mb-2"
            />
            <button onClick={submitAdmin} className="bg-black text-white px-3 py-2">
              Enter
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Index;
