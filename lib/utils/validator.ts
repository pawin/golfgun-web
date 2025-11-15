export function sanitizeUsername(input: string): string | null {
  const username = input.trim().toLowerCase();

  // 1. Length check
  if (username.length < 3 || username.length > 10) {
    return 'Username must be 3–10 characters long';
  }

  // 2. Allowed characters only (a–z, 0–9, . and _)
  const validChars = /^[a-z0-9._]+$/;
  if (!validChars.test(username)) {
    return 'Only English letters, numbers, . and _ are allowed';
  }

  // 3. Must start and end with a letter or number
  const startEndValid = /^[a-z0-9].*[a-z0-9]$/;
  if (!startEndValid.test(username)) {
    return 'Must start and end with a letter or number';
  }

  // 4. No consecutive dots or underscores or mixed ._ or _.
  if (
    username.includes('..') ||
    username.includes('__') ||
    username.includes('._') ||
    username.includes('_.')
  ) {
    return 'Cannot contain consecutive or mixed dots and underscores';
  }

  // Valid
  return null;
}

export function getInitials(name: string): string {
  if (name.length === 0) return '?';

  // Split by '.' or '_'
  const parts = name.split(/[._]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (name.length >= 2) {
    return name.substring(0, 2).toUpperCase();
  }
  return name[0].toUpperCase();
}

export function colorFromName(name: string): string {
  // Take first 3 characters (lowercased)
  const key = name.toLowerCase().padEnd(3).substring(0, 3);

  // Generate a simple hash
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash * 37) + key.charCodeAt(i)) & 0x7fffffff;
  }

  // Use hash to pick hue (0–360)
  const hue = hash % 360;

  // Keep colors rich but dark enough for white text
  const saturation = 60; // 0–100
  const lightness = 35; // darker side

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

