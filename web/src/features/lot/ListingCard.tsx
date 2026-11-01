import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCarSide, faUser } from "@fortawesome/free-solid-svg-icons";
import type { ScreenRow } from "../../../../resource/common/rows";
import { useLang } from "../../lib/lang";
import { money } from "../../lib/time";
import { cn } from "../../lib/utils";

/** One listing of the bottom strip (tgiann-vehicleshop card): glyph block, name, plate chip, seller, green price. */
export function ListingCard({
  row,
  active,
  onClick,
}: {
  row: ScreenRow;
  active: boolean;
  onClick: () => void;
}) {
  const t = useLang();
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "grid h-full w-full grid-cols-[9vh_minmax(0,1fr)] gap-[1.6vh] rounded-[1.4vh] border p-[1.6vh] text-left transition-colors duration-150",
        active
          ? "border-tgi-green bg-white/6"
          : "border-white/10 bg-white/2 hover:bg-white/6",
      )}
    >
      <span className="flex items-center justify-center border-r border-white/10 pr-[1.6vh]">
        <FontAwesomeIcon
          icon={faCarSide}
          className={cn(
            "text-[3.8vh] transition-colors duration-150",
            active ? "text-tgi-green" : "text-text-4",
          )}
        />
      </span>
      <span className="flex min-w-0 flex-col justify-between">
        <span className="flex flex-col gap-[0.7vh]">
          <span className="truncate text-[1.6vh] leading-[1.3] font-medium text-white">
            {row.label}
          </span>
          <span className="flex items-center gap-[0.6vh]">
            <span className="rounded-full border border-white/10 px-[1.2vh] py-[0.6vh] text-[1.2vh] leading-none font-medium text-warn uppercase tabular-nums">
              {row.plate}
            </span>
            {row.mine && (
              <span className="rounded-[0.4vh] bg-tgi-green px-[0.6vh] py-[0.2vh] text-[1.1vh] font-bold text-tgi-green-text uppercase">
                {t("UI_YOURS")}
              </span>
            )}
          </span>
        </span>
        <span className="flex items-center justify-between gap-[1vh]">
          <span className="text-[1.5vh] font-semibold text-tgi-green tabular-nums">
            {t("UI_PRICE", money(row.price))}
          </span>
          <span className="flex min-w-0 items-center gap-[0.5vh] text-[1.2vh] text-text-3">
            <FontAwesomeIcon icon={faUser} className="text-[1.1vh]" />
            <span className="truncate">{row.seller}</span>
          </span>
        </span>
      </span>
    </button>
  );
}
