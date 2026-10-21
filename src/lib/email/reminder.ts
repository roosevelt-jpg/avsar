import { localePath } from '@/lib/i18n';
import { renderEmail } from '@/lib/email/template';
import { getSiteSettings } from '@/lib/cms/data';
import { composeEmail, emailBrand } from '@/lib/email/compose';
import { formatProductFee } from '@/lib/company/config';

/** Only what the message needs, so the preview can build one by hand. */
export type ReminderRow = {
  full_name: string;
  locale: string;
  profile_completed_at: string | null;
  /** True when every assessment section is done (or a report exists). */
  assessment_complete: boolean;
};

/**
 * What is actually left to do.
 *
 * Order: finish profile → finish assessment → optional package. Someone who
 * already finished the test must never get "take the assessment" again.
 */
export type ReminderStage = 'profile' | 'assessment' | 'package';

export function reminderStage(row: Pick<ReminderRow, 'profile_completed_at' | 'assessment_complete'>): ReminderStage {
  if (row.assessment_complete) return 'package';
  if (row.profile_completed_at) return 'assessment';
  return 'profile';
}

type Reminder = {
  subject: (firstName: string, brand: string) => string;
  preheader: string;
  heading: string;
  paragraphs: (firstName: string, brand: string, price: string) => string[];
  actionLabel: string;
};

/* English comes from Settings › Emails. Hindi is a translation kept in code
   with the rest of the interface wording. */
const COPY: Record<string, Record<ReminderStage, Reminder> & { unsubscribe: string }> = {
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
      preheader: 'आपकी प्रोफ़ाइल सुरक्षित है। मूल्यांकन मुफ़्त है।',
      heading: 'बस एक चरण बाकी है',
      paragraphs: (first) => [
        `नमस्ते ${first},`,
        'आपकी प्रोफ़ाइल सुरक्षित है। अब सिर्फ़ मूल्यांकन बाकी है, जिसे आप अपने फ़ोन पर मुफ़्त में पूरा कर सकते हैं।',
        'मूल्यांकन पूरा करने पर आप हमारे उम्मीदवार डेटाबेस में जुड़ जाते हैं।',
      ],
      actionLabel: 'मूल्यांकन शुरू करें',
    },
    package: {
      subject: (first) => `${first}, आपका करियर पैकेज अभी भी उपलब्ध है`,
      preheader: 'मूल्यांकन पूरा हो चुका है। पैकेज वैकल्पिक है।',
      heading: 'आपका मूल्यांकन पूरा हो चुका है',
      paragraphs: (first, _brand, price) => [
        `नमस्ते ${first},`,
        `आपने मुफ़्त मूल्यांकन पूरा कर लिया है और आप हमारे उम्मीदवार डेटाबेस में हैं। वैकल्पिक करियर पैकेज (${price}) में लिखित रिपोर्ट, CV, प्रारंभिक कानूनी दस्तावेज़ जाँच और करियर सुझाव शामिल हैं।`,
        'यह शॉर्टलिस्ट की संभावना नहीं बदलता और नौकरी या वीज़ा की गारंटी नहीं देता।',
      ],
      actionLabel: 'पैकेज देखें',
    },
  },
};

const ACTION_PATH: Record<ReminderStage, string> = {
  profile: '/signup',
  assessment: '/assessment',
  package: '/dashboard#package',
};

const TEMPLATE_ID = {
  profile: 'reminder_profile',
  assessment: 'reminder_assessment',
  package: 'reminder_package',
} as const;

export async function renderReminder(
  row: ReminderRow,
  origin: string,
  unsubscribe: string,
): Promise<{ subject: string; text: string; html: string }> {
  const stage = reminderStage(row);
  const firstName = row.full_name.split(' ')[0] ?? '';
  const settings = await getSiteSettings();
  const price = formatProductFee(settings.pricing, 'bundle');
  const url = `${origin}${localePath(row.locale, ACTION_PATH[stage])}`;

  if (row.locale !== 'hi') {
    return composeEmail(TEMPLATE_ID[stage], { first_name: firstName, price }, {
      origin,
      actionUrl: url,
      unsubscribe: { label: 'Stop these reminders', url: unsubscribe },
    });
  }

  const brand = settings.general.siteName;
  const pack = COPY.hi!;
  const copy = pack[stage];
  const paragraphs = copy.paragraphs(firstName, brand, price);
  const subject = copy.subject(firstName, brand);

  const text = [
    ...paragraphs,
    `${copy.actionLabel}: ${url}`,
    `${pack.unsubscribe}: ${unsubscribe}`,
    brand,
  ].join('\n\n');

  return {
    subject,
    text,
    html: renderEmail({
      preheader: copy.preheader,
      heading: copy.heading,
      paragraphs,
      action: { label: copy.actionLabel, url },
      unsubscribe: { label: pack.unsubscribe, url: unsubscribe },
      origin,
      brand: emailBrand(settings),
    }),
  };
}
