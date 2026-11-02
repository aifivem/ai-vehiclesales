import { NUI_LAYER } from "@aifivem/shared";

// Stacking among NUI pages (`NUI_LAYER`): set at start, not left to load order.
SetNuiZindex(NUI_LAYER.screen);
