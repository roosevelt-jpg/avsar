import type { Item } from '../items';

/**
 * IT items.
 *
 * A data analyst and a QA tester share a sector and not a job, so most items
 * here are scoped to one position. `positions` does that without a new enum
 * value per role, which is the churn `positions.ts` exists to avoid.
 *
 * Written to be answerable by someone who has done the work. Nothing here
 * rewards having read a tutorial: the SQL questions describe a result, the
 * testing questions describe a situation on a real project.
 */

export const IT_ITEMS: Item[] = [
  /* --------------------------------------------------------- both roles --- */
  {
    id: 'it-comm-01',
    section: 'skills',
    sector: 'it',
    axis: 'Written communication',
    label: 'SKILLS · COMMUNICATION',
    prompt:
      'You find a number in a report that contradicts what the business has been using for months. What do you do first?',
    options: [
      'Publish the corrected number',
      'Check your own working, then raise it with the owner of that report',
      'Mention it informally to a colleague',
      'Leave it, the old number is established',
    ],
    correct: 1,
  },
  {
    id: 'it-comm-02',
    section: 'skills',
    sector: 'it',
    axis: 'Written communication',
    label: 'SKILLS · COMMUNICATION',
    prompt: 'A manager asks for "the numbers for last month". What is the best first response?',
    options: [
      'Send every report you have for that month',
      'Ask what decision the numbers are for',
      'Build a new dashboard covering everything',
      'Send last month alongside the previous twelve',
    ],
    correct: 1,
  },
  {
    id: 'it-work-01',
    section: 'skills',
    sector: 'it',
    axis: 'Technical depth',
    label: 'SKILLS · VERSION CONTROL',
    prompt: 'What does a pull request exist for?',
    options: [
      'Copying code between computers',
      'Proposing a change so it can be reviewed before it merges',
      'Downloading the latest version',
      'Backing up your work',
    ],
    correct: 1,
  },
  {
    id: 'it-data-privacy',
    section: 'skills',
    sector: 'it',
    axis: 'Technical depth',
    label: 'SKILLS · DATA HANDLING',
    prompt: 'You need production data to reproduce a problem. What is correct?',
    options: [
      'Copy the production database to your laptop',
      'Use anonymised or synthetic data, and ask for access if that is not enough',
      'Query production directly and export what you need',
      'Ask a colleague to send you a sample by email',
    ],
    correct: 1,
  },

  /* ------------------------------------------------------- data analyst --- */
  {
    id: 'it-sql-01',
    section: 'skills',
    sector: 'it',
    positions: ['data-analyst'],
    axis: 'Technical depth',
    label: 'SKILLS · SQL',
    prompt: 'Which clause filters rows after a GROUP BY has been applied?',
    options: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'],
    correct: 1,
  },
  {
    id: 'it-sql-02',
    section: 'skills',
    sector: 'it',
    positions: ['data-analyst'],
    axis: 'Technical depth',
    label: 'SKILLS · SQL',
    prompt:
      'You join orders to customers and the row count goes up. What is the most likely cause?',
    options: [
      'The join key is missing from one table',
      'A customer has more than one matching row',
      'The tables are too large',
      'You used an INNER JOIN',
    ],
    correct: 1,
  },
  {
    id: 'it-sql-03',
    section: 'skills',
    sector: 'it',
    positions: ['data-analyst'],
    axis: 'Technical depth',
    label: 'SKILLS · SQL',
    prompt: 'A LEFT JOIN returns NULLs in the right-hand columns. What does that tell you?',
    options: [
      'The query is wrong',
      'Those left rows have no match on the right',
      'The right table is empty',
      'The join key types do not match',
    ],
    correct: 1,
  },
  {
    id: 'it-stat-01',
    section: 'skills',
    sector: 'it',
    positions: ['data-analyst'],
    axis: 'Technical depth',
    label: 'SKILLS · ANALYSIS',
    prompt:
      'Average order value jumped 40% last month. One customer placed a very large order. What should the report say?',
    options: [
      'Average order value grew 40%',
      'Report the median as well, and name the outlier',
      'Remove the large order silently',
      'Wait another month before reporting',
    ],
    correct: 1,
  },
  {
    id: 'it-stat-02',
    section: 'skills',
    sector: 'it',
    positions: ['data-analyst'],
    axis: 'Technical depth',
    label: 'SKILLS · ANALYSIS',
    prompt:
      'Ice cream sales and drowning deaths both rise in summer. What does that tell you about ice cream?',
    options: [
      'It causes drowning',
      'Nothing. Both follow a third factor',
      'The data is wrong',
      'The correlation proves a link worth investigating',
    ],
    correct: 1,
  },
  {
    id: 'it-viz-01',
    section: 'skills',
    sector: 'it',
    positions: ['data-analyst'],
    axis: 'Written communication',
    label: 'SKILLS · REPORTING',
    prompt: 'When is it misleading to start a bar chart axis at something other than zero?',
    options: [
      'Never, it saves space',
      'Almost always, because bar length is what the reader compares',
      'Only for negative values',
      'Only in printed reports',
    ],
    correct: 1,
  },

  /* ---------------------------------------------------------- QA tester --- */
  {
    id: 'it-qa-01',
    section: 'skills',
    sector: 'it',
    positions: ['qa-tester'],
    axis: 'Technical depth',
    label: 'SKILLS · TESTING',
    prompt: 'What belongs in a defect report that a developer can act on without asking you?',
    options: [
      'A description of the problem',
      'Steps to reproduce, what you expected, what happened, and the environment',
      'A screenshot',
      'The severity and a priority',
    ],
    correct: 1,
  },
  {
    id: 'it-qa-02',
    section: 'skills',
    sector: 'it',
    positions: ['qa-tester'],
    axis: 'Technical depth',
    label: 'SKILLS · TESTING',
    prompt:
      'A field accepts ages from 18 to 65. Which values are most worth testing?',
    options: [
      'Any value in the middle, such as 30',
      '17, 18, 65 and 66',
      'Only 18 and 65',
      'Very large numbers such as 9999',
    ],
    correct: 1,
  },
  {
    id: 'it-qa-03',
    section: 'skills',
    sector: 'it',
    positions: ['qa-tester'],
    axis: 'Technical depth',
    label: 'SKILLS · TESTING',
    prompt: 'What is regression testing for?',
    options: [
      'Testing a new feature',
      'Checking that a change has not broken what already worked',
      'Measuring performance under load',
      'Testing on older devices',
    ],
    correct: 1,
  },
  {
    id: 'it-qa-04',
    section: 'skills',
    sector: 'it',
    positions: ['qa-tester'],
    axis: 'Technical depth',
    label: 'SKILLS · TESTING',
    prompt: 'A test fails intermittently, passing on some runs and failing on others. What do you do?',
    options: [
      'Re-run it until it passes and move on',
      'Investigate it, a flaky test hides a real timing or state problem',
      'Delete it',
      'Mark it as low priority',
    ],
    correct: 1,
  },
  {
    id: 'it-qa-05',
    section: 'skills',
    sector: 'it',
    positions: ['qa-tester'],
    axis: 'Technical depth',
    label: 'SKILLS · TESTING',
    prompt:
      'You find a serious defect an hour before a release everyone is expecting. What do you do?',
    options: [
      'Stay quiet, it is too late to change anything',
      'Report it with the evidence and let the decision be made with it',
      'Fix it yourself',
      'Log it for the next release',
    ],
    correct: 1,
  },
  {
    id: 'it-qa-06',
    section: 'skills',
    sector: 'it',
    positions: ['qa-tester'],
    axis: 'Written communication',
    label: 'SKILLS · TESTING',
    prompt: 'Passing all the tests means:',
    options: [
      'The software has no defects',
      'The cases you wrote did not find one',
      'The release is safe',
      'Testing is complete',
    ],
    correct: 1,
  },
];
