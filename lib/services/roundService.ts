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
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Round, roundFromFirestore, RoundGame } from '../models/round';
import { Course, courseToMap } from '../models/course';
import { Scorecard, scorecardToMap } from '../models/scorecard';
import { AppUser } from '../models/appUser';
import { userService } from './userService';

export class RoundService {
  private collection = collection(db, 'rounds');

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

      // Fetch missing users
      const allUserIds = [...round.memberIds, round.adminId];
      await userService.getUsersByIds(allUserIds);

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

      // Fetch missing users
      const allUserIds = [...round.memberIds, round.adminId];
      await userService.getUsersByIds(allUserIds);

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
      const ids = [...round.memberIds, round.adminId];
      await userService.getUsersByIds(ids);
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
}


export const roundService = new RoundService();
