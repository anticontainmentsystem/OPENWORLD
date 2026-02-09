import { readData, writeData } from './utils/gh.js';

// Helper: Determine shard path from date
function getShardPath(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'data/posts/legacy/misc.json';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `data/posts/${year}/${month}.json`;
}

export const handler = async (event, context) => {
  // Security: Only allow POST or specific secret? 
  // For now, checks for admin token in header or just relies on obfuscation/Netlify auth if enabled.
  // We'll require a simple "confirm=true" query param to prevent accidental runs.
  
  if (!event.queryStringParameters?.confirm) {
    return { 
        statusCode: 400, 
        body: 'Please add ?confirm=true to URL to execute migration.' 
    };
  }

  try {
    console.log('[Migration] Starting...');
    
    // 1. Read Legacy Data
    const result = await readData('posts.json');
    if (!result || !result.data) {
        return { statusCode: 404, body: 'posts.json not found' };
    }
    
    const allPosts = result.data;
    console.log(`[Migration] Found ${allPosts.length} posts.`);
    
    // 2. Group by Shard
    const shards = {}; // 'data/posts/2024/01.json': [post1, post2]
    
    allPosts.forEach(post => {
        const path = getShardPath(post.createdAt);
        if (!shards[path]) shards[path] = [];
        shards[path].push(post);
    });
    
    // 3. Write Shards
    const summary = [];
    
    for (const [path, posts] of Object.entries(shards)) {
        // Sort posts in shard
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // We need check if shard already exists to merge? 
        // For migration, we assume we want to OVERWRITE or MERGE.
        // Let's read first to be safe (idempotent).
        let existing = [];
        let sha = null;
        try {
            const currentShard = await readData(path);
            if (currentShard) {
                existing = currentShard.data;
                sha = currentShard.sha;
            }
        } catch (e) {} // ignore 404
        
        // Merge logic: Add new migration posts if ID not present
        let merged = [...existing];
        let addedCount = 0;
        
        posts.forEach(p => {
            if (!merged.find(m => m.id === p.id)) {
                merged.push(p);
                addedCount++;
            }
        });
        
        // Sort merged
        merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (addedCount > 0) {
            await writeData(path, merged, sha, `Migrate ${addedCount} posts to shard`);
            summary.push(`Wrote ${addedCount} (Total: ${merged.length}) to ${path}`);
        } else {
            summary.push(`Skipped ${path} (No new posts)`);
        }
    }
    
    console.log('[Migration] Complete.');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
          success: true, 
          shardsProcessed: Object.keys(shards).length,
          summary 
      }, null, 2)
    };

  } catch (error) {
    console.error('Migration Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
