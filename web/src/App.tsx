import { useEffect, useRef, useState } from "react";
import { fetchNui, useNuiEvent } from "fivem-nui-react";
import { useDebouncedValue } from "@tanstack/react-pacer";
import type { ScreenRow } from "../../resource/common/rows";
import type { NuiMessage } from "../../resource/common/sales";
import { MOCK_DETAILS, MOCK_OPEN } from "./dev/mock";
import { Detail, type Action } from "./features/lot/Detail";
import { Header } from "./features/lot/Header";
import { ListingStrip } from "./features/lot/ListingStrip";
import { PickHint } from "./features/lot/PickHint";
import { TimerChip } from "./features/lot/TimerChip";
import { Toolbar, type Filter, type Sort } from "./features/lot/Toolbar";
import { useListings } from "./features/lot/useListings";
import { setTexts } from "./lib/lang";
import {
  put,
  remove,
  reset,
  selectAll,
  selectOffset,
  useAppDispatch,
  useAppSelector,
} from "./store";

type OpenData = Extract<NuiMessage, { action: "open" }>["data"];
type Screen = Pick<OpenData, "lot" | "commission" | "testDriveSeconds">;
const OK = { mockData: { ok: true } };
const close = () => void fetchNui("close", undefined, OK);

/** The lot screen over the preview camera (tgiann-vehicleshop look): title and ESC; detail left; filters and the listing strip below. */
export function App() {
  const dispatch = useAppDispatch();
  const rows = useAppSelector(selectAll);
  const offset = useAppSelector(selectOffset);
  const [screen, setScreen] = useState<Screen | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [busy, setBusy] = useState<Action | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [query, setQuery] = useState("");
  const [search] = useDebouncedValue(query, { wait: 200 });
  const [timerEnd, setTimerEnd] = useState(0);
  /** The selection a late description reply is checked against. */
  const current = useRef<number | null>(null);

  const choose = (id: number | null) => {
    current.current = id;
    setSelected(id);
  };
  const pick = (id: number) => {
    choose(id);
    setDescription(null);
    void fetchNui<{ ok: boolean; description?: string }>(
      "select",
      { id },
      { mockData: MOCK_DETAILS },
    ).then(
      (reply) => {
        if (current.current === id)
          setDescription(reply.ok ? (reply.description ?? "") : "");
      },
      () => undefined,
    );
  };

  useNuiEvent<OpenData>(
    "open",
    (d) => {
      setTexts(d.texts);
      dispatch(reset({ rows: d.rows, now: d.now }));
      setScreen({
        lot: d.lot,
        commission: d.commission,
        testDriveSeconds: d.testDriveSeconds,
      });
      setFilter("all");
      setQuery("");
      setBusy(null);
      if (d.selected !== null) pick(d.selected);
      else choose(null);
    },
    { mockData: MOCK_OPEN, mockDelay: 100 },
  );
  useNuiEvent<ScreenRow[]>("put", (d) => dispatch(put(d)));
  useNuiEvent<number[]>("remove", (ids) => {
    dispatch(remove(ids));
    if (current.current !== null && ids.includes(current.current)) choose(null);
  });
  useNuiEvent("close", () => setScreen(null));
  useNuiEvent<{ seconds: number }>("timer", (d) =>
    setTimerEnd(d.seconds > 0 ? Date.now() + d.seconds * 1000 : 0),
  );

  useEffect(() => {
    if (timerEnd === 0) return;
    const id = window.setTimeout(() => setTimerEnd(0), timerEnd - Date.now());
    return () => window.clearTimeout(id);
  }, [timerEnd]);

  useEffect(() => {
    if (!screen) return;
    // Escape on key up: the game must not get the release once the focus is gone.
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keyup", onKey);
    return () => window.removeEventListener("keyup", onKey);
  }, [screen]);

  const { mine, list } = useListings(rows, filter, search, sort);

  const timer = timerEnd > 0 && !screen && <TimerChip endsAt={timerEnd} />;
  if (!screen) return timer || null;
  const row = rows.find((r) => r.id === selected);

  const act = async (action: Action) => {
    if (!row) return;
    setBusy(action);
    await fetchNui(action, { id: row.id }, OK).catch(() => null);
    setBusy(null);
  };

  const empty =
    rows.length === 0
      ? "UI_EMPTY"
      : filter === "mine" && mine.length === 0
        ? "UI_EMPTY_MINE"
        : "UI_NO_MATCH";

  return (
    <div className="fixed inset-0 animate-fade">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.15)_30%,rgba(0,0,0,0.85))]"
      />
      <div className="relative flex h-full flex-col justify-between p-[2vh]">
        <Header label={screen.lot.label} onClose={close} />
        <div className="flex min-h-0">
          {row ? (
            <Detail
              key={row.id}
              row={row}
              description={description}
              offset={offset}
              commission={screen.commission}
              testDriveSeconds={screen.testDriveSeconds}
              busy={busy}
              onAction={(a) => void act(a)}
            />
          ) : (
            rows.length > 0 && <PickHint />
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-[1.2vh]">
          <Toolbar
            filter={filter}
            counts={{ all: rows.length, mine: mine.length }}
            sort={sort}
            query={query}
            onFilter={setFilter}
            onSort={setSort}
            onQuery={setQuery}
          />
          <ListingStrip
            list={list}
            selected={selected}
            empty={empty}
            onPick={pick}
          />
        </div>
      </div>
    </div>
  );
}
