import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { AppShell } from "@/components/layout/app-shell";
import { Starling } from "@starling/dev/next";

// Font is loaded here via next/font and bound to the CSS variable consumed by
// the @theme block in globals.css. DM Sans is the single typeface for the
// design system (see DESIGN.md §4) — no second display face, no mono. Do not
// import additional fonts without design approval.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AiLMS",
  description: "AiLMS — logistics management system",
};

/**
 * Root layout: providers (outermost → innermost) wrapping the app shell.
 * Add a new provider here ONLY if state is needed by ≥2 unrelated routes
 * (framework doc §4); otherwise prefer a feature-scoped store or local state.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="antialiased">
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
        {/* Dev-only annotation tool (no-op in production). Compile persists to the
            shared remote store scoped by appId; Rewind lists/loads from there. */}
        {/* <Starling
          appId="ailms"
          saveEndpoint="/api/starling/save"
          listEndpoint="/api/starling/list"
          loadEndpoint="/api/starling/load"
          openEndpoint="/api/starling/open"
        /> */}
      </body>
    </html>
  );
}
