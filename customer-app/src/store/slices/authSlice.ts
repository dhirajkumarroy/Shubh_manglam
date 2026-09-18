import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../../api/client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'OWNER';
  emailVerified?: boolean;
  phoneVerified?: boolean;
  isEmailVerified?: boolean;
  avatar: string | null;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isResolved: boolean;
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
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        return { token: null, user: null };
      }

      const response = await apiClient.get('/auth/me');
      const user: UserProfile = response.data.data.user;

      return { token, user };
    } catch (error: any) {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      return rejectWithValue(error.message || 'Session expired.');
    }
  }
);

// Async Thunk: Log customer in
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/customer/login', credentials);
      const { user, tokens } = response.data.data;
      const accessToken = tokens.accessToken;
      const refreshToken = tokens.refreshToken;

      await SecureStore.setItemAsync('accessToken', accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync('refreshToken', refreshToken);
      }

      return { user, token: accessToken };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed.');
    }
  }
);

// Async Thunk: Register customer
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (
    userData: { name: string; email: string; phone: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post('/auth/customer/register', userData);
      const { user, tokens } = response.data.data;
      const accessToken = tokens?.accessToken;
      const refreshToken = tokens?.refreshToken;

      if (accessToken) {
        await SecureStore.setItemAsync('accessToken', accessToken);
        if (refreshToken) {
          await SecureStore.setItemAsync('refreshToken', refreshToken);
        }
      }

      return { user, token: accessToken, message: response.data.message };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed.');
    }
  }
);

// Async Thunk: Google Login for customer
export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (
    payload: { idToken: string; email?: string; name?: string; avatar?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post('/auth/google', {
        ...payload,
        role: 'CUSTOMER',
      });
      const { user, tokens } = response.data.data;
      const accessToken = tokens.accessToken;
      const refreshToken = tokens.refreshToken;

      await SecureStore.setItemAsync('accessToken', accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync('refreshToken', refreshToken);
      }

      return { user, token: accessToken };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Google sign-in failed.');
    }
  }
);

// Async Thunk: Log user out
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
      }
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      return null;
    } catch (error: any) {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
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
    markEmailVerifiedSuccess: (state) => {
      if (state.user) {
        state.user.emailVerified = true;
      }
      if (state.token) {
        state.isAuthenticated = true;
      }
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
      state.isResolved = true;
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

    // googleLogin
    builder.addCase(googleLogin.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(googleLogin.fulfilled, (state, action) => {
      state.loading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(googleLogin.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // registerUser
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.token && action.payload.user) {
        state.token = action.payload.token;
        state.user = action.payload.user;
        // If email verification is required, keep isAuthenticated = false
        // so the user can complete the VerifyEmailScreen flow
        state.isAuthenticated = !!action.payload.user.emailVerified;
      }
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

export const { clearError, updateUser, markEmailVerifiedSuccess } = authSlice.actions;
export default authSlice.reducer;
