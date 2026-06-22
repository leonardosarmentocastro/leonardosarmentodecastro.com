export type AtsExperience = {
  company: string;
  role: string;
  dateRange: string;
  location: string;
  bullets: string[];
  technologies: string[];
};

export type AtsEducation = {
  school: string;
  degree: string;
  period: string;
};

export type AtsSkillGroup = {
  category: string;
  entries: string[];
};

export type AtsResume = {
  name: string;
  headline: string;
  contact: string;
  links: string[];
  summary: string;
  skills: AtsSkillGroup[];
  experience: AtsExperience[];
  education: AtsEducation[];
};
