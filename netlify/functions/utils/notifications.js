/**
 * Notifications Helper
 * Shared logic to write notifications to user files
 */
import { readData, writeData } from './gh.js';

export async function createNotification(targetUsername, type, actor, data = {}) {
  // Don't notify self
  if (targetUsername === actor.username) return;

  const filePath = `notifications/${targetUsername}.json`;
  
  try {
    const result = await readData(filePath);
    let notifications = result?.data || [];
    
    // Create new notification
    const notification = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type, // 'follow', 'star', 'reply', 'reaction'
      actor: {
        username: actor.username,
        avatar: actor.avatar || `https://github.com/${actor.username}.png`
      },
      data, // { repoName, postId, content, etc. }
      read: false,
      createdAt: new Date().toISOString()
    };
    
    // Prepend (newest first)
    notifications.unshift(notification);
    
    // Limit size (e.g., keep last 50)
    if (notifications.length > 50) {
      notifications = notifications.slice(0, 50);
    }
    
    await writeData(
      filePath, 
      notifications, 
      result?.sha, 
      `Notify @${targetUsername}: ${type}`
    );
    
    return true;
  } catch (error) {
    console.error(`Failed to create notification for ${targetUsername}:`, error);
    return false;
  }
}
