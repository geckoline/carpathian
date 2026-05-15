export const getLocalExpertPortraitPath = (id: string) => `/profile-pictures/${id}.jpg`;

const getInitials = (name: string) => {
  const parts = name.replace(/^dr\.\s*/i, '').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?';
};

export const buildUiAvatarUrl = (name: string) => {
  const initials = getInitials(name);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=22c55e&color=fff&size=128&bold=true&rounded=true&font-size=0.45`;
};

export const isLocalProfilePicture = (value?: string) =>
  Boolean(value?.startsWith('/profile-pictures/') && !value.includes('..'));
