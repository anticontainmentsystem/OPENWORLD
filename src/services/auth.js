/**
 * OpenWorld Auth Service
 * Handles authentication state management
 */

const AUTH_KEY = 'openworld_auth';

class AuthService {
  constructor() {
    this.user = null;
    this.listeners = [];
    this.init();
  }

  init() {
    // Check for existing session
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try {
        this.user = JSON.parse(stored);
        this.notifyListeners();
      } catch (e) {
        localStorage.removeItem(AUTH_KEY);
      }
    }
  }

  isLoggedIn() {
    return this.user !== null;
  }

  getUser() {
    return this.user;
  }

  // Simulated GitHub OAuth login
  async login() {
    // In production, this would redirect to GitHub OAuth
    // For now, we simulate with a mock user
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        this.user = {
          id: 'usr_current',
          username: 'creator_' + Math.random().toString(36).substr(2, 6),
          name: 'OpenWorld Creator',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
          bio: 'Building in public on OpenWorld.',
          github: 'github-user',
          followers: Math.floor(Math.random() * 500),
          following: Math.floor(Math.random() * 200),
          repos: [],
          joinedAt: new Date().toISOString()
        };
        
        localStorage.setItem(AUTH_KEY, JSON.stringify(this.user));
        this.notifyListeners();
        resolve(this.user);
      }, 800);
    });
  }

  logout() {
    this.user = null;
    localStorage.removeItem(AUTH_KEY);
    this.notifyListeners();
  }

  // Subscribe to auth changes
  subscribe(callback) {
    this.listeners.push(callback);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.user));
  }
}

// Singleton instance
export const auth = new AuthService();
