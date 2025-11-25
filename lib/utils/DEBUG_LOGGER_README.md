# Debug Logger

A visual debug logging system for client-side components.

## Overview

The Debug Logger provides a floating UI component that displays logs from your React client components in real-time. This is especially useful for debugging components like `LiffProvider` and `AuthProvider` where `console.log` statements only appear in the browser console.

## Features

- ✅ **Real-time logs** - See logs as they happen
- ✅ **Categorized by level** - Info, Warn, Error, Success
- ✅ **Source tracking** - Know which component logged what
- ✅ **Data inspection** - Expand logs to see detailed data objects
- ✅ **Persistent** - Logs stay visible even as you navigate
- ✅ **Minimizable** - Collapse when not needed
- ✅ **Auto-clears** - Keeps only the 100 most recent logs

## How to Use

### 1. The Debug Logger View is Already Added

The `DebugLoggerView` component is already added to your app layout and will appear as a floating button in the bottom-right corner of your screen.

### 2. Click to Open

Click the "Debug Logs" button to open the debug panel.

### 3. View Logs

Logs are displayed in real-time with:
- **Timestamp** - When the log occurred
- **Level** - Info (blue), Warn (yellow), Error (red), Success (green)
- **Source** - Which component/service logged it (e.g., "LiffProvider", "AuthProvider")
- **Message** - The log message
- **Data** - Optional data object (click "Show data" to expand)

### 4. Controls

- **Minimize** - Click the chevron to collapse the panel
- **Clear** - Click the trash icon to clear all logs
- **Close** - Click the X to close the panel (button will reappear in corner)

## Adding Logs to Your Components

### Import the logger

```typescript
import { debugLogger } from '@/lib/utils/debugLogger';
```

### Use the logging methods

```typescript
// Info log
debugLogger.info('ComponentName', 'Something happened');

// Warn log
debugLogger.warn('ComponentName', 'Warning message');

// Error log
debugLogger.error('ComponentName', 'Error message', errorObject);

// Success log
debugLogger.success('ComponentName', 'Operation completed successfully');

// With additional data
debugLogger.info('ComponentName', 'User logged in', {
  userId: user.id,
  timestamp: new Date(),
});
```

## Example Usage

Already implemented in:
- **LiffProvider** - Logs LIFF initialization, login status, errors
- **AuthProvider** - Logs Firebase initialization, user authentication, profile checks

## Tips

- Use descriptive messages that help you understand what's happening
- Include relevant data objects to see the state at that moment
- Use appropriate log levels (info, warn, error, success) for better visibility
- The logger also logs to browser console for backup

## Production

In production, you may want to:
1. Remove the `<DebugLoggerView />` component from the layout
2. Or conditionally render it based on an environment variable:

```typescript
{process.env.NODE_ENV === 'development' && <DebugLoggerView />}
```

