# Technology Stack

**Analysis Date:** 2026-03-15

## Languages

**Primary:**
- TypeScript - Frontend and backend logic
- SQL - Database schema and functions

**Secondary:**
- JavaScript - Runtime execution in browsers and Node.js
- Shell/Bash - Scripts and automation

## Runtime

**Environment:**
- Node.js (for development and build processes)
- Deno (for Supabase Edge Functions)

**Package Manager:**
- npm
- Lockfile: present (package-lock.json)

## Frameworks

**Core:**
- React 19.2.0 - Frontend UI framework
- React Router DOM 7.12.0 - Client-side routing
- Vite 7.2.4 - Build tool and development server

**Testing:**
- Not detected

**Build/Dev:**
- TypeScript Compiler - Type checking and transpilation
- ESLint - Code linting
- PostCSS - CSS processing

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.90.1 - Supabase client for database and auth
- @tanstack/react-query 5.90.21 - Server state management
- react-hook-form 7.71.1 - Form handling and validation
- zod 4.3.5 - Schema validation
- framer-motion 12.36.0 - Animation library
- recharts 3.7.0 - Charting library

**Infrastructure:**
- @radix-ui/react-* - UI component primitives
- tailwind-merge, class-variance-authority, clsx - Utility-first CSS classes
- lucide-react - Icon components

## Configuration

**Environment:**
- Environment variables loaded via Vite's import.meta.env
- Required variables defined in .env.example

**Build:**
- vite.config.ts - Vite configuration with React plugin
- tsconfig.json - TypeScript configuration files
- postcss.config.js - PostCSS configuration
- eslint.config.js - ESLint configuration

## Platform Requirements

**Development:**
- Node.js (latest LTS recommended)
- npm package manager
- Git for version control

**Production:**
- Supabase project
- Edge Functions runtime (Deno-based)
- Static hosting for frontend assets

---

*Stack analysis: 2026-03-15*