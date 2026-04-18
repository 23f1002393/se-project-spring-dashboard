import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { z } from "zod";

const userSchema = z.object({
  name: z.string(),
  role: z.string<"manager" | "customer">(),
});

export type User = z.infer<typeof userSchema>;

interface UserState {
  user: User | null;
}

const initialState: UserState = {
  user: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;

export default userSlice.reducer;
