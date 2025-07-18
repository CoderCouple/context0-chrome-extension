# Service Worker Debug Guide

## Error Code 15: Common Causes and Solutions

### 1. Check Chrome Extension Load Status
1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Look for any errors under your extension
4. Click "Details" → "Errors" to see specific issues

### 2. Common Issues with Service Workers in Manifest V3

The service worker might fail due to:
- Missing permissions in manifest.json
- Incorrect file paths
- Syntax errors in background.js
- Missing required APIs

### 3. Add Missing Permissions
Your manifest.json might need the `contextMenus` permission since background.js uses it:

```json
"permissions": [
  "storage",
  "activeTab",
  "contextMenus"
]
```

### 4. Check Service Worker Registration
In the extension's background page console:
- Go to chrome://extensions/
- Find your extension and click "background page" or "service worker"
- Check the console for errors

### 5. Quick Fix Steps:
1. Update manifest.json to add `contextMenus` permission
2. Reload the extension
3. Check if the error persists

### 6. Alternative Debug Method
Try loading a minimal version first:
- Create a simple background.js with just console.log
- Remove all complex logic temporarily
- Add features back one by one