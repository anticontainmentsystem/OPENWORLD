/**
 * Action Queue Service
 * "Indestructible" Offline-First Write Buffer
 */

const QUEUE_KEY = 'openworld_action_queue';

class ActionQueue {
  constructor() {
    this.queue = this.load();
    this.isProcessing = false;
    
    // Attempt processing on load
    if (this.queue.length > 0) {
      this.process();
    }

    // Listener for network recovery
    window.addEventListener('online', () => this.process());
  }

  load() {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  save() {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
  }

  add(action) {
    // action: { type: 'create'|'edit'|'delete', data: {...}, id: string, timestamp: number }
    this.queue.push({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      attempts: 0,
      ...action
    });
    this.save();
    this.process();
  }

  async process() {
    if (this.isProcessing || this.queue.length === 0) return;
    if (!navigator.onLine) return; // Don't try if offline

    this.isProcessing = true;
    const item = this.queue[0]; // Peek

    console.log(`[Queue] Processing ${item.type} (${item.queueId || 'new'})...`);

    try {
      let success = false;
      
      // Dynamic import to avoid circular dependencies if possible, 
      // or we just use raw fetch here to be pure.
      // Let's use raw fetch to match what postsAPI does.
      
      const token = localStorage.getItem('openworld_user') 
        ? JSON.parse(localStorage.getItem('openworld_user')).accessToken 
        : null;

      if (!token) {
        throw new Error('No token found');
      }

      if (item.type === 'create') {
        const res = await fetch('/.netlify/functions/create-post', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data)
        });
        success = res.ok;
        
      } else if (item.type === 'edit' || item.type === 'delete' || item.type === 'react') {
        const res = await fetch('/.netlify/functions/manage-post', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: item.type,
                postId: item.data.postId || item.data.id,
                ...item.data
            })
        });
        success = res.ok;
      }

      if (success) {
        console.log(`[Queue] Success: ${item.type}`);
        this.queue.shift(); // Remove
        this.save();
        
        // Notify UI? dispatchEvent
        window.dispatchEvent(new CustomEvent('queue:success', { detail: item }));
        
        // Next
        setTimeout(() => {
            this.isProcessing = false;
            this.process();
        }, 500);
      } else {
        throw new Error('Server returned non-200');
      }
      
    } catch (error) {
      console.error(`[Queue] Failed: ${error.message}`);
      item.attempts++;
      
      // Backoff or move to end?
      // If auth error, maybe stop.
      if (item.attempts > 5) {
         // Move to "Dead Letter Queue"? For now, just keep retrying slowly
         this.isProcessing = false; // Stop loop
      } else {
         this.isProcessing = false;
         // Retry later
      }
    }
  }
}

export const queue = new ActionQueue();
