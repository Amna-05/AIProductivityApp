# Auth Fix Testing Guide

## Quick Test (5 minutes)

### Step 1: Clear everything and login fresh
```bash
# Clear browser cookies/storage
# DevTools → Application → Clear Site Data

# Navigate to http://localhost:3000 (or your frontend URL)
# Login with test credentials
```

### Step 2: Verify cookies are set
```javascript
// Open DevTools → Console
// Paste this to see your cookies:
document.cookie
// Should show: access_token=...; refresh_token=...

// Open DevTools → Application → Cookies
// Should see TWO cookies:
// - access_token (HttpOnly, Secure, Path=/)
// - refresh_token (HttpOnly, Secure, Path=/)
```

### Step 3: Test token expiry
```javascript
// In console, make multiple simultaneous requests
// This simulates the race condition

Promise.all([
  fetch('/api/v1/tasks'),
  fetch('/api/v1/categories'),
  fetch('/api/v1/tags'),
  fetch('/api/v1/analytics/overview')
])
.then(responses =>
  Promise.all(responses.map(r => r.json()))
)
.then(data => console.log('All succeeded:', data))
.catch(err => console.error('Some failed:', err))

// Expected: All 4 requests succeed (200s)
// NOT expected: Any 401s without a refresh call
```

---

## Deep Test (15 minutes)

### Setup: Set token to 1 minute expiry (temporary)

**Backend**:
```bash
# Edit app/core/config.py
ACCESS_TOKEN_EXPIRE_MINUTES = 1  # was 15

# Restart backend
# Kill: Ctrl+C
# Run: uvicorn app.main:app --reload
```

### Test 1: Single Request After Expiry
1. Login successfully
2. Open DevTools → Network tab
3. Wait 61 seconds (token expires)
4. Click "Tasks" or any page
5. Check Network tab:
   - Should see first request → 401
   - Then /refresh endpoint called
   - Then same request retried → 200
   - Should NOT redirect to /login

**Expected Network sequence**:
```
GET /api/v1/tasks → 401
POST /api/v1/auth/refresh → 200
GET /api/v1/tasks → 200  (retry with new token)
```

### Test 2: Multiple Requests After Expiry
1. Login successfully
2. Open DevTools → Network tab
3. Wait 61 seconds (token expires)
4. Quickly click multiple pages (Tasks, Categories, Analytics)
5. Check Network tab:
   - Should see multiple 401s
   - Only ONE /refresh call
   - All requests retried with new token
   - Should NOT redirect to /login

**Expected Network sequence**:
```
GET /api/v1/tasks → 401
GET /api/v1/categories → 401
GET /api/v1/analytics/overview → 401
POST /api/v1/auth/refresh → 200
GET /api/v1/tasks → 200
GET /api/v1/categories → 200
GET /api/v1/analytics/overview → 200
```

### Test 3: Check Cookie Rotation
1. Login and get initial cookies (see in DevTools)
2. Open Console and note the refresh_token value:
   ```javascript
   // Get all cookies
   const cookies = document.cookie.split(';').reduce((obj, cookie) => {
     const [key, value] = cookie.trim().split('=');
     obj[key] = value;
     return obj;
   }, {});
   console.log('refresh_token:', cookies.refresh_token);
   ```
3. Save that value
4. Wait 61 seconds for token to expire
5. Make a request (triggers refresh)
6. Check cookie again:
   ```javascript
   // Paste same code as above
   console.log('NEW refresh_token:', cookies.refresh_token);
   ```
7. **Expected**: The refresh_token value should CHANGE (token rotated)

---

## Railway Production Test

### Check logs for /refresh calls
```bash
# In Railway dashboard:
# 1. Go to your project
# 2. Logs tab
# 3. Search for: /auth/refresh

# You should see patterns like:
# ✅ POST /auth/refresh - 200 (good)
# ✅ Few /refresh calls (not 100+ per hour)
# ❌ Many POST /auth/refresh - 401 (bad - indicates race condition)
# ❌ Hung requests (timeout waiting for refresh)
```

### Monitor error messages
Look for these messages in logs:
- ❌ "Refresh token not found" - means cookie not being sent
- ❌ "Invalid or expired refresh token" - means old token, token rotation issue
- ✅ "Access token refreshed successfully" - working correctly

### Performance metrics
```bash
# Check response times:
POST /auth/refresh

# ✅ Expected: 50-200ms
# ❌ Bad: > 500ms (indicates database issue)
```

---

## Debugging: If Tests Fail

### Issue: /refresh returns 401
**Cause**: Likely token rotation failure or token validation issue

**Debug**:
1. Check backend logs for full error message
2. Verify refresh_token is in request cookies
3. Check `refresh_tokens` table in database:
   ```sql
   -- In your DB client:
   SELECT id, user_id, is_revoked, expires_at, created_at
   FROM refresh_tokens
   ORDER BY created_at DESC
   LIMIT 10;

   -- Expected: recent tokens with is_revoked=false
   ```

### Issue: Multiple /refresh calls instead of one
**Cause**: Race condition not fixed, or frontend queue not working

**Debug**:
1. Check if isRefreshing flag is being set/reset
2. Add console.log to frontend lib/api/client.ts:
   ```typescript
   console.log('[AUTH] isRefreshing:', isRefreshing)
   console.log('[AUTH] failedQueue length:', failedQueue.length)
   ```
3. Repeat test and check console for flag management

### Issue: Browser keeps redirecting to login
**Cause**: /refresh failing completely, not just race condition

**Debug**:
1. Open Network tab
2. Trigger the issue
3. Click /refresh request
4. Check Response tab for error message
5. Check Response Headers for Set-Cookie (should be there)

---

## Reset Back to Normal

```bash
# Edit app/core/config.py
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # was 1

# Restart backend
# Kill: Ctrl+C
# Run: uvicorn app.main:app --reload
```

---

## Success Criteria

✅ All tests pass if:
1. Single request after expiry works without redirect
2. Multiple simultaneous requests show ONE /refresh only
3. Refresh token value changes in cookies (rotation working)
4. No 401s appear in final Network tab (except triggering refresh)
5. User never forced to login unless refresh completely fails
6. Railway logs show successful /refresh calls

❌ If any of these fail:
1. Check AUTH_FIX_SUMMARY.md for what was changed
2. Verify both backend AND frontend changes deployed
3. Clear browser cache/cookies and retry
4. Check database for refresh_token table integrity

