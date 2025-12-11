import type { User, EventSummary, SetSummary, SetDetail, ReportSummary, ReportDetail, GameRecord } from '@/types';

export const mockUser: User = {
  id: 1,
  gamerTag: 'TestPlayer',
  role: 'competitor',
};

export const mockAdminUser: User = {
  id: 2,
  gamerTag: 'AdminUser',
  role: 'admin',
};

export const mockEvents: EventSummary[] = [
  {
    id: 1,
    name: 'SmashBros Spain 2024 - Madrid',
    game: 'smash_ultimate',
    bestOf: 3,
    startAt: '2024-12-15T10:00:00Z',
    status: 'active',
  },
  {
    id: 2,
    name: 'Barcelona Smash Tournament',
    game: 'smash_ultimate',
    bestOf: 5,
    startAt: '2024-12-20T14:00:00Z',
    status: 'upcoming',
  },
];

export const mockSets: SetSummary[] = [
  {
    id: 1,
    eventId: 1,
    round: 'Winners Round 1',
    bestOf: 3,
    p1: { entrantId: 101, name: 'TestPlayer' },
    p2: { entrantId: 102, name: 'OpponentPlayer' },
    status: 'in_progress',
  },
  {
    id: 2,
    eventId: 1,
    round: 'Winners Semifinals',
    bestOf: 5,
    p1: { entrantId: 103, name: 'PlayerThree' },
    p2: { entrantId: 104, name: 'PlayerFour' },
    status: 'not_started',
  },
];

export const mockSetDetail: SetDetail = {
  id: 1,
  eventId: 1,
  round: 'Winners Round 1',
  bestOf: 3,
  p1: { entrantId: 101, name: 'TestPlayer' },
  p2: { entrantId: 102, name: 'OpponentPlayer' },
  status: 'in_progress',
  stagesAvailable: [
    'Battlefield',
    'Small Battlefield',
    'Final Destination',
    'Smashville',
    'Pokemon Stadium 2',
    'Town and City',
    "Yoshi's Story",
    'Hollow Bastion',
    'Kalos Pokemon League',
  ],
  stagesBanned: [],
  currentTurn: 'rps',
  games: [],
  rpsWinner: null,
};

export const mockReports: ReportSummary[] = [
  {
    id: 1,
    eventId: 1,
    eventName: 'SmashBros Spain 2024 - Madrid',
    setId: 1,
    round: 'Winners Round 1',
    p1: { entrantId: 101, name: 'TestPlayer' },
    p2: { entrantId: 102, name: 'OpponentPlayer' },
    scoreP1: 2,
    scoreP2: 1,
    createdAt: '2024-12-10T15:30:00Z',
    status: 'pending',
    submittedBy: 'TestPlayer',
  },
  {
    id: 2,
    eventId: 1,
    eventName: 'SmashBros Spain 2024 - Madrid',
    setId: 3,
    round: 'Winners Semifinals',
    p1: { entrantId: 103, name: 'PlayerThree' },
    p2: { entrantId: 104, name: 'PlayerFour' },
    scoreP1: 3,
    scoreP2: 0,
    createdAt: '2024-12-10T16:00:00Z',
    status: 'pending',
    submittedBy: 'PlayerThree',
  },
];

export const mockReportDetail: ReportDetail = {
  ...mockReports[0],
  games: [
    {
      index: 1,
      stage: 'Battlefield',
      winner: 'p1',
      stocksP1: 2,
      stocksP2: 0,
      characterP1: 'Fox',
      characterP2: 'Falco',
    },
    {
      index: 2,
      stage: 'Pokemon Stadium 2',
      winner: 'p2',
      stocksP1: 0,
      stocksP2: 1,
      characterP1: 'Fox',
      characterP2: 'Falco',
    },
    {
      index: 3,
      stage: 'Smashville',
      winner: 'p1',
      stocksP1: 3,
      stocksP2: 0,
      characterP1: 'Fox',
      characterP2: 'Falco',
    },
  ],
  notes: 'Good games!',
};

// Mock handlers for development
let mockSetState = { ...mockSetDetail };

export const mockHandlers = {
  getUser: async (): Promise<User> => {
    await delay(500);
    const isAdmin = localStorage.getItem('mock_admin') === 'true';
    return isAdmin ? mockAdminUser : mockUser;
  },

  getMyEvents: async (): Promise<EventSummary[]> => {
    await delay(500);
    return mockEvents;
  },

  getEventSets: async (eventId: string | number): Promise<SetSummary[]> => {
    await delay(500);
    return mockSets.filter((s) => s.eventId === Number(eventId));
  },

  getSetDetail: async (setId: string | number): Promise<SetDetail> => {
    await delay(500);
    if (Number(setId) === 1) {
      return mockSetState;
    }
    return mockSetDetail;
  },

  saveGame: async (setId: string | number, game: GameRecord): Promise<void> => {
    await delay(300);
    const existingIndex = mockSetState.games.findIndex((g) => g.index === game.index);
    if (existingIndex >= 0) {
      mockSetState.games[existingIndex] = game;
    } else {
      mockSetState.games.push(game);
    }
  },

  submitReport: async (setId: string | number, data: { games: GameRecord[] }): Promise<void> => {
    await delay(500);
    mockSetState.status = 'reported';
    mockSetState.games = data.games;
  },

  getReports: async (params?: { status?: string }): Promise<ReportSummary[]> => {
    await delay(500);
    if (params?.status) {
      return mockReports.filter((r) => r.status === params.status);
    }
    return mockReports;
  },

  getReportDetail: async (reportId: string | number): Promise<ReportDetail> => {
    await delay(500);
    return mockReportDetail;
  },

  approveReport: async (reportId: string | number): Promise<void> => {
    await delay(500);
    const report = mockReports.find((r) => r.id === Number(reportId));
    if (report) report.status = 'approved';
  },

  rejectReport: async (reportId: string | number, reason: string): Promise<void> => {
    await delay(500);
    const report = mockReports.find((r) => r.id === Number(reportId));
    if (report) {
      report.status = 'rejected';
    }
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
