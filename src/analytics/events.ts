import posthog from "posthog-js";

export const trackResumeClick = (): void => {
  posthog.capture("resume_clicked");
};

export const trackContactModalOpen = (): void => {
  posthog.capture("contact_modal_opened");
};

export const trackContactModalDismiss = (): void => {
  posthog.capture("contact_modal_dismissed");
};

export const trackResumeModalDismiss = (): void => {
  posthog.capture("resume_modal_dismissed");
};

export const trackResumePdfClick = (): void => {
  posthog.capture("resume_pdf_clicked", { destination: "google_drive" });
};

export const trackResumeWebClick = (): void => {
  posthog.capture("resume_web_clicked", { destination: "cv_page" });
};

export type ContactChannel = "whatsapp" | "email" | "linkedin";
export type ContactLocation =
  | "landing_modal"
  | "cv_contact_section"
  | "cv_dock";

export const trackContactClick = (params: {
  channel: ContactChannel;
  location: ContactLocation;
}): void => {
  posthog.capture("contact_clicked", params);
};
