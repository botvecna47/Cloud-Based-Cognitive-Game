// Clean geometric monograms matching database CHECK constraint IDs (zero AI emoji clutter)
export const AVATAR_OPTIONS = [
  { id: 'brain-blue', label: 'Logic', icon: '◈' },
  { id: 'crown-gold', label: 'Apex', icon: '▲' },
  { id: 'lightning', label: 'Pulse', icon: '✦' },
  { id: 'rocket', label: 'Vector', icon: '↗' },
  { id: 'diamond', label: 'Prism', icon: '◆' },
  { id: 'robot', label: 'Matrix', icon: '⊞' },
  { id: 'fire', label: 'Spark', icon: '●' },
  { id: 'star', label: 'North', icon: '★' },
] as const;

export type AvatarId = (typeof AVATAR_OPTIONS)[number]['id'];

export const ALLOWED_AVATARS: readonly AvatarId[] = AVATAR_OPTIONS.map(a => a.id);

export function getAvatarIcon(avatarId?: string): string {
  const found = AVATAR_OPTIONS.find(a => a.id === avatarId);
  return found ? found.icon : '◈';
}
