import { useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "../lib/utils";

const vhPx = (): number => window.innerHeight / 100;

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  /** Estimated row height (column width when horizontal) in vh; rows measure themselves after mount. */
  estimateSize: number;
  /** Row gap in vh. */
  gap?: number;
  getItemKey: (item: T, index: number) => string | number;
  /** A row that scrolls sideways; the mouse wheel scrolls it too. */
  horizontal?: boolean;
  empty?: ReactNode;
  className?: string;
}

/** Every scrolling list of data (aicore-ui rule): only visible rows render, positions on whole pixels. */
export function VirtualList<T>({
  items,
  renderItem,
  estimateSize,
  gap = 0,
  getItemKey,
  horizontal = false,
  empty,
  className,
}: VirtualListProps<T>) {
  "use no memo";
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    horizontal,
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize * vhPx(),
    gap: gap * vhPx(),
    overscan: 4,
    // Measures in the next frame: re-layout inside the observer callback floods ResizeObserver warnings.
    useAnimationFrameWithResizeObserver: true,
    getItemKey: (index) => {
      const item = items[index];
      return item === undefined ? index : getItemKey(item, index);
    },
  });
  const total = virtualizer.getTotalSize();

  return (
    <div
      ref={scrollRef}
      className={cn(
        horizontal ? "overflow-x-auto overflow-y-hidden" : "overflow-y-auto",
        className,
      )}
      onWheel={
        horizontal
          ? (e) => {
              if (scrollRef.current && e.deltaY !== 0)
                scrollRef.current.scrollLeft += e.deltaY;
            }
          : undefined
      }
    >
      {items.length === 0 ? (
        empty
      ) : (
        <div
          className={horizontal ? "relative h-full" : "relative w-full"}
          style={horizontal ? { width: total } : { height: total }}
        >
          {virtualizer.getVirtualItems().map((row) => {
            const item = items[row.index];
            const at = Math.round(row.start);
            return item === undefined ? null : (
              <div
                key={row.key}
                data-index={row.index}
                ref={virtualizer.measureElement}
                className={
                  horizontal
                    ? "absolute top-0 left-0 h-full"
                    : "absolute top-0 left-0 w-full"
                }
                style={{
                  transform: horizontal
                    ? `translateX(${at}px)`
                    : `translateY(${at}px)`,
                }}
              >
                {renderItem(item, row.index)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
