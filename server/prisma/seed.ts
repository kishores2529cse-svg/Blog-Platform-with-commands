import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // Clean existing data in order of relations
  await prisma.commentLike.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create Users with hashed passwords
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  console.log('Creating users (Admin, Authors, Readers)...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@chronicle.dev',
      username: 'admin',
      password: passwordHash,
      displayName: 'Eleanor Vance',
      role: 'ADMIN',
      bio: 'Lead platform administrator and editorial director. Writing about software architecture and modern web design.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      website: 'https://chronicle.dev',
      github: 'eleanorvance',
      twitter: 'eleanor_dev',
    },
  });

  const author1 = await prisma.user.create({
    data: {
      email: 'marcus@chronicle.dev',
      username: 'marcus',
      password: passwordHash,
      displayName: 'Marcus Chen',
      role: 'AUTHOR',
      bio: 'Principal distributed systems engineer. Passionate about TypeScript, database internals, and performance optimization.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      website: 'https://marcuschen.tech',
      github: 'marcuschen',
      twitter: 'marcus_codes',
    },
  });

  const author2 = await prisma.user.create({
    data: {
      email: 'sophia@chronicle.dev',
      username: 'sophia',
      password: passwordHash,
      displayName: 'Sophia Martinez',
      role: 'AUTHOR',
      bio: 'Product designer and accessibility advocate. Writing on typography, clean UX paradigms, and design systems.',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      website: 'https://sophiamartinez.design',
      github: 'sophiadesign',
    },
  });

  const reader = await prisma.user.create({
    data: {
      email: 'alex@example.com',
      username: 'alex',
      password: passwordHash,
      displayName: 'Alex Rivera',
      role: 'READER',
      bio: 'Curious reader and full-stack software apprentice.',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    },
  });

  // Create Categories
  console.log('Creating categories...');
  const catEngineering = await prisma.category.create({
    data: {
      name: 'Software Engineering',
      slug: 'software-engineering',
      description: 'System design, backend architectures, performance tuning, and scalable codebases.',
      color: '#2563eb',
    },
  });

  const catDesign = await prisma.category.create({
    data: {
      name: 'Design & UX',
      slug: 'design-and-ux',
      description: 'Crafting thoughtful user experiences, design systems, and accessible interfaces.',
      color: '#7c3aed',
    },
  });

  const catFrontend = await prisma.category.create({
    data: {
      name: 'Modern Web',
      slug: 'modern-web',
      description: 'React, TypeScript, CSS architecture, and browser runtime performance.',
      color: '#059669',
    },
  });

  const catCulture = await prisma.category.create({
    data: {
      name: 'Engineering Culture',
      slug: 'engineering-culture',
      description: 'Team dynamics, code reviews, deep work rituals, and developer productivity.',
      color: '#d97706',
    },
  });

  // Create Tags
  console.log('Creating tags...');
  const tagTypeScript = await prisma.tag.create({ data: { name: 'TypeScript', slug: 'typescript' } });
  const tagArchitecture = await prisma.tag.create({ data: { name: 'Architecture', slug: 'architecture' } });
  const tagReact = await prisma.tag.create({ data: { name: 'React', slug: 'react' } });
  const tagAccessibility = await prisma.tag.create({ data: { name: 'Accessibility', slug: 'accessibility' } });
  const tagDatabase = await prisma.tag.create({ data: { name: 'Database', slug: 'database' } });
  const tagMinimalism = await prisma.tag.create({ data: { name: 'Minimalism', slug: 'minimalism' } });

  // Create Posts
  console.log('Creating published and draft posts...');
  const post1 = await prisma.post.create({
    data: {
      title: 'Architecting Resilient RESTful APIs with Clean Architecture',
      slug: 'architecting-resilient-restful-apis',
      excerpt: 'Explore practical patterns for building scalable, maintainable APIs with robust validation, centralized error handling, and strong relational integrity.',
      content: `<h2>The Philosophy of Predictable APIs</h2>
<p>In modern full-stack development, an API is not merely a bridge between a database and a client application; it is the fundamental contract defining how systems communicate, evolve, and remain stable under high throughput.</p>

<h3>1. Single Source of Truth for Domain Validation</h3>
<p>Input validation must occur at the edge of your service layer before untrusted user input touches business logic or database queries. Utilizing typed schema validators like <strong>Zod</strong> guarantees that runtime inputs strictly align with compile-time TypeScript declarations.</p>

<blockquote>"Code that crashes on invalid input is code that has not clearly defined its boundaries."</blockquote>

<h3>2. Centralized, Standardized Error Envelopes</h3>
<p>Every response leaving your API should adhere to an invariant shape:</p>
<pre><code>{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [{ "field": "title", "message": "Title must be at least 3 characters" }]
  }
}</code></pre>

<h3>3. Data Relationships and Referential Integrity</h3>
<p>Relational databases such as SQLite and PostgreSQL empower developers with foreign key constraints, cascading deletes, and indexed query lookups. These guarantees eliminate orphaned records and keep concurrent mutations consistent.</p>`,
      coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
      readingTime: 4,
      status: 'PUBLISHED',
      featured: true,
      views: 342,
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      authorId: author1.id,
      categoryId: catEngineering.id,
      tags: {
        create: [
          { tagId: tagTypeScript.id },
          { tagId: tagArchitecture.id },
          { tagId: tagDatabase.id },
        ],
      },
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'The Art of Modern Minimalist Design: Zero Distraction UX',
      slug: 'art-of-modern-minimalist-design',
      excerpt: 'Why eliminating gratuitous decorative elements and high-saturation neon gradients leads to higher reading comprehension and long-term user trust.',
      content: `<h2>Content First, Always</h2>
<p>Great web publishing experiences are defined not by what you add, but by what you deliberately leave out. Over the past few years, the web has suffered from visual fatigue—cluttered layouts, excessive animations, and unnecessary decorative AI gradients that fight for the reader's attention.</p>

<h3>Hierarchy through Typography and Whitespace</h3>
<p>When you strip away arbitrary ornamentation, typography must do the heavy lifting. Choosing a refined sans-serif like <strong>Inter</strong> paired with generous line height (1.6 to 1.8) and disciplined contrast ratios creates a reading sanctuary.</p>

<ul>
  <li><strong>Consistent Vertical Rhythm:</strong> Consistent margin scales between headings, paragraphs, and list elements.</li>
  <li><strong>Meaningful State Feedback:</strong> Interactive elements should respond with subtle color shifts and precise border transitions.</li>
  <li><strong>Accessible Color Contrast:</strong> Deep zinc tones (#0f1117 and #fafafa) ensure WCAG AAA compliance across dark and light modes.</li>
</ul>`,
      coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
      readingTime: 3,
      status: 'PUBLISHED',
      featured: true,
      views: 218,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      authorId: author2.id,
      categoryId: catDesign.id,
      tags: {
        create: [
          { tagId: tagMinimalism.id },
          { tagId: tagAccessibility.id },
        ],
      },
    },
  });

  const post3 = await prisma.post.create({
    data: {
      title: 'Building Real-Time Interactive Applications with WebSockets',
      slug: 'building-real-time-interactive-applications',
      excerpt: 'A comprehensive deep dive into bidirectional event-driven communication for live commenting and collaboration.',
      content: `<h2>Why Polling Fails Real-Time Collaboration</h2>
<p>Traditional HTTP short-polling wastes server CPU cycles and introduces unacceptable latency for live interactions. Bidirectional WebSocket connections maintain a persistent, low-overhead TCP connection that enables sub-millisecond event broadcasts.</p>

<h3>Room-Based Partitioning</h3>
<p>By compartmentalizing clients into rooms (e.g., <code>post:post_id</code>), events like comment creation, edits, and live reactions are pushed only to relevant subscribers rather than polluting the entire network.</p>`,
      coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
      readingTime: 5,
      status: 'PUBLISHED',
      featured: false,
      views: 154,
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      authorId: admin.id,
      categoryId: catFrontend.id,
      tags: {
        create: [
          { tagId: tagTypeScript.id },
          { tagId: tagReact.id },
        ],
      },
    },
  });

  // Draft Post (for testing draft visibility permissions)
  await prisma.post.create({
    data: {
      title: 'Upcoming Trends in Distributed Systems and Cloud Computing (Draft)',
      slug: 'upcoming-trends-in-distributed-systems',
      excerpt: 'Internal draft outlining notes on event sourcing, CQRS, and edge deployments.',
      content: `<p>Work in progress notes on edge computing and distributed consensus algorithms.</p>`,
      readingTime: 2,
      status: 'DRAFT',
      authorId: author1.id,
      categoryId: catEngineering.id,
    },
  });

  // Create Comments with Nested Replies
  console.log('Creating nested comments...');
  const comment1 = await prisma.comment.create({
    data: {
      content: 'Outstanding breakdown on clean architecture! The emphasis on validating schemas before entering the service layer resonates deeply with our engineering team.',
      postId: post1.id,
      authorId: reader.id,
    },
  });

  const comment1Reply = await prisma.comment.create({
    data: {
      content: 'Thank you Alex! Zod + TypeScript has virtually eradicated runtime boundary bugs in our production services.',
      postId: post1.id,
      authorId: author1.id,
      parentId: comment1.id, // Nested reply!
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Could you elaborate on how you handle database migrations in zero-downtime blue/green deployments?',
      postId: post1.id,
      authorId: author2.id,
      parentId: comment1Reply.id, // Second-level nested reply!
    },
  });

  // Add likes and bookmarks
  console.log('Adding post likes and bookmarks...');
  await prisma.postLike.create({
    data: { userId: reader.id, postId: post1.id },
  });
  await prisma.postLike.create({
    data: { userId: author2.id, postId: post1.id },
  });
  await prisma.postLike.create({
    data: { userId: reader.id, postId: post2.id },
  });

  await prisma.bookmark.create({
    data: { userId: reader.id, postId: post1.id },
  });

  await prisma.commentLike.create({
    data: { userId: author1.id, commentId: comment1.id },
  });

  console.log('✅ Seeding complete!');
  console.log('--------------------------------------------------');
  console.log('Demo Credentials:');
  console.log('Admin:   admin@chronicle.dev   / Password123!');
  console.log('Author:  marcus@chronicle.dev  / Password123!');
  console.log('Author:  sophia@chronicle.dev  / Password123!');
  console.log('Reader:  alex@example.com      / Password123!');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
