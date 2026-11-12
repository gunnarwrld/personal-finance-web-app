import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks';

const LAST_UPDATED = '12 November 2026';
const REPO_URL = 'https://github.com/gunnarwrld/personal-finance-web-app';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
    <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">{children}</div>
  </section>
);

const ExternalLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-primary-600 dark:text-primary-400 underline"
  >
    {children}
  </a>
);

/**
 * Public privacy notice, readable signed in or out. Keep it in step with
 * what the app actually does: if a feature starts sending data somewhere
 * new, update this page and LAST_UPDATED in the same change.
 */
export const PrivacyPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const backTo = isAuthenticated ? '/settings' : '/auth';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8 md:py-12">
      <article className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 md:p-10 space-y-8">
        <div>
          <Link
            to={backTo}
            className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:underline mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {isAuthenticated ? 'Back to Settings' : 'Back to sign in'}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy notice</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Last updated {LAST_UPDATED}</p>
        </div>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          FinanceTracker is a free, open-source personal finance tracker run as a personal project, not
          by a company. You type in your own accounts and transactions; it does not connect to your bank.
          This page explains, in plain words, what it stores, where, and who else sees any of it. The
          source code is public on{' '}
          <ExternalLink href={REPO_URL}>GitHub</ExternalLink>, so you can check every claim here.
        </p>

        <Section title="What is stored">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Your sign-in details:</strong> your email address, and if you sign in with Google
              or Apple, the name and profile picture they share.
            </li>
            <li>
              <strong>What you enter:</strong> accounts and balances, transactions (date, description,
              category, amount, currency), transfers, budgets, bill reminders, recurring transactions
              and the notifications the app creates from them.
            </li>
            <li>
              <strong>Your settings:</strong> display currency, notification choices and whether AI
              insights are on.
            </li>
          </ul>
        </Section>

        <Section title="Where it is stored">
          <p>
            Everything above is stored in a{' '}
            <ExternalLink href="https://supabase.com/privacy">Supabase</ExternalLink> database hosted in
            the EU (AWS, Ireland). Database rules let each signed-in user read and change only their
            own rows.
          </p>
          <p>
            The website itself is served by{' '}
            <ExternalLink href="https://vercel.com/legal/privacy-policy">Vercel</ExternalLink>. Like any
            web host, Vercel and Supabase keep standard request logs (such as IP address and browser
            type) to run and protect their services.
          </p>
          <p>
            In your browser, the app keeps your sign-in session and a few display choices in local
            storage, and its offline cache keeps copies of your data for up to 24 hours. The cache is
            cleared when you sign out or switch accounts.
          </p>
        </Section>

        <Section title="AI insights and Groq">
          <p>
            AI insights are optional and run only when you click an AI action, such as{' '}
            <em>Analyze Spending</em> on the dashboard or <em>Ask AI</em> on the Analytics page. Nothing
            is sent in the background.
          </p>
          <p>When you click one, the app sends a text prompt to{' '}
            <ExternalLink href="https://groq.com/privacy-policy">Groq</ExternalLink>, an AI provider,
            through FinanceTracker's own server. Depending on the action, the prompt contains:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              a list of transactions with only their date, description, category, type (income or
              expense) and amount converted to your display currency; or
            </li>
            <li>totals: income, expenses and savings, or spending per category; and</li>
            <li>any goal or question you type into the AI box.</li>
          </ul>
          <p>
            The prompt does not include your name, email, user ID, account names or balances. Groq
            handles it under its own terms; FinanceTracker does not store the prompt or the answer.
            Transaction descriptions are sent as you wrote them, so leave personal details out of them
            if that matters to you.
          </p>
          <p>
            AI insights are on by default. You can turn them off at any time in{' '}
            <strong>Settings → Privacy</strong>. When they are off, the AI features are hidden and the
            server refuses AI requests for your account.
          </p>
        </Section>

        <Section title="Other services">
          <p>
            Exchange rates come from the free{' '}
            <ExternalLink href="https://frankfurter.dev">Frankfurter</ExternalLink> API (European
            Central Bank data). The server fetches them; none of your data is sent.
          </p>
          <p>
            If you choose <em>Sign in with Google</em> or <em>Sign in with Apple</em>, that provider
            handles the sign-in under its own privacy policy.
          </p>
        </Section>

        <Section title="What FinanceTracker does not do">
          <ul className="list-disc pl-6 space-y-2">
            <li>No payments: the app is free and takes no card details.</li>
            <li>No ads, no analytics and no tracking scripts or cookies.</li>
            <li>Your data is never sold or shared, apart from the services named on this page.</li>
          </ul>
        </Section>

        <Section title="Deleting your data">
          <p>
            Go to <strong>Settings → Delete Account</strong> and confirm. Your account and everything
            you stored are deleted immediately and you are signed out. This cannot be undone.
          </p>
          <p>
            You can also delete single items (transactions, accounts, budgets and so on) at any time.
            Deleted data may remain in the hosting provider's backups for a short period until those
            backups expire.
          </p>
        </Section>

        <Section title="Changes and questions">
          <p>
            If this notice changes, the date at the top changes too, and every edit is visible in the
            project's history on GitHub. For questions, open an issue on the{' '}
            <ExternalLink href={`${REPO_URL}/issues`}>GitHub repository</ExternalLink>. Issues are
            public, so don't include personal or financial details there.
          </p>
        </Section>
      </article>
    </div>
  );
};
