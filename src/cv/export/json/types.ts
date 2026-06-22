export type JsonResumeProfile = {
  network: string;
  username: string;
  url: string;
};

export type JsonResumeBasics = {
  name: string;
  label: string;
  email: string;
  phone: string;
  url: string;
  summary: string;
  location: { city: string; region: string; countryCode: string };
  profiles: JsonResumeProfile[];
};

export type JsonResumeWork = {
  name: string;
  position: string;
  startDate: string;
  endDate?: string;
  summary: string;
  highlights: string[];
  keywords: string[];
};

export type JsonResumeEducation = {
  institution: string;
  studyType: string;
  startDate: string;
  endDate: string;
};

export type JsonResumeSkill = {
  name: string;
  level: string;
  keywords: string[];
  /** Non-standard extension: self-assessed years of experience. Omitted for
   * skills without an experience bar (e.g. native languages) or with no
   * logged years, mirroring the ATS export. */
  yearsOfExperience?: number;
};

export type JsonResumeLanguage = {
  language: string;
  fluency: string;
};

export type JsonResume = {
  $schema: string;
  basics: JsonResumeBasics;
  work: JsonResumeWork[];
  education: JsonResumeEducation[];
  skills: JsonResumeSkill[];
  languages: JsonResumeLanguage[];
};
