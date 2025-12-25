# Network Error Fix - Login/Register Issue

## Problem
Getting "AxiosError: Network Error" when trying to login or register

## Root Cause
The frontend (port 3000) cannot connect to the backend (port 8000).

## Solutions (Try in order):

### ✅ Solution 1: Restart Backend (MOST IMPORTANT)

The backend needs to be restarted to apply the embedding fix!

**Steps**:

1. **Stop the backend**:
   - Press `Ctrl+C` in the terminal where backend is running
   - OR find and kill the process:
   ```bash
   # Find backend process
   netstat -ano | findstr :8000
   # You'll see a PID (e.g., 15144)

   # Kill it
   taskkill /PID 15144 /F
   ```

2. **Start the backend again**:
   ```bash
   cd d:\Desktop\deployed-project\task-manager-app

   # Activate virtual environment (if using one)
   # .venv\Scripts\activate

   # Start backend
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

3. **Wait for startup message**:
   ```
   INFO:     Uvicorn running on http://127.0.0.1:8000
   INFO:     Application startup complete
   ```

---

### ✅ Solution 2: Check Backend is Running

Open http://localhost:8000/docs in your browser

**Expected**: You should see the FastAPI Swagger documentation
**If not**: Backend is not running - see Solution 1

---

### ✅ Solution 3: Restart Frontend

Sometimes frontend needs restart to pick up env variables:

```bash
# Kill frontend (Ctrl+C in terminal)
# Then restart:
cd frontend
npm run dev
```

---

### ✅ Solution 4: Check Environment Variables

Make sure `frontend/.env.local` has:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

After changing, **restart frontend** (Solution 3)

---

### ✅ Solution 5: Test Backend Manually

Open a new terminal and test:

```bash
# Test health check (if you have one)
curl http://localhost:8000/

# Test login endpoint (should get 422 or 400, not connection refused)
curl -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d "{}"
```

**Expected**: You get a response (even if it's an error response like 422)
**Not Expected**: "Connection refused" or timeout

---

### ✅ Solution 6: Check Firewall/Antivirus

Sometimes Windows Firewall blocks localhost connections:

1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Make sure Python is allowed
4. Try again

---

### ✅ Solution 7: Use 127.0.0.1 Instead

Edit `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

Restart frontend.

---

## Testing After Fix:

1. **Backend Test**:
   - Open http://localhost:8000/docs
   - Should see Swagger UI
   - Click on `/auth/register` → Try it out
   - Fill in test data
   - Should get 200 or 422 (not connection error)

2. **Frontend Test**:
   - Open http://localhost:3000/register
   - Fill in registration form
   - Click "Create Account"
   - Should NOT get "Network Error"
   - Should either register successfully or show validation error

---

## Quick Checklist:

- [ ] Backend is running on port 8000
- [ ] Can access http://localhost:8000/docs
- [ ] Frontend is running on port 3000
- [ ] `.env.local` has correct `NEXT_PUBLIC_API_URL`
- [ ] Both terminals show no errors
- [ ] Firewall allows Python
- [ ] Browser console shows request to `http://localhost:8000/api/v1/auth/login`

---

## Still Not Working?

### Check Backend Logs

In the backend terminal, you should see:
```
INFO: → POST /api/v1/auth/login
```

**If you DON'T see this**: Frontend is not reaching backend at all

**If you DO see this**: Backend is receiving the request, check the response

### Check Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Try to login
4. Look for the `/auth/login` request
5. Check:
   - **Request URL**: Should be `http://localhost:8000/api/v1/auth/login`
   - **Status**: If it says "(failed)", check Console for CORS errors
   - **Response**: If empty, backend didn't respond

### Common Issues:

**Issue**: Request URL shows `http://localhost:3000/api/v1/auth/login`
**Fix**: Frontend is using wrong URL. Check `.env.local` and restart frontend

**Issue**: CORS error in console
**Fix**: Backend CORS is already configured correctly. Just restart backend.

**Issue**: Connection refused
**Fix**: Backend is not running. Start it with `uvicorn app.main:app --reload`

---

## Final Solution:

**THE MOST COMMON FIX**:

1. Stop backend (Ctrl+C)
2. Restart backend: `uvicorn app.main:app --reload`
3. Wait for "Application startup complete"
4. Try login again

**This fixes 90% of Network Error issues!**

---

## Verify Everything is Working:

```bash
# Terminal 1 - Backend
cd d:\Desktop\deployed-project\task-manager-app
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd d:\Desktop\deployed-project\task-manager-app\frontend
npm run dev

# Browser
# 1. Go to http://localhost:3000/register
# 2. Create account
# 3. Should work without Network Error!
```
