import type { Item } from '../items';

/**
 * Skills items, per sector.
 *
 * Written to be answerable by someone who has done the work and not by someone
 * who has only read about it. Where a question has no single right answer, it
 * carries no `correct` and is scored as profile information instead.
 *
 * These are uncalibrated. Difficulty and discrimination come from watching real
 * responses, and until that happens a score is a rough ordering, not a measure.
 * See `docs/assessment.md`.
 */

export const HOSPITALITY_ITEMS: Item[] = [
  /*
    What is left of the old shared bank: the items both a cook and a waiter
    need. The six housekeeping items that used to sit here moved to the
    cleaning bank, where there is a position that actually does that work, and
    two went entirely. The role-specific sets live in `food-beverage.ts`.
  */
  {
    id: 'hosp-05', section: 'skills', sector: 'hospitality', axis: 'Food safety',
    label: 'SKILLS · FOOD SAFETY',
    prompt: 'Cooked food is left out at room temperature. After how long should it not be served?',
    options: ['30 minutes', '2 hours', '6 hours', 'It is fine all day if it looks good'],
    correct: 1,
  },
  {
    id: 'hosp-06', section: 'skills', sector: 'hospitality', axis: 'Food safety',
    label: 'SKILLS · FOOD SAFETY',
    prompt: 'Raw meat should be stored where in a fridge?',
    options: ['Top shelf', 'Middle shelf', 'Bottom shelf', 'Anywhere, if it is wrapped'],
    correct: 2,
  },
  {
    id: 'hosp-09', section: 'skills', sector: 'hospitality', axis: 'Allergens',
    label: 'SKILLS · ALLERGENS',
    prompt: 'A guest says they are allergic to nuts. What must you do?',
    options: ['Tell them most dishes are fine', 'Check with the kitchen before serving anything', 'Remove visible nuts from the dish', 'Suggest they order something simple'],
    correct: 1,
  },
  {
    id: 'hosp-12', section: 'skills', sector: 'hospitality', axis: 'Health and safety',
    label: 'SKILLS · FIRE',
    prompt: 'The fire alarm sounds during service. What do you do?',
    options: ['Finish what you are doing first', 'Leave by the nearest exit and report to the assembly point', 'Look for the fire', 'Wait for a supervisor to tell you'],
    correct: 1,
  },
  {
    id: 'hosp-04', section: 'skills', sector: 'hospitality', positions: ['fb-service'],
    axis: 'Guest service', label: 'SKILLS · GUEST SERVICE',
    prompt: 'A guest asks for something you are not allowed to give. What is best?',
    options: ['Say no and walk away', 'Explain what you can offer instead', 'Say yes and hope nobody notices', 'Pretend not to understand'],
    correct: 1,
  },
  {
    id: 'hosp-08', section: 'skills', sector: 'hospitality', positions: ['fb-service'],
    axis: 'Guest service', label: 'SKILLS · COMPLAINTS',
    prompt: 'A guest is shouting at you about a problem you did not cause. What is best?',
    options: ['Explain it was not your fault', 'Listen, apologise for the situation, and get help', 'Walk away until they calm down', 'Shout back so they take you seriously'],
    correct: 1,
  },
];

export const PROPERTY_ITEMS: Item[] = [
  {
    id: 'prop-01', section: 'skills', sector: 'property-management', axis: 'Tenant coordination',
    label: 'SKILLS · ACCESS',
    prompt: 'A contractor arrives to work in a flat but the tenant is out. What do you do?',
    options: ['Let them in and leave', 'Check the access was agreed with the tenant first', 'Send them away', 'Let them in and wait outside'],
    correct: 1,
  },
  {
    id: 'prop-02', section: 'skills', sector: 'property-management', axis: 'Record keeping',
    label: 'SKILLS · KEYS',
    prompt: 'A key is returned late by a contractor. What matters most?',
    options: ['That it was returned', 'That the return is logged with time and name', 'That nobody noticed', 'That the contractor apologised'],
    correct: 1,
  },
  {
    id: 'prop-03', section: 'skills', sector: 'property-management', axis: 'Tenant coordination',
    label: 'SKILLS · COMPLAINTS',
    prompt: 'A tenant reports noise from a neighbouring flat at 01:00. What is best?',
    options: ['Tell them to call the police', 'Log it, acknowledge it, and follow the building procedure', 'Knock on the neighbour’s door yourself', 'Ignore it until morning'],
    correct: 1,
  },
  {
    id: 'prop-04', section: 'skills', sector: 'property-management', axis: 'Record keeping',
    label: 'SKILLS · INVENTORY',
    prompt: 'When is a property inventory most useful?',
    options: ['At the end of a tenancy only', 'At the start, with photographs and dates', 'When damage is found', 'Once a year'],
    correct: 1,
  },
  {
    id: 'prop-05', section: 'skills', sector: 'property-management', axis: 'Health and safety',
    label: 'SKILLS · SAFETY',
    prompt: 'You smell gas in a common area. What do you do first?',
    options: ['Look for the source', 'Turn on a light to see better', 'Evacuate, ventilate, and call the emergency number', 'Report it in the next weekly summary'],
    correct: 2,
  },
  {
    id: 'prop-06', section: 'skills', sector: 'property-management', axis: 'Tenant coordination',
    label: 'SKILLS · TURNOVER',
    prompt: 'A flat must be ready for new arrivals in four hours. What comes first?',
    options: ['Deep clean everything', 'Check that services work: water, power, heating, keys', 'Replace the furniture', 'Wait for the cleaner'],
    correct: 1,
  },
  {
    id: 'prop-07', section: 'skills', sector: 'property-management', axis: 'Record keeping',
    label: 'SKILLS · MAINTENANCE',
    prompt: 'Which maintenance issue should be escalated immediately rather than scheduled?',
    options: ['A dripping tap', 'A loose cupboard door', 'Water coming through a ceiling', 'A stained carpet'],
    correct: 2,
  },
  {
    id: 'prop-08', section: 'skills', sector: 'property-management', axis: 'Tenant coordination',
    label: 'SKILLS · DEPOSITS',
    prompt: 'A tenant disputes a deduction for damage. What settles it?',
    options: ['The landlord’s word', 'Dated photographs and the signed inventory', 'How long they lived there', 'Whether they paid rent on time'],
    correct: 1,
  },
];

export const CLEANING_ITEMS: Item[] = [
  {
    id: 'clean-01', section: 'skills', sector: 'cleaning', axis: 'Method and chemicals',
    label: 'SKILLS · CHEMICALS',
    prompt: 'You find a chemical bottle with no label. What is correct?',
    options: ['Use it only for floors', 'Pour it away in the sink', 'Do not use it and report it', 'Mix it with water to make it safer'],
    correct: 2,
  },
  {
    id: 'clean-02', section: 'skills', sector: 'cleaning', axis: 'Method and chemicals',
    label: 'SKILLS · CHEMICALS',
    prompt: 'Why must bleach never be mixed with ammonia-based cleaners?',
    options: ['It stains surfaces', 'It produces a toxic gas', 'It stops working', 'It costs more'],
    correct: 1,
  },
  {
    id: 'clean-03', section: 'skills', sector: 'cleaning', axis: 'Health and safety',
    label: 'SKILLS · SAFETY',
    prompt: 'A wet floor sign is missing after you mop a corridor. What do you do?',
    options: ['Carry on, it dries quickly', 'Stop and get a sign before leaving', 'Warn the next person you see', 'Mop again more lightly'],
    correct: 1,
  },
  {
    id: 'clean-04', section: 'skills', sector: 'cleaning', axis: 'Method and chemicals',
    label: 'SKILLS · CROSS-CONTAMINATION',
    prompt: 'Colour-coded cloths are used in professional cleaning to prevent what?',
    options: ['Fading', 'Moving germs between areas such as toilets and kitchens', 'Theft', 'Confusion about who owns them'],
    correct: 1,
  },
  {
    id: 'clean-05', section: 'skills', sector: 'cleaning', axis: 'Working unsupervised',
    label: 'SKILLS · AUTONOMY',
    prompt: 'You finish your checklist early and nobody is there to ask. What is best?',
    options: ['Leave early', 'Sit and wait for the end of the shift', 'Do a second pass on high-touch areas and note what you did', 'Start a task nobody asked for in another area'],
    correct: 2,
  },
  {
    id: 'clean-06', section: 'skills', sector: 'cleaning', axis: 'Method and chemicals',
    label: 'SKILLS · METHOD',
    prompt: 'In what order should a room be cleaned?',
    options: ['Bottom to top', 'Top to bottom', 'Middle outwards', 'It does not matter'],
    correct: 1,
  },
  {
    id: 'clean-07', section: 'skills', sector: 'cleaning', axis: 'Health and safety',
    label: 'SKILLS · SHARPS',
    prompt: 'You find a used needle in a bin bag. What do you do?',
    options: ['Take it out carefully by hand', 'Stop, do not handle it, and report it', 'Tie the bag and carry on', 'Put it in the sharps bin with your fingers'],
    correct: 1,
  },
  {
    id: 'clean-08', section: 'skills', sector: 'cleaning', axis: 'Working unsupervised',
    label: 'SKILLS · REPORTING',
    prompt: 'You break something while cleaning and nobody saw. What do you do?',
    options: ['Hide the pieces', 'Report it yourself', 'Wait to see if anyone notices', 'Replace it at your own cost quietly'],
    correct: 1,
  },
  /*
    Rehomed from the hospitality bank. These are housekeeping questions, and
    the cleaner is the position that does housekeeping; chef and food and
    beverage service were the only roles drawing on hospitality, so here is
    where they were always meant to be.
  */
  {
    id: 'clean-09', section: 'skills', sector: 'cleaning', axis: 'Guest service',
    label: 'SKILLS · GUEST SERVICE',
    prompt: 'A guest complains their room was not cleaned. What do you do first?',
    options: ['Explain the housekeeper was busy', 'Apologise, then have it cleaned immediately', 'Ask them to come back later', 'Tell them to call the manager'],
    correct: 1,
  },
  {
    id: 'clean-10', section: 'skills', sector: 'cleaning', axis: 'Trust and discretion',
    label: 'SKILLS · VALUABLES',
    prompt: 'You find a guest\u2019s passport while cleaning. What do you do?',
    options: ['Leave it where it is', 'Put it in a drawer out of sight', 'Report it to your supervisor and log it', 'Take it to reception yourself without telling anyone'],
    correct: 2,
  },
  {
    id: 'clean-11', section: 'skills', sector: 'cleaning', axis: 'Standards',
    label: 'SKILLS · LINEN',
    prompt: 'A sheet has a small stain after washing. What do you do?',
    options: ['Put it on the bed, the stain is small', 'Fold it so the stain does not show', 'Take it out of service and report it', 'Use it as a spare'],
    correct: 2,
  },
  {
    id: 'clean-12', section: 'skills', sector: 'cleaning', axis: 'Standards',
    label: 'SKILLS · ROOM CHECK',
    prompt: 'What should you check last before leaving a serviced room?',
    options: ['That the bed is made', 'That the bathroom is dry', 'A final look from the doorway', 'That the curtains are open'],
    correct: 2,
  },
];

export const DRIVER_ITEMS: Item[] = [
  {
    id: 'driv-02', section: 'skills', sector: 'drivers', axis: 'Health and safety',
    label: 'SKILLS · SAFETY',
    prompt: 'A warning light comes on mid-journey with passengers aboard. What do you do?',
    options: ['Carry on to the destination', 'Stop somewhere safe and check before continuing', 'Turn the engine off and on again', 'Ignore it unless the vehicle stops'],
    correct: 1,
  },
  {
    id: 'driv-03', section: 'skills', sector: 'drivers', axis: 'Health and safety',
    label: 'SKILLS · HOURS',
    prompt: 'You are close to the end of a long shift and feel drowsy. What is correct?',
    options: ['Open a window and continue', 'Drink coffee and continue', 'Stop and rest before continuing', 'Drive faster to finish sooner'],
    correct: 2,
  },
  {
    id: 'driv-04', section: 'skills', sector: 'drivers', positions: ['driver'], axis: 'Route and conditions',
    label: 'SKILLS · CONDITIONS',
    prompt: 'Which of these have you driven in regularly?',
    options: ['City traffic only', 'City and highway', 'Including night driving', 'Including long distance with overnight stops'],
  },
  {
    id: 'driv-05', section: 'skills', sector: 'drivers', axis: 'Licence and record',
    label: 'SKILLS · CHECKS',
    prompt: 'What should be checked before the first journey of the day?',
    options: ['Fuel only', 'Tyres, lights, brakes, fluids and fuel', 'Nothing, if it worked yesterday', 'Only what the last driver reported'],
    correct: 1,
  },
  {
    id: 'driv-06', section: 'skills', sector: 'drivers', axis: 'Health and safety',
    label: 'SKILLS · INCIDENT',
    prompt: 'You have a minor collision with no injuries. What comes first?',
    options: ['Exchange details and continue', 'Make the scene safe, then exchange details and report it', 'Leave if the damage is small', 'Call your family'],
    correct: 1,
  },
  {
    id: 'driv-08', section: 'skills', sector: 'drivers', positions: ['driver'], axis: 'Guest service',
    label: 'SKILLS · PASSENGERS',
    prompt: 'A passenger asks you to exceed the speed limit because they are late. What do you say?',
    options: ['Agree, they are the customer', 'Explain you cannot, and offer the fastest legal route', 'Speed up a little only', 'Say nothing and drive faster'],
    correct: 1,
  },
];

export const MAINTENANCE_ITEMS: Item[] = [
  {
    id: 'main-01', section: 'skills', sector: 'maintenance', axis: 'Trade depth',
    label: 'SKILLS · TRADE',
    prompt: 'Which trade is closest to your main experience?',
    options: ['Electrical', 'Plumbing', 'HVAC or refrigeration', 'General repairs and carpentry'],
  },
  {
    id: 'main-04', section: 'skills', sector: 'maintenance', axis: 'Health and safety',
    label: 'SKILLS · HEIGHT',
    prompt: 'You need to reach a ceiling fitting at 3 metres. What is correct?',
    options: ['Stand on a chair', 'Use a stable ladder or platform rated for the job', 'Ask someone to hold you', 'Stand on a table'],
    correct: 1,
  },
  {
    id: 'main-05', section: 'skills', sector: 'maintenance', axis: 'Trade depth',
    label: 'SKILLS · DIAGNOSIS',
    prompt: 'An air conditioning unit runs but does not cool. What do you check first?',
    options: ['Replace the whole unit', 'Filters and airflow, then refrigerant pressure', 'The remote control battery', 'The building fuse box'],
    correct: 1,
  },
  {
    id: 'main-07', section: 'skills', sector: 'maintenance', axis: 'Health and safety',
    label: 'SKILLS · LIMITS',
    prompt: 'A job is outside your trade and you are the only person on site. What do you do?',
    options: ['Attempt it, someone has to', 'Make it safe and escalate to the right trade', 'Leave it without telling anyone', 'Watch a video and try'],
    correct: 1,
  },
  {
    id: 'main-08', section: 'skills', sector: 'maintenance', axis: 'Trade depth',
    label: 'SKILLS · RECORDS',
    prompt: 'After a repair, what should be recorded?',
    options: ['Nothing, if it works', 'What failed, what was done, and parts used', 'Only the time spent', 'Only the cost'],
    correct: 1,
  },
];

export const CONSTRUCTION_ITEMS: Item[] = [
  {
    id: 'cons-02', section: 'skills', sector: 'construction', axis: 'Site safety',
    label: 'SKILLS · PPE',
    prompt: 'Which equipment is required on almost every European site?',
    options: ['Hard hat only', 'Hard hat, safety boots and high-visibility clothing', 'Gloves only', 'Whatever the worker prefers'],
    correct: 1,
  },
  {
    id: 'cons-06', section: 'skills', sector: 'construction', axis: 'Site safety',
    label: 'SKILLS · LIFTING',
    prompt: 'A load is too heavy to lift alone. What is correct?',
    options: ['Lift with your back straight and try anyway', 'Get help or mechanical assistance', 'Split it however you can', 'Drag it across the floor'],
    correct: 1,
  },
  {
    id: 'cons-07', section: 'skills', sector: 'construction', axis: 'Site safety',
    label: 'SKILLS · INDUCTION',
    prompt: 'Have you completed a formal site safety induction or card scheme?',
    options: ['No', 'Site induction only', 'A recognised safety card', 'Card plus supervisor training'],
  },
];
