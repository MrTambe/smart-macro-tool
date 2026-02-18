# LM Studio Integration Troubleshooting Guide

## 🚀 QUICK FIX CHECKLIST

### **IMMEDIATE ACTIONS (Complete These First):**

- [ ] **1. LM Studio Server Running?**
  - Open LM Studio → Developer → Start Server
  - Verify port: `http://localhost:1234`

- [ ] **2. CORS Enabled?**
  - LM Studio → Developer → Server Settings
  - Check "Enable Cross-Origin Resource Sharing (CORS)"
  - Click Apply

- [ ] **3. Model Loaded?**
  - Verify a model shows "Model loaded" in LM Studio
  - Example: Llama 3.1 8B, Mistral 7B, etc.

- [ ] **4. Windows Firewall**
  - Allow LM Studio through firewall
  - Or allow port 1234

- [ ] **5. Test Connection**
  - Open browser → `http://localhost:1234/v1/models`
  - Should return JSON response

- [ ] **6. Smart Macro Tool**
  - Settings → AI Configuration
  - Click "Auto-detect Providers"
  - Or refresh the page

---

## 🔧 DETAILED FIXES

### **FIX 1: UI Layout - Toolbar/Sidebar Cramped**

**Problem:** Toolbar is cramped with horizontal scroll bar

**Solution:** Update the Toolbar component with responsive layout

Replace your `Toolbar.tsx` with this improved version:

```tsx
// Key changes made:
// 1. Added overflow-x-auto and flex-wrap
// 2. Reduced padding and gaps
// 3. Made buttons more compact
// 4. Added min-width to prevent squishing

<div 
  className="flex flex-col border-b border-gray-300 overflow-hidden"
  style={{ backgroundColor: toolbarBgColor, color: toolbarFontColor }}
>
  {/* Main Toolbar - Now with horizontal scroll if needed */}
  <div className="flex items-center gap-0.5 px-2 py-1 overflow-x-auto whitespace-nowrap">
    {/* All your toolbar sections */}
  </div>
</div>
```

**CSS Fixes to Add:**

```css
/* Add to your globals.css */
.toolbar-container {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.toolbar-container::-webkit-scrollbar {
  height: 6px;
}

.toolbar-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

/* Ensure buttons don't shrink */
.toolbar-button {
  flex-shrink: 0;
  min-width: fit-content;
}
```

---

### **FIX 2: LM Studio Detection Issues**

#### **A. Verify LM Studio Server Configuration**

**Step 1: Check Server is Running**
```bash
# Open Command Prompt and run:
curl http://localhost:1234/v1/models

# Expected Output:
{
  "data": [
    {
      "id": "local-model",
      "object": "model"
    }
  ]
}
```

**If you get "Connection refused":**
- LM Studio server is not running
- Open LM Studio → Developer → Start Server

**Step 2: Enable CORS (Critical for Browser Access)**

```
In LM Studio:
1. Go to "Developer" tab
2. Click "Server Settings"
3. Check: "Enable Cross-Origin Resource Sharing (CORS)"
4. Click "Apply"
5. Stop and restart the server
6. Verify CORS is working:
   - Open browser devtools (F12)
   - Go to Console
   - Run: fetch('http://localhost:1234/v1/models').then(r => r.json()).then(console.log)
   - Should return model list without CORS errors
```

**Step 3: Check Port Availability**

```bash
# Check if port 1234 is in use
netstat -ano | findstr :1234

# If nothing shows, port is free
# If something shows, note the PID and check:
tasklist | findstr [PID]
```

**Step 4: Windows Firewall Configuration**

```powershell
# Run as Administrator in PowerShell:

# Option 1: Allow specific port
New-NetFirewallRule -DisplayName "LM Studio API" -Direction Inbound -LocalPort 1234 -Protocol TCP -Action Allow

# Option 2: Allow LM Studio application
# Go to Windows Security → Firewall → Allow an app
# Find "LM Studio" and check Private and Public
```

---

### **FIX 3: API Integration - Smart Macro Tool Configuration**

#### **A. Manual LM Studio Configuration**

In Smart Macro Tool:

```typescript
// If auto-detect fails, manually configure:

1. Open Settings (gear icon)
2. Go to "AI Configuration" tab
3. Scroll to "LM Studio (Local)" section
4. Verify settings:
   - Server URL: http://localhost:1234
   - Status should show: "Connected"

5. If status shows "Not Connected":
   - Click "Auto-detect Providers" button
   - Wait 5 seconds
   - Check browser console (F12) for errors
```

#### **B. API Endpoint Configuration**

**Correct API Endpoints for LM Studio:**

```javascript
// LM Studio uses OpenAI-compatible API

// 1. List Models
GET http://localhost:1234/v1/models

// 2. Generate Completion
POST http://localhost:1234/v1/chat/completions
Content-Type: application/json

{
  "model": "local-model",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 2048
}

// 3. Streaming (for real-time responses)
POST http://localhost:1234/v1/chat/completions
Content-Type: application/json

{
  "model": "local-model",
  "messages": [{"role": "user", "content": "Hello"}],
  "stream": true
}
```

**Test with JavaScript:**

```javascript
// Test in browser console
async function testLMStudio() {
  try {
    const response = await fetch('http://localhost:1234/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'local-model',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 50
      })
    });
    
    const data = await response.json();
    console.log('Success:', data.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

testLMStudio();
```

---

## 🎨 CSS/UI FIXES FOR TOOLBAR

### **Fix Horizontal Scroll Issues**

**Option 1: Responsive Toolbar (Recommended)**

```tsx
// Toolbar.tsx - Wrap toolbar sections properly

<div className="flex flex-col border-b border-gray-300">
  {/* Main Toolbar */}
  <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto">
    
    {/* Use flex-shrink-0 to prevent squishing */}
    <div className="flex items-center gap-0.5 pr-2 border-r border-gray-300 flex-shrink-0">
      {/* Clipboard buttons */}
    </div>
    
    <div className="flex items-center gap-1 px-2 border-r border-gray-300 flex-shrink-0">
      {/* Font controls */}
    </div>
    
    {/* Add flex-shrink-0 to all sections */}
    
  </div>
</div>
```

**Option 2: Collapsible Toolbar**

```tsx
// Add a "More" dropdown for less-used features

const [showMore, setShowMore] = useState(false);

<div className="flex items-center">
  {/* Essential tools always visible */}
  <div className="flex gap-1">
    <BoldButton />
    <ItalicButton />
    {/* ... */}
  </div>
  
  {/* "More" dropdown for additional tools */}
  <div className="relative">
    <button onClick={() => setShowMore(!showMore)}>
      More ▼
    </button>
    {showMore && (
      <div className="absolute top-full right-0 bg-white shadow-lg rounded">
        {/* Less frequently used tools */}
      </div>
    )}
  </div>
</div>
```

**Option 3: Two-Row Toolbar**

```tsx
// Split into two rows
<div className="flex flex-col">
  {/* Row 1: Essential formatting */}
  <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-200">
    {/* Bold, Italic, Font, Size */}
  </div>
  
  {/* Row 2: Advanced features */}
  <div className="flex items-center gap-1 px-2 py-1">
    {/* Alignment, Colors, Borders, Merge */}
  </div>
</div>
```

---

## 🔍 DEBUGGING CHECKLIST

### **If Detection Still Fails:**

**1. Check Browser Console:**
```
F12 → Console → Look for:
- "Failed to fetch"
- "CORS policy" errors
- "Connection refused"
- "net::ERR_CONNECTION_REFUSED"
```

**2. Check Network Tab:**
```
F12 → Network → Look for:
- Red failed requests
- Status codes (200 = OK, 403 = Forbidden, 404 = Not Found)
- Response headers (should include CORS headers)
```

**3. Test Step by Step:**
```bash
# Step 1: Is LM Studio running?
curl http://localhost:1234/v1/models

# Step 2: Can you generate a response?
curl -X POST http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "local-model", "messages": [{"role": "user", "content": "Hello"}]}'

# Step 3: Check from browser
# Open http://localhost:1234/v1/models in browser
# Should show JSON, not an error
```

**4. Common Error Messages & Solutions:**

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection refused` | Server not running | Start LM Studio server |
| `CORS policy` | CORS not enabled | Enable CORS in LM Studio settings |
| `404 Not Found` | Wrong endpoint | Use `/v1/chat/completions` |
| `No model loaded` | No model in LM Studio | Load a model in LM Studio |
| `net::ERR_FAILED` | Firewall blocking | Add firewall rule for port 1234 |

---

## 📝 COMPLETE WORKING EXAMPLE

### **Working Configuration:**

**LM Studio Settings:**
```yaml
Server:
  Port: 1234
  Enable CORS: true
  Auto-start: true (optional)

Model:
  Loaded: Llama 3.1 8B Instruct (or any GGUF model)
  Context Length: 4096 (or model default)
```

**Smart Macro Tool Settings:**
```typescript
// AI Configuration → LM Studio
{
  provider: 'lmstudio',
  enabled: true,
  baseUrl: 'http://localhost:1234',
  connectionStatus: 'connected',
  loadedModel: {
    id: 'local-model',
    name: 'Llama 3.1 8B'
  }
}
```

**Test API Call:**
```javascript
const response = await fetch('http://localhost:1234/v1/chat/completions', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'local-model',
    messages: [
      { role: 'system', content: 'You are a spreadsheet assistant' },
      { role: 'user', content: 'Format this data: A1=10, B1=20' }
    ],
    temperature: 0.7,
    max_tokens: 2048
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

---

## 🆘 STILL NOT WORKING?

**Nuclear Option - Complete Reset:**

1. **Close Smart Macro Tool**
2. **Close LM Studio**
3. **Kill any lingering processes:**
   ```bash
   taskkill /F /IM "LM Studio.exe"
   taskkill /F /IM "lm-studio-server.exe"
   ```
4. **Clear browser cache** (if using web version)
5. **Restart LM Studio**
   - Load model
   - Start server
   - Enable CORS
6. **Restart Smart Macro Tool**
7. **Test connection**

**If all else fails:**
- Use Ollama instead (more reliable detection)
- Or use OpenRouter for cloud-based AI
- Check Windows Event Viewer for errors
- Check LM Studio logs (Help → Open Logs Folder)

---

## ✅ VERIFICATION STEPS

After applying fixes, verify:

1. [ ] LM Studio server shows "Running" status
2. [ ] Browser test to `localhost:1234/v1/models` works
3. [ ] Smart Macro Tool shows "Connected" status
4. [ ] Can send test message from Smart Macro Tool
5. [ ] Toolbar is visible without excessive scrolling
6. [ ] All toolbar buttons respond to clicks

---

## 📞 SUPPORT

If issues persist:
1. Check LM Studio documentation: https://lmstudio.ai/docs
2. Check Smart Macro Tool logs (F12 → Console)
3. Verify Windows version compatibility
4. Try running both apps as Administrator (test only)

**LM Studio Version Requirements:**
- Minimum: v0.2.x (with server support)
- Recommended: v0.3.x or later
- Must have "Developer" tab visible

---

**Last Updated:** February 7, 2026
**Applies to:** Smart Macro Tool + LM Studio Integration
