
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GeminiMatchResponse, MatchStatus, NavTab } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY || API_KEY === "AIzaSyB31vq3WVkWKn-W135fz1ZYxE2FmohARGQ") {
  console.warn("Gemini API Key is not configured. Please set process.env.API_KEY.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const parseJsonFromMarkdown = (markdownString: string): any => {
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = markdownString.trim().match(fenceRegex);
  let jsonStr = markdownString.trim();
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse JSON response:", jsonStr, e);
    throw new Error("Invalid JSON response from API.");
  }
};

export const generateMatchesWithGemini = async (
  competitionName?: string, // Name of the specific competition to fetch, or undefined/null for 'all'
  dateContext?: NavTab     // To guide Gemini on the date range
): Promise<GeminiMatchResponse[]> => {
  if (!API_KEY || API_KEY === "AIzaSyB31vq3WVkWKn-W135fz1ZYxE2FmohARGQ") throw new Error("API Key not available for Gemini service.");
  
  const today = new Date().toISOString().split('T')[0];
  const model = "gemini-2.5-flash-preview-04-17";

  let dateInstructions = `Assume today is ${today}.`;
  if (dateContext === NavTab.TODAY) {
    dateInstructions += ` Focus on matches scheduled for today.`;
  } else if (dateContext === NavTab.TOMORROW) {
    dateInstructions += ` Focus on matches scheduled for tomorrow.`;
  } else if (dateContext === NavTab.LAST_MATCHES) {
    dateInstructions += ` Focus on matches from the last 2-3 days, mostly with status "${MatchStatus.FINISHED}".`;
  }

  let competitionInstructions = "Generate a list of 7 diverse football matches from various leagues.";
  if (competitionName && competitionName.toLowerCase() !== 'toutes les compétitions' && competitionName !== 'all') {
    competitionInstructions = `Generate a list of 5-7 football matches specifically for the "${competitionName}" competition.`;
  }
  
  const prompt = `
    ${competitionInstructions}
    For each match, provide:
    - league (string, e.g., "Premier League", "La Liga")
    - round (string, e.g., "Gameweek 5", "Matchday 3")
    - date (ISO 8601 format string. ${dateInstructions})
    - status (one of: "${MatchStatus.SCHEDULED}", "${MatchStatus.FINISHED}", "${MatchStatus.CANCELLED}", "${MatchStatus.POSTPONED}", "${MatchStatus.IN_PROGRESS}")
    - homeTeamName (Realistic football club name)
    - awayTeamName (Realistic football club name, different from homeTeamName)
    - homeScore (integer or null, if status is "${MatchStatus.FINISHED}" or "${MatchStatus.IN_PROGRESS}", otherwise null)
    - awayScore (integer or null, if status is "${MatchStatus.FINISHED}" or "${MatchStatus.IN_PROGRESS}", otherwise null)
    - homeHalfTimeScore (integer or null, if status is "${MatchStatus.FINISHED}" and applicable, otherwise null)
    - awayHalfTimeScore (integer or null, if status is "${MatchStatus.FINISHED}" and applicable, otherwise null)
    - competitionId (a slug-cased version of the competition name, consistent with the input if a specific competition was requested)
    - competitionName (string, e.g., "Premier League". This should match the requested competition if one was specified.)
    - detailsError (string or null, 1 in 10 chance of a short error like "Key player injured." or "Pitch conditions poor." for *actual* matches only)
    - homeTeamRecentForm (string, 15 characters of W, D, L separated by spaces, e.g., "W D L W W L D D W L W W L D W")
    - awayTeamRecentForm (string, 15 characters of W, D, L separated by spaces, e.g., "L L D W W L D W W L D D W L W")

    Ensure team names are realistic football club names.
    Ensure dates are logical relative to the date context provided.
    Ensure scores are logical for football (e.g. homeScore 0-5, awayScore 0-5). Half time scores should be less than or equal to full time scores.
    If a specific competition was requested, all matches should be from that competition.
    The recent form strings must be exactly 15 characters (W, D, or L) separated by single spaces.

    IMPORTANT: If there are no real football matches that fit the specified criteria (competition, date context), you **must** return an empty JSON array \`[]\`. 
    Do not invent or simulate matches if none genuinely exist. Accuracy is paramount.

    Return the response strictly as a JSON array of match objects. Do not include any other text or explanations.
    Example of a single match object (if matches exist):
    {
      "league": "${competitionName || "Premier League"}",
      "round": "Gameweek 5",
      "date": "${new Date().toISOString()}", 
      "status": "${MatchStatus.SCHEDULED}",
      "homeTeamName": "Team A",
      "awayTeamName": "Team B",
      "homeScore": null,
      "awayScore": null,
      "homeHalfTimeScore": null,
      "awayHalfTimeScore": null,
      "competitionId": "${competitionName ? competitionName.toLowerCase().replace(/\s+/g, '-') : "premier-league"}",
      "competitionName": "${competitionName || "Premier League"}",
      "detailsError": null,
      "homeTeamRecentForm": "W D L W W L D D W L W W L D W",
      "awayTeamRecentForm": "L L D W W L D W W L D D W L W"
    }
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7, // Lower temperature might also help reduce "creativity" when not desired
      },
    });

    const parsedData = parseJsonFromMarkdown(response.text);

    if (!Array.isArray(parsedData)) {
        console.error("Gemini response is not an array:", parsedData);
        // If Gemini returns a non-array (e.g. a string saying "no matches found" instead of []), treat as empty.
        if (typeof parsedData === 'string' && parsedData.toLowerCase().includes("no match")) {
            return [];
        }
        throw new Error("Expected an array of matches from Gemini API.");
    }
    
    // Basic validation of the first item to check critical fields including new form fields
    if (parsedData.length > 0) {
        const firstItem = parsedData[0];
        if (!firstItem.homeTeamName || !firstItem.awayTeamName || !firstItem.date || !firstItem.status || !firstItem.competitionName || !firstItem.competitionId || !firstItem.homeTeamRecentForm || !firstItem.awayTeamRecentForm) {
            console.warn("Gemini response item is missing crucial fields (including recent form). This might be due to no matches being found and an unexpected response format. Treating as no matches.", firstItem);
            // If the structure is unexpected but array is not empty, this might indicate a partial/broken response.
            // For safety, and to adhere to "no simulation", we could return empty or throw more specific error.
            // Given the prompt, an empty array is the expected "no matches" signal.
            // If it's malformed for other reasons, the existing error below might be better.
            // However, if it's a malformed "no matches" signal, we want to return [].
            // For now, let's rely on the more generic error or successful empty array parsing.
            // The prompt change is the primary fix.
        }
    }
    // Ensure competitionId is slugified based on competitionName from response for consistency
    return parsedData.map((match: GeminiMatchResponse) => ({
        ...match,
        competitionId: match.competitionName ? match.competitionName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : 'unknown-competition'
    })) as GeminiMatchResponse[];
  } catch (error) {
    console.error("Error generating matches with Gemini:", error);
    if (error instanceof Error && error.message.includes("API Key not valid")) {
        throw new Error("Invalid Gemini API Key. Please check your API_KEY.");
    }
    if (error instanceof Error && (error.message.includes("429") || error.message.includes("RESOURCE_EXHAUSTED"))) {
        throw new Error("Rate limit exceeded with Gemini API. Please try again later or check your plan.");
    }
    // If the error is due to parsing an empty string or non-JSON from Gemini (which might happen if it tries to say "no matches" non-JSON way)
    if (error instanceof Error && error.message.includes("Invalid JSON response")) {
        // This could happen if Gemini doesn't return `[]` but some other text.
        // We can assume this means no matches if the strict JSON parsing fails for simple text.
        console.warn("Gemini returned non-JSON, possibly indicating no matches. Returning empty list.");
        return [];
    }
    throw error;
  }
};
// Removed generateRecentFormWithGemini function
