/**
 * User migration service for migrating users from old systems (e.g., LINE LIFF)
 * to the new Firebase auth system. Migrates rounds from oldUserId to newUserId.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  setDoc,
  serverTimestamp,
  SetOptions,
  deleteField,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { roundService } from './roundService';

export interface UserMigrationResult {
  oldUserId: string;
  newUserId: string;
  migratedRoundIds: string[];
  failedRounds: Record<string, string>;
  status: 'success' | 'partial' | 'failed';
  logId?: string;
}

export class UserMigrationService {
  private get usersCollection() {
    if (typeof window === 'undefined') {
      throw new Error('UserMigrationService can only be used on the client side');
    }
    return collection(db, 'users');
  }

  private get roundsCollection() {
    if (typeof window === 'undefined') {
      throw new Error('UserMigrationService can only be used on the client side');
    }
    return collection(db, 'rounds');
  }

  private get migrationLogsCollection() {
    if (typeof window === 'undefined') {
      throw new Error('UserMigrationService can only be used on the client side');
    }
    return collection(db, 'migrationLogs');
  }

  /**
   * Migrates user data from oldUserId to newUserId (for LINE LIFF integration)
   * @param oldUserId - The old user ID (e.g., from LINE)
   * @param newUserId - The new user ID (Firebase auth)
   * @returns Migration result or null if old user doesn't exist
   */
  async migrateIfOldUserExistsAndLink(
    oldUserId: string,
    newUserId: string
  ): Promise<UserMigrationResult | null> {
    const oldUserRef = doc(this.usersCollection, oldUserId);
    const oldUserDoc = await getDoc(oldUserRef);

    if (!oldUserDoc.exists()) {
      return null;
    }

    const result = await this.migrateUser(oldUserId, newUserId);

    // Link old and new user IDs
    await Promise.all([
      setDoc(
        oldUserRef,
        { newUserId },
        { merge: true } as SetOptions
      ),
      setDoc(
        doc(this.usersCollection, newUserId),
        { oldUserId },
        { merge: true } as SetOptions
      ),
    ]);

    return result;
  }

  /**
   * Migrates all rounds from oldUserId to newUserId
   * @param oldUserId - The old user ID
   * @param newUserId - The new user ID
   * @returns Migration result
   */
  async migrateUser(
    oldUserId: string,
    newUserId: string
  ): Promise<UserMigrationResult> {
    if (!oldUserId || !newUserId) {
      throw new Error('oldUserId and newUserId cannot be empty');
    }

    // Verify new user exists
    const newUserDoc = await getDoc(doc(this.usersCollection, newUserId));
    if (!newUserDoc.exists()) {
      throw new Error(`New user ${newUserId} does not exist`);
    }

    // Find all rounds where oldUserId is a member
    const roundsQuery = query(
      this.roundsCollection,
      where('memberIds', 'array-contains', oldUserId)
    );
    const roundsSnapshot = await getDocs(roundsQuery);

    const migratedRoundIds: string[] = [];
    const failedRounds: Record<string, string> = {};

    // Migrate each round
    for (const roundDoc of roundsSnapshot.docs) {
      try {
        // Replace guest user in the round
        await roundService.replaceGuest(roundDoc.id, oldUserId, newUserId);

        // Update adminId if the old user was the admin
        const roundData = roundDoc.data();
        const currentAdminId = roundData.adminId?.toString();
        if (currentAdminId === oldUserId) {
          await updateDoc(doc(this.roundsCollection, roundDoc.id), {
            adminId: newUserId,
          });
        }

        migratedRoundIds.push(roundDoc.id);
      } catch (error) {
        failedRounds[roundDoc.id] =
          error instanceof Error ? error.message : String(error);
      }
    }

    const status = this.resolveStatus(migratedRoundIds, failedRounds);

    // Log migration if there are partial failures
    let logId: string | undefined;
    if (migratedRoundIds.length > 0 && Object.keys(failedRounds).length > 0) {
      const logRef = doc(this.migrationLogsCollection);
      await setDoc(logRef, {
        oldUserId,
        newUserId,
        roundIds: migratedRoundIds,
        failedRounds,
        status,
        createdAt: serverTimestamp(),
      });
      logId = logRef.id;
    }

    return {
      oldUserId,
      newUserId,
      migratedRoundIds,
      failedRounds,
      status,
      logId,
    };
  }

  /**
   * Pre-migrates rounds from version 1 to version 2 format
   * (Converts old member/admin structures to new memberIds/adminId format)
   * @param logDetails - Whether to log details
   * @returns Number of rounds migrated
   */
  async preMigrateRounds(logDetails: boolean = false): Promise<number> {
    const roundsSnapshot = await getDocs(this.roundsCollection);
    const migratedRoundIds: string[] = [];

    for (const roundDoc of roundsSnapshot.docs) {
      const data = roundDoc.data();
      const version = data.version?.toString();

      // Skip already migrated rounds
      if (version === '2') continue;

      // Extract member IDs from old structure
      const members = data.members || [];
      const existingMemberIds = this.asStringSet(data.memberIds);
      const extractedMemberIds = this.extractIdsFromUsers(members);
      const memberIds = Array.from(
        new Set([...existingMemberIds, ...extractedMemberIds])
      ).filter((id) => id);

      // Extract admin ID
      const adminMap = data.admin;
      const adminId =
        data.adminId?.toString() || this.extractIdFromMap(adminMap) || '';

      // Update games to use playerIds/teamIds instead of players/teams
      const games = data.games || [];
      const updatedGames = games.map((game: any) => {
        const gameMap = { ...game };

        const existingPlayerIds = this.asStringSet(gameMap.playerIds);
        const existingRedIds = this.asStringSet(gameMap.redTeamIds);
        const existingBlueIds = this.asStringSet(gameMap.blueTeamIds);

        const players = gameMap.players || [];
        const redTeam = gameMap.redTeam || [];
        const blueTeam = gameMap.blueTeam || [];

        const playerIds = Array.from(
          new Set([...existingPlayerIds, ...this.extractIdsFromUsers(players)])
        ).filter((id) => id);

        const redTeamIds = Array.from(
          new Set([...existingRedIds, ...this.extractIdsFromUsers(redTeam)])
        ).filter((id) => id);

        const blueTeamIds = Array.from(
          new Set([...existingBlueIds, ...this.extractIdsFromUsers(blueTeam)])
        ).filter((id) => id);

        // Remove old fields and add new ones
        delete gameMap.players;
        delete gameMap.redTeam;
        delete gameMap.blueTeam;

        gameMap.playerIds = playerIds;
        gameMap.redTeamIds = redTeamIds;
        gameMap.blueTeamIds = blueTeamIds;

        return gameMap;
      });

      migratedRoundIds.push(roundDoc.id);

      if (logDetails) {
        console.log(
          `[preMigrateRounds] Preparing round ${roundDoc.id} (previous version: ${version || 'unknown'})`
        );
      }

      await updateDoc(doc(this.roundsCollection, roundDoc.id), {
        version: '0',
        memberIds,
        adminId,
        games: updatedGames,
        members: deleteField(), // Delete field
        admin: deleteField(), // Delete field
        updatedAt: serverTimestamp(),
      });
    }

    if (logDetails) {
      console.log(
        `[preMigrateRounds] Completed preprocessing for ${migratedRoundIds.length} rounds`
      );
    }

    return migratedRoundIds.length;
  }

  private resolveStatus(
    migratedRoundIds: string[],
    failedRounds: Record<string, string>
  ): 'success' | 'partial' | 'failed' {
    if (Object.keys(failedRounds).length === 0) {
      return 'success';
    }
    if (migratedRoundIds.length === 0) {
      return 'failed';
    }
    return 'partial';
  }

  private asStringSet(value: any): Set<string> {
    if (Array.isArray(value)) {
      return new Set(
        value.map((e) => e?.toString() || '').filter((id) => id)
      );
    }
    return new Set();
  }

  private extractIdsFromUsers(users: any[]): string[] {
    return users
      .map((user) => this.extractIdFromMap(user))
      .filter((id): id is string => Boolean(id));
  }

  private extractIdFromMap(value: any): string | null {
    if (value && typeof value === 'object') {
      const rawId = value.id;
      if (typeof rawId === 'string' && rawId) {
        return rawId;
      } else if (rawId != null) {
        return String(rawId);
      }
    }
    return null;
  }
}

export const userMigrationService = new UserMigrationService();

