import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  addDoc,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Round, roundFromFirestore, RoundGame } from '../models/round';
import { Course, courseToMap } from '../models/course';
import { Scorecard, scorecardToMap } from '../models/scorecard';
import { AppUser } from '../models/appUser';
import { userService } from './userService';

export class RoundService {
  private get collection() {
    if (typeof window === 'undefined') {
      throw new Error('RoundService can only be used on the client side');
    }
    return collection(db, 'rounds');
  }

  async getAllRounds(memberId: string): Promise<Round[]> {
    const q = query(
      this.collection,
      where('deletedAt', '==', null),
      where('memberIds', 'array-contains', memberId)
    );
    const querySnapshot = await getDocs(q);

    const rounds: Round[] = [];

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      const round = roundFromFirestore(data, docSnap.id);
      rounds.push(round);
    }

    return rounds;
  }

  watchRound(roundId: string, callback: (round: Round) => void): () => void {
    const docRef = doc(db, 'rounds', roundId);
    
    return onSnapshot(docRef, async (snapshot) => {
      if (!snapshot.exists()) {
        throw new Error('Round not found');
      }

      const data = snapshot.data();
      const round = roundFromFirestore(data, snapshot.id);

      // Prefetch users in background (non-blocking)
      const allUserIds = [...round.memberIds, round.adminId];
      userService.getUsersByIds(allUserIds).catch(() => {
        // Silently handle errors - components will fetch users when needed
      });

      callback(round);
    }, (error) => {
      throw error;
    });
  }

  async startRound(
    adminId: string,
    selectedScoreCardIds: string[],
    course: Course,
    scorecards: Scorecard[]
  ): Promise<Round> {
    try {
      const roundData = {
        adminId,
        selectedScoreCardIds,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deletedAt: null,
        memberIds: [adminId],
        course: courseToMap(course),
        scorecards: scorecards.map((s) => scorecardToMap(s)),
        version: '2',
      };

      const docRef = await addDoc(this.collection, roundData);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Failed to create round');
      }

      const round = roundFromFirestore(docSnap.data(), docSnap.id);
      // Prefetch users in background (non-blocking)
      const ids = [...round.memberIds, round.adminId];
      userService.getUsersByIds(ids).catch(() => {
        // Silently handle errors - components will fetch users when needed
      });
      return round;
    } catch (e) {
      throw new Error(`Failed to start round: ${e}`);
    }
  }

  async updateUserTeebox(
    roundId: string,
    userId: string,
    teeboxes: string[]
  ): Promise<void> {
    const roundRef = doc(db, 'rounds', roundId);
    const snap = await getDoc(roundRef);
    if (!snap.exists()) throw new Error('Round not found');

    const data = snap.data();
    const currentTeeboxes = data?.userTeeboxes || {};
    currentTeeboxes[userId] = teeboxes;

    await updateDoc(roundRef, { userTeeboxes: currentTeeboxes });
  }

  async saveGame({ roundId, game }: { roundId: string; game: RoundGame }): Promise<void> {
    const roundRef = doc(db, 'rounds', roundId);
    const snap = await getDoc(roundRef);
    if (!snap.exists()) throw new Error('Round not found');

    const data = snap.data();
    const games = data?.games || [];
    const gameIndex = games.findIndex((g: any) => g.id === game.id);

    const gameData = {
      id: game.id,
      type: game.type,
      playerIds: game.playerIds,
      redTeamIds: game.redTeamIds,
      blueTeamIds: game.blueTeamIds,
      handicapStrokes: game.handicapStrokes,
      holePoints: game.holePoints,
      birdieMultiplier: game.birdieMultiplier,
      eagleMultiplier: game.eagleMultiplier,
      albatrossMultiplier: game.albatrossMultiplier,
      holeInOneMultiplier: game.holeInOneMultiplier,
      scoreCountMode: game.scoreCountMode,
      skinsMode: game.skinsMode,
      maxSkins: game.maxSkins,
      skinsStartingHole: game.skinsStartingHole,
      ...(Object.keys(game.horseSettings).length > 0 && {
        horseSettings: Object.fromEntries(
          Object.entries(game.horseSettings).map(([segment, values]) => [
            segment,
            Object.fromEntries(Object.entries(values)),
          ])
        ),
      }),
    };

    if (gameIndex >= 0) {
      games[gameIndex] = gameData;
    } else {
      games.push(gameData);
    }

    await updateDoc(roundRef, { games, updatedAt: serverTimestamp() });
  }

  async deleteGame({ roundId, gameId }: { roundId: string; gameId: string }): Promise<void> {
    const roundRef = doc(db, 'rounds', roundId);
    const snap = await getDoc(roundRef);
    if (!snap.exists()) throw new Error('Round not found');

    const data = snap.data();
    const games = (data?.games || []).filter((g: any) => g.id !== gameId);

    await updateDoc(roundRef, { games, updatedAt: serverTimestamp() });
  }

  async setPartyGameEnabled(roundId: string, enabled: boolean): Promise<void> {
    const roundRef = doc(db, 'rounds', roundId);
    await updateDoc(roundRef, {
      partyGameEnabled: enabled,
      updatedAt: serverTimestamp(),
    });
  }

  async updateScore(
    roundId: string,
    hole: string,
    userId: string,
    score: number | null,
    stats?: { fairway?: string; putts?: number; bunker?: number; hazard?: number },
    olympicPoint?: number
  ): Promise<void> {
    const roundRef = doc(db, 'rounds', roundId);
    const snap = await getDoc(roundRef);
    if (!snap.exists()) throw new Error('Round not found');

    const data = snap.data();
    const currentScore = { ...(data?.score || {}) };
    if (!currentScore[hole]) {
      currentScore[hole] = {};
    }
    currentScore[hole] = { ...currentScore[hole], [userId]: score };

    const updateData: any = { score: currentScore, updatedAt: serverTimestamp() };

    // Update stats if provided
    if (stats) {
      const currentStats = { ...(data?.stats || {}) };
      if (!currentStats[hole]) {
        currentStats[hole] = {};
      }
      currentStats[hole] = { ...currentStats[hole], [userId]: stats };
      updateData.stats = currentStats;
    }

    // Update olympic if provided
    if (olympicPoint !== undefined) {
      const currentOlympic = { ...(data?.olympic || {}) };
      if (!currentOlympic[hole]) {
        currentOlympic[hole] = {};
      }
      currentOlympic[hole] = { ...currentOlympic[hole], [userId]: olympicPoint };
      updateData.olympic = currentOlympic;
    }

    await updateDoc(roundRef, updateData);
  }

  async joinRound(roundId: string, userId: string): Promise<void> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) throw new Error('User not found');

    const roundRef = doc(db, 'rounds', roundId);
    const snap = await getDoc(roundRef);
    if (!snap.exists()) throw new Error('Round not found');

    const data = snap.data();
    const memberIds = data?.memberIds || [];
    if (memberIds.includes(userId)) return;

    const updatedIds = [...memberIds, userId];
    await updateDoc(roundRef, { memberIds: updatedIds });
  }

  async leaveRound(roundId: string, userId: string): Promise<void> {
    const roundRef = doc(db, 'rounds', roundId);
    const snap = await getDoc(roundRef);
    if (!snap.exists()) throw new Error('Round not found');

    const data = snap.data();
    const round = roundFromFirestore(data, snap.id);

    if (!round.memberIds.includes(userId)) return;

    // Prevent admin from leaving
    if (round.adminId === userId) {
      throw new Error('Admin cannot leave the round');
    }

    // Remove from memberIds
    const updatedIds = round.memberIds.filter((id) => id !== userId);

    // Remove from all games
    const updatedGames = round.games.map((game) => ({
      ...game,
      playerIds: game.playerIds.filter((id) => id !== userId),
      redTeamIds: game.redTeamIds.filter((id) => id !== userId),
      blueTeamIds: game.blueTeamIds.filter((id) => id !== userId),
    }));

    await updateDoc(roundRef, {
      memberIds: updatedIds,
      games: updatedGames,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteRound(roundId: string, requesterId: string): Promise<void> {
    const roundRef = doc(db, 'rounds', roundId);
    const snap = await getDoc(roundRef);
    if (!snap.exists()) throw new Error('Round not found');

    const data = snap.data();
    const round = roundFromFirestore(data, snap.id);

    if (round.adminId !== requesterId) {
      throw new Error('Only admin can delete the round');
    }

    await updateDoc(roundRef, {
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Replaces a guest user ID with a new user ID in a round (for user migration)
   * @param roundId - The round ID
   * @param guestId - The guest user ID to replace
   * @param userId - The new user ID
   */
  async replaceGuest(
    roundId: string,
    guestId: string,
    userId: string
  ): Promise<void> {
    const roundRef = doc(db, 'rounds', roundId);
    const snap = await getDoc(roundRef);
    if (!snap.exists()) throw new Error('Round not found');

    const data = snap.data();
    const round = roundFromFirestore(data, snap.id);

    if (!round.memberIds.includes(guestId)) {
      throw new Error('Guest not found in this round');
    }

    // Verify new user exists
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    // Helper to replace and deduplicate IDs
    const replaceAndDedupIds = (ids: string[]): string[] => {
      const seen = new Set<string>();
      const result: string[] = [];
      for (const id of ids) {
        const replacement = id === guestId ? userId : id;
        if (!seen.has(replacement)) {
          seen.add(replacement);
          result.push(replacement);
        }
      }
      return result;
    };

    // Replace in memberIds
    const memberIds = replaceAndDedupIds(round.memberIds);

    // Replace in games (including handicapStrokes and horseSettings)
    const updatedGames = round.games.map((game) => {
      // Replace in handicapStrokes
      const updatedHandicapStrokes: Record<string, any> = {};
      for (const [hole, holeData] of Object.entries(game.handicapStrokes || {})) {
        const updatedHoleData: Record<string, any> = { ...holeData };
        if (updatedHoleData[guestId] !== undefined) {
          updatedHoleData[userId] = updatedHoleData[guestId];
          delete updatedHoleData[guestId];
        }
        updatedHandicapStrokes[hole] = updatedHoleData;
      }

      // Replace in horseSettings
      const updatedHorseSettings: Record<string, Record<string, number>> = {};
      for (const [segment, playerValues] of Object.entries(game.horseSettings || {})) {
        const updatedSegment: Record<string, number> = { ...playerValues };
        if (updatedSegment[guestId] !== undefined) {
          updatedSegment[userId] = updatedSegment[guestId];
          delete updatedSegment[guestId];
        }
        updatedHorseSettings[segment] = updatedSegment;
      }

      return {
        ...game,
        playerIds: replaceAndDedupIds(game.playerIds),
        redTeamIds: replaceAndDedupIds(game.redTeamIds),
        blueTeamIds: replaceAndDedupIds(game.blueTeamIds),
        handicapStrokes: updatedHandicapStrokes,
        horseSettings: updatedHorseSettings,
      };
    });

    // Replace in score and stats
    const updatedScore: Record<string, Record<string, number | null>> = {};
    for (const [hole, userScores] of Object.entries(round.score)) {
      updatedScore[hole] = {};
      for (const [uid, score] of Object.entries(userScores)) {
        updatedScore[hole][uid === guestId ? userId : uid] = score;
      }
    }

    const updatedStats: Record<string, Record<string, any>> = {};
    for (const [hole, userStats] of Object.entries(round.stats || {})) {
      updatedStats[hole] = {};
      for (const [uid, stats] of Object.entries(userStats)) {
        updatedStats[hole][uid === guestId ? userId : uid] = stats;
      }
    }

    // Replace in olympic if exists
    const updatedOlympic: Record<string, Record<string, any>> | undefined =
      round.olympic
        ? (() => {
            const result: Record<string, Record<string, any>> = {};
            for (const [hole, userOlympic] of Object.entries(round.olympic!)) {
              result[hole] = {};
              for (const [uid, olympic] of Object.entries(userOlympic)) {
                result[hole][uid === guestId ? userId : uid] = olympic;
              }
            }
            return result;
          })()
        : undefined;

    // Replace in userTeeboxes if exists
    const updatedUserTeeboxes: Record<string, any> = {};
    for (const [uid, teebox] of Object.entries(round.userTeeboxes || {})) {
      updatedUserTeeboxes[uid === guestId ? userId : uid] = teebox;
    }

    // Replace adminId if guest was admin
    const updatedAdminId = round.adminId === guestId ? userId : round.adminId;

    await updateDoc(roundRef, {
      adminId: updatedAdminId,
      memberIds,
      games: updatedGames,
      score: updatedScore,
      stats: updatedStats,
      ...(updatedOlympic && { olympic: updatedOlympic }),
      userTeeboxes: updatedUserTeeboxes,
      updatedAt: serverTimestamp(),
    });
  }
}


export const roundService = new RoundService();
