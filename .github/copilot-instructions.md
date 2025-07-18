# Copilot Instructions for MoveMe

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Next.js TypeScript application for rating and tagging movies. The app uses:
- **Frontend**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **State Management**: React hooks and server actions

## Key Features to Implement
- Add movies to the database
- Rate movies (1-5 stars)
- Tag movies with genres/categories
- Search and filter movies
- Persistent storage with Supabase
- Responsive design

## Code Style Guidelines
- Use TypeScript for all components and utilities
- Follow Next.js App Router patterns
- Use Tailwind CSS for styling
- Implement proper error handling
- Use React Server Components where appropriate
- Follow modern React patterns with hooks

## Database Schema
The main entities are:
- **Movies**: id, title, description, year, poster_url, created_at
- **Ratings**: id, movie_id, rating, user_id, created_at
- **Tags**: id, name, color
- **MovieTags**: movie_id, tag_id (many-to-many relationship)

## Supabase Integration
- Use Supabase client for database operations
- Implement proper environment variable handling
- Use Row Level Security (RLS) for data protection
- Follow Supabase best practices for real-time updates
