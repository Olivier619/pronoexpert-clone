import React from 'react';
import { Match } from '../types';
import { ExclamationIcon } from './icons/ExclamationIcon';

interface MatchDetailsProps {
  match: Match;
}

export const MatchDetails: React.FC<MatchDetailsProps> = ({ match }) => {
  const hasContent = match.detailsError || (match.recentForm && (match.recentForm.home !== 'N/A' || match.recentForm.away !== 'N/A'));

  if (!hasContent) {
    return (
        <div id={`match-details-${match.id}`} className="pt-3 mt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">Aucun détail supplémentaire disponible pour ce match.</p>
        </div>
    );
  }

  return (
    <div id={`match-details-${match.id}`} className="pt-3 mt-3 border-t border-gray-200 space-y-3">
      {match.detailsError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{match.detailsError}</p>
            </div>
          </div>
        </div>
      )}
      {match.recentForm && (match.recentForm.home !== 'N/A' || match.recentForm.away !== 'N/A') && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Forme Récente (15 derniers matchs) :</h4>
          {match.recentForm.home !== 'N/A' && (
            <p className="text-xs text-gray-600">
              <span className="font-medium">{match.homeTeam.name}:</span> {match.recentForm.home}
            </p>
          )}
           {match.recentForm.away !== 'N/A' && (
            <p className="text-xs text-gray-600">
              <span className="font-medium">{match.awayTeam.name}:</span> {match.recentForm.away}
            </p>
           )}
        </div>
      )}
    </div>
  );
};