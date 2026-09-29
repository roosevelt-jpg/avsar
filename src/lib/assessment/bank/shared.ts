import type { Item } from '../items';

/**
 * Items that apply to every sector: experience, English and profile.
 *
 * English here measures workplace comprehension, not language proficiency in
 * the certificated sense. See `docs/english-assessment.md` for why the CEFR
 * level on a report has to come from a recognised provider and not from these.
 */

export const EXPERIENCE_ITEMS: Item[] = [
  {
    id: 'exp-01',
    section: 'experience',
    label: 'EXPERIENCE · ROLE HISTORY',
    prompt: 'In your most recent job, how many people did you work with on a typical shift?',
    options: ['I worked alone', '2 to 4 people', '5 to 10 people', 'More than 10 people'],
    axis: 'Experience depth',
  },
  {
    id: 'exp-02',
    section: 'experience',
    label: 'EXPERIENCE · RESPONSIBILITY',
    prompt: 'Have you been responsible for training or supervising other staff?',
    options: ['No', 'Informally, when asked', 'Yes, as part of my role', 'Yes, I managed a team'],
    axis: 'Experience depth',
  },
  {
    id: 'exp-03',
    section: 'experience',
    label: 'EXPERIENCE · TENURE',
    prompt: 'How long did you stay in your longest job?',
    options: ['Less than 6 months', '6 months to 2 years', '2 to 5 years', 'More than 5 years'],
    axis: 'Experience depth',
  },
  {
    id: 'exp-04',
    section: 'experience',
    label: 'EXPERIENCE · TRUST',
    prompt: 'Have you been trusted with any of these at work?',
    options: [
      'None of these',
      'Keys or access to premises',
      'Cash or payments',
      'Both keys and money',
    ],
    axis: 'Experience depth',
  },
  {
    id: 'exp-05',
    section: 'experience',
    label: 'EXPERIENCE · SHIFTS',
    prompt: 'Which shift patterns have you worked?',
    options: ['Days only', 'Days and evenings', 'Including nights', 'Rotating, including weekends'],
    axis: 'Experience depth',
  },
  {
    id: 'exp-06',
    section: 'experience',
    label: 'EXPERIENCE · ABROAD',
    prompt: 'Have you worked outside your home state or country?',
    options: ['No', 'Another state in India', 'Another country, under 1 year', 'Another country, over 1 year'],
    axis: 'Experience depth',
  },
  {
    id: 'exp-07',
    section: 'experience',
    label: 'EXPERIENCE · REFERENCES',
    prompt: 'Could a former supervisor be contacted about your work?',
    options: ['No', 'Perhaps, I would have to ask', 'Yes, one', 'Yes, more than one'],
    axis: 'Experience depth',
  },
  {
    id: 'exp-08',
    section: 'experience',
    label: 'EXPERIENCE · RECORDS',
    prompt: 'Do you have documents showing your work history?',
    options: [
      'No documents',
      'Some payslips or letters',
      'Employment letters for most jobs',
      'Full records, including contracts',
    ],
    axis: 'Documentation',
  },
];

export const ENGLISH_ITEMS: Item[] = [
  {
    id: 'eng-read-01',
    section: 'english',
    label: 'ENGLISH · READING',
    passage:
      'Message from a guest: "Our flight lands at 23:40. Please keep our room and leave the key at reception."',
    prompt: 'What should the reception team do?',
    options: [
      'Cancel the booking',
      'Hold the room for a late arrival',
      'Move the guest to another hotel',
      'Charge a no-show fee',
    ],
    correct: 1,
    axis: 'English: reading',
  },
  {
    id: 'eng-gram-01',
    section: 'english',
    label: 'ENGLISH · GRAMMAR',
    prompt: 'Choose the correct sentence.',
    options: [
      'I have worked here since 2021.',
      'I am working here since 2021.',
      'I work here since 2021.',
      'I worked here since 2021 year.',
    ],
    correct: 0,
    axis: 'English: grammar',
  },
  {
    id: 'eng-work-01',
    section: 'english',
    label: 'ENGLISH · WORKPLACE',
    prompt: 'A guest reports a leaking tap at 22:00. What do you do first?',
    options: [
      'Tell them to wait until morning',
      'Log it and inform the maintenance person on duty',
      'Fix it yourself without telling anyone',
      'Ignore it if the guest leaves tomorrow',
    ],
    correct: 1,
    axis: 'English: workplace',
  },
  {
    id: 'eng-read-02',
    section: 'english',
    label: 'ENGLISH · READING',
    passage:
      'Notice in the staff room: "From Monday, anyone finishing after 22:00 must sign out at the security desk before leaving the building."',
    prompt: 'Who has to sign out at the security desk?',
    options: [
      'Everyone, every day',
      'Only staff who finish after 22:00',
      'Only security staff',
      'Nobody, it is optional',
    ],
    correct: 1,
    axis: 'English: reading',
  },
  {
    id: 'eng-read-03',
    section: 'english',
    label: 'ENGLISH · READING',
    passage:
      'Email from a supervisor: "I will be away on Thursday. If anything urgent comes up, speak to Marta rather than waiting for me."',
    prompt: 'What should you do about an urgent problem on Thursday?',
    options: [
      'Wait until the supervisor returns',
      'Speak to Marta',
      'Handle it alone and say nothing',
      'Send an email and wait for a reply',
    ],
    correct: 1,
    axis: 'English: reading',
  },
  {
    id: 'eng-gram-02',
    section: 'english',
    label: 'ENGLISH · GRAMMAR',
    prompt: 'Choose the correct sentence.',
    options: [
      'The room was cleaned yesterday by me.',
      'The room is cleaned yesterday by me.',
      'The room has cleaned yesterday.',
      'The room were cleaned yesterday.',
    ],
    correct: 0,
    axis: 'English: grammar',
  },
  {
    id: 'eng-gram-03',
    section: 'english',
    label: 'ENGLISH · GRAMMAR',
    prompt: 'Which question is correct?',
    options: [
      'How long you are working here?',
      'How long are you working here since?',
      'How long have you worked here?',
      'How long you work here?',
    ],
    correct: 2,
    axis: 'English: grammar',
  },
  {
    id: 'eng-work-02',
    section: 'english',
    label: 'ENGLISH · WORKPLACE',
    prompt: 'A colleague says: "Can you cover for me? I am running late." What are they asking?',
    options: [
      'To finish their shift early',
      'To do their work until they arrive',
      'To pay for something',
      'To tell the manager they are absent',
    ],
    correct: 1,
    axis: 'English: workplace',
  },
  {
    id: 'eng-work-03',
    section: 'english',
    label: 'ENGLISH · WORKPLACE',
    prompt: 'Your supervisor says the work is "not up to standard". What does that mean?',
    options: [
      'It was finished too quickly',
      'It is not good enough and needs redoing',
      'It was done by someone else',
      'It is better than expected',
    ],
    correct: 1,
    axis: 'English: workplace',
  },
  {
    id: 'eng-work-04',
    section: 'english',
    label: 'ENGLISH · WORKPLACE',
    prompt: 'You do not understand an instruction from a manager. What is best?',
    options: [
      'Nod and work it out later',
      'Ask them to repeat or explain it',
      'Ask a colleague afterwards instead',
      'Do what you think they meant',
    ],
    correct: 1,
    axis: 'English: workplace',
  },
];

export const PROFILE_ITEMS: Item[] = [
  {
    id: 'pro-01',
    section: 'profile',
    label: 'PROFILE · AVAILABILITY',
    prompt: 'How soon could you start a job abroad?',
    options: ['Within 1 month', '1 to 3 months', '3 to 6 months', 'More than 6 months'],
  },
  {
    id: 'pro-02',
    section: 'profile',
    label: 'PROFILE · MOBILITY',
    prompt: 'Would you accept shared staff accommodation?',
    options: ['Yes', 'Yes, if I have my own room', 'Only for the first months', 'No'],
  },
  {
    id: 'pro-03',
    section: 'profile',
    label: 'PROFILE · DOCUMENTS',
    prompt: 'What is the state of your passport?',
    options: [
      'I have one, valid over 2 years',
      'I have one, expiring within 2 years',
      'I have applied for one',
      'I have not applied yet',
    ],
  },
  {
    id: 'pro-04',
    section: 'profile',
    label: 'PROFILE · FAMILY',
    prompt: 'Would you be travelling alone at first?',
    options: [
      'Yes, alone',
      'Alone first, family later',
      'With my partner',
      'With my whole family',
    ],
  },
  {
    id: 'pro-05',
    section: 'profile',
    label: 'PROFILE · LANGUAGE',
    prompt: 'Would you be willing to learn basic Portuguese before arriving?',
    options: ['Yes, I have already started', 'Yes', 'If it is provided', 'I would rather not'],
  },
];
