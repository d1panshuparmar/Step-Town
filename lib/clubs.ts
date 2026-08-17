export type ClubRole = 'leader' | 'co_leader' | 'member';

export type ClubMember = {
  id: string;
  name: string;
  role: ClubRole;
  donated: number;
};

export type ClubState = {
  id: string;
  name: string;
  logo: string;
  motto: string;
  members: ClubMember[];
  /** Cooperative task progress */
  taskLabel: string;
  taskProgress: number;
  taskTarget: number;
  taskRewardCoins: number;
  donatedTotal: number;
  joined: boolean;
};

const SAMPLE_CLUBS: Omit<ClubState, 'joined' | 'donatedTotal'>[] = [
  {
    id: 'meadow-walkers',
    name: 'Meadow Walkers',
    logo: '🌻',
    motto: 'Steps today, town tomorrow.',
    members: [
      { id: 'm1', name: 'Ava', role: 'leader', donated: 120 },
      { id: 'm2', name: 'Noah', role: 'co_leader', donated: 80 },
      { id: 'm3', name: 'Mia', role: 'member', donated: 40 },
      { id: 'm4', name: 'Leo', role: 'member', donated: 25 },
    ],
    taskLabel: 'Club harvest drive — donate 50 wheat',
    taskProgress: 18,
    taskTarget: 50,
    taskRewardCoins: 200,
  },
  {
    id: 'iron-rails',
    name: 'Iron Rails',
    logo: '🚂',
    motto: 'Trains never sleep.',
    members: [
      { id: 'r1', name: 'Kai', role: 'leader', donated: 200 },
      { id: 'r2', name: 'Zoe', role: 'member', donated: 60 },
      { id: 'r3', name: 'Eli', role: 'member', donated: 35 },
    ],
    taskLabel: 'Load 30 train crates together',
    taskProgress: 9,
    taskTarget: 30,
    taskRewardCoins: 250,
  },
  {
    id: 'sky-harbor',
    name: 'Sky Harbor',
    logo: '✈️',
    motto: 'Cargo and kindness.',
    members: [
      { id: 's1', name: 'Rae', role: 'leader', donated: 150 },
      { id: 's2', name: 'Jun', role: 'co_leader', donated: 90 },
      { id: 's3', name: 'Bea', role: 'member', donated: 20 },
    ],
    taskLabel: 'Fill 20 airport crates',
    taskProgress: 6,
    taskTarget: 20,
    taskRewardCoins: 220,
  },
];

export function listClubs(): ClubState[] {
  return SAMPLE_CLUBS.map((c) => ({
    ...c,
    joined: false,
    donatedTotal: 0,
  }));
}

export function emptyClub(): ClubState | null {
  return null;
}
