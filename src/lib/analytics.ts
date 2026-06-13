import posthog from "posthog-js";

export const trackResumeClick = (): void => {
  posthog.capture("resume_clicked", { destination: "google_drive" });
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
