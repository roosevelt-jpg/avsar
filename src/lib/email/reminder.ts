import { renderEmail } from '@/lib/email/template';
import { BRAND } from '@/lib/data/brand';

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
  subject: (firstName: string) => string;
  preheader: string;
  heading: string;
  paragraphs: (firstName: string) => string[];
  actionLabel: string;
};

const COPY: Record<string, Record<Stage, Reminder> & { unsubscribe: string }> = {
  en: {
    unsubscribe: 'Stop these reminders',
    profile: {
      subject: (first) => `${first}, your ${BRAND.name} application is waiting`,
      preheader: 'Nothing is lost. Sign in and carry on from where you stopped.',
      heading: 'Your application is waiting',
      paragraphs: (first) => [
        `Hello ${first},`,
        `You opened an account with ${BRAND.name} and did not finish your application. Nothing is lost: sign in and carry on from where you stopped.`,
      ],
      actionLabel: 'Continue my application',
    },
    assessment: {
      subject: (first) => `${first}, one step left on your ${BRAND.name} application`,
      preheader: 'Your profile is saved. The assessment takes 20 to 30 minutes.',
      heading: 'One step left',
      paragraphs: (first) => [
        `Hello ${first},`,
        'Your profile is saved. The assessment is the only thing left, and it takes 20 to 30 minutes on your phone.',
        'You pay nothing until you have completed it and seen what it found.',
      ],
      actionLabel: 'Take the assessment',
    },
  },
  hi: {
    unsubscribe: 'ये अनुस्मारक बंद करें',
    profile: {
      subject: (first) => `${first}, आपका ${BRAND.name} आवेदन अधूरा है`,
      preheader: 'कुछ भी खोया नहीं है। साइन इन करें और वहीं से आगे बढ़ें।',
      heading: 'आपका आवेदन आपका इंतज़ार कर रहा है',
      paragraphs: (first) => [
        `नमस्ते ${first},`,
        `आपने ${BRAND.name} पर खाता खोला था लेकिन आवेदन पूरा नहीं किया। कुछ भी खोया नहीं है: साइन इन करें और वहीं से आगे बढ़ें जहाँ रुके थे।`,
      ],
      actionLabel: 'आवेदन जारी रखें',
    },
    assessment: {
      subject: (first) => `${first}, आपके ${BRAND.name} आवेदन में एक ही चरण बाकी है`,
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

export function renderReminder(
  row: ReminderRow,
  origin: string,
  unsubscribe: string,
): { subject: string; text: string; html: string } {
  const stage: Stage = row.profile_completed_at ? 'assessment' : 'profile';
  const firstName = row.full_name.split(' ')[0] ?? '';
  const locale = row.locale === 'hi' ? 'hi' : 'en';
  const pack = COPY[locale]!;
  const copy = pack[stage];

  const url = `${origin}/${row.locale}/${stage === 'assessment' ? 'assessment' : 'signup'}`;
  const paragraphs = copy.paragraphs(firstName);

  const text = [
    ...paragraphs,
    '',
    url,
    '',
    `${pack.unsubscribe}: ${unsubscribe}`,
    '',
    BRAND.name,
  ].join('\n');

  return {
    subject: copy.subject(firstName),
    text,
    html: renderEmail({
      preheader: copy.preheader,
      heading: copy.heading,
      paragraphs,
      action: { label: copy.actionLabel, url },
      origin,
      unsubscribe: { label: pack.unsubscribe, url: unsubscribe },
    }),
  };
}

