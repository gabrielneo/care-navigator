"use client";
// Location data (contacts, places, area centres) is only needed from the postal step on, so it loads on demand
// as its own chunk instead of with the first screen.
import { useEffect, useState } from "react";
import type { ContactsBundle, Place, Sectors } from "./types";

export interface Geo { contacts: ContactsBundle; places: Place[]; sectors: Sectors }

let pending: Promise<Geo> | null = null;
export function loadGeo(): Promise<Geo> {
  pending ??= Promise.all([
    import("../../../public/data/contacts.json"),
    import("../../../public/data/places.json"),
    import("../../../public/data/sectors.json"),
  ]).then(([c, p, s]) => ({
    contacts: c.default as unknown as ContactsBundle,
    places: p.default as unknown as Place[],
    sectors: s.default as unknown as Sectors,
  }));
  return pending;
}

/** The location data, or null for the moment it takes to load. */
export function useGeo(): Geo | null {
  const [geo, setGeo] = useState<Geo | null>(null);
  useEffect(() => { loadGeo().then(setGeo); }, []);
  return geo;
}
