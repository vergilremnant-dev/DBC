import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { authService } from '../../services/auth/authService'
import { setAccessToken } from '../../services/auth/axiosClient'
import type { AuthState, AuthUser, LoginRequest, LoginResponse } from '../../types/auth/authTypes'

function readStoredUser() {
  const rawUser = localStorage.getItem('user')
  if (!rawUser) return null
  try {
    return JSON.parse(rawUser) as AuthUser
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

function persistUser(user: AuthUser) {
  localStorage.setItem('user', JSON.stringify(user))
}

function clearStoredAuth() {
  localStorage.removeItem('user')
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

const initialState: AuthState = {
  accessToken: null,
  user: readStoredUser(),
  loading: false,
  error: null,
  isAuthenticated: false,
}

export const loginThunk = createAsyncThunk<LoginResponse, LoginRequest, { rejectValue: string }>(
  'auth/login',
  async (request, { rejectWithValue }) => {
    try {
      const response = await authService.login(request)
      persistUser(response.user)
      return response
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, 'Unable to login'))
    }
  },
)

export const logoutThunk = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout()
      clearStoredAuth()
      setAccessToken(null)
    } catch (error) {
      clearStoredAuth()
      setAccessToken(null)
      return rejectWithValue(toErrorMessage(error, 'Unable to logout'))
    }
  },
)

export const refreshThunk = createAsyncThunk<LoginResponse, void, { rejectValue: string }>(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.refresh()
      persistUser(response.user)
      return response
    } catch (error) {
      clearStoredAuth()
      setAccessToken(null)
      return rejectWithValue(toErrorMessage(error, 'Session expired'))
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      clearStoredAuth()
      setAccessToken(null)
      state.accessToken = null
      state.user = null
      state.loading = false
      state.error = null
      state.isAuthenticated = false
    },
    clearError(state) {
      state.error = null
    },
    clearAuth(state) {
      clearStoredAuth()
      setAccessToken(null)
      state.accessToken = null
      state.user = null
      state.loading = false
      state.error = null
      state.isAuthenticated = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false
        state.accessToken = action.payload.accessToken
        state.user = action.payload.user
        state.isAuthenticated = true
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Unable to login'
        state.isAuthenticated = false
      })
      .addCase(logoutThunk.pending, (state) => {
        state.loading = true
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.loading = false
        state.accessToken = null
        state.user = null
        state.isAuthenticated = false
      })
      .addCase(logoutThunk.rejected, (state) => {
        state.loading = false
        state.accessToken = null
        state.user = null
        state.isAuthenticated = false
      })
      .addCase(refreshThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(refreshThunk.fulfilled, (state, action) => {
        state.loading = false
        state.accessToken = action.payload.accessToken
        state.user = action.payload.user
        state.isAuthenticated = true
      })
      .addCase(refreshThunk.rejected, (state) => {
        state.loading = false
        state.accessToken = null
        state.user = null
        state.isAuthenticated = false
      })
  },
})

export const { clearAuth, logout, clearError } = authSlice.actions
export const authReducer = authSlice.reducer
