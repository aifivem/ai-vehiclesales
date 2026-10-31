import en from "../../../locales/en.json";
import lots from "../../../data/lots.json";

/** Browser preview only (`bun run webdev`): the default lot with generated listings. */
const MODELS = [
  ["sultan", "Sultan"],
  ["elegy2", "Elegy Retro Custom"],
  ["bati", "Bati 801"],
  ["sandking", "Sandking XL"],
  ["blista", "Blista"],
  ["dominator", "Dominator"],
  ["baller", "Baller"],
] as const;
const NAMES = ["Jane Doe", "Sam Price", "Luis Lopez", "Ada Hart"];
const now = Date.now();

export const MOCK_OPEN = {
  texts: en,
  lot: { id: "sandy", label: lots.sandy.label },
  now,
  commission: 10,
  testDriveSeconds: 60,
  // `#detail` in the preview url opens with the first listing picked.
  selected: location.hash === "#detail" ? 1 : null,
  rows: Array.from({ length: 240 }, (_, i) => {
    const [model, label] = MODELS[i % MODELS.length] ?? MODELS[0];
    return {
      id: i + 1,
      model,
      label,
      plate: `AI${(1000 + i).toString(36).toUpperCase().padStart(6, "0")}`,
      price: 5000 + ((i * 7919) % 90) * 1000,
      seller: NAMES[i % NAMES.length] ?? "",
      listed: now - i * 3_600_000,
      mine: i % 9 === 0,
    };
  }),
};

export const MOCK_DETAILS = {
  ok: true,
  description: "Low mileage, new tyres, never crashed. Garage kept.",
};
