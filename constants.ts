
import { Competition, NavTab } from './types';

export const NAV_TABS: NavTab[] = [
  NavTab.TODAY,
  NavTab.TOMORROW,
  NavTab.LAST_MATCHES,
];

// MOCK_COMPETITIONS will serve as the base list for the dropdown.
// "Sélectionnez une compétition" will be prepended in App.tsx.
// "Toutes les compétitions" is a valid selectable option.
export const MOCK_COMPETITIONS: Competition[] = [
  { id: 'all', name: 'Toutes les compétitions' },
  { id: 'premier-league', name: 'Premier League' },
  { id: 'la-liga', name: 'La Liga' },
  { id: 'serie-a', name: 'Serie A' },
  { id: 'bundesliga', name: 'Bundesliga' },
  { id: 'ligue-1', name: 'Ligue 1' },
  { id: 'champions-league', name: 'Champions League'},
  { id: 'europa-league', name: 'Europa League'},
  { id: 'mls', name: 'MLS'},
  { id: 'coupe-du-monde-des-clubs', name: 'Coupe du monde des clubs' },
];