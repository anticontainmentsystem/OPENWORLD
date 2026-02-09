/**
 * RecommendationEngine.js
 * Extensible algorithm for user recommendations
 * 
 * Architecture designed for future expansion:
 * - Pluggable scoring strategies
 * - Tiered results
 * - Easy to add new factors (topics, ads, repos, etc.)
 */

// Scoring strategies - each returns a numeric score
const strategies = {
  // Tier 1: Engagement score (posts + fire reactions)
  engagement: (user) => {
    const postWeight = 2;
    const fireWeight = 3;
    return (user.postCount || 0) * postWeight + (user.fireCount || 0) * fireWeight;
  },
  
  // Tier 2: Community score (posts + following others)
  community: (user) => {
    const postWeight = 1;
    const followingWeight = 2;
    return (user.postCount || 0) * postWeight + (user.followingCount || 0) * followingWeight;
  }
  
  // Future strategies can be added here:
  // topicRelevance: (user, context) => {...},
  // sponsored: (user) => {...},
  // repoActivity: (user) => {...},
};

export const RecommendationEngine = {
  
  /**
   * Get recommended users based on tiered scoring
   * @param {Array} allUsers - All platform users with stats
   * @param {Object} currentUser - Currently logged in user
   * @param {Object} options - Configuration options
   * @returns {Array} Recommended users
   */
  getRecommendations(allUsers, currentUser, options = {}) {
    const {
      tier1Count = 3,  // Top engagement users
      tier2Count = 3,  // Top community users
      excludeFollowed = true
    } = options;
    
    // Exclude current user
    let candidates = allUsers.filter(u => 
      currentUser ? u.username !== currentUser.username : true
    );
    
    // Exclude already-followed users (if enabled and we have follow data)
    if (excludeFollowed && currentUser?.following) {
      const followingSet = new Set(currentUser.following.map(f => f.username || f));
      candidates = candidates.filter(u => !followingSet.has(u.username));
    }
    
    // Tier 1: Top by engagement
    const tier1 = [...candidates]
      .map(u => ({ ...u, score: strategies.engagement(u) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, tier1Count);
    
    // Remove tier1 users from candidates for tier2
    const tier1Usernames = new Set(tier1.map(u => u.username));
    const tier2Candidates = candidates.filter(u => !tier1Usernames.has(u.username));
    
    // Tier 2: Top by community
    const tier2 = [...tier2Candidates]
      .map(u => ({ ...u, score: strategies.community(u) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, tier2Count);
    
    // Combine tiers (no labels, just merged list)
    return [...tier1, ...tier2];
  },
  
  /**
   * Calculate user stats from posts data
   * @param {Array} posts - All posts
   * @returns {Object} Map of username -> stats
   */
  calculateUserStats(posts) {
    const stats = {};
    
    posts.forEach(post => {
      if (post.deleted) return;
      
      const username = post.username;
      if (!username) return;
      
      if (!stats[username]) {
        stats[username] = {
          username,
          userId: post.userId,
          avatar: post.avatar,
          postCount: 0,
          fireCount: 0,
          followingCount: 0 // Will be filled from user profiles
        };
      }
      
      stats[username].postCount++;
      stats[username].fireCount += (post.reactions?.fire || 0);
    });
    
    return stats;
  },
  
  /**
   * Get total member count
   * @param {Array} posts - All posts  
   * @returns {number} Unique user count
   */
  getMemberCount(posts) {
    const users = new Set();
    posts.forEach(post => {
      if (post.username) users.add(post.username);
    });
    return users.size;
  }
};
