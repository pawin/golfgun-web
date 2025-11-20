# Firebase Authentication Best Practices

This document outlines the best practices for accessing Firebase user ID and authentication state in this project.

## Overview

We've implemented a centralized authentication context provider (`AuthProvider`) that manages Firebase authentication state across the entire application. This provides a single source of truth for user authentication and makes it easy to access the user ID throughout the app.

## Architecture

### 1. AuthProvider (React Components)

For React components, use the `AuthProvider` hooks:

#### `useAuth()` - Full auth state
```tsx
import { useAuth } from '@/components/providers/AuthProvider';

function MyComponent() {
  const { user, loading, error, userId } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>Please sign in</div>;
  
  // Use userId directly
  const rounds = await roundService.getAllRounds(userId!);
}
```

#### `useCurrentUserId()` - Just the user ID (convenience hook)
```tsx
import { useCurrentUserId } from '@/components/providers/AuthProvider';

function MyComponent() {
  const userId = useCurrentUserId();
  
  if (!userId) return <div>Please sign in</div>;
  
  // Use userId directly
  const rounds = await roundService.getAllRounds(userId);
}
```

### 2. Utility Functions (Services/Non-React Code)

For services, utility functions, or non-React contexts, use the utility functions:

#### `getCurrentUserId()` - Get user ID (can return null)
```ts
import { getCurrentUserId } from '@/lib/utils/auth';

export class MyService {
  async doSomething() {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User must be authenticated');
    }
    // Use userId...
  }
}
```

#### `requireUserId()` - Get user ID (throws if not authenticated)
```ts
import { requireUserId } from '@/lib/utils/auth';

export class MyService {
  async doSomething() {
    const userId = requireUserId(); // Throws if not authenticated
    // Use userId...
  }
}
```

#### `getCurrentUser()` - Get full user object
```ts
import { getCurrentUser } from '@/lib/utils/auth';

export class MyService {
  async doSomething() {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }
    // Use user.uid, user.email, etc.
  }
}
```

## Migration Guide

### Before (Old Pattern)
```tsx
// ❌ Old way - using useAuthState directly
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';

function MyComponent() {
  const [user, loading] = useAuthState(auth);
  
  useEffect(() => {
    if (user && !loading) {
      // Do something with user.uid
    }
  }, [user, loading]);
}
```

### After (New Pattern)
```tsx
// ✅ New way - using AuthProvider
import { useCurrentUserId } from '@/components/providers/AuthProvider';

function MyComponent() {
  const userId = useCurrentUserId();
  
  useEffect(() => {
    if (userId) {
      // Do something with userId
    }
  }, [userId]);
}
```

### Services Migration

#### Before
```ts
// ❌ Old way - direct access
import { auth } from '@/lib/firebase/config';

export class MyService {
  async doSomething() {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('Not authenticated');
    }
    // ...
  }
}
```

#### After
```ts
// ✅ New way - using utility
import { requireUserId } from '@/lib/utils/auth';

export class MyService {
  async doSomething() {
    const userId = requireUserId(); // Throws if not authenticated
    // ...
  }
}
```

## Best Practices

### ✅ DO

1. **Use `useCurrentUserId()` in React components** - It's the simplest way to get the user ID
2. **Use `requireUserId()` in services** - It throws a clear error if not authenticated
3. **Check for null/loading states** - Always handle the case where user might not be authenticated
4. **Use the context in components** - Avoid direct `auth.currentUser` access in components

### ❌ DON'T

1. **Don't use `auth.currentUser` directly in components** - Use the context hooks instead
2. **Don't use `useAuthState` directly** - The AuthProvider already handles this
3. **Don't assume user is always authenticated** - Always check for null/loading states
4. **Don't access `auth.currentUser` in services without error handling** - Use `requireUserId()` instead

## Performance Considerations

- **Single `useAuthState` call**: The `AuthProvider` makes a single `useAuthState` call at the root level, which is more efficient than multiple calls in different components
- **Cached user ID**: The `userId` is derived once and cached in the context, avoiding repeated `user?.uid` checks
- **Re-render optimization**: Only components using `useAuth()` or `useCurrentUserId()` will re-render when auth state changes

## Examples

### Example 1: Component with user ID
```tsx
import { useCurrentUserId } from '@/components/providers/AuthProvider';
import { roundService } from '@/lib/services/roundService';

export default function MyRoundsScreen() {
  const userId = useCurrentUserId();
  const [rounds, setRounds] = useState<Round[]>([]);
  
  useEffect(() => {
    if (!userId) return;
    
    roundService.getAllRounds(userId).then(setRounds);
  }, [userId]);
  
  if (!userId) return <div>Please sign in</div>;
  
  return <div>{/* Render rounds */}</div>;
}
```

### Example 2: Service method
```ts
import { requireUserId } from '@/lib/utils/auth';

export class RoundService {
  async getAllRounds(): Promise<Round[]> {
    const userId = requireUserId();
    // Use userId...
  }
}
```

### Example 3: Conditional rendering
```tsx
import { useAuth } from '@/components/providers/AuthProvider';

export default function ProfileScreen() {
  const { user, loading, userId } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  
  return <div>Welcome, {user.email}!</div>;
}
```

## Troubleshooting

### "useAuth must be used within an AuthProvider"
- Make sure your component is rendered inside the `AuthProvider` (which is in `app/[locale]/layout.tsx`)
- If you're in a page that's not under `[locale]`, you may need to add the provider there too

### User ID is null when it should have a value
- Check that Firebase auth is initialized
- Verify the user is actually signed in
- Check browser console for auth errors
- Ensure you're not calling the function on the server side (use `typeof window !== 'undefined'` check)

### Service throws "User must be authenticated"
- This is expected behavior when using `requireUserId()`
- Make sure the user is signed in before calling the service method
- Consider using `getCurrentUserId()` and handling null explicitly if you want different behavior

