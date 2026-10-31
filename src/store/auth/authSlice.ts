import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { authService } from '../../services/auth/authService'
import { setAccessToken } from '../../services/auth/axiosClient'
import type { AuthState, AuthUser, LoginRequest, LoginResponse, PhoneRegisterRequest, PhoneSessionResponse } from '../../types/auth/authTypes'
import { clearAccountData, purgeLegacySharedKeys } from '../../utils/accountStorage'

// Older builds kept account details under shared browser keys that any account could read; drop them.
purgeLegacySharedKeys()

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
  // A different account signing in on this browser must never see the previous account's data.
  const previous = readStoredUser()
  if (previous && String(previous.id) !== String(user.id)) clearAccountData()
  localStorage.setItem('user', JSON.stringify(user))
}

/** Ends the stored session. `wipeAccountData` also removes the account's browser data (sign-out, expiry). */
function clearStoredAuth(wipeAccountData = true) {
  if (wipeAccountData) clearAccountData()
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

export const socialLoginThunk = createAsyncThunk<
  LoginResponse,
  'google' | 'microsoft' | 'apple',
  { rejectValue: string }
>('auth/socialLogin', async (provider, { rejectWithValue }) => {
  try {
    let response: LoginResponse
    if (provider === 'google') {
      response = await authService.signInWithGoogle()
    } else if (provider === 'microsoft') {
      response = await authService.signInWithMicrosoft()
    } else {
      response = await authService.signInWithApple()
    }
    persistUser(response.user)
    return response
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, `Unable to sign in with ${provider}`))
  }
})

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
      clearStoredAuth(readStoredUser() !== null)
      setAccessToken(null)
      return rejectWithValue(toErrorMessage(error, 'Session expired'))
    }
  },
)

export const phoneSessionThunk = createAsyncThunk<PhoneSessionResponse, string, { rejectValue: string }>(
  'auth/phoneSession',
  async (firebaseIdToken, { rejectWithValue }) => {
    try {
      const response = await authService.phoneSession(firebaseIdToken)
      if (response.status === 'AUTHENTICATED') persistUser(response.user)
      return response
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, 'Unable to sign in with this phone number'))
    }
  },
)

export const phoneRegisterThunk = createAsyncThunk<PhoneSessionResponse, PhoneRegisterRequest, { rejectValue: string }>(
  'auth/phoneRegister',
  async (request, { rejectWithValue }) => {
    try {
      const response = await authService.phoneRegister(request)
      if (response.status === 'AUTHENTICATED') persistUser(response.user)
      return response
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, 'Unable to complete registration'))
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
    /** Keeps the signed-in user's display data in step with a profile edit (identity stays the same user id). */
    profilePatched(state, action: { payload: { fullName?: string; phone?: string | null; profileImageUrl?: string | null } }) {
      if (!state.user) return
      const { fullName, phone, profileImageUrl } = action.payload
      if (fullName !== undefined) {
        const parts = fullName.trim().split(/\s+/)
        state.user.firstName = parts[0] || ''
        state.user.lastName = parts.slice(1).join(' ')
      }
      if (phone !== undefined) state.user.phone = phone
      if (profileImageUrl !== undefined) state.user.profileImageUrl = profileImageUrl
      localStorage.setItem('user', JSON.stringify(state.user))
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
      .addCase(socialLoginThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(socialLoginThunk.fulfilled, (state, action) => {
        state.loading = false
        state.accessToken = action.payload.accessToken
        state.user = action.payload.user
        state.isAuthenticated = true
      })
      .addCase(socialLoginThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Social authentication failed'
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
      .addCase(phoneSessionThunk.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.status === 'AUTHENTICATED') {
          state.accessToken = action.payload.accessToken
          state.user = action.payload.user
          state.isAuthenticated = true
        }
      })
      .addCase(phoneRegisterThunk.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.status === 'AUTHENTICATED') {
          state.accessToken = action.payload.accessToken
          state.user = action.payload.user
          state.isAuthenticated = true
        }
      })
      .addMatcher(
        (action) => action.type === phoneSessionThunk.pending.type || action.type === phoneRegisterThunk.pending.type,
        (state) => {
          state.loading = true
        },
      )
      .addMatcher(
        (action) => action.type === phoneSessionThunk.rejected.type || action.type === phoneRegisterThunk.rejected.type,
        (state) => {
          // Phone flow errors are shown inside the OTP component, not the shared login error.
          state.loading = false
        },
      )
  },
})

export const { clearAuth, logout, clearError, profilePatched } = authSlice.actions
export const authReducer = authSlice.reducer
