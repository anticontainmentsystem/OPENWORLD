/**
 * OpenWorld Mock Data
 * Sample users, posts, and activity for development
 */

export const mockUsers = [
  {
    id: 'usr_001',
    username: 'aurora_dev',
    name: 'Aurora Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aurora',
    bio: 'Building the future of creative tools. Open source enthusiast.',
    location: 'San Francisco, CA',
    website: 'https://aurora.dev',
    github: 'aurora-dev',
    followers: 1247,
    following: 89,
    repos: [
      { name: 'soundscape-engine', description: 'Generative audio toolkit', stars: 342, language: 'TypeScript' },
      { name: 'creative-lab', description: 'Experimental art tools', stars: 128, language: 'JavaScript' }
    ],
    joinedAt: '2024-03-15'
  },
  {
    id: 'usr_002',
    username: 'night_coder',
    name: 'Marcus Night',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
    bio: 'Code artist. Generative visuals. Interactive everything.',
    location: 'Berlin, Germany',
    github: 'nightcoder',
    followers: 892,
    following: 156,
    repos: [
      { name: 'pixel-forge', description: 'WebGL shader playground', stars: 567, language: 'GLSL' },
      { name: 'data-canvas', description: 'Data visualization library', stars: 234, language: 'JavaScript' }
    ],
    joinedAt: '2023-11-20'
  },
  {
    id: 'usr_003',
    username: 'synthwave_kai',
    name: 'Kai Yamamoto',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kai',
    bio: 'Sound designer × developer. Making machines sing.',
    location: 'Tokyo, Japan',
    github: 'synthkai',
    followers: 2103,
    following: 67,
    repos: [
      { name: 'wave-synth', description: 'Browser-based synthesizer', stars: 890, language: 'TypeScript' },
      { name: 'audio-reactive', description: 'Audio visualization toolkit', stars: 445, language: 'JavaScript' }
    ],
    joinedAt: '2023-08-10'
  },
  {
    id: 'usr_004',
    username: 'void_artist',
    name: 'Elena Void',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena',
    bio: 'Digital sculptor. Creating worlds from nothing.',
    location: 'Amsterdam, NL',
    github: 'voidartist',
    followers: 1567,
    following: 234,
    repos: [
      { name: 'procedural-worlds', description: '3D world generation', stars: 678, language: 'Rust' },
      { name: 'fractal-dreams', description: 'Fractal art generator', stars: 321, language: 'Python' }
    ],
    joinedAt: '2024-01-05'
  },
  {
    id: 'usr_005',
    username: 'open_flux',
    name: 'River Santos',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=river',
    bio: 'Open source advocate. Building tools for everyone.',
    location: 'São Paulo, Brazil',
    github: 'openflux',
    followers: 3421,
    following: 312,
    repos: [
      { name: 'community-forge', description: 'Collaborative creation platform', stars: 1234, language: 'TypeScript' },
      { name: 'share-kit', description: 'Social sharing utilities', stars: 567, language: 'JavaScript' }
    ],
    joinedAt: '2023-05-22'
  }
];

export const mockPosts = [
  {
    id: 'post_001',
    userId: 'usr_001',
    content: 'Just shipped v2.0 of soundscape-engine! 🎵 Now with real-time audio reactivity and WebAudio API integration. Check out the demo →',
    repo: { name: 'soundscape-engine', url: 'https://github.com/aurora-dev/soundscape-engine' },
    type: 'release',
    reactions: { fire: 24, heart: 18, rocket: 12 },
    comments: 7,
    createdAt: '2026-02-07T17:30:00Z'
  },
  {
    id: 'post_002',
    userId: 'usr_002',
    content: 'Experimenting with procedural shader generation. The results are... unexpectedly beautiful. WIP thread below 🧵',
    repo: { name: 'pixel-forge', url: 'https://github.com/nightcoder/pixel-forge' },
    type: 'experiment',
    reactions: { fire: 45, heart: 32, eyes: 28 },
    comments: 15,
    createdAt: '2026-02-07T15:45:00Z'
  },
  {
    id: 'post_003',
    userId: 'usr_003',
    content: 'New tutorial: Building a browser synthesizer from scratch. No libraries, just WebAudio. Link in bio.',
    repo: { name: 'wave-synth', url: 'https://github.com/synthkai/wave-synth' },
    type: 'tutorial',
    reactions: { heart: 67, bookmark: 89, rocket: 23 },
    comments: 31,
    createdAt: '2026-02-07T12:00:00Z'
  },
  {
    id: 'post_004',
    userId: 'usr_004',
    content: 'Pushed 47 commits this week on procedural-worlds. The terrain generation is finally working! 🏔️ Next up: biome transitions.',
    repo: { name: 'procedural-worlds', url: 'https://github.com/voidartist/procedural-worlds' },
    type: 'commit',
    reactions: { fire: 18, muscle: 12, heart: 8 },
    comments: 4,
    createdAt: '2026-02-07T09:20:00Z'
  },
  {
    id: 'post_005',
    userId: 'usr_005',
    content: 'community-forge just hit 1000 stars! 🌟 Thank you to everyone who contributed. This is what open source is about.',
    repo: { name: 'community-forge', url: 'https://github.com/openflux/community-forge' },
    type: 'milestone',
    reactions: { rocket: 156, heart: 89, clap: 67 },
    comments: 42,
    createdAt: '2026-02-06T22:15:00Z'
  },
  {
    id: 'post_006',
    userId: 'usr_001',
    content: 'Working on something new in the creative-lab. Can\'t say much yet, but it involves AI + generative art. Stay tuned 👀',
    type: 'teaser',
    reactions: { eyes: 34, fire: 21, heart: 15 },
    comments: 8,
    createdAt: '2026-02-06T18:30:00Z'
  },
  {
    id: 'post_007',
    userId: 'usr_002',
    content: 'Hot take: The best creative tools are the ones that get out of your way. Building interfaces that disappear.',
    type: 'thought',
    reactions: { heart: 78, fire: 45, brain: 56 },
    comments: 23,
    createdAt: '2026-02-06T14:00:00Z'
  }
];

// Current user (when logged in)
export const currentUser = {
  id: 'usr_current',
  username: 'you',
  name: 'Your Name',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current',
  bio: 'Building in public on OpenWorld.',
  github: 'yourusername',
  followers: 42,
  following: 108,
  repos: [],
  joinedAt: '2026-02-01'
};

// Helper to get user by ID
export function getUserById(id) {
  if (id === 'usr_current') return currentUser;
  return mockUsers.find(u => u.id === id);
}

// Helper to format relative time
export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
