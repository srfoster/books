# Textbook App

TODO:

* Progress page bug: "Continue Reading" buttons not working

A React-based web application for serving and viewing textbooks authored in markdown format.

## Features

- **Textbook Library**: Browse available textbooks from your collection
- **Chapter Navigation**: Easy navigation between chapters within each textbook
- **Markdown Support**: Full support for markdown content including:
  - GitHub Flavored Markdown (tables, strikethrough, etc.)
  - Mathematical equations via KaTeX
  - Code syntax highlighting
- **Responsive Design**: Works on desktop and mobile devices
- **TypeScript**: Full type safety throughout the application

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Navigation.tsx   # Main navigation bar
│   │   ├── TextbookList.tsx # Textbook listing page
│   │   └── TextbookViewer.tsx # Individual textbook viewer
│   ├── types/               # TypeScript type definitions
│   │   └── Textbook.ts      # Textbook and Chapter types
│   ├── App.tsx              # Main application component
│   ├── App.css              # Application styles
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── package.json             # Dependencies and scripts
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint to check for code issues

## Adding Textbooks

The application is designed to serve textbooks from the parent directories of this repo:

- `ai_ml/` - AI & Machine Learning content
- `math/` - Mathematics content  
- `stoicism/` - Philosophy content
- `history/` - Historical content

To add a new textbook:

1. Create markdown files in the appropriate directory
2. Update the textbook configuration in `src/App.tsx`
3. Add chapter information to link to specific markdown files

## Content Integration

In a production setup, you would:

1. Set up a backend API to serve markdown content from the textbook directories
2. Implement file system watching to automatically update the textbook list
3. Add search functionality across all content
4. Implement content caching for better performance

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **React Markdown** - Markdown rendering
- **KaTeX** - Mathematical equation rendering
- **Remark/Rehype** - Markdown processing plugins

## Future Enhancements

- [ ] Full-text search across all textbooks
- [ ] Table of contents generation
- [ ] Progress tracking
- [ ] Note-taking functionality
- [ ] Export to PDF
- [ ] Dark/light theme toggle
- [ ] Mobile-optimized reading experience
