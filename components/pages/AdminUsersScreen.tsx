'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useCurrentUserId, useAuth } from '@/components/providers/AuthProvider';
import { userService } from '@/lib/services/userService';
import { adminService } from '@/lib/services/adminService';
import { AppUser } from '@/lib/models/appUser';
import { DateFormatter, AppDateFormatStyle } from '@/lib/utils/dateFormatter';
import { getInitials, colorFromName } from '@/lib/utils/validator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type UserRole = 'member' | 'temporary' | 'guest' | 'all';

export default function AdminUsersScreen() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const { loading: authLoading } = useAuth();
  const userId = useCurrentUserId();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('all');
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getAllUsers();
      // Only show users that have a role (not null or empty)
      const usersWithRole = data.filter((user) => user.role && user.role.trim() !== '');
      
      // Sort by last login (most recent first), then by name
      // Users without lastLoginAt are sorted to the end
      const sortedUsersList = usersWithRole.sort((a, b) => {
        const aLastLogin = a.lastLoginAt?.getTime();
        const bLastLogin = b.lastLoginAt?.getTime();
        
        // If both have lastLoginAt, sort by most recent first
        if (aLastLogin && bLastLogin) {
          if (bLastLogin !== aLastLogin) {
            return bLastLogin - aLastLogin;
          }
          return a.name.localeCompare(b.name);
        }
        
        // If only one has lastLoginAt, prioritize it
        if (aLastLogin && !bLastLogin) return -1;
        if (!aLastLogin && bLastLogin) return 1;
        
        // If neither has lastLoginAt, sort by name
        return a.name.localeCompare(b.name);
      });
      
      setUsers(sortedUsersList);
    } catch (e) {
      setError((e as Error).toString());
    } finally {
      setIsLoading(false);
    }
  };

  const checkAdminAndLoad = async () => {
    if (authLoading) return;

    if (!userId) {
      router.push(`/${locale}/`);
      return;
    }

    try {
      const appUser = await userService.getUserById(userId);
      if (appUser?.role !== 'admin') {
        router.push(`/${locale}/`);
        return;
      }
      setIsCheckingAdmin(false);
      loadUsers();
    } catch (e) {
      console.error('Failed to check admin status:', e);
      router.push(`/${locale}/`);
    }
  };

  useEffect(() => {
    checkAdminAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, authLoading]);

  const filteredUsers = useMemo(() => {
    // Only include users with a valid role
    const usersWithRole = users.filter((user) => user.role && user.role.trim() !== '');
    
    if (selectedRole === 'all') {
      return usersWithRole;
    }
    return usersWithRole.filter((user) => user.role === selectedRole);
  }, [users, selectedRole]);

  // Sort by last login (most recent first), then by name
  // Users without lastLoginAt are sorted to the end
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aLastLogin = a.lastLoginAt?.getTime();
      const bLastLogin = b.lastLoginAt?.getTime();
      
      // If both have lastLoginAt, sort by most recent first
      if (aLastLogin && bLastLogin) {
        if (bLastLogin !== aLastLogin) {
          return bLastLogin - aLastLogin;
        }
        return a.name.localeCompare(b.name);
      }
      
      // If only one has lastLoginAt, prioritize it
      if (aLastLogin && !bLastLogin) return -1;
      if (!aLastLogin && bLastLogin) return 1;
      
      // If neither has lastLoginAt, sort by name
      return a.name.localeCompare(b.name);
    });
  }, [filteredUsers]);

  if (authLoading || isCheckingAdmin || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="sticky top-0 bg-background border-b border-border px-4 py-3 z-100">
          <h1 className="text-xl font-semibold">Admin • Users</h1>
        </div>
        <div className="p-4 text-error">
          <p className="font-medium">Failed to load users.</p>
          <p className="text-sm text-error">{error}</p>
          <button
            onClick={loadUsers}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Map app locale to Intl locale format (e.g., 'en' -> 'en-US', 'th' -> 'th-TH')
  const intlLocale = locale === 'th' ? 'th-TH' : locale === 'en' ? 'en-US' : undefined;

  // Only count users that have a role (not null or empty)
  const usersWithRole = users.filter((u) => u.role && u.role.trim() !== '');
  const memberCount = usersWithRole.filter((u) => u.role === 'member').length;
  const temporaryCount = usersWithRole.filter((u) => u.role === 'temporary').length;
  const guestCount = usersWithRole.filter((u) => u.role === 'guest').length;

  return (
    <div className="min-h-screen bg-subtle pb-20">
      <div className="sticky top-0 bg-background border-b border-border px-4 py-3 z-100">
        <h1 className="text-xl font-semibold">Admin • Users</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Role Filter */}
        <div className="flex justify-center">
          <ToggleGroup
            type="single"
            value={selectedRole}
            onValueChange={(value) => {
              if (value) setSelectedRole(value as UserRole);
            }}
            variant="outline"
            className="w-full max-w-md"
          >
            <ToggleGroupItem value="all" aria-label="All users" className="flex-1">
              All ({usersWithRole.length})
            </ToggleGroupItem>
            <ToggleGroupItem value="member" aria-label="Members" className="flex-1">
              Member ({memberCount})
            </ToggleGroupItem>
            <ToggleGroupItem value="temporary" aria-label="Temporary" className="flex-1">
              Temporary ({temporaryCount})
            </ToggleGroupItem>
            <ToggleGroupItem value="guest" aria-label="Guest" className="flex-1">
              Guest ({guestCount})
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Users List */}
        {sortedUsers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {selectedRole === 'all' ? 'No users found.' : `No ${selectedRole} users found.`}
          </p>
        ) : (
          <div className="space-y-3">
            {sortedUsers.map((user) => {
              const lastLoginText = user.lastLoginAt
                ? DateFormatter.format(user.lastLoginAt, AppDateFormatStyle.dateTime, intlLocale)
                : 'Never';

              return (
                <div
                  key={user.id}
                  onClick={() => router.push(`/${locale}/profile/${user.id}`)}
                  className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      {user.pictureUrl ? (
                        <AvatarImage src={user.pictureUrl} alt={user.name} />
                      ) : null}
                      <AvatarFallback
                        className="text-white font-bold text-xl"
                        style={{ backgroundColor: colorFromName(user.name) }}
                      >
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{user.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        Last login: {lastLoginText}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

