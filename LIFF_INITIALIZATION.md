# LIFF Initialization Flow

## Overview

LIFF (LINE Front-end Framework) is now initialized at the root level of the application, ensuring it's ready before any routing or component rendering happens.

## Architecture

### 1. LiffProvider (`components/providers/LiffProvider.tsx`)

The `LiffProvider` component wraps the entire application and handles LIFF initialization:

- **Location**: Integrated in `app/[locale]/layout.tsx`
- **Initialization**: Happens before any page or component renders
- **Login Flow**: Automatically redirects to LINE login if user is not authenticated

### 2. Flow Sequence

```
1. User visits any URL (/, /ds, /username, or with liff.state parameters)
   ↓
2. LiffProvider initializes LIFF first
   ↓
3. If not logged in → Redirect to LINE login
   ↓
4. Once LIFF is ready → Router processes the URL
   ↓
5. UsernameGate checks Firebase auth and username
   ↓
6. User sees the requested page
```

### 3. Supported URL Patterns

All these URLs will properly initialize LIFF before loading:

- `app.golfgun.co/` - Home page
- `app.golfgun.co/ds` - Design system
- `app.golfgun.co/username` - Username setup
- `app.golfgun.co?liff.state=%2Fds` - LIFF state redirect to /ds
- `app.golfgun.co/rounds/123` - Direct deep link to a round

## Usage in Components

### Using LIFF in Your Components

```tsx
import { useLiff, liff } from '@/components/providers/LiffProvider';

function MyComponent() {
  const { isReady, error } = useLiff();
  
  // LIFF is guaranteed to be initialized at this point
  // because LiffProvider blocks rendering until ready
  
  const handleGetProfile = async () => {
    if (!isReady) return;
    
    try {
      const profile = await liff.getProfile();
      console.log('User profile:', profile);
    } catch (error) {
      console.error('Failed to get profile:', error);
    }
  };
  
  return (
    <button onClick={handleGetProfile}>
      Get Profile
    </button>
  );
}
```

### Direct LIFF Access

Since LIFF is initialized at the root level, you can use it directly in any component without additional initialization:

```tsx
import liff from '@line/liff';

function AnotherComponent() {
  const userId = liff.getContext()?.userId;
  const isInClient = liff.isInClient();
  
  // Use LIFF APIs directly
  // ...
}
```

## Key Benefits

1. **Consistent Initialization**: LIFF is initialized once at app startup
2. **Handles Deep Links**: Works with `liff.state` URL parameters
3. **No Race Conditions**: Components render only after LIFF is ready
4. **Better UX**: Single loading state for the entire app
5. **Simplified Components**: Individual screens don't need to handle LIFF initialization

## Migration Notes

### Before (Old Pattern)
```tsx
// HomePage.tsx - OLD WAY
function HomePage() {
  const [isLiffReady, setIsLiffReady] = useState(false);
  
  useEffect(() => {
    const initializeLiff = async () => {
      await liff.init({ liffId: 'YOUR_LIFF_ID' });
      setIsLiffReady(true);
    };
    initializeLiff();
  }, []);
  
  if (!isLiffReady) return <Loading />;
  return <Content />;
}
```

### After (New Pattern)
```tsx
// HomePage.tsx - NEW WAY
function HomePage() {
  // LIFF is already initialized by LiffProvider
  // Just render your content
  return <Content />;
}
```

## Troubleshooting

### LIFF Not Initializing
- Check `NEXT_PUBLIC_LIFF_ID` environment variable
- Verify LIFF app is properly configured in LINE Developers Console
- Check browser console for initialization errors

### Login Loop
- Ensure your LIFF endpoint URL matches the registered one in LINE Developers Console
- Check if the LIFF ID is correct

### Deep Links Not Working
- The router already handles `liff.state` parameters in `lib/utils/router.tsx`
- Make sure your deep link format follows: `app.golfgun.co?liff.state=%2Fpath%2Fto%2Fpage`

## Technical Details

- **Initialization Check**: Prevents re-initialization using `liff.isInitialized()`
- **Loading State**: Shows "Initializing LIFF..." while loading
- **Error Handling**: Displays error message if initialization fails
- **Context API**: Uses React Context to share LIFF state across components

