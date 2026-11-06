// These are preference prompts, not a psychometric assessment. See docs/WRITING_STYLE.md.
const question = (key, group, title, hint, options) => ({ key, group, title, hint,
  options: [...options.map(([value, label, example]) => ({ value, label, example })),
    { value: 'unspecified', label: 'No preference / depends on the situation', example: 'Let the task and audience guide this choice.' }],
});
const questions = [
  question('tone', 'voice', 'How formal should your everyday writing feel?', 'Compare the same request. Choose what sounds like you, rather than what seems most impressive.', [
    ['conversational', 'Casual', 'Hey Sam, could you send the notes when you get a chance?'],
    ['warm-professional', 'Professional', 'Hi Sam, could you send the meeting notes when you have a moment?'],
    ['formal', 'Formal', 'Dear Sam, please forward the meeting notes at your convenience.'],
  ]),
  question('humor', 'voice', 'How much humor belongs in your writing?', 'Think about an ordinary update, where humor would be appropriate.', [
    ['serious', 'Stay serious', 'The launch was delayed. We are working on a fix.'],
    ['occasional', 'An occasional light touch', 'The launch hit a small detour. We are working on a fix.'],
    ['playful', 'Often playful', 'Our launch took a scenic route. We are working on a fix.'],
  ]),
  question('enthusiasm', 'voice', 'How much energy should an update have?', 'Each option communicates the same launch milestone.', [
    ['restrained', 'Matter-of-fact', 'The new site is live. You can explore it today.'],
    ['warm', 'Quietly enthusiastic', 'I’m happy to share that the new site is live. You can explore it today.'],
    ['energetic', 'Openly enthusiastic', 'The new site is live! I’m excited for you to explore it today.'],
  ]),
  question('stance', 'voice', 'How do you approach an established convention?', 'Choose your approach to the idea, not how politely you treat people.', [
    ['respectful', 'Respect the convention', 'The usual approach has value. I would like to explore an alternative.'],
    ['neutral', 'Evaluate it neutrally', 'There is a usual approach. I would like to explore an alternative.'],
    ['irreverent', 'Challenge it with a little edge', 'The usual approach is not sacred. I would like to explore an alternative.'],
  ]),
  question('detail', 'craft', 'How much explanation do you usually include?', 'Use the same fact: testing found a navigation issue, which the team fixed.', [
    ['concise', 'The essential point', 'Testing revealed a navigation issue. We fixed it.'],
    ['balanced', 'The point and useful context', 'Testing revealed that the navigation was confusing, so we simplified it.'],
    ['detailed', 'The reasoning and context', 'During testing, we found that people had trouble navigating the site. We reviewed the navigation and simplified it to address the issue.'],
  ]),
  question('structure', 'craft', 'How would you organize a short progress update?', 'Choose a default layout. The required format of a task will still take priority.', [
    ['paragraphs', 'Connected paragraphs', 'We finished testing and fixed the navigation. Next, we will prepare the launch.'],
    ['bullets', 'Scannable points', '• Finished testing\n• Fixed the navigation\n• Next: prepare the launch'],
    ['mixed', 'A short introduction and points', 'Here is our progress:\n• Finished testing\n• Fixed the navigation\nNext, we will prepare the launch.'],
  ]),
  question('vocabulary', 'craft', 'What kind of wording feels natural?', 'Use technical terms when the audience needs them, regardless of your default.', [
    ['plain', 'Everyday words', 'We made the page load faster.'],
    ['technical', 'Specialist terms', 'We reduced the page’s load latency.'],
    ['expressive', 'Figurative language', 'We gave the page a faster start.'],
  ]),
  question('rhythm', 'craft', 'Which sentence rhythm feels like you?', 'The facts stay the same: the team tested the page, found a problem, and fixed it.', [
    ['short', 'Short sentences', 'We tested the page. We found a problem. We fixed it.'],
    ['varied', 'A mix of lengths', 'We tested the page and found a problem. We fixed it.'],
    ['flowing', 'Longer, connected sentences', 'After testing the page and finding a problem, we fixed it.'],
  ]),
  question('directness', 'mechanics', 'How would you ask for a change?', 'This sets phrasing, not confidence in facts or expertise.', [
    ['direct', 'Lead with the request', 'Please move the deadline to Friday.'],
    ['balanced', 'Ask directly, with a softener', 'Could we move the deadline to Friday?'],
    ['gentle', 'Offer it as a suggestion', 'Would it be possible to consider moving the deadline to Friday?'],
  ]),
  question('contractions', 'mechanics', 'Do you use contractions?', 'Compare the same sentence.', [
    ['use', 'Use them', 'I’m ready, and I don’t need more time.'],
    ['avoid', 'Spell words out', 'I am ready, and I do not need more time.'],
  ]),
  question('punctuation', 'mechanics', 'How expressive is your punctuation?', 'This guides stylistic punctuation, while preserving punctuation needed for meaning.', [
    ['minimal', 'Mostly periods and commas', 'The draft is ready. I look forward to your feedback.'],
    ['moderate', 'An occasional dash or exclamation', 'The draft is ready — I look forward to your feedback.'],
    ['expressive', 'More expressive punctuation', 'The draft is ready! I look forward to your feedback.'],
  ]),
  question('spelling', 'mechanics', 'Which English spelling do you prefer?', 'Other languages and explicit requests still take priority.', [
    ['us', 'US English', 'We organized the color samples.'],
    ['uk', 'UK English', 'We organised the colour samples.'],
  ]),
];
const contexts = [
  { key: 'posts', label: 'Portfolio posts and project stories' },
  { key: 'applications', label: 'Cover letters and job applications' },
  { key: 'email', label: 'Emails and outreach' },
];
const avoidOptions = [
  { value: 'cliches', label: 'Clichés and stock phrases' },
  { value: 'buzzwords', label: 'Corporate buzzwords' },
  { value: 'em-dashes', label: 'Em dashes' },
  { value: 'emoji', label: 'Emoji' },
  { value: 'exclamation', label: 'Exclamation marks' },
  { value: 'rhetorical-questions', label: 'Rhetorical questions' },
  { value: 'overstatement', label: 'Hype and superlatives' },
];
module.exports = { version: 2, questions, contexts, avoidOptions };
