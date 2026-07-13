export type ApplicationStatus = "Pending review" | "In review" | "Accepted" | "Rejected";

export type LanguageProficiency = "Native" | "Fluent" | "Professional" | "Conversational";

export type SpokenLanguage = {
  language: string;
  proficiency: LanguageProficiency;
};

export type EmploymentEntry = {
  title: string;
  company: string;
  start: string;
  end: string | null;
  summary: string;
};

export type EducationEntry = {
  school: string;
  degree: string;
  start: string;
  end: string;
};

export type CertificateAttachment = {
  name: string;
  issuer: string;
  year: string;
  fileName: string;
  fileSize: string;
};

export type OpenSourceLink = {
  name: string;
  url: string;
  description: string;
};

export type WeekDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type AvailabilityDay = {
  day: WeekDay;
  slots: string[];
};

export type MentorApplication = {
  id: string;
  name: string;
  email: string;
  headline: string;
  bio: string;
  appliedDate: string;
  status: ApplicationStatus;
  decisionNote?: string;
  residency: {
    country: string;
    city: string;
    timezone: string;
  };
  languages: SpokenLanguage[];
  topics: string[];
  employment: EmploymentEntry[];
  education: EducationEntry[];
  certificates: CertificateAttachment[];
  openSource: OpenSourceLink[];
  weeklyAvailability: AvailabilityDay[];
};

export const statusMeta: Record<ApplicationStatus, { badgeClass: string; dotClass: string }> = {
  "Pending review": {
    badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  "In review": {
    badgeClass: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    dotClass: "bg-sky-500",
  },
  Accepted: {
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  Rejected: {
    badgeClass: "border-destructive/20 bg-destructive/10 text-destructive",
    dotClass: "bg-destructive",
  },
};

const fullWeekOff: AvailabilityDay[] = [
  { day: "Mon", slots: [] },
  { day: "Tue", slots: [] },
  { day: "Wed", slots: [] },
  { day: "Thu", slots: [] },
  { day: "Fri", slots: [] },
  { day: "Sat", slots: [] },
  { day: "Sun", slots: [] },
];

function availability(overrides: Partial<Record<WeekDay, string[]>>): AvailabilityDay[] {
  return fullWeekOff.map(({ day }) => ({ day, slots: overrides[day] ?? [] }));
}

export const mentorApplications: MentorApplication[] = [
  {
    id: "APP-1042",
    name: "Thiri Aung",
    email: "thiri.aung@gmail.com",
    headline: "Senior Frontend Engineer",
    bio: "Frontend engineer with 8 years of experience building design systems and large React applications. I want to help junior developers in Southeast Asia break into product teams.",
    appliedDate: "08 Jul 2026, 9:12 AM",
    status: "Pending review",
    residency: { country: "Myanmar", city: "Yangon", timezone: "GMT+6:30" },
    languages: [
      { language: "Burmese", proficiency: "Native" },
      { language: "English", proficiency: "Fluent" },
      { language: "Thai", proficiency: "Conversational" },
    ],
    topics: ["React", "TypeScript", "Design Systems", "Career Growth"],
    employment: [
      {
        title: "Senior Frontend Engineer",
        company: "Grab",
        start: "Mar 2022",
        end: null,
        summary: "Leads the driver-facing web platform team and maintains the internal component library.",
      },
      {
        title: "Frontend Engineer",
        company: "Codigo",
        start: "Jun 2018",
        end: "Feb 2022",
        summary: "Built consumer web apps for regional banking and telco clients.",
      },
    ],
    education: [
      {
        school: "University of Computer Studies, Yangon",
        degree: "B.C.Sc. Computer Science",
        start: "2013",
        end: "2017",
      },
    ],
    certificates: [
      {
        name: "AWS Certified Developer – Associate",
        issuer: "Amazon Web Services",
        year: "2024",
        fileName: "aws-developer-associate.pdf",
        fileSize: "1.2 MB",
      },
      {
        name: "Professional Scrum Master I",
        issuer: "Scrum.org",
        year: "2023",
        fileName: "psm-1-certificate.pdf",
        fileSize: "840 KB",
      },
    ],
    openSource: [
      {
        name: "react-mm-datepicker",
        url: "https://github.com/thiriaung/react-mm-datepicker",
        description: "Myanmar-calendar-aware date picker for React.",
      },
      {
        name: "design-tokens-cli",
        url: "https://github.com/thiriaung/design-tokens-cli",
        description: "CLI that syncs Figma variables into Tailwind themes.",
      },
    ],
    weeklyAvailability: availability({
      Mon: ["19:00 – 21:00"],
      Wed: ["19:00 – 21:00"],
      Sat: ["09:00 – 12:00", "14:00 – 16:00"],
      Sun: ["09:00 – 12:00"],
    }),
  },
  {
    id: "APP-1041",
    name: "Jonas Weber",
    email: "jonas.weber@posteo.de",
    headline: "Staff Engineer, Platform",
    bio: "I run the platform group at a Berlin scale-up. Mentoring is how I stay close to fundamentals — I enjoy walking engineers through distributed systems trade-offs.",
    appliedDate: "07 Jul 2026, 4:38 PM",
    status: "Pending review",
    residency: { country: "Germany", city: "Berlin", timezone: "GMT+2" },
    languages: [
      { language: "German", proficiency: "Native" },
      { language: "English", proficiency: "Fluent" },
    ],
    topics: ["System Design", "Kubernetes", "Go", "SRE Practices"],
    employment: [
      {
        title: "Staff Engineer",
        company: "Trade Republic",
        start: "Jan 2021",
        end: null,
        summary: "Owns the service platform and on-call standards across 40+ teams.",
      },
      {
        title: "Backend Engineer",
        company: "Zalando",
        start: "Sep 2015",
        end: "Dec 2020",
        summary: "Scaled the checkout order pipeline through several Black Friday peaks.",
      },
    ],
    education: [
      {
        school: "TU Berlin",
        degree: "M.Sc. Computer Engineering",
        start: "2011",
        end: "2015",
      },
    ],
    certificates: [
      {
        name: "Certified Kubernetes Administrator",
        issuer: "CNCF",
        year: "2025",
        fileName: "cka-jonas-weber.pdf",
        fileSize: "980 KB",
      },
    ],
    openSource: [
      {
        name: "kube-drain-guard",
        url: "https://github.com/jweber/kube-drain-guard",
        description: "Controller that blocks unsafe node drains during rollouts.",
      },
    ],
    weeklyAvailability: availability({
      Tue: ["18:00 – 20:00"],
      Thu: ["18:00 – 20:00"],
      Sun: ["10:00 – 13:00"],
    }),
  },
  {
    id: "APP-1039",
    name: "Amara Okafor",
    email: "amara.okafor@outlook.com",
    headline: "Machine Learning Engineer",
    bio: "ML engineer focused on production recommendation systems. I previously ran a 12-week data science bootcamp track in Lagos and loved seeing career switchers land offers.",
    appliedDate: "05 Jul 2026, 11:04 AM",
    status: "In review",
    residency: { country: "Nigeria", city: "Lagos", timezone: "GMT+1" },
    languages: [
      { language: "English", proficiency: "Native" },
      { language: "Igbo", proficiency: "Native" },
      { language: "French", proficiency: "Conversational" },
    ],
    topics: ["Machine Learning", "Python", "MLOps", "Interview Prep"],
    employment: [
      {
        title: "Machine Learning Engineer",
        company: "Spotify",
        start: "Apr 2023",
        end: null,
        summary: "Works on podcast recommendation ranking and offline evaluation tooling.",
      },
      {
        title: "Data Scientist",
        company: "Paystack",
        start: "Jul 2019",
        end: "Mar 2023",
        summary: "Built fraud detection models covering 60k+ merchants.",
      },
    ],
    education: [
      {
        school: "University of Lagos",
        degree: "B.Sc. Statistics",
        start: "2014",
        end: "2018",
      },
    ],
    certificates: [
      {
        name: "TensorFlow Developer Certificate",
        issuer: "Google",
        year: "2022",
        fileName: "tensorflow-developer.pdf",
        fileSize: "1.1 MB",
      },
      {
        name: "Deep Learning Specialization",
        issuer: "DeepLearning.AI",
        year: "2021",
        fileName: "dl-specialization.pdf",
        fileSize: "760 KB",
      },
    ],
    openSource: [
      {
        name: "feature-store-lite",
        url: "https://github.com/amaraokafor/feature-store-lite",
        description: "Lightweight feature store for small ML teams on Postgres.",
      },
    ],
    weeklyAvailability: availability({
      Mon: ["17:00 – 19:00"],
      Wed: ["17:00 – 19:00"],
      Fri: ["17:00 – 19:00"],
    }),
  },
  {
    id: "APP-1036",
    name: "Kenji Nakamura",
    email: "kenji.nakamura@proton.me",
    headline: "Mobile Lead (iOS)",
    bio: "iOS lead shipping consumer apps since the App Store launched. Happy to mentor on Swift, app architecture, and moving from senior to lead roles.",
    appliedDate: "02 Jul 2026, 8:20 PM",
    status: "Pending review",
    residency: { country: "Japan", city: "Fukuoka", timezone: "GMT+9" },
    languages: [
      { language: "Japanese", proficiency: "Native" },
      { language: "English", proficiency: "Professional" },
    ],
    topics: ["iOS / Swift", "Mobile Architecture", "Engineering Leadership"],
    employment: [
      {
        title: "Mobile Lead",
        company: "SmartNews",
        start: "Oct 2020",
        end: null,
        summary: "Leads a team of nine iOS engineers on the reader experience.",
      },
      {
        title: "iOS Engineer",
        company: "LINE",
        start: "Apr 2013",
        end: "Sep 2020",
        summary: "Shipped sticker store and payments features used by 90M+ MAU.",
      },
    ],
    education: [
      {
        school: "Kyushu University",
        degree: "B.Eng. Information Science",
        start: "2008",
        end: "2012",
      },
    ],
    certificates: [],
    openSource: [
      {
        name: "swift-snapshot-kit",
        url: "https://github.com/knakamura/swift-snapshot-kit",
        description: "Snapshot testing helpers for SwiftUI views.",
      },
      {
        name: "fastlane-plugin-kyushu",
        url: "https://github.com/knakamura/fastlane-plugin-kyushu",
        description: "Fastlane plugin bundling our release-train conventions.",
      },
    ],
    weeklyAvailability: availability({
      Sat: ["10:00 – 12:00", "20:00 – 22:00"],
      Sun: ["10:00 – 12:00"],
    }),
  },
  {
    id: "APP-1033",
    name: "Mariana Costa",
    email: "mariana.costa@gmail.com",
    headline: "Product Designer → Design Engineer",
    bio: "Design engineer bridging Figma and production code. I mentor designers learning to ship their own front-ends.",
    appliedDate: "28 Jun 2026, 2:47 PM",
    status: "Accepted",
    decisionNote: "Strong portfolio and prior mentoring track record at ADPList. Fast-tracked.",
    residency: { country: "Brazil", city: "Florianópolis", timezone: "GMT-3" },
    languages: [
      { language: "Portuguese", proficiency: "Native" },
      { language: "English", proficiency: "Fluent" },
      { language: "Spanish", proficiency: "Professional" },
    ],
    topics: ["Design Engineering", "CSS / Tailwind", "Figma to Code", "Portfolio Reviews"],
    employment: [
      {
        title: "Design Engineer",
        company: "Nubank",
        start: "Feb 2022",
        end: null,
        summary: "Maintains the web design system consumed by 30+ squads.",
      },
      {
        title: "Product Designer",
        company: "Resultados Digitais",
        start: "May 2017",
        end: "Jan 2022",
        summary: "Owned onboarding flows and the marketing site design.",
      },
    ],
    education: [
      {
        school: "UFSC",
        degree: "B.A. Design",
        start: "2012",
        end: "2016",
      },
    ],
    certificates: [
      {
        name: "Advanced CSS Architecture",
        issuer: "Frontend Masters",
        year: "2023",
        fileName: "fm-css-architecture.pdf",
        fileSize: "620 KB",
      },
    ],
    openSource: [
      {
        name: "tailwind-motion-presets",
        url: "https://github.com/marianacosta/tailwind-motion-presets",
        description: "Curated motion utilities and demos for Tailwind projects.",
      },
    ],
    weeklyAvailability: availability({
      Mon: ["08:00 – 10:00"],
      Tue: ["08:00 – 10:00"],
      Thu: ["19:00 – 21:00"],
    }),
  },
  {
    id: "APP-1031",
    name: "Priya Raman",
    email: "priya.raman@fastmail.com",
    headline: "Security Engineer",
    bio: "AppSec engineer running threat modeling programs. I want to mentor developers who are security-curious but don't know where to start.",
    appliedDate: "24 Jun 2026, 10:15 AM",
    status: "Pending review",
    residency: { country: "Singapore", city: "Singapore", timezone: "GMT+8" },
    languages: [
      { language: "English", proficiency: "Native" },
      { language: "Tamil", proficiency: "Native" },
      { language: "Malay", proficiency: "Conversational" },
    ],
    topics: ["Application Security", "Threat Modeling", "Secure Code Review"],
    employment: [
      {
        title: "Senior Security Engineer",
        company: "Stripe",
        start: "Aug 2021",
        end: null,
        summary: "Runs the security partners program for product teams in APAC.",
      },
      {
        title: "Security Consultant",
        company: "NCC Group",
        start: "Jan 2017",
        end: "Jul 2021",
        summary: "Delivered 80+ penetration tests and secure design reviews.",
      },
    ],
    education: [
      {
        school: "National University of Singapore",
        degree: "B.Comp. Information Security",
        start: "2012",
        end: "2016",
      },
    ],
    certificates: [
      {
        name: "OSCP",
        issuer: "OffSec",
        year: "2018",
        fileName: "oscp-priya-raman.pdf",
        fileSize: "1.4 MB",
      },
      {
        name: "CISSP",
        issuer: "ISC2",
        year: "2022",
        fileName: "cissp-priya-raman.pdf",
        fileSize: "900 KB",
      },
    ],
    openSource: [
      {
        name: "threat-model-templates",
        url: "https://github.com/priyaraman/threat-model-templates",
        description: "Ready-to-run threat modeling workshop decks and checklists.",
      },
    ],
    weeklyAvailability: availability({
      Wed: ["12:00 – 14:00"],
      Fri: ["12:00 – 14:00"],
      Sat: ["15:00 – 18:00"],
    }),
  },
  {
    id: "APP-1028",
    name: "Minh Tran",
    email: "minh.tran@icloud.com",
    headline: "Full-stack Developer",
    bio: "Full-stack developer at an agency, three years in. Looking to give back to bootcamp grads working on their first portfolio projects.",
    appliedDate: "19 Jun 2026, 6:52 PM",
    status: "Rejected",
    decisionNote: "Promising, but below the 5-year experience bar for this cohort. Encouraged to reapply next year.",
    residency: { country: "Vietnam", city: "Da Nang", timezone: "GMT+7" },
    languages: [
      { language: "Vietnamese", proficiency: "Native" },
      { language: "English", proficiency: "Professional" },
    ],
    topics: ["Node.js", "Next.js", "Portfolio Reviews"],
    employment: [
      {
        title: "Full-stack Developer",
        company: "Enouvo Space",
        start: "May 2023",
        end: null,
        summary: "Builds client web apps on Next.js and NestJS.",
      },
    ],
    education: [
      {
        school: "Da Nang University of Technology",
        degree: "B.Eng. Software Engineering",
        start: "2018",
        end: "2022",
      },
    ],
    certificates: [],
    openSource: [
      {
        name: "next-i18n-starter",
        url: "https://github.com/minhtran/next-i18n-starter",
        description: "Opinionated Next.js starter with localization wired in.",
      },
    ],
    weeklyAvailability: availability({
      Mon: ["20:00 – 22:00"],
      Tue: ["20:00 – 22:00"],
      Wed: ["20:00 – 22:00"],
      Thu: ["20:00 – 22:00"],
    }),
  },
  {
    id: "APP-1025",
    name: "Sofia Lindqvist",
    email: "sofia.lindqvist@hey.com",
    headline: "Engineering Manager",
    bio: "EM of two product teams. I mentor senior engineers navigating the IC-versus-management fork and first-time managers finding their footing.",
    appliedDate: "14 Jun 2026, 1:30 PM",
    status: "Accepted",
    decisionNote: "Excellent references from two current mentees. Approved for the leadership track.",
    residency: { country: "Sweden", city: "Stockholm", timezone: "GMT+2" },
    languages: [
      { language: "Swedish", proficiency: "Native" },
      { language: "English", proficiency: "Fluent" },
      { language: "Norwegian", proficiency: "Professional" },
    ],
    topics: ["Engineering Management", "Career Growth", "Hiring & Interviews"],
    employment: [
      {
        title: "Engineering Manager",
        company: "Spotify",
        start: "Nov 2019",
        end: null,
        summary: "Manages the playlist experience teams, 14 engineers across two squads.",
      },
      {
        title: "Backend Engineer",
        company: "Klarna",
        start: "Jun 2014",
        end: "Oct 2019",
        summary: "Worked on the payments risk platform, later as tech lead.",
      },
    ],
    education: [
      {
        school: "KTH Royal Institute of Technology",
        degree: "M.Sc. Computer Science",
        start: "2009",
        end: "2014",
      },
    ],
    certificates: [
      {
        name: "ICF Associate Certified Coach",
        issuer: "International Coaching Federation",
        year: "2024",
        fileName: "icf-acc-lindqvist.pdf",
        fileSize: "1.0 MB",
      },
    ],
    openSource: [
      {
        name: "eng-ladder-templates",
        url: "https://github.com/slindqvist/eng-ladder-templates",
        description: "Open-sourced engineering career ladder and review templates.",
      },
    ],
    weeklyAvailability: availability({
      Tue: ["07:30 – 09:00"],
      Thu: ["07:30 – 09:00"],
      Fri: ["16:00 – 18:00"],
    }),
  },
];
