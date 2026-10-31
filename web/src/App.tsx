import { useEffect, useMemo, useRef, useState } from "react";
import { fetchNui, useNuiEvent } from "fivem-nui-react";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowPointer,
  faCarSide,
  faDoorOpen,
} from "@fortawesome/free-solid-svg-icons";
import type { NuiMessage, ScreenRow } from "../../resource/common/sales";
import { VirtualList } from "./components/VirtualList";
import { MOCK_DETAILS, MOCK_OPEN } from "./dev/mock";
import { Detail, type Action } from "./features/Detail";
import { ListingCard } from "./features/ListingCard";
import { TimerChip } from "./features/TimerChip";
import { Toolbar, type Filter, type Sort } from "./features/Toolbar";
import { setTexts, useLang } from "./lib/lang";
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

const SORTERS: Record<Sort, (a: ScreenRow, b: ScreenRow) => number> = {
  newest: (a, b) => b.listed - a.listed,
  cheap: (a, b) => a.price - b.price,
  pricey: (a, b) => b.price - a.price,
};

/** The lot screen over the preview camera (tgiann-vehicleshop look): title and ESC; detail left; filters and the listing strip below. */
export function App() {
  const t = useLang();
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

  const mine = useMemo(() => rows.filter((r) => r.mine), [rows]);
  const list = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const base = filter === "mine" ? mine : rows;
    const found = needle
      ? base.filter(
          (r) =>
            r.label.toLowerCase().includes(needle) ||
            r.plate.toLowerCase().includes(needle),
        )
      : base;
    return [...found].sort(SORTERS[sort]);
  }, [rows, mine, filter, search, sort]);

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
        <div className="flex items-start justify-between gap-[4vh]">
          <div className="flex min-w-0 flex-col gap-[0.6vh]">
            <h1 className="font-display text-[4.4vh] leading-none font-extrabold tracking-[-0.01em] uppercase">
              {t("UI_TITLE")}
            </h1>
            <p className="truncate text-[1.8vh] text-text-2">
              {screen.lot.label}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="group flex shrink-0 items-center gap-[1vh]"
          >
            <span className="text-[1.4vh] font-extrabold text-text-2 transition-colors duration-150 group-hover:text-white">
              {t("UI_ESC_CLOSE")}
            </span>
            <span className="flex size-[4.4vh] items-center justify-center rounded-full bg-black/60 text-[1.8vh] text-text-3 transition-colors duration-150 group-hover:bg-[#101010B3] group-hover:text-white">
              <FontAwesomeIcon icon={faDoorOpen} />
            </span>
          </button>
        </div>
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
            rows.length > 0 && (
              <div className="flex w-[40vh] animate-rise items-center gap-[1.2vh] rounded-[1.4vh] border border-white/10 bg-black/50 p-[1.4vh]">
                <span className="flex size-[3.6vh] shrink-0 items-center justify-center rounded-full bg-tgi-green-10 text-[1.5vh] text-tgi-green">
                  <FontAwesomeIcon icon={faArrowPointer} />
                </span>
                <span className="flex min-w-0 flex-col gap-[0.3vh]">
                  <span className="text-[1.5vh] leading-[1.3] font-semibold">
                    {t("UI_PICK_TITLE")}
                  </span>
                  <span className="text-[1.3vh] leading-[1.4] text-text-3">
                    {t("UI_PICK_HINT")}
                  </span>
                </span>
              </div>
            )
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
          <VirtualList
            horizontal
            className="h-[15vh] shrink-0 pb-[0.6vh]"
            items={list}
            estimateSize={36}
            gap={1.2}
            getItemKey={(r) => r.id}
            empty={
              <div className="flex h-full flex-col items-center justify-center gap-[1vh] rounded-[1.4vh] border border-white/10 bg-white/2 text-text-3">
                <FontAwesomeIcon icon={faCarSide} className="text-[2.4vh]" />
                <span className="text-[1.5vh]">{t(empty)}</span>
              </div>
            }
            renderItem={(r) => (
              <div className="h-full w-[36vh]">
                <ListingCard
                  row={r}
                  active={r.id === selected}
                  onClick={() => pick(r.id)}
                />
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
