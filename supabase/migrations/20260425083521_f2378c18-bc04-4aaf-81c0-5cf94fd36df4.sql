CREATE TABLE public.destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE CHECK (code IN ('A', 'B', 'C', 'D', 'E')),
  name TEXT NOT NULL,
  image_url TEXT,
  map_hint TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.travel_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id UUID REFERENCES public.destinations(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('stay', 'experiences', 'lifestyle', 'transport')),
  name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  short_info TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  transport_mode TEXT CHECK (transport_mode IN ('Air', 'Sea', 'Land')),
  land_type TEXT CHECK (land_type IN ('Public', 'Private', 'Private with driver')),
  duration TEXT,
  route_from TEXT,
  route_to TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_edits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view destinations"
ON public.destinations
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create destinations"
ON public.destinations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can edit destinations"
ON public.destinations
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can remove destinations"
ON public.destinations
FOR DELETE
USING (true);

CREATE POLICY "Anyone can view travel items"
ON public.travel_items
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create travel items"
ON public.travel_items
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can edit travel items"
ON public.travel_items
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can remove travel items"
ON public.travel_items
FOR DELETE
USING (true);

CREATE POLICY "Anyone can view admin edit history"
ON public.admin_edits
FOR SELECT
USING (true);

CREATE POLICY "Anyone can record admin edits"
ON public.admin_edits
FOR INSERT
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_destinations_updated_at
BEFORE UPDATE ON public.destinations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_travel_items_updated_at
BEFORE UPDATE ON public.travel_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_destinations_sort_order ON public.destinations(sort_order);
CREATE INDEX idx_travel_items_destination_section ON public.travel_items(destination_id, section, sort_order);
CREATE INDEX idx_travel_items_transport ON public.travel_items(transport_mode, land_type);

INSERT INTO public.destinations (code, name, image_url, map_hint, sort_order) VALUES
('A', 'Destination A', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80', 'North Palawan island stop', 1),
('B', 'Destination B', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80', 'Lagoon and beach zone', 2),
('C', 'Destination C', 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80', 'Coastal town connection', 3),
('D', 'Destination D', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80', 'Quiet inland escape', 4),
('E', 'Destination E', 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=900&q=80', 'Remote island finale', 5);

INSERT INTO public.travel_items (destination_id, section, name, price, short_info, image_url, transport_mode, land_type, duration, route_from, route_to, sort_order)
SELECT d.id, x.section, x.name, x.price, x.short_info, x.image_url, x.transport_mode, x.land_type, x.duration, x.route_from, d.name, x.sort_order
FROM public.destinations d
CROSS JOIN (VALUES
('stay', 'Garden guest stay', 2800.00, 'Clean private room near the main road.', NULL, NULL, NULL, NULL, NULL, 1),
('stay', 'Beachfront cottage', 5200.00, 'Simple seaside room with breakfast.', NULL, NULL, NULL, NULL, NULL, 2),
('experiences', 'Island hopping day', 1800.00, 'Boat tour with lagoon and beach stops.', NULL, NULL, NULL, NULL, NULL, 1),
('experiences', 'Local food walk', 950.00, 'Easy evening route with local bites.', NULL, NULL, NULL, NULL, NULL, 2),
('lifestyle', 'Wellness morning', 1200.00, 'Massage or slow yoga session.', NULL, NULL, NULL, NULL, NULL, 1),
('transport', 'Airport van transfer', 1400.00, 'Door-to-door land transfer.', NULL, 'Land', 'Private with driver', '2–3 hrs', 'Airport', 1),
('transport', 'Shared public van', 550.00, 'Budget land route with fixed stops.', NULL, 'Land', 'Public', '3–4 hrs', 'Airport', 2),
('transport', 'Fast ferry route', 1300.00, 'Sea transfer when available.', NULL, 'Sea', NULL, '2 hrs', 'Port', 3),
('transport', 'Island air hop', 4200.00, 'Quick air connection for longer routes.', NULL, 'Air', NULL, '45 min', 'Airport', 4)
) AS x(section, name, price, short_info, image_url, transport_mode, land_type, duration, route_from, sort_order);