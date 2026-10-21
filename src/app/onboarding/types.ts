export interface OnboardingState {
  kind: "business" | "agency";
  url: string;
  name: string;
  niche: string;
  audience: string;
  description: string;
  language: string;
  extra_languages: string[];
  tone: string;
  person: string;
  avoid: string;
  sample: string;
  competitors: { name: string; url: string }[];
  suggested: { name: string; url: string }[];
  min_words: number;
  internal_links: number;
  faq: boolean;
  schema: boolean;
  days: string[];
  time: string;
  mode: "drip" | "batch";
  gsc: boolean;
  cms: string | null;
  hostedBlogMode: "platform" | "subdomain" | "folder";
  hostedBlogDomain: string;
  planId: string;
  interval: "month" | "year";
  survey: string;
  surveyOther: string;
  agency: { brand: string; logo_url: string; color: string; invites: string[]; domain: string; callSlot: string };
}

export const initialState: OnboardingState = {
  kind: "business",
  url: "",
  name: "",
  niche: "",
  audience: "",
  description: "",
  language: "es",
  extra_languages: [],
  tone: "Cercano y claro, con criterio experto",
  person: "nosotros",
  avoid: "",
  sample: "",
  competitors: [],
  suggested: [],
  min_words: 1400,
  internal_links: 3,
  faq: true,
  schema: true,
  days: ["mon", "wed", "fri"],
  time: "09:00",
  mode: "drip",
  gsc: false,
  cms: null,
  hostedBlogMode: "platform",
  hostedBlogDomain: "",
  planId: "",
  interval: "year",
  survey: "",
  surveyOther: "",
  agency: { brand: "", logo_url: "", color: "#ff4f1f", invites: [], domain: "", callSlot: "" },
};
