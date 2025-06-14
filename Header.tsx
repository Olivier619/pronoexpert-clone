
import React from 'react';
import { NavTab, Competition } from '../types';

interface HeaderProps {
  selectedTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  tabs: NavTab[];
  competitions: Competition[];
  selectedCompetitionId: string;
  onCompetitionChange: (competitionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedTab,
  onTabChange,
  tabs,
  competitions,
  selectedCompetitionId,
  onCompetitionChange,
}) => {
  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-0">PronoExpert</h1>
        <div className="w-full sm:w-auto">
          <select
            value={selectedCompetitionId}
            onChange={(e) => onCompetitionChange(e.target.value)}
            className="bg-white text-blue-700 p-2 rounded-md shadow focus:ring-2 focus:ring-pink-500 focus:border-pink-500 w-full sm:w-auto"
            aria-label="Filter by competition"
          >
            {competitions.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <nav className="bg-blue-700">
        <div className="container mx-auto px-4 flex space-x-2 sm:space-x-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`py-3 px-3 sm:px-4 text-sm sm:text-base font-medium whitespace-nowrap ${
                selectedTab === tab
                  ? 'border-b-4 border-pink-500 text-white'
                  : 'text-blue-200 hover:text-white hover:border-b-4 hover:border-pink-400'
              } transition-colors duration-150 ease-in-out`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
};
    