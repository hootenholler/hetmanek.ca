// Site content. Dates are ISO (YYYY-MM-DD); display formats are handled in main.js.
// Work entries are real. Body copy, Build Log posts, Case Studies and Letters are placeholders
// until real content is written. Any entry can be hidden with `draft: true`.

window.SITE = (function () {
  const LINKEDIN_URL = 'https://www.linkedin.com/in/hetmanek';

  const L1 = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
  const L2 = 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.';
  const L3 = 'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.';
  const L4 = 'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?';
  const L5 = 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.';
  const L6 = 'Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.';
  const p = (...xs) => xs.map((x) => '<p>' + x + '</p>').join('');

  // id is the URL slug: /work/<id>. `updated` is the manual date; Last Update is derived in main.js.
  const work = [
    { id: 'schema-app', title: 'Schema App', desc: 'Lead Product and Design for startup building AI performance-improving semantic data layers', skills: ['AI', 'Design', 'Build', 'People', 'Strategy', 'GTM', 'Product Marketing'], updated: '2026-09-05', status: 'Done' },
    { id: 'hetmanek-ca', title: 'hetmanek.ca', desc: 'This website to support my career', skills: ['Design', 'Build', 'Write'], updated: '2026-10-20', status: 'In Design' },
    { id: 'opportunity-assessment-engine', title: 'Opportunity Assessment Engine', desc: 'Is opportunity x worth doing? How much? In which ways?', skills: ['AI', 'Design', 'Build', 'Learn'], updated: '2026-10-19', status: 'In Dev' },
    {
      id: 'pengi-by-beatrix', title: 'Pengi by Beatrix', type: 'Project', desc: 'Next level lemonade stand. A fashion business for my kids.', skills: ['Design', 'Build', 'Strategy', 'GTM'], updated: '2026-10-19', status: 'Alive',
      body: p(L1, L2) + '<h2>What it is</h2>' + p(L3, L5),
      gallery: [{ alt: 'Image 1' }, { alt: 'Image 2' }, { alt: 'Image 3' }]
    },
    { id: 'senior-director-gs1-canada', title: 'Senior Director @ GS1 Canada', desc: 'Lead Product and Design for global non-profit driving supply chain standards and data pools', skills: ['Design', 'Build', 'People', 'Strategy'], updated: '2025-10-10', status: 'Done' },
    { id: 'at-the-bedside-podcast', title: 'At the Bedside Podcast', desc: 'Automate social media marketing', skills: ['Design', 'Build'], updated: '2026-08-07', status: 'Active' },
    { id: 'essence-of', title: 'Essence Of', desc: 'Social game', skills: ['Design', 'GTM'], updated: '2026-01-13', status: 'In Design' },
    { id: 'project-eggdrop', title: 'Project Eggdrop', desc: 'App to teaching kids new media literacies', skills: ['Design', 'Design Research'], updated: '2009-04-02', status: 'Done' },
    { id: 'my-story-island', title: 'My Story Island', desc: 'interactive animated theatre turned into educational content', skills: ['Design', 'Build', 'Strategy', 'Business', 'GTM'], updated: '2008-06-09', status: 'Done' },
    { id: 'tune-your-ride', title: 'Tune Your Ride', desc: 'Stationary Bicycle Powered Event Services', skills: ['People', 'Listen', 'Learn', 'Design', 'Build'], updated: '2017-09-11', status: 'Done' }
  ];

  // Newest first is not required; main.js sorts. `engagements` holds Work ids.
  // id is derived from the date (YYYY-MM-DD, with -2, -3 for same-day posts) unless set.
  const buildlog = [
    { date: '2026-10-20', engagements: ['hetmanek-ca'], skills: ['Design', 'Build'], paras: [L2, L4] },
    {
      date: '2026-10-19', pinned: true, engagements: ['hetmanek-ca'], skills: ['Write'],
      excerpt: 'This site is in public beta build mode. If you’re here, it’s due to referral or chance. Welcome! I am working towards the following DoD:',
      paras: ['This site is in public beta build mode. If you’re here, it’s due to referral or chance. Welcome! I am working towards the following DoD:', L1]
    },
    { date: '2026-10-12', engagements: ['opportunity-assessment-engine'], skills: ['AI', 'Design'], paras: [L2, L4, L5, L6, L3] },
    { date: '2026-10-11', engagements: ['pengi-by-beatrix'], skills: ['Design', 'Strategy'], paras: [L1] },
    { date: '2026-10-09', engagements: ['opportunity-assessment-engine'], skills: ['Design', 'Design Research'], paras: [L1, L4, L5] },
    { date: '2026-10-07', engagements: ['pengi-by-beatrix'], skills: ['People', 'GTM'], paras: [L4, L6] }
  ];

  // Sections are a writing template (Opportunity, Solution, Wins, Learning). `image: true` shows a placeholder.
  const caseSection = (label, text, image) => ({ label, html: p(text), image });
  const caseSections = [
    caseSection('Opportunity', L1, true),
    caseSection('Solution', L2),
    caseSection('Wins', L3, true),
    caseSection('Learning', L5)
  ];
  const casestudies = [
    { id: 'hidden-complexity', title: 'Hidden Complexity', engagement: 'opportunity-assessment-engine', skills: ['AI', 'Design', 'Strategy'], order: 1, sections: caseSections },
    { id: 'positioning', title: 'Positioning', skills: [], order: 2, sections: caseSections },
    { id: 'customer-journey', title: 'Customer Journey', skills: [], order: 3, sections: caseSections },
    { id: 'demo-day', title: 'Demo Day', skills: [], order: 4, sections: caseSections }
  ];

  const letterBody = p(L1, L2) +
    '<blockquote>Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor.</blockquote>' +
    p(L3, L5) + '<h2>A section heading</h2>' + p(L1, L2);
  const letters = [
    { id: 'notes-on-building-in-public', title: 'Notes on building in public', date: '2026-10-19', summary: 'A placeholder summary: one line that appears under the title in the Letters list.', skills: ['Design', 'Strategy'], image: { alt: '' }, body: letterBody },
    { id: 'letter-title-placeholder', title: 'Letter title placeholder', date: '2026-10-05', summary: 'Another placeholder summary for the list.', skills: ['AI'], image: { alt: '' }, body: letterBody },
    { id: 'another-letter-placeholder', title: 'Another letter placeholder', date: '2026-09-21', summary: 'A third placeholder summary for the list.', skills: ['People'], image: { alt: '' }, body: letterBody }
  ];

  return { LINKEDIN_URL, work, buildlog, casestudies, letters };
})();
