const { getFile } = require('./utils/gh');

// Helper: Determine shard path from date
function getShardPath(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `data/posts/${year}/${month}.json`;
}

exports.handler = async (event, context) => {
  // 1. Caching Headers (The "Genius" Part)
  // public: cacheable by CDN
  // s-maxage=60: shared cache (CDN) holds it for 60s
  // stale-while-revalidate=300: serve stale content for 5m while fetching new in background
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    'Access-Control-Allow-Origin': '*' // Allow CORS
  };

  try {
    // 2. Fetch Current Shard
    // In a real production system, we might check query params for ?month=...
    // For now, we default to the current month ("Head of Feed")
    const shardPath = getShardPath();
    
    console.log(`[GetFeed] Fetching shard: ${shardPath}`);
    let posts = [];
    
    try {
        posts = await getFile(shardPath);
    } catch (e) {
        // If current month doesn't exist, try previous month? 
        // Or just return empty (start of month)
        console.log(`[GetFeed] Shard ${shardPath} not found. Returning empty.`);
        posts = [];
    }

    // 3. Fallback/Merge (Optional: Load previous month if < 10 posts)
    if (posts.length < 5) {
        // Calculate previous month
        const now = new Date();
        now.setMonth(now.getMonth() - 1);
        const prevShardPath = getShardPath(now);
        console.log(`[GetFeed] Fetching previous shard: ${prevShardPath}`);
        try {
            const prevPosts = await getFile(prevShardPath);
            posts = [...posts, ...prevPosts];
        } catch (e) {
            // Ignore if prev doesn't exist
        }
    }
    
    // 4. Return Data
    // We sort here just in case, though file should be sorted.
    // Newest first.
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(posts)
    };

  } catch (error) {
    console.error('Get Feed Error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
};
