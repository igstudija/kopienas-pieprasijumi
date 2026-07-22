export const SOURCE_CODE_URL = "https://github.com/igstudija/kopienas-pieprasijumi";
export const LICENSE_NAME = "PolyForm Noncommercial License 1.0.0";

export type LegalSettings = {
  instanceName: string;
  legalEntityName: string;
  legalRegistrationNumber: string;
  legalAddress: string;
  legalCountry: string;
  legalEmail: string;
  legalPhone: string;
  privacyContactEmail: string;
  dataRetentionMonths: number;
};

export type LegalSettingsInput = Omit<LegalSettings, "instanceName">;
