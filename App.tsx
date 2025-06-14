
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { MatchList } from './components/MatchList';
import { NAV_TABS, MOCK_COMPETITIONS } from './constants';
import { Match, NavTab, Competition, MatchStatus, Team, GeminiMatchResponse } from './types';
import { generateMatchesWithGemini } from './services/geminiService';
import { calculateOutcomeProbabilities } from './utils/probabilities';

const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

// This is a common placeholder key, ensure it matches the one in geminiService if checked.
const PLACEHOLDER_API_KEY = "AIzaSyB31vq3WVkWKn-W135fz1ZYxE2FmohARGQ";

const App: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<NavTab>(NavTab.TODAY);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>(''); // Empty string for "Select a competition"
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const competitionsForFilter: Competition[] = useMemo(() => [
    { id: '', name: 'Sélectionnez une compétition' },
    ...MOCK_COMPETITIONS 
  ], []);

  useEffect(() => {
    const fetchAndProcessMatches = async () => {
      // Check if the API key is missing or is still the placeholder value.
      // process.env.API_KEY should be set by the environment.
      if (!process.env.API_KEY || process.env.API_KEY === PLACEHOLDER_API_KEY) {
        setError("API Key not configured. Please ensure your Gemini API Key is set in the environment.");
        setIsLoading(false);
        setAllMatches([]);
        return;
      }

      if (!selectedCompetitionId) { // Do not fetch if no competition is selected
        setAllMatches([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const selectedCompetition = competitionsForFilter.find(c => c.id === selectedCompetitionId);
        const competitionToFetch = selectedCompetitionId === 'all' ? undefined : selectedCompetition?.name;

        const rawMatches = await generateMatchesWithGemini(competitionToFetch, selectedTab);
        
        const processedMatches: Match[] = rawMatches.map((rawMatch: GeminiMatchResponse, index: number): Match => {
            const homeTeamId = slugify(rawMatch.homeTeamName);
            const awayTeamId = slugify(rawMatch.awayTeamName);

            const homeTeam: Team = {
              id: homeTeamId,
              name: rawMatch.homeTeamName,
              logoUrl: `https://picsum.photos/seed/${homeTeamId}/40/40`,
            };
            const awayTeam: Team = {
              id: awayTeamId,
              name: rawMatch.awayTeamName,
              logoUrl: `https://picsum.photos/seed/${awayTeamId}/40/40`,
            };
            
            const validateForm = (formString: string): string => {
              if (typeof formString === 'string') {
                const parts = formString.trim().split(' ');
                if (parts.length === 15 && parts.every(p => ['W', 'D', 'L'].includes(p) && p.length ===1)) {
                  return formString.trim();
                }
                if (formString.length === 15 && /^[WDL]+$/.test(formString)) {
                  return formString.split('').join(' ');
                }
              }
              console.warn(`Invalid recent form string received: "${formString}". Using N/A.`);
              return 'N/A';
            };

            const validatedHomeForm = validateForm(rawMatch.homeTeamRecentForm);
            const validatedAwayForm = validateForm(rawMatch.awayTeamRecentForm);
            
            const outcomeProbs = calculateOutcomeProbabilities(validatedHomeForm, validatedAwayForm);

            return {
              id: `${slugify(rawMatch.homeTeamName)}-vs-${slugify(rawMatch.awayTeamName)}-${new Date(rawMatch.date).getTime()}-${index}`,
              league: rawMatch.league,
              round: rawMatch.round,
              date: rawMatch.date,
              status: rawMatch.status as MatchStatus,
              homeTeam,
              awayTeam,
              homeScore: rawMatch.homeScore,
              awayScore: rawMatch.awayScore,
              homeHalfTimeScore: rawMatch.homeHalfTimeScore,
              awayHalfTimeScore: rawMatch.awayHalfTimeScore,
              recentForm: {
                home: validatedHomeForm,
                away: validatedAwayForm,
              },
              outcomeProbabilities: outcomeProbs,
              detailsError: rawMatch.detailsError,
              competitionId: slugify(rawMatch.competitionName),
              competitionName: rawMatch.competitionName,
            };
          }
        );
        setAllMatches(processedMatches);

      } catch (err: any) {
        console.error("Failed to fetch matches:", err);
        setError(`Failed to load match data: ${err.message || 'Unknown error'}. Check console for details.`);
        setAllMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessMatches();
  }, [selectedCompetitionId, selectedTab, competitionsForFilter]);

  const handleTabChange = useCallback((tab: NavTab) => {
    setSelectedTab(tab);
  }, []);

  const handleCompetitionChange = useCallback((competitionId: string) => {
    setSelectedCompetitionId(competitionId);
  }, []);

  const filteredMatches = useMemo(() => {
    const todayDt = new Date();
    todayDt.setHours(0, 0, 0, 0);
    
    const tomorrowDt = new Date(todayDt);
    tomorrowDt.setDate(todayDt.getDate() + 1);

    let matchesByTab = allMatches;

    switch (selectedTab) {
      case NavTab.TODAY:
        matchesByTab = allMatches.filter(match => {
          const matchDate = new Date(match.date);
          matchDate.setHours(0,0,0,0);
          return matchDate.getTime() === todayDt.getTime();
        });
        break;
      case NavTab.TOMORROW:
        matchesByTab = allMatches.filter(match => {
          const matchDate = new Date(match.date);
          matchDate.setHours(0,0,0,0);
          return matchDate.getTime() === tomorrowDt.getTime();
        });
        break;
      case NavTab.LAST_MATCHES:
        matchesByTab = allMatches.filter(match => {
          const matchDate = new Date(match.date);
          matchDate.setHours(0,0,0,0);
          return matchDate.getTime() < todayDt.getTime() && 
                 (match.status === MatchStatus.FINISHED || 
                  match.status === MatchStatus.CANCELLED || 
                  match.status === MatchStatus.POSTPONED ||
                  (match.status === MatchStatus.SCHEDULED && matchDate.getTime() < todayDt.getTime())); 
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      default:
        matchesByTab = allMatches;
    }
    
    if (selectedCompetitionId && selectedCompetitionId !== 'all') {
      return matchesByTab.filter(match => match.competitionId === selectedCompetitionId);
    }
    return matchesByTab;
  }, [selectedTab, selectedCompetitionId, allMatches]);
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        selectedTab={selectedTab}
        onTabChange={handleTabChange}
        tabs={NAV_TABS}
        competitions={competitionsForFilter}
        selectedCompetitionId={selectedCompetitionId}
        onCompetitionChange={handleCompetitionChange}
      />
      <main className="container mx-auto p-4 md:p-6">
        {isLoading && (
          <div className="text-center py-10">
            <p className="text-xl text-blue-600">Loading matches...</p>
          </div>
        )}
        {!isLoading && error && (
          <div className="text-center py-10 text-red-600 bg-red-50 p-4 rounded-md">
            <p className="text-xl font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}
        {!isLoading && !error && !selectedCompetitionId && (
            <div className="text-center py-10 text-gray-500">
                <p className="text-xl">Veuillez sélectionner une compétition pour afficher les matchs.</p>
            </div>
        )}
        {!isLoading && !error && selectedCompetitionId && filteredMatches.length > 0 && (
          <MatchList matches={filteredMatches} />
        )}
        {!isLoading && !error && selectedCompetitionId && filteredMatches.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <p className="text-xl">Aucun match trouvé pour les filtres sélectionnés.</p>
          </div>
        )}
      </main>
      <footer className="text-center py-6 text-gray-500 text-sm">
        PronoExpert Clone - Match data generated by Gemini API. For demonstration purposes.
      </footer>
    </div>
  );
};

export default App;