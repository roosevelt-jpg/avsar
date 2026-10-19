'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Opening the list is what "seen" means. Done from the browser after the page
 * has rendered, so the highlighted "new" rows are the ones that were new when
 * the person arrived, and so a prefetch never clears the bell by itself.
 */
export function MarkNotificationsSeen({ unseen }: { unseen: number }) {
  const router = useRouter();
  useEffect(() => {
    if (unseen === 0) return;
    void fetch('/api/admin/notifications/seen', { method: 'POST' }).then((response) => {
      if (response.ok) router.refresh();
    });
  }, [unseen, router]);
  return null;
}
