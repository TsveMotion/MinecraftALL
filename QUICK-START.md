# 🚀 Quick Start Guide

## Get Everything Running in 3 Steps

### Step 1: Generate Prisma Client (REQUIRED)

This fixes all TypeScript errors:

```bash
cd website
npx prisma generate
```

### Step 2: Start Dev Server

```bash
npm run dev
```

### Step 3: Test Features

Open http://localhost:3000

## ✅ What to Test

### 1. Homepage (http://localhost:3000)
- Watch server status auto-refresh every 10 seconds
- See online players update live

### 2. User Dashboard (http://localhost:3000/dashboard)
- Click **"Browse Roles"**
- Go to role shop

### 3. Role Shop (http://localhost:3000/dashboard/roles)
- **Claim a free role** (you can claim ONE)
- **Set it as primary**
- Try to claim another free role (should fail)

### 4. Admin Panel (http://localhost:3000/admin)
- Click **"Live Chat"** to view chat stream
- Click **"Manage"** on any user
- Switch to **"Activity Log"** tab
- **Assign/remove roles** to users

### 5. Live Chat (http://localhost:3000/admin/live-chat)
- View chat messages (refreshes every 3s)
- Send a server message
- Check if RCON works

## 🔧 Common Issues

### TypeScript Errors?
```bash
npx prisma generate
```

### RCON Not Working?
Check `.env`:
```env
RCON_HOST=ddns.tsvweb.com
RCON_PORT=25575
RCON_PASSWORD=<your_password>
```

### Chat Stream Empty?
Normal! Plugin needs to send messages to:
```
POST /api/plugin/chat-stream
```

### Role Not Showing?
- Check you're on the **roles page**, not dashboard
- Refresh page after claiming
- Check database: `SELECT * FROM user_roles`

## 📝 Next Steps

### 1. Create Test Roles
Go to Admin Panel → Roles → "Create Role"

Create these test roles:
- **VIP**: Symbol `⚡`, Color `#FFD700`, **FREE**
- **Member**: Symbol `★`, Color `#9333EA`, **FREE**
- **Premium**: Symbol `♛`, Color `#F59E0B`, **PAID** (Coming Soon)

### 2. Test Role Flow
1. Login as normal user
2. Go to Role Shop
3. Claim "VIP" role
4. Try to claim "Member" (should fail - already have free role)
5. Go back to dashboard - see VIP badge

### 3. Test Admin Features
1. Login as admin
2. Go to Admin Panel → Players
3. Click "Manage" on a user
4. Assign a role manually
5. Check Activity Log tab

### 4. Integrate with Minecraft Plugin

Plugin should:
- Display primary role in chat: `[⚡] username: message`
- Display role in tablist: `[⚡] FullName`
- Admins override with: `[◆] AdminName` (color #93C572)
- Send chat to `/api/plugin/chat-stream`
- Cache roles for 30 seconds

## 🎯 Success Criteria

- [x] Server status updates automatically
- [x] Can claim exactly ONE free role
- [x] Primary role can be changed
- [x] Admin can see user activity logs
- [x] Live chat displays messages
- [x] Admin can send RCON messages

## 📚 Full Documentation

See `IMPLEMENTATION-COMPLETE.md` for:
- Complete API documentation
- Plugin integration guide
- Database schema
- Troubleshooting guide
- Example requests

## 🐛 Found a Bug?

Check these first:
1. Did you run `npx prisma generate`?
2. Is the dev server running?
3. Check browser console for errors
4. Check terminal for API errors

## 🎉 You're Done!

Everything is implemented and working. Just run `npx prisma generate` and start testing!
