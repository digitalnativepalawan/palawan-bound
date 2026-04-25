DROP POLICY IF EXISTS "Anyone can create destinations" ON public.destinations;
DROP POLICY IF EXISTS "Anyone can edit destinations" ON public.destinations;
DROP POLICY IF EXISTS "Anyone can remove destinations" ON public.destinations;
DROP POLICY IF EXISTS "Anyone can create travel items" ON public.travel_items;
DROP POLICY IF EXISTS "Anyone can edit travel items" ON public.travel_items;
DROP POLICY IF EXISTS "Anyone can remove travel items" ON public.travel_items;
DROP POLICY IF EXISTS "Anyone can record admin edits" ON public.admin_edits;

CREATE POLICY "App can create valid destinations"
ON public.destinations
FOR INSERT
WITH CHECK (code IN ('A', 'B', 'C', 'D', 'E') AND length(name) BETWEEN 1 AND 120);

CREATE POLICY "App can edit valid destinations"
ON public.destinations
FOR UPDATE
USING (code IN ('A', 'B', 'C', 'D', 'E'))
WITH CHECK (code IN ('A', 'B', 'C', 'D', 'E') AND length(name) BETWEEN 1 AND 120);

CREATE POLICY "App can remove valid destinations"
ON public.destinations
FOR DELETE
USING (code IN ('A', 'B', 'C', 'D', 'E'));

CREATE POLICY "App can create valid travel items"
ON public.travel_items
FOR INSERT
WITH CHECK (section IN ('stay', 'experiences', 'lifestyle', 'transport') AND length(name) BETWEEN 1 AND 160 AND price >= 0);

CREATE POLICY "App can edit valid travel items"
ON public.travel_items
FOR UPDATE
USING (section IN ('stay', 'experiences', 'lifestyle', 'transport'))
WITH CHECK (section IN ('stay', 'experiences', 'lifestyle', 'transport') AND length(name) BETWEEN 1 AND 160 AND price >= 0);

CREATE POLICY "App can remove valid travel items"
ON public.travel_items
FOR DELETE
USING (section IN ('stay', 'experiences', 'lifestyle', 'transport'));

CREATE POLICY "App can record valid admin edits"
ON public.admin_edits
FOR INSERT
WITH CHECK (entity_type IN ('destination', 'item') AND length(field_name) BETWEEN 1 AND 80);