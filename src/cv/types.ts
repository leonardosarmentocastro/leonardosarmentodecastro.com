export type SkillCategory =
  | "Language"
  | "Framework"
  | "Runtime"
  | "Database"
  | "Infrastructure"
  | "AI"
  | "Design"
  | "CMS";

export type SkillLevel = "Expert" | "Advanced" | "Experienced";

export type Skill = {
  name: string;
  category: SkillCategory;
  area: string;
  level: SkillLevel;
  stars: 1 | 2 | 3 | 4 | 5;
  years: number;
  filledDots: number;
  totalDots: 10;
  since: string;
};

export type WorkExperience = {
  company: string;
  role: string;
  via?: string;
  workMode: "remote" | "in office";
  startDate: string;
  endDate: string | "Present";
  location?: string;
  description: string;
  bullets: string[];
  technologies: string[];
};

export type Education = {
  school: string;
  degree: string;
  period: string;
};

export type Milestone = {
  year: number;
  text: string;
};

export type ResumeLinks = {
  linkedin: string;
  email: string;
  whatsapp: string;
  whatsappDisplay: string;
  whatsappMessage: string;
  site: string;
  resumePdf: string;
};

export type Resume = {
  hero: {
    name: string;
    role: string;
    kicker: string;
    location: string;
    blurb: string;
    avatar: string;
    links: ResumeLinks;
  };
  about: string[];
  workExperience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  milestones: Milestone[];
};
