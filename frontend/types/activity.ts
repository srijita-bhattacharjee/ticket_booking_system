export type ActivityType =
  | 'CINEMA'
  | 'THEATRE'
  | 'CONCERT'
  | 'WORKSHOP'
  | 'SPORTS'
  | 'GAME'
  | 'EXHIBITION'
  | 'CONFERENCE'
  | 'AMUSEMENT'
  | 'OTHER';

export type BookingModel =
  | 'SEAT'
  | 'GENERAL_ADMISSION'
  | 'CAPACITY'
  | 'SLOT'
  | 'TABLE'
  | 'TEAM'
  | 'PASS'
  | 'CUSTOM';

export interface ActivityDefinition {
  type: ActivityType;
  label: string;
  description: string;
  defaultModel: BookingModel;
  supportedModels: BookingModel[];
  icon: string;
}

export const ACTIVITY_DEFINITIONS: Record<ActivityType, ActivityDefinition> = {
  CINEMA: {
    type: 'CINEMA',
    label: 'Cinema / Movie',
    description: 'Assigned row-and-seat screens with standard, premium, and VIP seating tiers.',
    defaultModel: 'SEAT',
    supportedModels: ['SEAT'],
    icon: '🎬',
  },
  THEATRE: {
    type: 'THEATRE',
    label: 'Theatre & Plays',
    description: 'Irregular seating layouts with stage, balconies, stalls, and custom row lengths.',
    defaultModel: 'SEAT',
    supportedModels: ['SEAT', 'TABLE', 'CUSTOM'],
    icon: '🎭',
  },
  CONCERT: {
    type: 'CONCERT',
    label: 'Live Concert / Music',
    description: 'Standing general-admission zones or assigned seats with entry gate assignments.',
    defaultModel: 'GENERAL_ADMISSION',
    supportedModels: ['GENERAL_ADMISSION', 'SEAT'],
    icon: '🎤',
  },
  WORKSHOP: {
    type: 'WORKSHOP',
    label: 'Workshop / Training',
    description: 'Participant capacity bounds, minimum cutoff limits, and session materials.',
    defaultModel: 'CAPACITY',
    supportedModels: ['CAPACITY', 'SLOT', 'SEAT'],
    icon: '🧠',
  },
  SPORTS: {
    type: 'SPORTS',
    label: 'Sports Tournament / Match',
    description: 'Spectator seating stands, general admission zones, or team registrations.',
    defaultModel: 'SEAT',
    supportedModels: ['SEAT', 'GENERAL_ADMISSION', 'TEAM'],
    icon: '⚽',
  },
  GAME: {
    type: 'GAME',
    label: 'Games & Escape Rooms',
    description: 'Timed booking slots, simultaneous room limits, and team size rules.',
    defaultModel: 'SLOT',
    supportedModels: ['SLOT', 'TEAM', 'CAPACITY'],
    icon: '🎮',
  },
  EXHIBITION: {
    type: 'EXHIBITION',
    label: 'Exhibition & Art Fair',
    description: 'Daily capacity, timed entry passes, and tiered ticket categories.',
    defaultModel: 'GENERAL_ADMISSION',
    supportedModels: ['GENERAL_ADMISSION', 'CAPACITY', 'SLOT'],
    icon: '🖼️',
  },
  CONFERENCE: {
    type: 'CONFERENCE',
    label: 'Conference & Summit',
    description: 'Auditorium seat maps, session passes, and multi-track registration.',
    defaultModel: 'SEAT',
    supportedModels: ['SEAT', 'CAPACITY', 'PASS'],
    icon: '🏛️',
  },
  AMUSEMENT: {
    type: 'AMUSEMENT',
    label: 'Amusement & Park Rides',
    description: 'Operating hours, slot duration, hourly throughput limits, and age/height rules.',
    defaultModel: 'SLOT',
    supportedModels: ['SLOT', 'CAPACITY', 'GENERAL_ADMISSION'],
    icon: '🎡',
  },
  OTHER: {
    type: 'OTHER',
    label: 'Custom Activity',
    description: 'Fully flexible activity layout with admin-selectable resource model.',
    defaultModel: 'CUSTOM',
    supportedModels: ['SEAT', 'GENERAL_ADMISSION', 'CAPACITY', 'SLOT', 'TABLE', 'TEAM', 'PASS', 'CUSTOM'],
    icon: '✨',
  },
};

export interface ZoneConfig {
  id: string;
  name: string;
  capacity: number;
  price: number;
  entryGate?: string;
}

export interface SlotConfig {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  maxCapacity: number;
  minPlayers?: number;
  pricePerPerson: number;
}

export interface TeamConfig {
  maxTeams: number;
  minTeamSize: number;
  maxTeamSize: number;
  registrationFee: number;
}

export interface IrregularSeatSection {
  id: string;
  name: string;
  rowsCount: number;
  seatsPerRow: number;
  category: 'STANDARD' | 'PREMIUM' | 'VIP' | 'ACCESSIBLE';
  price: number;
}

export interface ResourceConfigData {
  zones?: ZoneConfig[];
  slots?: SlotConfig[];
  team?: TeamConfig;
  sections?: IrregularSeatSection[];
  totalCapacity?: number;
  notes?: string;
}
