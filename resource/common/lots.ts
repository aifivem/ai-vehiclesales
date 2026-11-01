import {
  bool,
  num,
  type PlacePed,
  readPlacePed,
  record,
  str,
  vec4,
  type Vec4,
} from "@aicore-fivem/lib/shared";

export interface Lot {
  /** NPC standing at the counter (panel), null for none. */
  ped: PlacePed | null;
  id: string;
  label: string;
  /** The counter: browse the lot from here. */
  x: number;
  y: number;
  z: number;
  radius: number;
  /** Metres around the counter in which parked listings show (and buyers may act). */
  area: number;
  /** Where players drive in to list their vehicle. */
  sell: { x: number; y: number; z: number };
  /** Where listings are parked, first come first parked. */
  spots: Vec4[];
  /** Where the previewed listing stands and the camera looking at it. */
  preview: Vec4;
  camera: Vec4;
  /** Where bought, returned and test drive vehicles appear. */
  delivery: Vec4;
  blip: boolean;
}

/** One lot record (`panel.records` / `world.records`). */
export function readLot(id: string, v: Record<string, unknown>): Lot {
  const c = record(v.coords);
  const at = { x: num(c.x, 0), y: num(c.y, 0), z: num(c.z, 0), heading: 0 };
  const s = record(v.sell);
  const spots = Array.isArray(v.spots)
    ? v.spots.map((row) => vec4(record(row).coords, at))
    : [];
  return {
    ped: readPlacePed(v.ped),
    id,
    label: str(v.label, id, 48),
    x: at.x,
    y: at.y,
    z: at.z,
    radius: num(v.radius, 2, 1, 10),
    area: num(v.area, 80, 20, 300),
    sell: { x: num(s.x, at.x), y: num(s.y, at.y), z: num(s.z, at.z) },
    spots,
    preview: vec4(v.preview, at),
    camera: vec4(v.camera, at),
    delivery: vec4(v.delivery, at),
    blip: bool(v.blip, true),
  };
}
