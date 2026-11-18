export const AVATAR_OPTIONS = [
  { id: 'brain-blue', label: 'Cyan Brain', icon: '🧠' },
  { id: 'crown-gold', label: 'Gold Champion', icon: '👑' },
  { id: 'lightning', label: 'Reflex', icon: '⚡' },
  { id: 'rocket', label: 'Stratosphere', icon: '🚀' },
  { id: 'diamond', label: 'Diamond Mind', icon: '💎' },
  { id: 'robot', label: 'Neural Bot', icon: '🤖' },
  { id: 'fire', label: 'Hot Streak', icon: '🔥' },
  { id: 'star', label: 'Superstar', icon: '⭐' },
] as const;

export type AvatarId = (typeof AVATAR_OPTIONS)[number]['id'];

export const ALLOWED_AVATARS: readonly AvatarId[] = AVATAR_OPTIONS.map(a => a.id);

export function getAvatarIcon(avatarId?: string): string {
  const found = AVATAR_OPTIONS.find(a => a.id === avatarId);
  return found ? found.icon : '🧠';
}
