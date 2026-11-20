import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for using CineBlock, in plain words.",
  alternates: { canonical: "/terms" },
};

const CONTACT_EMAIL = "pratsprofess@gmail.com";
const LIST = "list-disc space-y-2 pl-5 marker:text-slate-600";
const LINK = "text-[#60A5FA] underline-offset-4 hover:underline";

const sections: readonly LegalSection[] = [
  {
    id: "using-cineblock",
    title: "Using CineBlock",
    body: (
      <>
        <p>
          CineBlock is a free service for discovering films and shows, tracking what you watch, and sharing lists with
          friends. By creating an account or using the site you agree to these terms and to our{" "}
          <Link href="/privacy" className={LINK}>
            Privacy Policy
          </Link>
          .
        </p>
        <p>You need to be at least 13 years old to create an account.</p>
      </>
    ),
  },
  {
    id: "your-account",
    title: "Your account",
    body: (
      <p>
        You sign in with Google. Keep access to your account to yourself, and tell us if you think someone else is using
        it. You can delete your account at any time from your Profile.
      </p>
    ),
  },
  {
    id: "your-content",
    title: "What you post",
    body: (
      <>
        <p>
          Stamps, CineBlocks, usernames and anything else you add stay yours. When you make something public, you let
          CineBlock show it to other people and on share links, for as long as it stays public. Making it private or
          deleting it ends that.
        </p>
        <p>You’re responsible for what you post. Don’t post anything that:</p>
        <ul className={LIST}>
          <li>is illegal, hateful, harassing or sexually explicit;</li>
          <li>shares someone else’s private information;</li>
          <li>infringes someone else’s copyright or other rights;</li>
          <li>is spam or misleading.</li>
        </ul>
        <p>We may remove content that breaks these rules.</p>
      </>
    ),
  },
  {
    id: "fair-use",
    title: "Fair use",
    body: (
      <>
        <p>Please don’t:</p>
        <ul className={LIST}>
          <li>try to get around limits such as daily swipe or search allowances;</li>
          <li>scrape CineBlock or use it to build a competing database;</li>
          <li>attack, overload or probe the service, or access other people’s accounts;</li>
          <li>use automation except through the CineBlock Terminal and AI assistant connections we provide.</li>
        </ul>
      </>
    ),
  },
  {
    id: "connected-tools",
    title: "Terminal and AI assistants",
    body: (
      <>
        <p>
          Your CineBlock Terminal token and AI assistant connections act on your behalf. Keep tokens secret, and
          generate a new one in your Profile if one leaks.
        </p>
        <p>
          An AI assistant only changes your library after showing you a preview that you approve. You’re responsible for
          the changes you approve, and AI assistants can make mistakes, so check what they suggest.
        </p>
      </>
    ),
  },
  {
    id: "film-data",
    title: "Film data and other services",
    body: (
      <>
        <p>
          Film and TV information and images come from{" "}
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className={LINK}>
            TMDB
          </a>
          . This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability is provided by
          JustWatch through TMDB. Trailers are played from YouTube.
        </p>
        <p>
          We do our best to keep this information accurate, but it comes from third parties and may be incomplete or out
          of date. Posters, titles and trailers belong to their respective owners.
        </p>
      </>
    ),
  },
  {
    id: "no-warranty",
    title: "No guarantees",
    body: (
      <p>
        CineBlock is provided as it is, without warranties of any kind. We work to keep it running and your data safe,
        but we can’t promise it will always be available or free of errors, so keep your own export of anything you
        can’t lose. To the extent the law allows, we aren’t liable for indirect losses or for losses caused by using or
        not being able to use the service.
      </p>
    ),
  },
  {
    id: "changes-and-ending",
    title: "Changes and ending",
    body: (
      <p>
        We may change or stop features, and update these terms. If a change is significant, we’ll tell you in the app
        before it takes effect; continuing to use CineBlock after that means you accept it. We may suspend accounts that
        break these terms. You can stop using CineBlock and delete your account whenever you like.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about these terms:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className={LINK}>
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="20 November 2026"
      intro={<p>The rules for using CineBlock, kept short and in plain words.</p>}
      sections={sections}
      related={{ href: "/privacy", label: "Privacy Policy" }}
    />
  );
}
