import Link from 'next/link';
import { notFound } from 'next/navigation';
import { privateMetadata } from '@/lib/seo';
import { DashboardNav } from '@/components/candidate/DashboardNav';
import { requireCandidate } from '@/lib/auth';
import { getSiteSettings } from '@/lib/cms/data';
import { isLocale, localePath } from '@/lib/i18n';
import { listSavedJobs } from '@/lib/jobs/saved';
import { getServerSupabase } from '@/lib/supabase/server';

export const metadata = privateMetadata('Messages');

type ThreadRow = {
  id: string;
  visitor_label: string;
  mode: string;
  last_message_at: string;
  needs_human: boolean;
};

/**
 * Candidate Messages workspace. Lists threads owned by this candidate
 * (migration 0042). New chats still open through the site WhatsApp desk.
 */
export default async function MessagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const candidate = await requireCandidate(locale, localePath(locale, '/dashboard/messages'));
  const supabase = await getServerSupabase();
  const [settings, savedJobs, threadsRes] = await Promise.all([
    getSiteSettings(),
    listSavedJobs(candidate.id),
    supabase
      ?.from('chat_threads')
      .select('id, visitor_label, mode, last_message_at, needs_human')
      .eq('candidate_id', candidate.id)
      .order('last_message_at', { ascending: false })
      .limit(50) ?? Promise.resolve({ data: [] as ThreadRow[] }),
  ]);

  const threads = ((threadsRes?.data ?? []) as ThreadRow[]) ?? [];

  return (
    <DashboardNav
      locale={locale}
      current="messages"
      candidate={{ fullName: candidate.fullName, emailConfirmed: candidate.emailConfirmed }}
      savedCount={savedJobs.length}
      whatsapp={settings.general.whatsapp}
    >
      <div className="mx-auto w-full max-w-[960px]">
        <div className="sa-workheading">
          <div>
            <p className="m-0 text-[12px] font-semibold tracking-[0.12em] text-[#b28a49] uppercase">Messages</p>
            <h1 className="m-0 mt-2 text-[29px] font-extrabold text-[#142438]">Your conversations</h1>
          </div>
        </div>
        <p className="m-0 mb-6 max-w-[62ch] text-[15px] text-[#5c7084]">
          Threads with our recruitment desk. Use the WhatsApp button on any page to start a new chat.
        </p>

        {threads.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#dfe6ee] bg-white px-6 py-14 text-center">
            <p className="m-0 text-[18px] font-semibold text-[#142438]">No messages yet.</p>
            <p className="m-0 mt-2 text-[15px] text-[#5c7084]">
              Open the chat desk from the header, or WhatsApp us if something on an application looks wrong.
            </p>
            <Link
              href={localePath(locale, '/dashboard/applications')}
              className="mt-6 inline-flex rounded-[5px] bg-[#142438] px-5 py-3 text-[14px] font-semibold text-white no-underline"
            >
              View applications
            </Link>
          </div>
        ) : (
          <div className="sa-tablewrap">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="bg-[#f8fafc] px-4 py-3 text-left text-[12px] font-semibold text-[#526477]">Conversation</th>
                  <th className="bg-[#f8fafc] px-4 py-3 text-left text-[12px] font-semibold text-[#526477]">Status</th>
                  <th className="bg-[#f8fafc] px-4 py-3 text-left text-[12px] font-semibold text-[#526477]">Last update</th>
                </tr>
              </thead>
              <tbody>
                {threads.map((thread) => (
                  <tr key={thread.id} className="border-t border-[#e9edf2]">
                    <td className="px-4 py-3 font-semibold text-[#142438]">
                      {thread.visitor_label || 'Recruitment desk'}
                    </td>
                    <td className="px-4 py-3 text-[#5c7084]">
                      {thread.needs_human ? 'Waiting for staff' : thread.mode}
                    </td>
                    <td className="px-4 py-3 text-[#5c7084]">
                      {new Date(thread.last_message_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardNav>
  );
}
