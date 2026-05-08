// src/utils/envValidation.ts
/**
 * Validates critical environment variables at startup.
 * Prevents silent failures when API keys or base URLs are missing in prod.
 */
export const validateEnv = (): boolean => {
  const requiredVars: string[] = []; // Add mandatory keys here (e.g., 'VITE_API_BASE_URL')
  const missing = requiredVars.filter(v => !import.meta.env[v]);
  
  if (missing.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  return true;
};
