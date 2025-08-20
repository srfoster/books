# Textbook Creation Scripts

This directory contains scripts for automatically creating new textbooks with proper structure and boilerplate content.

## Available Scripts

### Basic Textbook Creation

```bash
npm run create-textbook <textbook-name>
```

**Example:**
```bash
npm run create-textbook "Machine Learning"
# Creates: machine_learning/
```

**What it creates:**
- Directory: `public/textbooks/machine_learning/`
- Files: `index.yml`, `index.md`
- Registers textbook in `textbookService.ts`

### Advanced Textbook Creation

```bash
npm run create-textbook-advanced <textbook-name> [--with-chapters]
```

**Example:**
```bash
npm run create-textbook-advanced "Data Science" --with-chapters
# Creates: data_science/ with sample chapters
```

**What it creates:**
- Directory: `public/textbooks/data_science/`
- Files: `index.yml`, `index.md`
- Sample chapters (if `--with-chapters` flag is used):
  - `chapters/01-introduction/index.md`
  - `chapters/02-fundamentals/index.md`
  - `chapters/03-advanced_topics/index.md`
- Registers textbook in `textbookService.ts`

## Generated Structure

### Basic Textbook
```
public/textbooks/your_textbook/
├── index.yml          # Metadata and chapter configuration
└── index.md           # Main content
```

### Advanced Textbook (with chapters)
```
public/textbooks/your_textbook/
├── index.yml          # Metadata and chapter configuration
├── index.md           # Overview content
└── chapters/
    ├── 01-introduction/
    │   └── index.md
    ├── 02-fundamentals/
    │   └── index.md
    └── 03-advanced_topics/
        └── index.md
```

## Customization

After running the script:

1. **Edit `index.yml`** to customize:
   - Title and description
   - Author information
   - Chapter structure

2. **Edit `index.md`** to add your content

3. **Add more chapters** by creating new directories and updating `index.yml`

## Features

- ✅ Automatic directory creation
- ✅ Boilerplate YAML and Markdown generation
- ✅ Automatic registration in textbookService.ts
- ✅ Sanitized naming (spaces → underscores)
- ✅ Duplicate prevention
- ✅ Professional templates
- ✅ Sample chapter structure

## Name Sanitization

Textbook names are automatically sanitized:
- `"Machine Learning"` → `machine_learning`
- `"Data Science & AI"` → `data_science_ai`
- `"Web Development"` → `web_development`

The display name preserves proper capitalization while the directory/ID uses the sanitized version.
