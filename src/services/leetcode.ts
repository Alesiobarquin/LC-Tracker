import { problems } from '../data/problems';

export interface LeetCodeSubmission {
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
}

export const fetchLeetCodeProfile = async (username: string): Promise<LeetCodeSubmission[]> => {
  const endpoint = '/api/leetcode';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        limit: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch from LeetCode API');
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('LeetCode API Error:', error);
    throw error;
  }
};
