import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../api';

type AuthState = {
  token: string;
  me: User | null;
};

const sessionToken = typeof window !== 'undefined' ? window.sessionStorage.getItem('music-platform-admin-token') || '' : '';

const initialState: AuthState = {
  token: sessionToken,
  me: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      if (typeof window !== 'undefined') {
        if (action.payload) {
          window.sessionStorage.setItem('music-platform-admin-token', action.payload);
        } else {
          window.sessionStorage.removeItem('music-platform-admin-token');
        }
      }
    },
    setMe: (state, action: PayloadAction<User | null>) => {
      state.me = action.payload;
    },
    signOut: (state) => {
      state.token = '';
      state.me = null;
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('music-platform-admin-token');
      }
    },
  },
});

export const { setToken, setMe, signOut } = authSlice.actions;
export default authSlice.reducer;
