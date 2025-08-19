# Content Organization Structure

This document outlines the recommended structure for organizing textbook content in a hierarchical manner.

## Directory Structure

```
textbook_folder/
├── index.md                    # Main textbook introduction
├── config.json               # Textbook configuration and navigation
├── chapters/
│   ├── 01-chapter-name/
│   │   ├── index.md          # Chapter introduction
│   │   ├── 01-section-name.md
│   │   ├── 02-section-name.md
│   │   └── sections/         # For complex sections
│   │       ├── subsection-a.md
│   │       └── subsection-b.md
│   ├── 02-another-chapter/
│   │   ├── index.md
│   │   ├── pages/           # Alternative organization
│   │   │   ├── introduction.md
│   │   │   ├── fundamentals.md
│   │   │   └── advanced.md
│   │   └── fragments/       # Reusable content pieces
│   │       ├── code-examples.md
│   │       ├── exercises.md
│   │       └── glossary.md
│   └── appendices/
│       ├── references.md
│       └── glossary.md
├── assets/                   # Images, diagrams, etc.
│   ├── images/
│   ├── diagrams/
│   └── videos/
└── shared/                   # Shared content across chapters
    ├── formulas.md
    ├── definitions.md
    └── examples.md
```

## Configuration Format (config.json)

```json
{
  "title": "Textbook Title",
  "description": "Textbook description",
  "authors": ["Author Name"],
  "version": "1.0.0",
  "navigation": [
    {
      "id": "intro",
      "title": "Introduction",
      "file": "index.md",
      "type": "page"
    },
    {
      "id": "chapter-1",
      "title": "Chapter 1: Foundations",
      "file": "chapters/01-foundations/index.md",
      "type": "chapter",
      "children": [
        {
          "id": "basics",
          "title": "Basic Concepts",
          "file": "chapters/01-foundations/01-basics.md",
          "type": "section"
        },
        {
          "id": "principles",
          "title": "Core Principles",
          "file": "chapters/01-foundations/02-principles.md",
          "type": "section"
        }
      ]
    }
  ]
}
```

## Benefits of This Structure

1. **Scalable**: Easy to add new chapters, sections, and subsections
2. **Flexible**: Multiple organization patterns supported
3. **Reusable**: Fragments can be included in multiple places
4. **Maintainable**: Clear separation of content and structure
5. **Collaborative**: Multiple authors can work on different sections
6. **Asset Management**: Centralized location for media files
