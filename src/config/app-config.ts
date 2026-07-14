import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Learnwu Backoffice",
  version: packageJson.version,
  copyright: `© ${currentYear}, Learnwu.`,
  meta: {
    title: "Learnwu Backoffice",
    description: "Operations dashboard for the Learnwu platform — mentor vetting and platform settings.",
  },
};
