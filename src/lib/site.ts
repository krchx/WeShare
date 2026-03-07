export const siteConfig = {
  name: "ShareVia",
  teamName: "ShareVia Team",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://sharevia.vercel.app",
  repoUrl: "https://github.com/krchx/sharevia",
  description:
    "Instantly share files and collaborate on code in real-time using peer-to-peer technology. No sign-up required, just create a room and share the link.",
  shortDescription:
    "Real-time peer-to-peer file sharing and collaborative text editing.",
} as const;
