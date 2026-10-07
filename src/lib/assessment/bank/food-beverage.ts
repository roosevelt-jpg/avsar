import type { Item } from '../items';

/**
 * Kitchen and restaurant service, scoped by position.
 *
 * Chef and food-and-beverage service shared one "hospitality" bank, and that
 * bank was hotel housekeeping: a candidate applying to cook was asked the order
 * to service an occupied guest room and what to do with a stained sheet. It
 * measured nothing about either job.
 *
 * Mostly job knowledge, which is what an online test does best. On the revised
 * meta-analytic estimates (Sackett, Zhang, Berry & Lievens, 2022) job-knowledge
 * tests predict job performance at .40, ahead of work samples at .33; only
 * structured interviews do better at .42, and that is the assessment call, not
 * this. So the items ask what somebody who has worked a service knows, and the
 * situational ones are built on decisions that are actually made on a line
 * rather than on manners.
 *
 * Temperatures and allergen rules follow EU practice, because the job is in
 * Portugal. Where a figure differs between countries the item asks for the
 * principle instead, so a good cook is not marked down for having learned a
 * different number.
 *
 * Still uncalibrated. Difficulty and discrimination come from real responses.
 */

export const CHEF_ITEMS: Item[] = [
  {
    id: 'chef-01', section: 'skills', sector: 'hospitality', positions: ['chef'],
    axis: 'Food safety', label: 'SKILLS · FOOD SAFETY',
    prompt: 'A delivery of fresh chicken arrives and your probe reads 11°C. What do you do?',
    options: [
      'Accept it and put it straight into the coldest fridge',
      'Accept it and cook it the same day',
      'Reject the delivery and record it',
      'Accept it if the driver says the van broke down',
    ],
    correct: 2,
  },
  {
    id: 'chef-02', section: 'skills', sector: 'hospitality', positions: ['chef'],
    axis: 'Food safety', label: 'SKILLS · FOOD SAFETY',
    prompt: 'You have a large pot of hot stock that must be chilled for tomorrow. What is correct?',
    options: [
      'Put the whole pot in the fridge once it stops steaming',
      'Divide it into shallow containers so it cools quickly, then refrigerate',
      'Leave it out overnight and refrigerate in the morning',
      'Add ice to the pot and leave it on the pass',
    ],
    correct: 1,
  },
  {
    id: 'chef-03', section: 'skills', sector: 'hospitality', positions: ['chef'],
    axis: 'Food safety', label: 'SKILLS · FOOD SAFETY',
    prompt: 'What core temperature should poultry reach before it is served?',
    options: ['55°C', '63°C', '75°C', 'Until the outside is brown'],
    correct: 2,
  },
  {
    id: 'chef-04', section: 'skills', sector: 'hospitality', positions: ['chef'],
    axis: 'Allergens', label: 'SKILLS · ALLERGENS',
    prompt:
      'A waiter says a guest has a severe nut allergy and asks whether the sauce is safe. You prepared it but did not read every label. What do you do?',
    options: [
      'Say it is fine, there are no nuts in the recipe',
      'Check every label and the supplier information before answering, and say so if you cannot be certain',
      'Make the dish again quickly without nuts',
      'Tell the waiter to ask the guest how severe it is',
    ],
    correct: 1,
  },
  {
    id: 'chef-05', section: 'skills', sector: 'hospitality', positions: ['chef'],
    axis: 'Allergens', label: 'SKILLS · ALLERGENS',
    prompt: 'An order is marked as a coeliac guest. Which of these matters most?',
    options: [
      'Serving the dish quickly so it does not go cold',
      'Using clean equipment and a separate preparation area so nothing gluten touches it',
      'Telling the guest the kitchen is busy',
      'Removing visible bread from the plate',
    ],
    correct: 1,
  },
  {
    id: 'chef-06', section: 'skills', sector: 'hospitality', positions: ['chef'],
    axis: 'Kitchen craft', label: 'SKILLS · PREPARATION',
    prompt: 'What does mise en place mean in a working kitchen?',
    options: [
      'The order dishes leave the pass',
      'Everything prepared and in position before service starts',
      'The cleaning rota at the end of the night',
      'The written menu for the day',
    ],
    correct: 1,
  },
  {
    id: 'chef-07', section: 'skills', sector: 'hospitality', positions: ['chef'],
    axis: 'Kitchen craft', label: 'SKILLS · STOCK',
    prompt: 'Two trays of the same prepared item are in the fridge, dated Monday and Wednesday. Which do you use first?',
    options: [
      'Wednesday, it is fresher',
      'Monday, provided it is still within date',
      'Whichever is nearer the front',
      'Open both and judge by smell',
    ],
    correct: 1,
  },
  {
    id: 'chef-08', section: 'skills', sector: 'hospitality', positions: ['chef'],
    axis: 'Numeracy', label: 'SKILLS · NUMERACY',
    prompt: 'A recipe serves 4 and uses 600 g of rice. You need 18 covers. How much rice?',
    options: ['1.8 kg', '2.4 kg', '2.7 kg', '3.6 kg'],
    correct: 2,
  },
  {
    id: 'chef-09', section: 'skills', sector: 'hospitality', positions: ['chef'],
    axis: 'Service under pressure', label: 'SKILLS · SERVICE',
    prompt:
      'Three tickets land at once and one is the allergy order. The section is behind. What do you do?',
    options: [
      'Fire everything together and sort the allergy plate at the pass',
      'Separate the allergy order and prepare it apart, and tell the pass the section is behind',
      'Do the two normal tickets first and the allergy one last so it is not rushed',
      'Ask another chef to take the allergy order without telling them what it is',
    ],
    correct: 1,
  },
  {
    id: 'chef-10', section: 'skills', sector: 'hospitality', positions: ['chef'],
    axis: 'Food safety', label: 'SKILLS · HYGIENE',
    prompt: 'You cut your finger during prep. What is correct before you go back on the line?',
    options: [
      'Rinse it and carry on',
      'Cover it with any plaster you can find',
      'Clean and cover it with a blue detectable plaster, wear a glove over it, and report it',
      'Wrap it in cling film and keep working',
    ],
    correct: 2,
  },
  {
    id: 'chef-11', section: 'skills', sector: 'hospitality', positions: ['chef'],
    axis: 'Kitchen craft', label: 'SKILLS · SECTION',
    prompt: 'Which section have you worked the most?',
    options: ['Larder or cold starters', 'Sauce or meat', 'Pastry', 'Grill or fry'],
  },
  {
    id: 'chef-12', section: 'skills', sector: 'hospitality', positions: ['chef'],
    axis: 'Kitchen craft', label: 'SKILLS · HACCP',
    prompt: 'What is a HACCP critical control point?',
    options: [
      'The busiest moment of service',
      'A step where a control must be applied to prevent or remove a food safety hazard',
      'The temperature of the kitchen itself',
      'A list of suppliers that have been approved',
    ],
    correct: 1,
  },
];

export const FB_SERVICE_ITEMS: Item[] = [
  {
    id: 'fbs-01', section: 'skills', sector: 'hospitality', positions: ['fb-service'],
    axis: 'Allergens', label: 'SKILLS · ALLERGENS',
    prompt: 'A guest asks whether a dish contains gluten. You think it does not. What do you do?',
    options: [
      'Tell them it does not, you have served it many times',
      'Check with the kitchen before answering, every time',
      'Suggest they order something else to be safe',
      'Tell them the restaurant cannot guarantee anything and move on',
    ],
    correct: 1,
  },
  {
    id: 'fbs-02', section: 'skills', sector: 'hospitality', positions: ['fb-service'],
    axis: 'Guest service', label: 'SKILLS · COMPLAINTS',
    prompt: 'A guest says their main course is not what they ordered. What do you do first?',
    options: [
      'Explain that the kitchen is busy tonight',
      'Apologise, take the plate away and get the correct dish ordered',
      'Ask them to describe exactly what they said when ordering',
      'Offer a free dessert and leave the plate',
    ],
    correct: 1,
  },
  {
    id: 'fbs-03', section: 'skills', sector: 'hospitality', positions: ['fb-service'],
    axis: 'Beverage knowledge', label: 'SKILLS · BEVERAGE',
    prompt: 'At roughly what temperature is a red wine normally served?',
    options: ['4 to 6°C', '8 to 12°C', '16 to 18°C', 'Room temperature in summer, about 25°C'],
    correct: 2,
  },
  {
    id: 'fbs-04', section: 'skills', sector: 'hospitality', positions: ['fb-service'],
    axis: 'Beverage knowledge', label: 'SKILLS · BEVERAGE',
    prompt: 'A guest orders an espresso after dinner and it comes out pale with a thin crema. What is the most likely cause?',
    options: [
      'The cup was too warm',
      'The grind or the dose is wrong, or the shot ran too fast',
      'The guest ordered the wrong drink',
      'Espresso always looks like this after dinner service',
    ],
    correct: 1,
  },
  {
    id: 'fbs-05', section: 'skills', sector: 'hospitality', positions: ['fb-service'],
    axis: 'Responsible service', label: 'SKILLS · RESPONSIBLE SERVICE',
    prompt: 'A guest is clearly drunk and orders another drink. What is correct?',
    options: [
      'Serve it, they are paying',
      'Serve a weaker version without telling them',
      'Politely decline, offer water or food, and tell your manager',
      'Ignore them until they ask someone else',
    ],
    correct: 2,
  },
  {
    id: 'fbs-06', section: 'skills', sector: 'hospitality', positions: ['fb-service'],
    axis: 'Responsible service', label: 'SKILLS · RESPONSIBLE SERVICE',
    prompt: 'A group looks young and orders alcohol. What do you do?',
    options: [
      'Serve them, they are with adults',
      'Ask for identification and refuse if they cannot show it',
      'Serve only beer and not spirits',
      'Ask a colleague to decide',
    ],
    correct: 1,
  },
  {
    id: 'fbs-07', section: 'skills', sector: 'hospitality', positions: ['fb-service'],
    axis: 'Numeracy', label: 'SKILLS · NUMERACY',
    prompt: 'A table of four has a bill of €86.00 and wants to split it evenly, adding 10%. What does each person pay?',
    options: ['€21.50', '€23.65', '€24.15', '€25.80'],
    correct: 1,
  },
  {
    id: 'fbs-08', section: 'skills', sector: 'hospitality', positions: ['fb-service'],
    axis: 'Food safety', label: 'SKILLS · FOOD SAFETY',
    prompt: 'A dish has been waiting under the heat lamp on the pass for twenty-five minutes. What do you do?',
    options: [
      'Take it out, the guest has waited long enough',
      'Tell the kitchen and have it remade',
      'Take it out but apologise for the delay',
      'Put it back in the oven for a minute',
    ],
    correct: 1,
  },
  {
    id: 'fbs-09', section: 'skills', sector: 'hospitality', positions: ['fb-service'],
    axis: 'Service under pressure', label: 'SKILLS · SERVICE',
    prompt: 'You are running six tables, one wants the bill, one is waiting to order and a new party has just sat down. What is best?',
    options: [
      'Finish one table completely before looking at the others',
      'Acknowledge the new party, take the order, then bring the bill',
      'Bring the bill first because that table is leaving',
      'Ask the new party to wait at the door',
    ],
    correct: 1,
  },
  {
    id: 'fbs-10', section: 'skills', sector: 'hospitality', positions: ['fb-service'],
    axis: 'Guest service', label: 'SKILLS · EXPERIENCE',
    prompt: 'Which service style have you worked the most?',
    options: ['Café or counter service', 'Casual restaurant', 'Fine dining', 'Banquets and events'],
  },
];
