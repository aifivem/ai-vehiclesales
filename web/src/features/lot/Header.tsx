import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDoorOpen } from "@fortawesome/free-solid-svg-icons";
import { useLang } from "../../lib/lang";

/** The screen's title, the lot's name and the ESC close button. */
export function Header({
  label,
  onClose,
}: {
  label: string;
  onClose: () => void;
}) {
  const t = useLang();
  return (
    <div className="flex items-start justify-between gap-[4vh]">
      <div className="flex min-w-0 flex-col gap-[0.6vh]">
        <h1 className="font-display text-[4.4vh] leading-none font-extrabold tracking-[-0.01em] uppercase">
          {t("UI_TITLE")}
        </h1>
        <p className="truncate text-[1.8vh] text-text-2">{label}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
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
  );
}
