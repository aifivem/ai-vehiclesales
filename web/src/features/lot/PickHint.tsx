import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowPointer } from "@fortawesome/free-solid-svg-icons";
import { useLang } from "../../lib/lang";

/** Shown in the detail's place while no listing is picked. */
export function PickHint() {
  const t = useLang();
  return (
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
  );
}
