import { User, Post, Community, Comment, Flair, CommunityRule } from '@/types';
import { getAvatarColor } from './utils';

// ── Flairs ──────────────────────────────────────────
export const flairs: Flair[] = [
    { id: 'f1', name: 'CS', color: '#2563eb', bgColor: '#dbeafe' },
    { id: 'f2', name: 'EE', color: '#ea580c', bgColor: '#ffedd5' },
    { id: 'f3', name: 'ME', color: '#dc2626', bgColor: '#fee2e2' },
    { id: 'f4', name: 'Civil', color: '#16a34a', bgColor: '#dcfce7' },
    { id: 'f5', name: 'BBA', color: '#9333ea', bgColor: '#f3e8ff' },
    { id: 'f6', name: 'Discussion', color: '#0891b2', bgColor: '#cffafe' },
    { id: 'f7', name: 'Announcement', color: '#ca8a04', bgColor: '#fef9c3' },
    { id: 'f8', name: 'Question', color: '#6366f1', bgColor: '#e0e7ff' },
    { id: 'f9', name: 'Meme', color: '#db2777', bgColor: '#fce7f3' },
    { id: 'f10', name: 'Help', color: '#059669', bgColor: '#d1fae5' },
];

// ── Users ───────────────────────────────────────────
export const users: User[] = [
    { id: 'u1', username: 'ahmedkhan', displayName: 'Ahmed Khan', email: 'ahmed.khan@nust.edu.pk', department: 'Computer Science', batch: '2023', karma: 3420, avatarColor: getAvatarColor('ahmedkhan'), createdAt: '2024-09-01T08:00:00Z' },
    { id: 'u2', username: 'fatimaz', displayName: 'Fatima Zahra', email: 'fatima.zahra@nust.edu.pk', department: 'Electrical Engineering', batch: '2022', karma: 5890, avatarColor: getAvatarColor('fatimaz'), createdAt: '2024-01-15T10:00:00Z' },
    { id: 'u3', username: 'bilalraza', displayName: 'Bilal Raza', email: 'bilal.raza@nust.edu.pk', department: 'Mechanical Engineering', batch: '2024', karma: 1200, avatarColor: getAvatarColor('bilalraza'), createdAt: '2025-02-20T14:00:00Z' },
    { id: 'u4', username: 'sanamalik', displayName: 'Sana Malik', email: 'sana.malik@nust.edu.pk', department: 'Civil Engineering', batch: '2023', karma: 2100, avatarColor: getAvatarColor('sanamalik'), createdAt: '2024-06-10T09:00:00Z' },
    { id: 'u5', username: 'omerfarooq', displayName: 'Omer Farooq', email: 'omer.farooq@nust.edu.pk', department: 'BBA', batch: '2022', karma: 4560, avatarColor: getAvatarColor('omerfarooq'), createdAt: '2024-03-05T11:00:00Z' },
    { id: 'u6', username: 'ayeshanoor', displayName: 'Ayesha Noor', email: 'ayesha.noor@nust.edu.pk', department: 'Computer Science', batch: '2024', karma: 890, avatarColor: getAvatarColor('ayeshanoor'), createdAt: '2025-01-12T16:00:00Z' },
    { id: 'u7', username: 'hassanali', displayName: 'Hassan Ali', email: 'hassan.ali@nust.edu.pk', department: 'Electrical Engineering', batch: '2023', karma: 7650, avatarColor: getAvatarColor('hassanali'), createdAt: '2024-02-28T13:00:00Z' },
    { id: 'u8', username: 'mariam_s', displayName: 'Mariam Sheikh', email: 'mariam.sheikh@nust.edu.pk', department: 'Computer Science', batch: '2023', karma: 3150, avatarColor: getAvatarColor('mariam_s'), createdAt: '2024-07-19T15:00:00Z' },
];

// ── Community Rules ─────────────────────────────────
const csRules: CommunityRule[] = [
    { id: 'r1', title: 'Be Respectful', description: 'Treat all members with respect. No harassment, hate speech, or personal attacks.' },
    { id: 'r2', title: 'Relevant Content Only', description: 'Posts must be related to Computer Science at NUST.' },
    { id: 'r3', title: 'No Cheating', description: 'Do not share exam answers, plagiarized assignments, or encourage academic dishonesty.' },
    { id: 'r4', title: 'Use Appropriate Flairs', description: 'Tag your posts with the correct flair for easy navigation.' },
];

const generalRules: CommunityRule[] = [
    { id: 'r5', title: 'Follow NUST Code of Conduct', description: 'All posts must adhere to NUST\'s student code of conduct.' },
    { id: 'r6', title: 'No Spam', description: 'Avoid repetitive posts, excessive self-promotion, or irrelevant content.' },
    { id: 'r7', title: 'Be Constructive', description: 'Provide helpful feedback and constructive criticism.' },
];

// ── Communities ─────────────────────────────────────
export const communities: Community[] = [
    {
        id: 'c1', name: 'NUST Computer Science', slug: 'nust-cs',
        description: 'The hub for all SEECS CS students. Discuss courses, share projects, ask for help with DSA, and everything tech at NUST.',
        bannerColor: '#2563eb', iconColor: '#1d4ed8', memberCount: 2340, category: 'CS',
        rules: csRules, topContributors: [users[0], users[5], users[7]],
        createdAt: '2024-01-01T00:00:00Z', isJoined: true,
    },
    {
        id: 'c2', name: 'NUST Electrical Engineering', slug: 'nust-ee',
        description: 'For EE students at NUST. Circuits, signals, power systems, and everything in between.',
        bannerColor: '#ea580c', iconColor: '#c2410c', memberCount: 1870, category: 'EE',
        rules: generalRules, topContributors: [users[1], users[6]],
        createdAt: '2024-01-15T00:00:00Z', isJoined: false,
    },
    {
        id: 'c3', name: 'NUST Mechanical Engineering', slug: 'nust-me',
        description: 'Mechanical Engineering discussions — thermo, fluid dynamics, CAD, manufacturing, and placement advice.',
        bannerColor: '#dc2626', iconColor: '#b91c1c', memberCount: 1520, category: 'ME',
        rules: generalRules, topContributors: [users[2]],
        createdAt: '2024-02-01T00:00:00Z', isJoined: false,
    },
    {
        id: 'c4', name: 'NUST Civil Engineering', slug: 'nust-civil',
        description: 'For Civil Engineering students — structures, geotech, construction management, and FYP ideas.',
        bannerColor: '#16a34a', iconColor: '#15803d', memberCount: 980, category: 'Civil',
        rules: generalRules, topContributors: [users[3]],
        createdAt: '2024-03-01T00:00:00Z', isJoined: true,
    },
    {
        id: 'c5', name: 'NUST Business School', slug: 'nust-bba',
        description: 'NBS community for BBA and MBA students. Marketing case studies, finance tips, and campus events.',
        bannerColor: '#9333ea', iconColor: '#7e22ce', memberCount: 760, category: 'BBA',
        rules: generalRules, topContributors: [users[4]],
        createdAt: '2024-04-01T00:00:00Z', isJoined: false,
    },
    {
        id: 'c6', name: 'NUST General', slug: 'nust-general',
        description: 'The main NUST community. Campus life, events, food reviews, hostel discussions, and everything NUST.',
        bannerColor: '#006633', iconColor: '#004d26', memberCount: 4200, category: 'General',
        rules: generalRules, topContributors: [users[0], users[1], users[4]],
        createdAt: '2024-01-01T00:00:00Z', isJoined: true,
    },
    {
        id: 'c7', name: 'NUST Placements', slug: 'nust-placements',
        description: 'Discuss internship and job opportunities, interview prep, resume tips, and career guidance for NUST students.',
        bannerColor: '#0891b2', iconColor: '#0e7490', memberCount: 3100, category: 'Career',
        rules: generalRules, topContributors: [users[6], users[7]],
        createdAt: '2024-05-01T00:00:00Z', isJoined: false,
    },
];

// ── Posts ────────────────────────────────────────────
export const posts: Post[] = [
    {
        id: 'p1', title: 'Tips for surviving DSA with Dr. Amir?',
        body: 'Just started Data Structures & Algorithms this semester. Any tips for keeping up with the assignments? The first one on AVL trees was brutal. Looking for study group members too!\n\nI heard past papers are really helpful — can anyone share resources?',
        type: 'text', author: users[0],
        community: { id: 'c1', name: 'NUST Computer Science', slug: 'nust-cs' },
        flair: flairs[0], upvotes: 142, downvotes: 8, score: 134, userVote: null,
        commentCount: 23, createdAt: '2026-03-28T14:30:00Z', saved: false,
    },
    {
        id: 'p2', title: 'NUST Spring Festival 2026 — Official Thread',
        body: 'The Spring Festival is confirmed for April 15-17! 🎉\n\nThis year features:\n- Battle of Bands competition\n- Food stalls from all departments\n- Tech exhibition by SEECS\n- Sports gala\n\nDrop your suggestions for what you want to see this year.',
        type: 'text', author: users[4],
        community: { id: 'c6', name: 'NUST General', slug: 'nust-general' },
        flair: flairs[6], upvotes: 389, downvotes: 12, score: 377, userVote: 'up',
        commentCount: 67, createdAt: '2026-03-28T10:00:00Z', saved: true,
    },
    {
        id: 'p3', title: 'Got an internship at Systems Limited — AMA',
        body: 'After months of prep, I finally landed a summer internship at Systems Limited as a full-stack developer intern. Happy to answer questions about the process.\n\n**Timeline:**\n- Applied in February\n- Online assessment (HackerRank) in early March\n- Technical interview + HR round\n- Offer letter received last week\n\nKey topics they tested: React, Node.js, SQL, and system design basics.',
        type: 'text', author: users[7],
        community: { id: 'c7', name: 'NUST Placements', slug: 'nust-placements' },
        flair: flairs[5], upvotes: 256, downvotes: 3, score: 253, userVote: null,
        commentCount: 45, createdAt: '2026-03-27T18:00:00Z', saved: false,
    },
    {
        id: 'p4', title: 'Best cafeteria food on campus? (2026 ranking)',
        body: 'Let\'s settle this once and for all. What\'s your ranking of campus food spots?\n\nMy top 3:\n1. C1 Cafeteria — their paratha rolls are unmatched\n2. SEECS canteen — decent biryani on Thursdays\n3. NBS cafe — overpriced but good coffee\n\nFight me in the comments 😄',
        type: 'text', author: users[3],
        community: { id: 'c6', name: 'NUST General', slug: 'nust-general' },
        flair: flairs[5], upvotes: 198, downvotes: 22, score: 176, userVote: null,
        commentCount: 89, createdAt: '2026-03-27T12:00:00Z', saved: false,
    },
    {
        id: 'p5', title: 'Circuit Analysis II — study notes compilation',
        body: 'I\'ve compiled my notes for Circuit Analysis II covering:\n- Laplace transforms in circuit analysis\n- Two-port networks\n- Frequency response and Bode plots\n- Filter design basics\n\nLink to Google Drive in comments. Feel free to add your own notes!',
        type: 'text', author: users[1],
        community: { id: 'c2', name: 'NUST Electrical Engineering', slug: 'nust-ee' },
        flair: flairs[1], upvotes: 167, downvotes: 2, score: 165, userVote: 'up',
        commentCount: 31, createdAt: '2026-03-26T20:00:00Z', saved: true,
    },
    {
        id: 'p6', title: 'FYP idea: Smart Traffic Management System using IoT',
        body: 'Planning my FYP and thinking about a smart traffic signal system using ESP32 sensors + cloud analytics.\n\nThe idea:\n- Deploy sensors at key campus intersections\n- Real-time traffic flow data collection\n- ML model for signal optimization\n- Dashboard for monitoring\n\nAnyone interested in collaborating? Need 1-2 more team members.',
        type: 'text', author: users[6],
        community: { id: 'c2', name: 'NUST Electrical Engineering', slug: 'nust-ee' },
        flair: flairs[7], upvotes: 98, downvotes: 5, score: 93, userVote: null,
        commentCount: 18, createdAt: '2026-03-26T15:00:00Z', saved: false,
    },
    {
        id: 'p7', title: 'Thermodynamics midsem was insane',
        body: 'Just walked out of the Thermo mid-semester exam. That second law question was straight from another dimension. Pretty sure the class average is going to be below 40.\n\nHow did everyone else find it?',
        type: 'text', author: users[2],
        community: { id: 'c3', name: 'NUST Mechanical Engineering', slug: 'nust-me' },
        flair: flairs[2], upvotes: 87, downvotes: 4, score: 83, userVote: null,
        commentCount: 42, createdAt: '2026-03-26T09:00:00Z', saved: false,
    },
    {
        id: 'p8', title: 'Resume template for NUST grads — LaTeX version',
        body: 'Created a clean LaTeX resume template specifically designed for NUST graduates. Includes sections for:\n- Education (with NUST formatting)\n- Projects & FYP\n- Technical skills\n- Certifications\n\nOverleaf link in comments. Feedback welcome!',
        type: 'text', author: users[5],
        community: { id: 'c7', name: 'NUST Placements', slug: 'nust-placements' },
        flair: flairs[9], upvotes: 312, downvotes: 6, score: 306, userVote: null,
        commentCount: 28, createdAt: '2026-03-25T16:00:00Z', saved: false,
    },
    {
        id: 'p9', title: 'Structural Analysis lab report — group discussion',
        body: 'Can someone explain the procedure for the truss analysis experiment? I got some weird deflection values and I\'m not sure if it\'s a measurement error or calculation mistake.\n\nAlso, when is the submission deadline? I heard it got extended.',
        type: 'text', author: users[3],
        community: { id: 'c4', name: 'NUST Civil Engineering', slug: 'nust-civil' },
        flair: flairs[7], upvotes: 45, downvotes: 2, score: 43, userVote: null,
        commentCount: 12, createdAt: '2026-03-25T11:00:00Z', saved: false,
    },
    {
        id: 'p10', title: 'Marketing 101 group project — need team members',
        body: 'Looking for 2 more people for the Marketing 101 group project. We\'re planning to do a case study on a Pakistani startup (probably Bykea or Airlift\'s story).\n\nPreferably people who can meet on weekdays after 4 PM. DM me or comment below!',
        type: 'text', author: users[4],
        community: { id: 'c5', name: 'NUST Business School', slug: 'nust-bba' },
        flair: flairs[4], upvotes: 34, downvotes: 1, score: 33, userVote: null,
        commentCount: 8, createdAt: '2026-03-25T09:00:00Z', saved: false,
    },
    {
        id: 'p11', title: 'Web Dev Bootcamp this weekend — free for NUST students',
        body: 'GDSC NUST is hosting a free web development bootcamp this Saturday & Sunday at SEECS Auditorium.\n\nTopics:\n- HTML/CSS/JS fundamentals\n- React basics\n- Building & deploying your first app\n\nRegistration link in comments. Limited to 100 seats!',
        type: 'text', author: users[0],
        community: { id: 'c1', name: 'NUST Computer Science', slug: 'nust-cs' },
        flair: flairs[6], upvotes: 445, downvotes: 5, score: 440, userVote: 'up',
        commentCount: 56, createdAt: '2026-03-24T14:00:00Z', saved: true,
    },
    {
        id: 'p12', title: 'Lost my calculator in RIMMS building — please help!',
        body: 'Lost my Casio fx-991EX scientific calculator somewhere in RIMMS, probably in Room 204 after the Numerical Methods class today. It has a small green sticker on the back.\n\nIf anyone found it, please DM me. Really need it for upcoming exams!',
        type: 'text', author: users[2],
        community: { id: 'c6', name: 'NUST General', slug: 'nust-general' },
        flair: flairs[9], upvotes: 67, downvotes: 0, score: 67, userVote: null,
        commentCount: 15, createdAt: '2026-03-24T10:00:00Z', saved: false,
    },
];

// ── Comments ────────────────────────────────────────
export const comments: Comment[] = [
    {
        id: 'cm1', body: 'Honestly, the key is to practice on LeetCode alongside the course. Dr. Amir\'s exams are heavy on implementation, not just theory.',
        author: users[7], postId: 'p1', parentId: null,
        upvotes: 45, downvotes: 1, score: 44, userVote: null,
        createdAt: '2026-03-28T15:00:00Z', isCollapsed: false,
        replies: [
            {
                id: 'cm2', body: 'Agreed! Also, the TA office hours on Wednesdays are super helpful. Don\'t skip those.',
                author: users[5], postId: 'p1', parentId: 'cm1',
                upvotes: 22, downvotes: 0, score: 22, userVote: null,
                createdAt: '2026-03-28T15:30:00Z', isCollapsed: false,
                replies: [
                    {
                        id: 'cm3', body: 'Which TA? I went last week and the TA couldn\'t explain Red-Black trees properly 😅',
                        author: users[0], postId: 'p1', parentId: 'cm2',
                        upvotes: 8, downvotes: 2, score: 6, userVote: null,
                        createdAt: '2026-03-28T16:00:00Z', isCollapsed: false,
                        replies: [],
                    },
                ],
            },
            {
                id: 'cm4', body: 'I\'d recommend the Abdul Bari YouTube playlist too. It covers everything from the syllabus in a really clear way.',
                author: users[6], postId: 'p1', parentId: 'cm1',
                upvotes: 18, downvotes: 0, score: 18, userVote: null,
                createdAt: '2026-03-28T16:30:00Z', isCollapsed: false,
                replies: [],
            },
        ],
    },
    {
        id: 'cm5', body: 'Start with past papers from 2023 onward — the format changed significantly that year. I can share mine if you DM me.',
        author: users[1], postId: 'p1', parentId: null,
        upvotes: 67, downvotes: 2, score: 65, userVote: 'up',
        createdAt: '2026-03-28T15:15:00Z', isCollapsed: false,
        replies: [
            {
                id: 'cm6', body: 'Can you share them here? Would help everyone, not just OP.',
                author: users[3], postId: 'p1', parentId: 'cm5',
                upvotes: 34, downvotes: 0, score: 34, userVote: null,
                createdAt: '2026-03-28T15:45:00Z', isCollapsed: false,
                replies: [],
            },
        ],
    },
    {
        id: 'cm7', body: 'Form a study group ASAP. I did DSA solo and barely survived lol. Group discussions helped a lot for understanding graph algorithms.',
        author: users[4], postId: 'p1', parentId: null,
        upvotes: 29, downvotes: 1, score: 28, userVote: null,
        createdAt: '2026-03-28T17:00:00Z', isCollapsed: false,
        replies: [],
    },
];

// ── Departments list ────────────────────────────────
export const departments = [
    'Computer Science',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'BBA / MBA',
    'Architecture',
    'Industrial Design',
    'Aerospace Engineering',
    'Materials Engineering',
];
