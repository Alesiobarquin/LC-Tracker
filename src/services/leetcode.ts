import { problems } from '../data/problems';

export interface LeetCodeSubmission {
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
}

export const fetchLeetCodeProfile = async (username: string): Promise<LeetCodeSubmission[]> => {
  const query = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
        statusDisplay
        lang
      }
    }
  `;

  const variables = JSON.stringify({ username, limit: 20 });
  const params = new URLSearchParams({ query, variables });
  
  const targetUrl = `https://leetcode.com/graphql?${params.toString()}`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

  try {
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch from proxy`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }
    
    return data.data?.recentAcSubmissionList || [];
  } catch (error) {
    console.warn('Primary fetch failed, falling back to Alfa LeetCode API...', error);
    
    // Fallback to alfa-leetcode-api
    const fallbackEndpoint = `https://alfa-leetcode-api.onrender.com/${username}/acSubmission`;
    try {
      const fbResponse = await fetch(fallbackEndpoint);
      if (!fbResponse.ok) {
         const errorText = await fbResponse.text();
         throw new Error(`Fallback failed: ${errorText}`);
      }
      const data = await fbResponse.json();
      return data.submission || [];
    } catch (fallbackError) {
      console.error('All LeetCode API methods failed:', fallbackError);
      throw fallbackError;
    }
  }
};
