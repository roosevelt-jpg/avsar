import type { Item } from '../items';

/**
 * The trades, one set per position.
 *
 * Four roles were sharing two banks: electrician and plumber both drew on
 * "maintenance", welder and construction worker both on "construction". A
 * plumber was asked what to check first when an air conditioning unit runs but
 * does not cool, and a welder was asked to read a 1:50 drawing. Neither item is
 * wrong, and neither is the question you would ask to find out whether somebody
 * can do the job they applied for.
 *
 * The sector items that remain are the ones genuinely shared, mostly site
 * safety. These are what sits on top: job knowledge for the trade, plus the
 * decisions that trade makes alone on a site with nobody to ask.
 *
 * European practice where it differs, because the job is in Portugal: 230 V
 * single phase and 400 V three phase, metric pipe, EN process numbers. Still
 * uncalibrated.
 */

export const ELECTRICIAN_ITEMS: Item[] = [
  {
    id: 'elec-01', section: 'skills', sector: 'maintenance', positions: ['electrician'],
    axis: 'Electrical safety', label: 'SKILLS · SAFE ISOLATION',
    prompt: 'What is the correct order for safe isolation before working on a circuit?',
    options: [
      'Switch off, lock off, prove the tester, test the circuit is dead, prove the tester again',
      'Test the circuit is dead, then switch off and lock off',
      'Switch off and start work, the breaker is off',
      'Ask whoever is on site whether the circuit is live',
    ],
    correct: 0,
  },
  {
    id: 'elec-02', section: 'skills', sector: 'maintenance', positions: ['electrician'],
    axis: 'Electrical knowledge', label: 'SKILLS · SUPPLY',
    prompt: 'What is the standard low-voltage supply in Portugal and most of Europe?',
    options: [
      '110 V single phase, 220 V three phase',
      '230 V single phase, 400 V three phase',
      '240 V single phase, 440 V three phase',
      '120 V single phase, 208 V three phase',
    ],
    correct: 1,
  },
  {
    id: 'elec-03', section: 'skills', sector: 'maintenance', positions: ['electrician'],
    axis: 'Electrical knowledge', label: 'SKILLS · PROTECTION',
    prompt: 'What does an RCD protect against that a circuit breaker does not?',
    options: [
      'Overload on the circuit',
      'Short circuit between live and neutral',
      'Earth leakage, which is what causes a shock through a person',
      'Voltage drop over a long cable run',
    ],
    correct: 2,
  },
  {
    id: 'elec-04', section: 'skills', sector: 'maintenance', positions: ['electrician'],
    axis: 'Electrical knowledge', label: 'SKILLS · CALCULATION',
    prompt: 'A 230 V circuit carries a 3.5 kW water heater. Roughly what current does it draw?',
    options: ['6 A', '10 A', '15 A', '24 A'],
    correct: 2,
  },
  {
    id: 'elec-05', section: 'skills', sector: 'maintenance', positions: ['electrician'],
    axis: 'Fault finding', label: 'SKILLS · FAULT FINDING',
    prompt: 'An RCD trips every time one appliance is plugged in. What is the most likely cause?',
    options: [
      'The RCD is too sensitive and should be replaced',
      'An earth fault in that appliance or its circuit',
      'The supply voltage is too high',
      'The circuit is overloaded',
    ],
    correct: 1,
  },
  {
    id: 'elec-06', section: 'skills', sector: 'maintenance', positions: ['electrician'],
    axis: 'Fault finding', label: 'SKILLS · FAULT FINDING',
    prompt: 'Lights on one circuit dim whenever a large motor starts. What does this suggest?',
    options: [
      'The lamps are failing',
      'Voltage drop, from cable size or a loose connection on that circuit',
      'The motor is wired backwards',
      'Nothing, this is normal and needs no action',
    ],
    correct: 1,
  },
  {
    id: 'elec-07', section: 'skills', sector: 'maintenance', positions: ['electrician'],
    axis: 'Judgement on site', label: 'SKILLS · JUDGEMENT',
    prompt:
      'You open a consumer unit and find earth and neutral wired together on a circuit that should be separated. The client wants the job finished today. What do you do?',
    options: [
      'Finish the job and mention it on the way out',
      'Correct it, record what you found, and tell the client why it mattered',
      'Leave it, it was there before you arrived',
      'Photograph it and say nothing until someone asks',
    ],
    correct: 1,
  },
  {
    id: 'elec-08', section: 'skills', sector: 'maintenance', positions: ['electrician'],
    axis: 'Qualification', label: 'SKILLS · QUALIFICATION',
    prompt: 'What best describes your electrical training?',
    options: [
      'Learned on the job, no formal certificate',
      'Trade school or ITI certificate',
      'Completed apprenticeship with a licensed electrician',
      'Licensed or registered electrician in my own name',
    ],
    scale: true,
  },
];

export const PLUMBER_ITEMS: Item[] = [
  {
    id: 'plum-01', section: 'skills', sector: 'maintenance', positions: ['plumber'],
    axis: 'Plumbing knowledge', label: 'SKILLS · DRAINAGE',
    prompt: 'What is the purpose of the trap under a sink?',
    options: [
      'To slow the water down so the pipe does not block',
      'To hold a water seal that stops drain gases entering the room',
      'To catch anything dropped down the plughole',
      'To reduce the noise of draining water',
    ],
    correct: 1,
  },
  {
    id: 'plum-02', section: 'skills', sector: 'maintenance', positions: ['plumber'],
    axis: 'Fault finding', label: 'SKILLS · FAULT FINDING',
    prompt: 'A tap drips steadily from the spout when fully closed. The most likely cause is:',
    options: ['A blocked aerator', 'A worn washer or cartridge', 'Low mains pressure', 'A faulty isolation valve'],
    correct: 1,
  },
  {
    id: 'plum-03', section: 'skills', sector: 'maintenance', positions: ['plumber'],
    axis: 'Fault finding', label: 'SKILLS · FAULT FINDING',
    prompt: 'A toilet runs continuously into the pan. What do you check first?',
    options: [
      'The water main pressure',
      'The fill valve and the flush valve seal inside the cistern',
      'The soil pipe for a blockage',
      'The pan connector',
    ],
    correct: 1,
  },
  {
    id: 'plum-04', section: 'skills', sector: 'maintenance', positions: ['plumber'],
    axis: 'Plumbing knowledge', label: 'SKILLS · HOT WATER',
    prompt: 'Why is a temperature and pressure relief valve fitted to an unvented hot water cylinder?',
    options: [
      'To let air out when the system is filled',
      'To release pressure if the control fails, so the cylinder cannot burst',
      'To mix cold water in so the outlet is not scalding',
      'To drain the cylinder for service',
    ],
    correct: 1,
  },
  {
    id: 'plum-05', section: 'skills', sector: 'maintenance', positions: ['plumber'],
    axis: 'Plumbing knowledge', label: 'SKILLS · CONTAMINATION',
    prompt: 'Why must a hose left in a filled sink or tank be avoided?',
    options: [
      'It wastes water',
      'Backflow could siphon dirty water into the drinking supply',
      'It damages the tap over time',
      'It is only a problem on hot water',
    ],
    correct: 1,
  },
  {
    id: 'plum-06', section: 'skills', sector: 'maintenance', positions: ['plumber'],
    axis: 'Plumbing knowledge', label: 'SKILLS · MATERIALS',
    prompt: 'You need to join copper pipe to a plastic push-fit fitting. What matters most?',
    options: [
      'Heating the copper first so it seats properly',
      'A clean, deburred, correctly cut pipe end and the insert in place',
      'Using jointing compound on the push-fit',
      'Nothing, push-fit works on any cut end',
    ],
    correct: 1,
  },
  {
    id: 'plum-07', section: 'skills', sector: 'maintenance', positions: ['plumber'],
    axis: 'Judgement on site', label: 'SKILLS · JUDGEMENT',
    prompt:
      'You are fixing a leak in a flat and find the pipework below has been wet for a long time and the ceiling of the flat underneath is stained. What do you do?',
    options: [
      'Fix the leak you were called for and leave',
      'Fix the leak, then report the damage below so the other flat is checked',
      'Knock on the flat below and offer to repair the ceiling yourself',
      'Say nothing, it is not the job you were given',
    ],
    correct: 1,
  },
  {
    id: 'plum-08', section: 'skills', sector: 'maintenance', positions: ['plumber'],
    axis: 'Qualification', label: 'SKILLS · QUALIFICATION',
    prompt: 'What best describes your plumbing training?',
    options: [
      'Learned on the job, no formal certificate',
      'Trade school or ITI certificate',
      'Completed apprenticeship with a licensed plumber',
      'Licensed or registered plumber in my own name',
    ],
    scale: true,
  },
];

export const WELDER_ITEMS: Item[] = [
  {
    id: 'weld-01', section: 'skills', sector: 'construction', positions: ['welder'],
    axis: 'Welding process', label: 'SKILLS · PROCESS',
    prompt: 'Which processes have you welded with most?',
    options: [
      'MMA or stick',
      'MIG or MAG',
      'TIG',
      'Two or more of these to a tested standard',
    ],
    scale: true,
  },
  {
    id: 'weld-02', section: 'skills', sector: 'construction', positions: ['welder'],
    axis: 'Welding process', label: 'SKILLS · PROCESS',
    prompt: 'Which process is normally chosen for thin stainless steel where the finish matters?',
    options: ['MMA, stick', 'MIG with solid wire', 'TIG', 'Flux-cored arc welding'],
    correct: 2,
  },
  {
    id: 'weld-03', section: 'skills', sector: 'construction', positions: ['welder'],
    axis: 'Weld quality', label: 'SKILLS · DEFECTS',
    prompt: 'A weld shows undercut along the toe. What usually causes it?',
    options: [
      'Travel speed too slow and amperage too low',
      'Amperage too high, or travel speed and angle wrong',
      'Too much shielding gas',
      'The joint was cleaned too thoroughly',
    ],
    correct: 1,
  },
  {
    id: 'weld-04', section: 'skills', sector: 'construction', positions: ['welder'],
    axis: 'Weld quality', label: 'SKILLS · DEFECTS',
    prompt: 'MIG welds outdoors come out full of small holes. The most likely reason is:',
    options: [
      'The wire is the wrong diameter',
      'Wind is blowing the shielding gas away, so the weld is porous',
      'The earth clamp is too close',
      'The plate is too thick',
    ],
    correct: 1,
  },
  {
    id: 'weld-05', section: 'skills', sector: 'construction', positions: ['welder'],
    axis: 'Welding process', label: 'SKILLS · POSITION',
    prompt: 'In welding position terms, what does an overhead butt weld demand compared with flat?',
    options: [
      'Higher current and a larger weld pool',
      'Lower current and a smaller, controlled pool so it does not fall out',
      'No difference if the machine is set correctly',
      'A faster travel speed and no weaving',
    ],
    correct: 1,
  },
  {
    id: 'weld-06', section: 'skills', sector: 'construction', positions: ['welder'],
    axis: 'Health and safety', label: 'SKILLS · SAFETY',
    prompt: 'You are asked to weld a drum that previously held fuel. What is correct?',
    options: [
      'Weld it, it has been empty for weeks',
      'Rinse it with water first and then weld',
      'Refuse until it has been properly cleaned, purged and certified safe',
      'Open both ends and weld quickly',
    ],
    correct: 2,
  },
  {
    id: 'weld-07', section: 'skills', sector: 'construction', positions: ['welder'],
    axis: 'Health and safety', label: 'SKILLS · SAFETY',
    prompt: 'Which risk is specific to welding galvanised or coated steel?',
    options: [
      'Arc eye from the brighter arc',
      'Metal fume fever from the zinc, so extraction and ventilation matter',
      'The weld cools too quickly',
      'The earth connection fails more often',
    ],
    correct: 1,
  },
  {
    id: 'weld-08', section: 'skills', sector: 'construction', positions: ['welder'],
    axis: 'Judgement on site', label: 'SKILLS · JUDGEMENT',
    prompt: 'A weld you finished yesterday has failed inspection. What do you do?',
    options: [
      'Argue the inspection was wrong',
      'Grind it out and reweld it, and look at what in your setup caused it',
      'Cap over it so it looks sound',
      'Ask for a different inspector',
    ],
    correct: 1,
  },
];

export const CONSTRUCTION_WORKER_ITEMS: Item[] = [
  {
    id: 'cnw-01', section: 'skills', sector: 'construction', positions: ['construction-worker'],
    axis: 'Site craft', label: 'SKILLS · DRAWINGS',
    prompt: 'A drawing is marked 1:50. A wall measuring 6 cm on the drawing is how long in reality?',
    options: ['60 cm', '3 metres', '5 metres', '30 metres'],
    correct: 1,
  },
  {
    id: 'cnw-02', section: 'skills', sector: 'construction', positions: ['construction-worker'],
    axis: 'Site craft', label: 'SKILLS · MATERIALS',
    prompt: 'Concrete that is mixed too wet will typically:',
    options: [
      'Set faster and harder',
      'Be weaker once cured, and shrink and crack more',
      'Be stronger but take longer to cure',
      'Make no difference once it is in the formwork',
    ],
    correct: 1,
  },
  {
    id: 'cnw-03', section: 'skills', sector: 'construction', positions: ['construction-worker'],
    axis: 'Site craft', label: 'SKILLS · SETTING OUT',
    prompt: 'You need to check a set-out corner is square with only a tape. What do you do?',
    options: [
      'Measure both walls and make them equal',
      'Measure 3 m along one side, 4 m along the other, and adjust until the diagonal is 5 m',
      'Measure the diagonals of the whole building and make them different',
      'Use a spirit level against the corner',
    ],
    correct: 1,
  },
  {
    id: 'cnw-04', section: 'skills', sector: 'construction', positions: ['construction-worker'],
    axis: 'Site craft', label: 'SKILLS · NUMERACY',
    prompt: 'A slab is 8 m by 5 m and 150 mm thick. Roughly how much concrete is needed?',
    options: ['4 m³', '6 m³', '12 m³', '40 m³'],
    correct: 1,
  },
  {
    id: 'cnw-05', section: 'skills', sector: 'construction', positions: ['construction-worker'],
    axis: 'Health and safety', label: 'SKILLS · WORKING AT HEIGHT',
    prompt: 'You notice a missing guard rail on a scaffold you are about to use. What do you do?',
    options: [
      'Use it carefully and stay away from the edge',
      'Do not use it, and report it so it is fixed and tagged',
      'Fix it yourself with whatever is nearby',
      'Use it only for short tasks',
    ],
    correct: 1,
  },
  {
    id: 'cnw-06', section: 'skills', sector: 'construction', positions: ['construction-worker'],
    axis: 'Health and safety', label: 'SKILLS · EXCAVATION',
    prompt: 'You are asked to work in a 1.8 m deep trench with unsupported vertical sides. What is correct?',
    options: [
      'Work quickly and keep the ladder close',
      'Refuse until it is battered, benched or shored, and say why',
      'Work in it only if the soil looks firm',
      'Work in it with another person watching from the top',
    ],
    correct: 1,
  },
  {
    id: 'cnw-07', section: 'skills', sector: 'construction', positions: ['construction-worker'],
    axis: 'Judgement on site', label: 'SKILLS · JUDGEMENT',
    prompt: 'You realise work you completed yesterday is out of level. What do you do?',
    options: [
      'Carry on, the next trade will adjust',
      'Tell the supervisor straight away so it is put right before anything is built on it',
      'Fix the visible part and leave the rest',
      'Wait to see whether anyone notices',
    ],
    correct: 1,
  },
  {
    id: 'cnw-08', section: 'skills', sector: 'construction', positions: ['construction-worker'],
    axis: 'Site craft', label: 'SKILLS · TRADE',
    prompt: 'Which is closest to your main trade on site?',
    options: ['General labouring', 'Formwork, steel fixing or concrete', 'Masonry or blockwork', 'Finishing, plaster, tiling or carpentry'],
  },
];
