import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../../api/client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'OWNER' | 'ADMIN';
  isEmailVerified: boolean;
  avatar: string | null;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isResolved: boolean; // Indicates if storage token check is completed
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  isResolved: false,
};

// Async Thunk: Load stored token on startup and fetch profile to restore session
export const loadStoredToken = createAsyncThunk(
  'auth/loadStoredToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        return { token: null, user: null };
      }

      // Fetch user profile using the token (which is auto-injected by axios client interceptor)
      const response = await apiClient.get('/users/profile');
      const user: UserProfile = response.data.data;

      return { token, user };
    } catch (error: any) {
      // If token expired or server unreachable, clear storage and reject
      await SecureStore.deleteItemAsync('token');
      return rejectWithValue(error.message || 'Session expired.');
    }
  }
);

// Async Thunk: Log user in
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { user, accessToken } = response.data.data;

      // Persist token in SecureStore
      await SecureStore.setItemAsync('token', accessToken);

      return { user, token: accessToken };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed.');
    }
  }
);

// Async Thunk: Register user (role toggle included in UI, but backend defaults to CUSTOMER initially)
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (
    userData: { name: string; email: string; phone: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data.message || 'Registration successful. OTP has been sent.';
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed.');
    }
  }
);

// Async Thunk: Log user out
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await SecureStore.deleteItemAsync('token');
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed.');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<UserProfile>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // loadStoredToken
    builder.addCase(loadStoredToken.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadStoredToken.fulfilled, (state, action) => {
      state.loading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = !!action.payload.token && !!action.payload.user;
      state.isResolved = true;
    });
    builder.addCase(loadStoredToken.rejected, (state, action) => {
      state.loading = false;
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isResolved = true; // Still resolved because startup check finished
      state.error = action.payload as string;
    });

    // loginUser
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // registerUser
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state) => {
      state.loading = false;
      state.error = null;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // logoutUser
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
