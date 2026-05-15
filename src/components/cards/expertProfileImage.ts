export const LOCAL_EXPERT_PORTRAIT_EXTENSIONS = ['jpg', 'png', 'webp'] as const;

export const getLocalExpertPortraitPath = (
  id: string,
  extension: typeof LOCAL_EXPERT_PORTRAIT_EXTENSIONS[number] = LOCAL_EXPERT_PORTRAIT_EXTENSIONS[0],
) => `/profile-pictures/${id}.${extension}`;

export const getLocalExpertPortraitPaths = (id: string) =>
  LOCAL_EXPERT_PORTRAIT_EXTENSIONS.map((extension) => getLocalExpertPortraitPath(id, extension));

const getInitials = (name: string) => {
  const parts = name.replace(/^dr\.\s*/i, '').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?';
};

export const buildUiAvatarUrl = (name: string) => {
  const initials = getInitials(name);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=22c55e&color=fff&size=128&bold=true&rounded=true&font-size=0.45`;
};
