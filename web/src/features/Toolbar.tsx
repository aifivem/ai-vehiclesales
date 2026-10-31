import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDownWideShort,
  faCarSide,
  faMagnifyingGlass,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useLang } from "../lib/lang";

export type Filter = "all" | "mine";
export type Sort = "newest" | "cheap" | "pricey";

const SORTS: Sort[] = ["newest", "cheap", "pricey"];
const SORT_TEXT: Record<Sort, string> = {
  newest: "UI_SORT_NEWEST",
  cheap: "UI_SORT_CHEAP",
  pricey: "UI_SORT_PRICEY",
};

interface Props {
  filter: Filter;
  counts: Record<Filter, number>;
  sort: Sort;
  query: string;
  onFilter: (filter: Filter) => void;
  onSort: (sort: Sort) => void;
  onQuery: (query: string) => void;
}

/** Above the strip: All / My listings pills with counts, the sort pill (click cycles) and the search pill. */
export function Toolbar({
  filter,
  counts,
  sort,
  query,
  onFilter,
  onSort,
  onQuery,
}: Props) {
  const t = useLang();
  const count = (n: number) => (
    <span className="flex h-[2.4vh] min-w-[2.4vh] items-center justify-center rounded-full bg-white/8 px-[0.6vh] text-[1.1vh] font-bold text-text-3 tabular-nums group-data-[state=active]:bg-tgi-green group-data-[state=active]:text-tgi-green-text">
      {n}
    </span>
  );
  return (
    <div className="flex items-center gap-[0.8vh]">
      <Tabs
        value={filter}
        onValueChange={(v) => onFilter(v === "mine" ? "mine" : "all")}
      >
        <TabsList>
          <TabsTrigger value="all">
            <FontAwesomeIcon
              icon={faCarSide}
              className="text-[1.4vh] group-data-[state=active]:text-tgi-green"
            />
            {t("UI_ALL")}
            {count(counts.all)}
          </TabsTrigger>
          <TabsTrigger value="mine">
            <FontAwesomeIcon
              icon={faUser}
              className="text-[1.4vh] group-data-[state=active]:text-tgi-green"
            />
            {t("UI_MINE")}
            {count(counts.mine)}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <button
        type="button"
        onClick={() =>
          onSort(SORTS[(SORTS.indexOf(sort) + 1) % SORTS.length] ?? "newest")
        }
        className="flex h-[3.8vh] items-center gap-[0.8vh] rounded-full border border-white/10 bg-black/60 px-[1.4vh] text-[1.3vh] font-semibold text-text-2 transition-[border-color,color,transform] duration-150 hover:border-white/25 hover:text-white active:[transform:scale(0.97)]"
      >
        <FontAwesomeIcon
          icon={faArrowDownWideShort}
          className="text-[1.4vh] text-tgi-green"
        />
        {t(SORT_TEXT[sort])}
      </button>
      <label className="ml-auto flex h-[3.8vh] w-[30vh] items-center gap-[1vh] rounded-full border border-white/10 bg-black/60 px-[1.4vh] transition-colors duration-150 focus-within:border-tgi-green-40">
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={t("UI_SEARCH")}
          maxLength={32}
          className="min-w-0 flex-1 bg-transparent text-[1.3vh] text-white outline-none placeholder:text-text-4"
        />
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="text-[1.3vh] text-text-3"
        />
      </label>
    </div>
  );
}
