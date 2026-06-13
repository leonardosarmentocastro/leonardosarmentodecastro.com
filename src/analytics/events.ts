import posthog from "posthog-js";

export const trackResumeClick = (): void => {
  posthog.capture("resume_clicked");
};

export const trackLinkedinClick = (): void => {
  posthog.capture("linkedin_clicked", { destination: "linkedin_profile" });
};

export const trackContactModalOpen = (): void => {
  posthog.capture("contact_modal_opened");
};

export const trackContactModalDismiss = (): void => {
  posthog.capture("contact_modal_dismissed");
};

export const trackWhatsappClick = (): void => {
  posthog.capture("whatsapp_clicked", { channel: "whatsapp" });
};

export const trackEmailClick = (): void => {
  posthog.capture("email_clicked", { channel: "email" });
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
