# Testing Guide - Full Stack Task Manager

## Quick Start

### 1. Start Backend Server

```bash
# From project root
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Expected Output:**
```
Starting Productivity App API v1.0.0
Environment: development
Documentation: http://localhost:8000/docs
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Start Frontend Server

```bash
# From project root
cd frontend
npm run dev
```

**Expected Output:**
```
▲ Next.js 15.5.9 (Turbopack)
- Local:        http://localhost:3000
✓ Ready in 4.1s
```

## Frontend Testing Checklist

### ✅ Authentication Flow

#### Test 1: Registration
1. Navigate to **http://localhost:3000**
2. Should redirect to `/login`
3. Click "Sign up" link
4. Fill registration form:
   - **Email:** test@example.com
   - **Username:** testuser
   - **Password:** TestPass123!
5. Click "Create account"
6. Should show success toast
7. Should automatically redirect to `/dashboard`
8. Sidebar should show username and email

**Expected Behavior:**
- User is auto-logged in after registration (backend sets HttpOnly cookies)
- No need to login separately
- Cookies are stored in browser (check DevTools → Application → Cookies)

#### Test 2: Login
1. Logout from dashboard
2. Navigate to `/login`
3. Enter credentials:
   - **Email:** test@example.com (NOT username!)
   - **Password:** TestPass123!
4. Click "Sign in"
5. Should redirect to `/dashboard`

**Expected Behavior:**
- Login uses email, not username
- HttpOnly cookies are set (access_token, refresh_token)
- User data stored in Zustand store

#### Test 3: Logout
1. From dashboard, click "Logout" in sidebar
2. Should redirect to `/login`
3. Cookies should be cleared

**Expected Behavior:**
- POST /auth/logout clears cookies
- Zustand store cleared
- Redirected to login

#### Test 4: Protected Routes
1. Without logging in, try to access:
   - http://localhost:3000/dashboard
   - http://localhost:3000/tasks
   - http://localhost:3000/analytics
2. Should redirect to `/login`

**Expected Behavior:**
- DashboardLayout checks for user
- If no user, fetches from `/auth/me`
- If 401, redirects to login

#### Test 5: Token Refresh
1. Login successfully
2. Wait 15 minutes (access token expires)
3. Navigate to any protected route
4. Should automatically refresh and show page

**Expected Behavior:**
- API client intercepts 401
- Calls POST /auth/refresh with refresh_token cookie
- Retries original request
- User stays logged in

### ✅ UI Components

#### Test 6: Theme Toggle
1. Login to dashboard
2. Click sun/moon icon in header
3. Theme should toggle between light/dark
4. All colors should update (check cards, buttons, text)

**Expected Behavior:**
- CSS variables switch between :root and .dark
- Preference saved to localStorage (by next-themes)
- Smooth transition

#### Test 7: Responsive Design
1. Open dashboard
2. Resize browser window:
   - **Desktop (>1024px):** Sidebar visible, hamburger hidden
   - **Tablet (768-1024px):** Sidebar visible, responsive grid
   - **Mobile (<768px):** Sidebar hidden, hamburger visible
3. On mobile, click hamburger menu
4. Sidebar should slide in from left

**Expected Behavior:**
- Mobile: Hamburger menu, overlay sidebar
- Desktop: Fixed sidebar
- All content readable at all sizes

#### Test 8: Navigation
1. Click each sidebar link:
   - Dashboard ✅
   - All Tasks (placeholder)
   - Priority Matrix (placeholder)
   - Categories (placeholder)
   - Tags (placeholder)
   - Analytics (placeholder)
   - AI Assistant (placeholder)
   - Settings (placeholder)
2. Active link should be highlighted in blue

**Expected Behavior:**
- Active route has bg-primary
- Smooth navigation (no full page reload)
- URL updates

### ✅ Error Handling

#### Test 9: Invalid Login
1. Try to login with wrong credentials:
   - Email: wrong@example.com
   - Password: wrongpass
2. Should show error toast

**Expected Behavior:**
- Error message from backend: "Incorrect email or password"
- Toast notification appears
- No redirect

#### Test 10: Duplicate Registration
1. Try to register with existing email
2. Should show error toast

**Expected Behavior:**
- Error: "Email already registered"
- Stay on registration page

#### Test 11: Network Error
1. Stop backend server
2. Try to login
3. Should show error toast

**Expected Behavior:**
- Axios catches network error
- User-friendly error message shown

## Backend API Testing (via Frontend)

### Network Tab Verification

Open DevTools → Network tab and verify:

#### Registration Request
```
POST http://localhost:8000/api/v1/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "username": "testuser",
  "password": "TestPass123!"
}

Response: 201 Created
Set-Cookie: access_token=...; HttpOnly
Set-Cookie: refresh_token=...; HttpOnly
```

#### Login Request
```
POST http://localhost:8000/api/v1/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "TestPass123!"
}

Response: 200 OK
Set-Cookie: access_token=...; HttpOnly
Set-Cookie: refresh_token=...; HttpOnly
```

#### Get Current User
```
GET http://localhost:8000/api/v1/auth/me
Cookie: access_token=...

Response: 200 OK
{
  "id": 1,
  "email": "test@example.com",
  "username": "testuser",
  "is_active": true,
  "created_at": "2025-12-24T..."
}
```

## Known Working Features

### ✅ Completed & Tested
- [x] Next.js 15 with Turbopack
- [x] TypeScript strict mode
- [x] Tailwind CSS with dark/light themes
- [x] HttpOnly cookie authentication
- [x] Auto login after registration
- [x] Token refresh flow
- [x] Protected routes
- [x] Responsive sidebar layout
- [x] Mobile hamburger menu
- [x] Theme toggle
- [x] Form validation (React Hook Form + Zod)
- [x] Toast notifications (Sonner)
- [x] Error handling
- [x] API client with interceptors
- [x] Zustand state management
- [x] React Query provider setup

### 🚧 To Be Implemented
- [ ] Task CRUD operations
- [ ] Priority Matrix view
- [ ] Categories management
- [ ] Tags management
- [ ] AI task parser
- [ ] Priority suggestions
- [ ] Analytics dashboard
- [ ] Charts (Recharts)
- [ ] Voice input
- [ ] Similar tasks
- [ ] Settings page

## Common Issues & Solutions

### Issue 1: CORS Error
**Problem:** "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution:**
```python
# app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,  # CRITICAL for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 2: Cookies Not Being Set
**Problem:** Login succeeds but cookies not in browser

**Solution:**
- Check `withCredentials: true` in apiClient
- Check backend sets `allow_credentials=True` in CORS
- Check cookie domain settings (should work with localhost)

### Issue 3: 401 on /auth/me
**Problem:** getCurrentUser returns 401 even after login

**Solution:**
- Verify cookies are being sent (check Network tab)
- Check `withCredentials: true` on all requests
- Verify access_token cookie exists and is valid

### Issue 4: Theme Not Persisting
**Problem:** Theme resets on page reload

**Solution:**
- ThemeProvider stores preference in localStorage
- Check suppressHydrationWarning on <html> tag
- Verify ThemeProvider wraps entire app

## Development Tips

### Hot Reload
- **Frontend:** Auto-reloads on file save (Turbopack)
- **Backend:** Use `--reload` flag for auto-reload

### Debugging
1. **Frontend:**
   - React DevTools (Chrome extension)
   - console.log in components
   - Network tab for API calls
   - Application tab for cookies/localStorage

2. **Backend:**
   - Loguru logs in `logs/app_*.log`
   - Swagger UI at http://localhost:8000/docs
   - Check correlation IDs in response headers

### Type Safety
- TypeScript errors will show in IDE
- Run `npm run build` to check for type errors
- All API types match backend Pydantic models

## Next Steps

1. **Build Task Management:**
   - Create task form
   - Task list with filters
   - Priority matrix view
   - CRUD operations

2. **Add AI Features:**
   - Natural language parser modal
   - Voice input component
   - Priority suggestions
   - Similar tasks sidebar

3. **Create Analytics Dashboard:**
   - Overview cards
   - Trends chart (Recharts)
   - Priority distribution chart
   - Category/tag analytics

4. **Polish UI:**
   - Loading skeletons
   - Empty states
   - Animations
   - Accessibility improvements

---

**Status:** Frontend foundation complete and tested! ✅
**Next:** Implement task management pages and AI features. 🚀
