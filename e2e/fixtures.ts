export const authoredProject = (name = 'The test observatory') => ({
  version: 1,
  name,
  description: 'A locally authored three-stage puzzle.',
  holdMs: 250,
  cards: [
    { id: 0, label: 'Sun', color: '#f2cb75' },
    { id: 1, label: 'Key', color: '#bfa7f4' },
    { id: 2, label: 'Moon', color: '#8fd0da' },
  ],
  stages: [
    {
      id: 'power',
      title: 'Wake the console',
      instruction: 'Show the Key.',
      successText: 'Console awake.',
      scene: 'console',
      rule: { kind: 'visible', ids: [1] },
    },
    {
      id: 'align',
      title: 'Align the sky keys',
      instruction: 'Sun, Key, Moon from left to right.',
      successText: 'Gate aligned.',
      scene: 'gate',
      rule: { kind: 'order', ids: [0, 1, 2] },
    },
    {
      id: 'open',
      title: 'Make the key disappear',
      instruction: 'Show Key then hide it with Sun visible.',
      successText: 'Portal opened by the test.',
      scene: 'portal',
      rule: { kind: 'hidden', target: 1, witness: 0 },
    },
  ],
});
