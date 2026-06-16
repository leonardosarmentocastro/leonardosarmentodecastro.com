export type SkillCategory =
  | "Languages"
  | "Frameworks"
  | "Runtimes"
  | "Databases"
  | "Infrastructure"
  | "AI"
  | "Design"
  | "CMS"
  | "Communication";

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
  aliases: string[];
  /** Flag or other emoji shown in place of a tech icon (e.g. 🇺🇸). */
  emoji?: string;
  /** When true, shows only `since` — no "N years" line or dot bar. */
  omitExperienceBar?: boolean;
};

export type WorkLane = "left" | "right";

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
  lane: WorkLane;
  /** Desktop sticky pin: stay on lane until this company's scroll region ends */
  stickyThrough?: string;
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
  github: string;
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
