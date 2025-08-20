#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the textbook name from command line arguments
const textbookName = process.argv[2];

if (!textbookName) {
  console.error('❌ Error: Please provide a textbook name');
  console.log('Usage: npm run create-textbook <textbook-name>');
  console.log('Example: npm run create-textbook programming');
  process.exit(1);
}

// Sanitize the textbook name for use as directory/id
const sanitizedName = textbookName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
const displayName = textbookName.split(/[^a-zA-Z0-9]+/)
  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  .join(' ');

console.log(`📚 Creating new textbook: "${displayName}" (${sanitizedName})`);

// Define paths
const textbooksDir = path.join(__dirname, '..', 'public', 'textbooks');
const textbookDir = path.join(textbooksDir, sanitizedName);
const serviceFile = path.join(__dirname, '..', 'src', 'services', 'textbookService.ts');

// Check if textbook already exists
if (fs.existsSync(textbookDir)) {
  console.error(`❌ Error: Textbook "${sanitizedName}" already exists at ${textbookDir}`);
  process.exit(1);
}

try {
  // Create textbook directory
  fs.mkdirSync(textbookDir, { recursive: true });
  console.log(`📁 Created directory: ${textbookDir}`);

  // Create index.yml
  const indexYml = `title: ${displayName}
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

  fs.writeFileSync(path.join(textbookDir, 'index.yml'), indexYml);
  console.log(`📄 Created: index.yml`);

  // Create index.md
  const indexMd = `# ${displayName}

Welcome to the ${displayName} textbook!

## Introduction

This textbook covers the fundamentals of ${displayName.toLowerCase()}, providing you with a comprehensive understanding of the subject.

## What You'll Learn

- Core concepts and principles
- Practical applications
- Advanced topics and techniques
- Best practices and methodologies

## Getting Started

Begin your journey by exploring the chapters in the navigation sidebar. Each chapter builds upon the previous one, so we recommend following them in order.

---

*Happy learning!*
`;

  fs.writeFileSync(path.join(textbookDir, 'index.md'), indexMd);
  console.log(`📄 Created: index.md`);

  // Update textbookService.ts
  const serviceContent = fs.readFileSync(serviceFile, 'utf8');
  
  // Find the TEXTBOOK_CONFIGS array and add the new textbook
  const configsRegex = /(const TEXTBOOK_CONFIGS = \[)([\s\S]*?)(\])/;
  const configsMatch = serviceContent.match(configsRegex);
  
  if (!configsMatch) {
    console.error('❌ Error: Could not find TEXTBOOK_CONFIGS array in textbookService.ts');
    process.exit(1);
  }

  const existingConfigs = configsMatch[2];

  // Check if textbook is already registered
  if (existingConfigs.includes(`'${sanitizedName}'`)) {
    console.log(`⚠️  Textbook "${sanitizedName}" is already registered in textbookService.ts`);
  } else {
    // Add new textbook config before the closing bracket
    const newConfig = `  { id: '${sanitizedName}', path: '${sanitizedName}' },`;
    const updatedConfigs = existingConfigs.trim() + '\n' + newConfig + '\n';
    
    const updatedContent = serviceContent.replace(
      configsRegex, 
      `$1\n${updatedConfigs}$3`
    );
    
    fs.writeFileSync(serviceFile, updatedContent);
    console.log(`🔧 Updated textbookService.ts to include "${sanitizedName}"`);
  }

  console.log(`\n✅ Successfully created textbook "${displayName}"!`);
  console.log(`\n📍 Location: ${textbookDir}`);
  console.log(`🌐 URL: http://localhost:5173/#/textbook/${sanitizedName}`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Edit ${path.join(textbookDir, 'index.yml')} to customize metadata`);
  console.log(`   2. Edit ${path.join(textbookDir, 'index.md')} to add content`);
  console.log(`   3. Add additional chapters and sections as needed`);
  console.log(`   4. Start the dev server: npm run dev`);

} catch (error) {
  console.error(`❌ Error creating textbook: ${error.message}`);
  process.exit(1);
}
