import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCarSide } from "@fortawesome/free-solid-svg-icons";
import type { ScreenRow } from "../../../../resource/common/rows";
import { VirtualList } from "../../components/VirtualList";
import { useLang } from "../../lib/lang";
import { ListingCard } from "./ListingCard";

/** The horizontal, virtualized strip of listings; `empty` is the lang key shown when it has none. */
export function ListingStrip({
  list,
  selected,
  empty,
  onPick,
}: {
  list: ScreenRow[];
  selected: number | null;
  empty: string;
  onPick: (id: number) => void;
}) {
  const t = useLang();
  return (
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
            onClick={() => onPick(r.id)}
          />
        </div>
      )}
    />
  );
}
