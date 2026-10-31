import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faClock,
  faGaugeHigh,
  faRotateLeft,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { payoutOf, type ScreenRow } from "../../../resource/common/sales";
import { Button } from "../components/ui/button";
import { useLang } from "../lib/lang";
import { ago, money } from "../lib/time";

export type Action = "buy" | "testDrive" | "takeBack";

interface Props {
  row: ScreenRow;
  /** null while loading. */
  description: string | null;
  offset: number;
  commission: number;
  testDriveSeconds: number;
  busy: Action | null;
  onAction: (action: Action) => void;
}

/** Left column of the lot screen: name, price, plate, seller and age, the seller's text, then the actions. */
export function Detail({
  row,
  description,
  offset,
  commission,
  testDriveSeconds,
  busy,
  onAction,
}: Props) {
  const t = useLang();
  return (
    <div className="flex w-[40vh] animate-rise flex-col gap-[2vh]">
      <div className="flex flex-col gap-[0.8vh]">
        <span className="text-[2.4vh] leading-[1.2] font-extrabold text-white uppercase">
          {row.label}
        </span>
        <div className="flex flex-wrap items-center gap-[1vh]">
          <span className="text-[1.8vh] font-bold text-tgi-green tabular-nums">
            {t("UI_PRICE", money(row.price))}
          </span>
          <span className="rounded-full border border-white/10 px-[1.4vh] py-[0.7vh] text-[1.3vh] leading-none font-medium text-warn uppercase tabular-nums">
            {row.plate}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-[0.8vh] rounded-[1.4vh] border border-white/10 bg-black/50 p-[1.4vh]">
        <div className="flex items-center justify-between gap-[1vh] text-[1.3vh]">
          <span className="flex items-center gap-[0.8vh] text-text-3">
            <FontAwesomeIcon icon={faUser} className="text-tgi-green" />
            {t("UI_SELLER")}
          </span>
          <span className="truncate font-semibold">{row.seller}</span>
        </div>
        <div className="flex items-center justify-between gap-[1vh] text-[1.3vh]">
          <span className="flex items-center gap-[0.8vh] text-text-3">
            <FontAwesomeIcon icon={faClock} className="text-tgi-green" />
            {t("UI_LISTED")}
          </span>
          <span className="font-semibold">{ago(row.listed, offset)}</span>
        </div>
        <div className="mt-[0.4vh] border-t border-white/10 pt-[1vh]">
          <div className="mb-[0.4vh] text-[1.2vh] font-semibold text-text-3 uppercase">
            {t("UI_DESCRIPTION")}
          </div>
          <p className="max-h-[12vh] overflow-y-auto text-[1.4vh] leading-[1.45] break-words whitespace-pre-line text-text-2">
            {description === null
              ? t("UI_LOADING")
              : description || t("UI_NO_DESCRIPTION")}
          </p>
        </div>
      </div>
      {row.mine ? (
        <div className="flex flex-col gap-[1vh]">
          <p className="text-[1.3vh] text-text-3">
            {t(
              "UI_YOU_GET",
              money(payoutOf(row.price, commission)),
              commission,
            )}
          </p>
          <Button
            variant="destructive"
            className="w-full"
            busy={busy === "takeBack"}
            disabled={busy !== null}
            onClick={() => onAction("takeBack")}
          >
            {busy !== "takeBack" && (
              <FontAwesomeIcon icon={faRotateLeft} data-icon="inline-start" />
            )}
            {t("UI_TAKE_BACK")}
          </Button>
        </div>
      ) : (
        <div className="flex gap-[1vh]">
          <Button
            variant="secondary"
            className="flex-1"
            busy={busy === "testDrive"}
            disabled={busy !== null}
            onClick={() => onAction("testDrive")}
          >
            {busy !== "testDrive" && (
              <FontAwesomeIcon icon={faGaugeHigh} data-icon="inline-start" />
            )}
            {t("UI_TEST_DRIVE", testDriveSeconds)}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            busy={busy === "buy"}
            disabled={busy !== null}
            onClick={() => onAction("buy")}
          >
            {busy !== "buy" && (
              <FontAwesomeIcon icon={faCartShopping} data-icon="inline-start" />
            )}
            {t("UI_BUY")}
          </Button>
        </div>
      )}
    </div>
  );
}
