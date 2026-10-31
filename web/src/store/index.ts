import {
  configureStore,
  createEntityAdapter,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { ScreenRow } from "../../../resource/common/sales";

const adapter = createEntityAdapter<ScreenRow>();

/** The open lot's listings: one snapshot when the screen opens, then puts and removes. */
const listings = createSlice({
  name: "listings",
  initialState: adapter.getInitialState({
    /** Server clock minus page clock at the snapshot (listing times are server times). */
    offset: 0,
  }),
  reducers: {
    reset(state, action: PayloadAction<{ rows: ScreenRow[]; now: number }>) {
      adapter.setAll(state, action.payload.rows);
      state.offset = action.payload.now - Date.now();
    },
    put: adapter.upsertMany,
    remove: adapter.removeMany,
  },
});

export const { reset, put, remove } = listings.actions;

export const store = configureStore({
  reducer: { listings: listings.reducer },
});

type State = ReturnType<typeof store.getState>;
const selectors = adapter.getSelectors<State>((s) => s.listings);
export const selectAll = selectors.selectAll;
export const selectById = selectors.selectById;
export const selectOffset = (s: State) => s.listings.offset;

export const useAppDispatch = useDispatch.withTypes<typeof store.dispatch>();
export const useAppSelector = useSelector.withTypes<State>();
