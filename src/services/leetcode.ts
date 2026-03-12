import { problems } from '../data/problems';

export interface LeetCodeSubmission {
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
}

export const fetchLeetCodeProfile = async (username: string): Promise<LeetCodeSubmission[]> => {
  const endpoint = `https://alfa-leetcode-api.onrender.com/${username}/acSubmission`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch from LeetCode API: ${errorText}`);
    }

    const data = await response.json();
    return data.submission || [];
  } catch (error) {
    console.error('LeetCode API Error:', error);
    throw error;
  }
};
