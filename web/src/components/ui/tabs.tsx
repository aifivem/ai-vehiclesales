import type { ComponentProps } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "../../lib/utils";

/** Radix tabs as TGIANN category pills over the game (icon + label + count): the active one gets the green border and tint. */
export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("flex items-center gap-[0.8vh]", className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "group flex h-[3.8vh] shrink-0 items-center gap-[0.8vh] rounded-full border border-white/10 bg-black/60 pr-[0.6vh] pl-[1.4vh] text-[1.3vh] font-semibold whitespace-nowrap text-text-3 transition-[background-color,border-color,color,transform] duration-150 hover:border-white/25 hover:text-white active:[transform:scale(0.97)] data-[state=active]:border-tgi-green data-[state=active]:bg-tgi-green-10 data-[state=active]:text-white",
        className,
      )}
      {...props}
    />
  );
}
