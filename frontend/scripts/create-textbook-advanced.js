#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get arguments
const textbookName = process.argv[2];
const withChapters = process.argv.includes('--with-chapters') || process.argv.includes('-c');

if (!textbookName) {
  console.error('❌ Error: Please provide a textbook name');
  console.log('Usage: npm run create-textbook-advanced <textbook-name> [--with-chapters]');
  console.log('Example: npm run create-textbook-advanced "Data Science" --with-chapters');
  process.exit(1);
}

// Sanitize the textbook name
const sanitizedName = textbookName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
const displayName = textbookName.split(/[^a-zA-Z0-9]+/)
  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  .join(' ');

console.log(`📚 Creating advanced textbook: "${displayName}" (${sanitizedName})`);

// Define paths
const textbooksDir = path.join(__dirname, '..', 'public', 'textbooks');
const textbookDir = path.join(textbooksDir, sanitizedName);
const serviceFile = path.join(__dirname, '..', 'src', 'services', 'textbookService.ts');

// Check if textbook already exists
if (fs.existsSync(textbookDir)) {
  console.error(`❌ Error: Textbook "${sanitizedName}" already exists`);
  process.exit(1);
}

try {
  // Create textbook directory
  fs.mkdirSync(textbookDir, { recursive: true });

  let indexYml, chaptersContent = [];

  if (withChapters) {
    // Create chapters directory
    const chaptersDir = path.join(textbookDir, 'chapters');
    fs.mkdirSync(chaptersDir, { recursive: true });

    // Create sample chapters
    const chapters = [
      { id: 'introduction', title: 'Introduction', number: '01' },
      { id: 'fundamentals', title: 'Fundamentals', number: '02' },
      { id: 'advanced_topics', title: 'Advanced Topics', number: '03' }
    ];

    chapters.forEach(chapter => {
      const chapterDir = path.join(chaptersDir, `${chapter.number}-${chapter.id}`);
      fs.mkdirSync(chapterDir, { recursive: true });

      // Create chapter index.md
      const chapterContent = `# Chapter ${chapter.number}: ${chapter.title}

Welcome to the ${chapter.title} chapter of ${displayName}.

## Learning Objectives

By the end of this chapter, you will:

- Understand key concepts related to ${chapter.title.toLowerCase()}
- Be able to apply these concepts in practical scenarios
- Have a solid foundation for the next chapter

## Chapter Overview

This chapter covers:

1. **Section 1**: Introduction to ${chapter.title}
2. **Section 2**: Core Concepts
3. **Section 3**: Practical Examples
4. **Section 4**: Summary and Next Steps

---

Let's begin your journey through ${chapter.title}!
`;

      fs.writeFileSync(path.join(chapterDir, 'index.md'), chapterContent);
      
      chaptersContent.push({
        id: chapter.id,
        title: `Chapter ${chapter.number}: ${chapter.title}`,
        file: `chapters/${chapter.number}-${chapter.id}/index.md`,
        type: 'chapter'
      });
    });

    // Create index.yml with chapters
    indexYml = `title: ${displayName}
description: A comprehensive guide to ${displayName.toLowerCase()}
config:
  authors:
    - Your Name
  version: "1.0"

chapters:
  - id: overview
    title: ${displayName} Overview
    file: index.md
    type: page
    
${chaptersContent.map(chapter => 
  `  - id: ${chapter.id}
    title: "${chapter.title}"
    file: ${chapter.file}
    type: ${chapter.type}`
).join('\n    \n')}
`;

    console.log(`📁 Created chapters directory with ${chapters.length} sample chapters`);
  } else {
    // Simple textbook with just overview
    indexYml = `title: ${displayName}
description: A comprehensive guide to ${displayName.toLowerCase()}
config:
  authors:
    - Your Name
  version: "1.0"

chapters:
  - id: overview
    title: ${displayName} Overview
    file: index.md
    type: page
`;
  }

  // Create index.yml
  fs.writeFileSync(path.join(textbookDir, 'index.yml'), indexYml);
  console.log(`📄 Created: index.yml`);

  // Create main index.md
  const indexMd = `# ${displayName}

Welcome to the comprehensive ${displayName} textbook!

## About This Textbook

This textbook is designed to provide you with a thorough understanding of ${displayName.toLowerCase()}. Whether you're a beginner or looking to deepen your knowledge, this resource will guide you through the essential concepts and practical applications.

## How to Use This Textbook

${withChapters ? `
### Chapter Structure

This textbook is organized into several chapters, each building upon the previous:

${chaptersContent.map((chapter, index) => 
  `${index + 1}. **${chapter.title}** - Foundation concepts and introduction
`).join('')}

### Navigation

Use the sidebar navigation to move between chapters and sections. Each chapter contains:
- Learning objectives
- Core concepts
- Practical examples
- Summary and review questions

` : `
### Getting Started

Begin by reading through this overview, then explore the additional content as it becomes available.

`}## Prerequisites

- Basic understanding of related concepts (if applicable)
- Access to necessary tools or software
- Willingness to learn and practice

## Learning Approach

This textbook emphasizes:
- **Practical Application**: Real-world examples and exercises
- **Progressive Learning**: Each concept builds on the previous
- **Interactive Content**: Engaging with the material actively

---

Ready to begin? ${withChapters ? 'Start with Chapter 1: Introduction!' : 'Dive into the content below!'}
`;

  fs.writeFileSync(path.join(textbookDir, 'index.md'), indexMd);
  console.log(`📄 Created: index.md`);

  // Update textbookService.ts
  const serviceContent = fs.readFileSync(serviceFile, 'utf8');
  const configsRegex = /(const TEXTBOOK_CONFIGS = \[)([\s\S]*?)(\])/;
  const configsMatch = serviceContent.match(configsRegex);
  
  if (!configsMatch) {
    console.error('❌ Error: Could not find TEXTBOOK_CONFIGS array');
    process.exit(1);
  }

  const existingConfigs = configsMatch[2];

  if (!existingConfigs.includes(`'${sanitizedName}'`)) {
    const newConfig = `  { id: '${sanitizedName}', path: '${sanitizedName}', coming_soon: true },`;
    const updatedConfigs = existingConfigs.trim() + '\n' + newConfig + '\n';
    
    const updatedContent = serviceContent.replace(
      configsRegex, 
      `$1\n${updatedConfigs}$3`
    );
    
    fs.writeFileSync(serviceFile, updatedContent);
    console.log(`🔧 Updated textbookService.ts (marked as coming soon)`);
  }

  console.log(`\n✅ Successfully created ${withChapters ? 'advanced ' : ''}textbook "${displayName}"!`);
  console.log(`\n📍 Location: ${textbookDir}`);
  console.log(`🌐 URL: http://localhost:5173/#/textbook/${sanitizedName} (coming soon)`);
  
  if (withChapters) {
    console.log(`📚 Created with ${chaptersContent.length} sample chapters`);
  }
  
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Customize the content in ${path.basename(textbookDir)}/`);
  console.log(`   2. Edit metadata in index.yml`);
  console.log(`   3. Add your content to index.md and chapter files`);
  console.log(`   4. Start the dev server: npm run dev`);

} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}
