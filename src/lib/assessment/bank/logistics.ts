import type { Item } from '../items';

/**
 * Driving and warehouse work, separated.
 *
 * Both roles drew on the "drivers" bank, so somebody applying to work in a
 * warehouse was asked which licence categories they hold and what to do when a
 * navigation device sends them under a low bridge. The two jobs overlap in
 * vehicles and in nothing else.
 *
 * The shared bank keeps the items that are genuinely common: daily checks,
 * fatigue, collisions. These are what each role needs on top.
 *
 * European rules where they differ, because the job is in Portugal: EU driving
 * and rest times, tachographs, the CAM certificate for professional drivers.
 * Still uncalibrated.
 */

export const DRIVER_ROLE_ITEMS: Item[] = [
  {
    id: 'drv-01', section: 'skills', sector: 'drivers', positions: ['driver'],
    axis: 'Hours and rest', label: 'SKILLS · HOURS',
    prompt: 'Under EU rules, how long may a professional driver drive before taking a break?',
    options: [
      '3 hours, then a 30 minute break',
      '4.5 hours, then a break of at least 45 minutes',
      '6 hours, then a 20 minute break',
      'There is no limit if you feel alert',
    ],
    correct: 1,
  },
  {
    id: 'drv-02', section: 'skills', sector: 'drivers', positions: ['driver'],
    axis: 'Hours and rest', label: 'SKILLS · TACHOGRAPH',
    prompt: 'What is a tachograph for?',
    options: [
      'Recording fuel consumption for the company',
      'Recording driving time, breaks and speed, as a legal record',
      'Tracking the vehicle for the customer',
      'Logging the route for navigation',
    ],
    correct: 1,
  },
  {
    id: 'drv-03', section: 'skills', sector: 'drivers', positions: ['driver'],
    axis: 'Vehicle knowledge', label: 'SKILLS · LOADING',
    prompt: 'Why does it matter where a heavy load sits on the bed of a van?',
    options: [
      'It only matters for fuel consumption',
      'Weight too far back lightens the steering axle and makes the vehicle unstable',
      'It matters only on long journeys',
      'Modern vehicles correct for it automatically',
    ],
    correct: 1,
  },
  {
    id: 'drv-04', section: 'skills', sector: 'drivers', positions: ['driver'],
    axis: 'Vehicle knowledge', label: 'SKILLS · ROADCRAFT',
    prompt: 'You are driving a loaded van downhill on a long descent. What is correct?',
    options: [
      'Hold the brake steadily all the way down',
      'Select a lower gear and let the engine hold the speed, braking in stages',
      'Coast in neutral to save fuel',
      'Build speed at the top so you need less throttle later',
    ],
    correct: 1,
  },
  {
    id: 'drv-05', section: 'skills', sector: 'drivers', positions: ['driver'],
    axis: 'Judgement on the road', label: 'SKILLS · JUDGEMENT',
    prompt:
      'Your navigation device sends you down a road with a height restriction your vehicle cannot pass. What do you do?',
    options: [
      'Follow the device, it has the correct route',
      'Stop safely, find another route, and report the restriction',
      'Try it slowly and turn back if it does not fit',
      'Ask a passer-by whether other vans get through',
    ],
    correct: 1,
  },
  {
    id: 'drv-06', section: 'skills', sector: 'drivers', positions: ['driver'],
    axis: 'Judgement on the road', label: 'SKILLS · JUDGEMENT',
    prompt: 'A delivery slot will be missed unless you skip your break. What do you do?',
    options: [
      'Skip the break, the customer is waiting',
      'Take the break and tell dispatch the slot will be missed',
      'Take a shorter break and record the full one',
      'Ask the customer whether they mind',
    ],
    correct: 1,
  },
  {
    id: 'drv-07', section: 'skills', sector: 'drivers', positions: ['driver'],
    axis: 'Qualification', label: 'SKILLS · LICENCE',
    prompt: 'Which best describes your licence?',
    options: [
      'Car only, category B',
      'Car and light van, with commercial driving experience',
      'Truck, category C, or bus, category D',
      'Truck or bus with a professional driver certificate',
    ],
    scale: true,
  },
];

export const LOGISTICS_ITEMS: Item[] = [
  {
    id: 'log-01', section: 'skills', sector: 'drivers', positions: ['logistics'],
    axis: 'Stock accuracy', label: 'SKILLS · STOCK',
    prompt: 'A pick list says 24 units and the location holds 22. What do you do?',
    options: [
      'Pick 22 and close the line',
      'Pick 22, flag the shortage so the record is corrected, and tell the supervisor',
      'Take 2 from a similar product so the count matches',
      'Leave the line and move to the next one',
    ],
    correct: 1,
  },
  {
    id: 'log-02', section: 'skills', sector: 'drivers', positions: ['logistics'],
    axis: 'Stock accuracy', label: 'SKILLS · ROTATION',
    prompt: 'What does FIFO mean in a warehouse, and why does it matter?',
    options: [
      'Fastest items first, so picking is quicker',
      'First in, first out, so older stock ships before it expires or ages',
      'Fragile items first, so they are not crushed',
      'Full pallets in, full pallets out',
    ],
    correct: 1,
  },
  {
    id: 'log-03', section: 'skills', sector: 'drivers', positions: ['logistics'],
    axis: 'Goods handling', label: 'SKILLS · RECEIVING',
    prompt: 'A pallet arrives with the shrink wrap torn and two cartons crushed. What is correct?',
    options: [
      'Accept it and put it away, the stock is needed',
      'Note the damage on the delivery paperwork before signing, and photograph it',
      'Refuse the whole delivery',
      'Accept it and raise it later if anybody complains',
    ],
    correct: 1,
  },
  {
    id: 'log-04', section: 'skills', sector: 'drivers', positions: ['logistics'],
    axis: 'Goods handling', label: 'SKILLS · STACKING',
    prompt: 'How should a mixed pallet be built?',
    options: [
      'Lightest at the bottom so nothing is crushed',
      'Heaviest at the bottom, even layers, nothing overhanging the edge',
      'Whatever order the pick list gives',
      'Tallest items first so the wrap holds',
    ],
    correct: 1,
  },
  {
    id: 'log-05', section: 'skills', sector: 'drivers', positions: ['logistics'],
    axis: 'Health and safety', label: 'SKILLS · SAFETY',
    prompt: 'You are working on foot in an aisle where a forklift is operating. What matters most?',
    options: [
      'Moving quickly so you are not in the way long',
      'High-visibility clothing, a marked walkway, and eye contact with the driver before crossing',
      'Staying behind the forklift at all times',
      'Waiting until the forklift leaves the building',
    ],
    correct: 1,
  },
  {
    id: 'log-06', section: 'skills', sector: 'drivers', positions: ['logistics'],
    axis: 'Numeracy', label: 'SKILLS · NUMERACY',
    prompt: 'A carton holds 12 units and a pallet holds 40 cartons. An order is for 1,000 units. How many full pallets and loose cartons?',
    options: [
      '2 pallets and 3 cartons',
      '2 pallets and 4 cartons, with 4 units short',
      '2 pallets and 4 cartons, with 4 units over',
      '3 pallets exactly',
    ],
    correct: 2,
  },
  {
    id: 'log-07', section: 'skills', sector: 'drivers', positions: ['logistics'],
    axis: 'Judgement', label: 'SKILLS · JUDGEMENT',
    prompt: 'You realise you picked the wrong item for an order that has already left the building. What do you do?',
    options: [
      'Say nothing, it may not be noticed',
      'Tell the supervisor immediately so the customer can be contacted',
      'Correct the stock record so it balances',
      'Wait for the customer to complain, then explain',
    ],
    correct: 1,
  },
  {
    id: 'log-08', section: 'skills', sector: 'drivers', positions: ['logistics'],
    axis: 'Equipment', label: 'SKILLS · EQUIPMENT',
    prompt: 'Which equipment have you been trained or certified on?',
    options: [
      'Hand pallet truck only',
      'Powered pallet truck or stacker',
      'Counterbalance forklift',
      'Reach truck or more than one certified truck type',
    ],
    scale: true,
  },
];
