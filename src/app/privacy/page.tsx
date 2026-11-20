import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What CineBlock collects, why, who helps us run it, and how to delete your data.",
  alternates: { canonical: "/privacy" },
};

const CONTACT_EMAIL = "pratsprofess@gmail.com";
const LIST = "list-disc space-y-2 pl-5 marker:text-slate-600";

const sections: readonly LegalSection[] = [
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <>
        <p>
          <strong className="text-white">From Google sign-in:</strong> your name, email address and profile picture. We
          ask Google for nothing else: no contacts, no calendar, no Drive, no access to your Google account.
        </p>
        <p>
          <strong className="text-white">What you add to CineBlock:</strong>
        </p>
        <ul className={LIST}>
          <li>Your username and preferred language.</li>
          <li>Films and shows you like, watch or add to your watchlist, and your upcoming-release radar.</li>
          <li>Stamps (your notes on titles), public or private as you choose.</li>
          <li>CineBlocks you create or save, and Watch Block rooms you join, including invites and votes.</li>
          <li>CineSwipe history, so we don’t show you the same title twice, and a daily swipe count.</li>
        </ul>
        <p>
          <strong className="text-white">If you connect other tools:</strong> a CineBlock Terminal token and its daily
          search count, and, for AI assistants such as ChatGPT, connection tokens (stored as one-way hashes) plus a short
          record of each change you approved, so the same request can’t be applied twice.
        </p>
        <p>
          <strong className="text-white">Technical data:</strong> sign-in cookies that keep you logged in, and the country
          your request comes from, which our hosting provider adds to each request so we can show local release dates
          and streaming options. We don’t store your IP address in our database.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-it",
    title: "How we use it",
    body: (
      <>
        <p>Only to run CineBlock for you:</p>
        <ul className={LIST}>
          <li>to create your account and show your name and picture on your profile;</li>
          <li>to keep your lists, stamps and CineBlocks in sync across devices;</li>
          <li>to make recommendations from what you’ve liked and watched;</li>
          <li>to share the things you choose to make public, such as public stamps and CineBlocks;</li>
          <li>to keep the service secure and within fair-use limits.</li>
        </ul>
        <p>We don’t sell your data, we don’t show ads, and we don’t use your data to train AI models.</p>
      </>
    ),
  },
  {
    id: "google-user-data",
    title: "Google user data",
    body: (
      <>
        <p>
          CineBlock’s use of information received from Google APIs adheres to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#60A5FA] underline-offset-4 hover:underline"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
        <p>
          The name, email address and profile picture we receive from Google are used only to sign you in and show your
          profile. They are not sold, not used for advertising, and not shared with anyone except the service providers
          listed below, who store them on our behalf.
        </p>
      </>
    ),
  },
  {
    id: "who-helps",
    title: "Who helps us run CineBlock",
    body: (
      <>
        <p>These providers process data only to provide their service to us:</p>
        <ul className={LIST}>
          <li>
            <strong className="text-white">Convex</strong>: our database and sign-in system, where your account and
            library are stored.
          </li>
          <li>
            <strong className="text-white">Vercel</strong>: hosts the website and provides privacy-friendly page-view
            analytics that use no cookies.
          </li>
          <li>
            <strong className="text-white">Cloudflare</strong>: network delivery and protection for cineblock.in.
          </li>
          <li>
            <strong className="text-white">Google</strong>: sign-in.
          </li>
          <li>
            <strong className="text-white">TMDB</strong>: film and TV information and posters. We send TMDB titles and
            search terms, never your account details.
          </li>
          <li>
            <strong className="text-white">YouTube</strong>: trailers. If you play one, YouTube’s own privacy policy
            applies to that video.
          </li>
        </ul>
        <p>Hosting and network providers keep short-lived request logs, including IP addresses, for security.</p>
      </>
    ),
  },
  {
    id: "your-choices",
    title: "Your choices and your data",
    body: (
      <>
        <ul className={LIST}>
          <li>
            <strong className="text-white">Export</strong> your lists at any time from{" "}
            <Link href="/profile" className="text-[#60A5FA] underline-offset-4 hover:underline">
              Profile
            </Link>
            , under Data &amp; Privacy.
          </li>
          <li>
            <strong className="text-white">Make things private</strong>: stamps and CineBlocks can be public or private.
          </li>
          <li>
            <strong className="text-white">Cut off connected tools</strong>: generating a new Terminal token in your
            Profile stops the old one working. Generating a new AI assistant token does the same and also disconnects
            every assistant you connected by signing in, such as ChatGPT.
          </li>
          <li>
            <strong className="text-white">Delete your account</strong> from your Profile. This permanently removes your
            profile, lists, stamps, CineBlocks (and other people’s saves of them), rooms you own, swipe history, radar,
            connected-tool tokens and sign-in records. It can’t be undone.
          </li>
        </ul>
        <p>
          You can also remove CineBlock’s access to your Google account at any time in your{" "}
          <a
            href="https://myaccount.google.com/connections"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#60A5FA] underline-offset-4 hover:underline"
          >
            Google Account settings
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <p>
        We keep your data while your account exists. When you delete your account it is removed from our database
        straight away; backups held by our providers expire on their normal schedule. Sign-in sessions and connection
        tokens expire on their own when unused.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: <p>CineBlock isn’t meant for children under 13, and we don’t knowingly collect their data.</p>,
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        If we change what we collect or how we use it, we’ll update this page and the date at the top. Significant
        changes will be shown in the app before they take effect.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions or requests about your data:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#60A5FA] underline-offset-4 hover:underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="20 November 2026"
      intro={
        <p>
          CineBlock helps you discover films and shows, keep track of what you’ve watched, and share lists with friends.
          This page explains, in plain words, what we collect, why, and how you stay in control of it.
        </p>
      }
      sections={sections}
      related={{ href: "/terms", label: "Terms of Service" }}
    />
  );
}
