export type CountryOption = {
  code: string;
  name: string;
  isCarpathian: boolean;
};

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'AT', name: 'Austria', isCarpathian: true },
  { code: 'CZ', name: 'Czech Republic', isCarpathian: true },
  { code: 'HU', name: 'Hungary', isCarpathian: true },
  { code: 'PL', name: 'Poland', isCarpathian: true },
  { code: 'RO', name: 'Romania', isCarpathian: true },
  { code: 'RS', name: 'Serbia', isCarpathian: true },
  { code: 'SK', name: 'Slovakia', isCarpathian: true },
  { code: 'UA', name: 'Ukraine', isCarpathian: true },
  { code: 'DE', name: 'Germany', isCarpathian: false },
  { code: 'MD', name: 'Moldova', isCarpathian: false },
];

export const COUNTRY_BY_CODE = Object.fromEntries(
  COUNTRY_OPTIONS.map((c) => [c.code, c])
);

export const COUNTRY_BY_NAME = Object.fromEntries(
  COUNTRY_OPTIONS.map((c) => [c.name, c])
);

export const CARPATHIAN_COUNTRY_CODES = COUNTRY_OPTIONS
  .filter((c) => c.isCarpathian)
  .map((c) => c.code);

export const isCarpathianCountry = (code: string) =>
  CARPATHIAN_COUNTRY_CODES.includes(code);

export const getCountryName = (code: string) =>
  COUNTRY_BY_CODE[code]?.name ?? code;

export const getCountryFlag = (code: string) => {
  if (code.length !== 2) return '';
  const base = 0x1F1E6;
  return String.fromCodePoint(base + (code.charCodeAt(0) - 65), base + (code.charCodeAt(1) - 65));
};
