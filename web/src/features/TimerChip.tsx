import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGaugeHigh } from "@fortawesome/free-solid-svg-icons";
import { useLang } from "../lib/lang";

const clock = (ms: number): string => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** The test drive countdown at the top of the screen (page clock; the client ends the drive itself). */
export function TimerChip({ endsAt }: { endsAt: number }) {
  const t = useLang();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="pointer-events-none fixed top-[3vh] left-1/2 flex -translate-x-1/2 animate-fade items-center gap-[1.2vh] rounded-full bg-[rgba(19,19,19,0.75)] py-[0.8vh] pr-[2vh] pl-[0.8vh]">
      <span className="flex size-[3.6vh] items-center justify-center rounded-full bg-tgi-green-10 text-[1.5vh] text-tgi-green">
        <FontAwesomeIcon icon={faGaugeHigh} />
      </span>
      <span className="flex flex-col">
        <span className="text-[1.2vh] font-semibold text-text-3 uppercase">
          {t("UI_TIMER")}
        </span>
        <span className="text-[1.1vh] text-text-4">{t("UI_TIMER_HINT")}</span>
      </span>
      <span className="font-display text-[2.4vh] leading-none tabular-nums">
        {clock(endsAt - now)}
      </span>
    </div>
  );
}
