import { localePath } from '@/lib/i18n';
import { renderEmail } from '@/lib/email/template';
import { getSiteSettings } from '@/lib/cms/data';
import { composeEmail, emailBrand } from '@/lib/email/compose';

/** Only what the message needs, so the preview can build one by hand. */
export type ReminderRow = {
  full_name: string;
  locale: string;
  profile_completed_at: string | null;
};

/**
 * What is actually left to do, which is not what it used to be.
 *
 * The fee moved to the end of the flow, so somebody with a finished profile is
 * no longer somebody who owes money: they are somebody who has not sat the
 * assessment. This copy said "you have not completed the assessment fee yet"
 * for a while after that change, which asked for payment from people who had
 * nothing to pay for.
 */
type Stage = 'profile' | 'assessment';

type Reminder = {
  subject: (firstName: string, brand: string) => string;
  preheader: string;
  heading: string;
  paragraphs: (firstName: string, brand: string) => string[];
  actionLabel: string;
};

/* English comes from Settings › Emails. Hindi is a translation kept in code
   with the rest of the interface wording. */
const COPY: Record<string, Record<Stage, Reminder> & { unsubscribe: string }> = {
  hi: {
    unsubscribe: 'ये अनुस्मारक बंद करें',
    profile: {
      subject: (first, brand) => `${first}, आपका ${brand} आवेदन अधूरा है`,
      preheader: 'कुछ भी खोया नहीं है। साइन इन करें और वहीं से आगे बढ़ें।',
      heading: 'आपका आवेदन आपका इंतज़ार कर रहा है',
      paragraphs: (first, brand) => [
        `नमस्ते ${first},`,
        `आपने ${brand} पर खाता खोला था लेकिन आवेदन पूरा नहीं किया। कुछ भी खोया नहीं है: साइन इन करें और वहीं से आगे बढ़ें जहाँ रुके थे।`,
      ],
      actionLabel: 'आवेदन जारी रखें',
    },
    assessment: {
      subject: (first, brand) => `${first}, आपके ${brand} आवेदन में एक ही चरण बाकी है`,
      preheader: 'आपकी प्रोफ़ाइल सुरक्षित है। मूल्यांकन में 20 से 30 मिनट लगते हैं।',
      heading: 'बस एक चरण बाकी है',
      paragraphs: (first) => [
        `नमस्ते ${first},`,
        'आपकी प्रोफ़ाइल सुरक्षित है। अब सिर्फ़ मूल्यांकन बाकी है, जिसमें आपके फ़ोन पर 20 से 30 मिनट लगते हैं।',
        'जब तक आप इसे पूरा करके परिणाम नहीं देख लेते, तब तक आपको कुछ भी नहीं देना है।',
      ],
      actionLabel: 'मूल्यांकन शुरू करें',
    },
  },
};

export async function renderReminder(
  row: ReminderRow,
  origin: string,
  unsubscribe: string,
): Promise<{ subject: string; text: string; html: string }> {
  const stage: Stage = row.profile_completed_at ? 'assessment' : 'profile';
  const firstName = row.full_name.split(' ')[0] ?? '';
  const url = `${origin}${localePath(row.locale, `/${stage === 'assessment' ? 'assessment' : 'signup'}`)}`;

  if (row.locale !== 'hi') {
    return composeEmail(stage === 'assessment' ? 'reminder_assessment' : 'reminder_profile', { first_name: firstName }, {
      origin,
      actionUrl: url,
      unsubscribe: { label: 'Stop these reminders', url: unsubscribe },
    });
  }

  const settings = await getSiteSettings();
  const brand = settings.general.siteName;
  const pack = COPY.hi!;
  const copy = pack[stage];
  const paragraphs = copy.paragraphs(firstName, brand);

  const text = [...paragraphs, '', url, '', `${pack.unsubscribe}: ${unsubscribe}`, '', brand].join('\n');

  return {
    subject: copy.subject(firstName, brand),
    text,
    html: renderEmail({
      preheader: copy.preheader,
      heading: copy.heading,
      paragraphs,
      action: { label: copy.actionLabel, url },
      origin,
      unsubscribe: { label: pack.unsubscribe, url: unsubscribe },
      brand: emailBrand(settings),
    }),
  };
}