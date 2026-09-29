import { redirect } from 'next/navigation';
import { Wordmark } from '@/components/ui/Wordmark';
import { StaffSignInForm } from '@/components/employer/StaffSignInForm';
import { getSessionStaff } from '@/lib/auth';

export const metadata = { title: 'Staff sign-in' };

export default async function StaffSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/admin';

  if (await getSessionStaff()) redirect(target);

  return (
    <div className="avsar-root">
      <header className="flex items-center justify-between gap-4 border-b border-line px-[clamp(20px,4cqi,56px)] py-[18px]">
        <Wordmark href="/employers" accent="employer" />
      </header>
      <main className="px-[clamp(20px,4cqi,56px)] py-[clamp(48px,8cqi,96px)]">
        <StaffSignInForm next={target} />
      </main>
    </div>
  );
}
