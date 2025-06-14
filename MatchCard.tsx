
import React, { useState } from 'react';
import { Match, MatchStatus, Team } from '../types';
import { MatchDetails } from './MatchDetails';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';

interface MatchCardProps {
  match: Match;
}

const TeamDisplay: React.FC<{ team: Team; score?: number | null; alignment: 'left' | 'right' }> = ({ team, score, alignment }) => {
  return (
    <div className={`flex items-center space-x-2 w-2/5 ${alignment === 'left' ? 'justify-start' : 'justify-end'}`}>
      {alignment === 'left' && <img src={team.logoUrl} alt={`${team.name} logo`} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover shadow" />}
      <span className="text-sm sm:text-base font-semibold text-gray-800 truncate" title={team.name}>{team.name}</span>
      {alignment === 'right' && <img src={team.logoUrl} alt={`${team.name} logo`} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover shadow" />}
    </div>
  );
};

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const getStatusBadge = (isCenter: boolean = false) => {
    let baseClasses = "text-xs font-semibold px-2 py-1 rounded-full";
    if (isCenter) baseClasses += " whitespace-nowrap"; 

    switch (match.status) {
      case MatchStatus.FINISHED:
        return <span className={`${baseClasses} bg-green-100 text-green-700`}>Match Finished</span>;
      case MatchStatus.CANCELLED:
        return <span className={`${baseClasses} bg-red-100 text-red-700`}>Match Cancelled</span>;
      case MatchStatus.POSTPONED:
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-700`}>Postponed</span>;
      case MatchStatus.SCHEDULED:
      case MatchStatus.IN_PROGRESS:
         const matchDate = new Date(match.date);
         const timeString = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
         return <span className={`${baseClasses} bg-blue-100 text-blue-700`}>{match.status === MatchStatus.IN_PROGRESS ? 'In Progress' : timeString}</span>;
      default:
        if (typeof match.status === 'string') {
            return <span className={`${baseClasses} bg-gray-100 text-gray-700`}>{match.status}</span>;
        }
        return null;
    }
  };
  
  const renderScore = () => {
    if (match.status === MatchStatus.FINISHED && typeof match.homeScore === 'number' && typeof match.awayScore === 'number') {
      return (
        <div className="text-center">
          <div className="text-xl sm:text-2xl font-bold text-gray-800">
            {match.homeScore} - {match.awayScore}
          </div>
          {(typeof match.homeHalfTimeScore === 'number' && typeof match.awayHalfTimeScore === 'number') && (
            <div className="text-xs text-gray-500">
              ({match.homeHalfTimeScore}-{match.awayHalfTimeScore})
            </div>
          )}
        </div>
      );
    }
    if (match.status === MatchStatus.SCHEDULED || match.status === MatchStatus.IN_PROGRESS) {
        return <span className="text-sm font-semibold text-gray-600">VS</span>;
    }
    return null;
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl">
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-gray-500 truncate" title={`${match.league} - ${match.round}`}>{match.league} - {match.round}</p>
          {match.status !== MatchStatus.SCHEDULED && match.status !== MatchStatus.IN_PROGRESS && getStatusBadge()}
        </div>
        <div className="flex justify-between items-center">
          <TeamDisplay team={match.homeTeam} score={match.homeScore} alignment="left" />
          <div className="flex-shrink-0 w-1/5 text-center flex flex-col items-center justify-center">
            { (match.status === MatchStatus.SCHEDULED || match.status === MatchStatus.IN_PROGRESS) && getStatusBadge(true) }
            {renderScore()}
          </div>
          <TeamDisplay team={match.awayTeam} score={match.awayScore} alignment="right" />
        </div>
        {match.outcomeProbabilities && (match.recentForm?.home !== 'N/A' || match.recentForm?.away !== 'N/A') && (
          <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-center text-gray-700">
            <span className="font-medium">DOM:</span> {match.outcomeProbabilities.homeWin}%
            <span className="mx-1 sm:mx-2 text-gray-400">|</span>
            <span className="font-medium">NUL:</span> {match.outcomeProbabilities.draw}%
            <span className="mx-1 sm:mx-2 text-gray-400">|</span>
            <span className="font-medium">EXT:</span> {match.outcomeProbabilities.awayWin}%
          </div>
        )}
      </div>
      
      {(match.recentForm || match.detailsError) && (
         <div className="p-3 sm:p-4 bg-gray-50">
            <button
              onClick={() => setDetailsExpanded(!detailsExpanded)}
              aria-expanded={detailsExpanded}
              aria-controls={`match-details-${match.id}`}
              className="w-full flex justify-center items-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
            >
              {detailsExpanded ? 'MASQUER DÉTAILS' : 'VOIR DÉTAILS'}
              {detailsExpanded ? <ChevronUpIcon className="w-4 h-4 ml-1" /> : <ChevronDownIcon className="w-4 h-4 ml-1" />}
            </button>
            {detailsExpanded && <MatchDetails match={match} />}
          </div>
      )}
    </div>
  );
};