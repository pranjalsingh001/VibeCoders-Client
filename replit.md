# Overview

VibeCoders IDE is an AI-powered development platform that simulates real-world software development workflows. The application functions as an interactive IDE where users act as project managers while AI serves as the developer, guiding the entire development process from initial idea and planning through to fully coded, scalable full-stack applications. The platform emphasizes a planning-first approach, teaching users the complete software development lifecycle including system design, architecture decisions, and implementation workflows used in professional tech environments.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client application is built using React with TypeScript, leveraging modern development practices and a component-based architecture. The frontend uses Vite as the build tool and development server, providing fast hot module replacement and optimized production builds.

**UI Framework**: The application utilizes shadcn/ui components built on top of Radix UI primitives for consistent, accessible user interface elements. TailwindCSS provides utility-first styling with a custom design system supporting both light and dark themes.

**State Management**: The application employs Zustand for client-side state management, with separate stores for authentication, workflow management, and workspace functionality. TanStack Query (React Query) handles server state management, caching, and API interactions.

**Routing**: The application uses Wouter as a lightweight routing solution, providing client-side navigation between different application views including dashboard, workflow management, and workspace pages.

## Backend Architecture
The server is built using Express.js with TypeScript, following RESTful API design principles. The architecture separates concerns through distinct layers for routing, business logic, and data persistence.

**API Design**: Routes are organized into logical groups (authentication, projects, workflows, files) with consistent error handling and request/response patterns. JWT-based authentication secures protected endpoints with middleware-based token verification.

**Data Layer**: The application uses an abstraction layer for data storage, currently implementing in-memory storage for development but designed to easily swap to persistent databases. The storage interface defines methods for managing users, projects, workflows, and project files.

## Database Architecture
The schema is designed using Drizzle ORM with PostgreSQL as the target database. The data model supports the complete development workflow with proper relationships and constraints.

**Core Entities**:
- Users with authentication credentials
- Projects linked to users with status tracking
- Workflows managing development stages and AI-generated content
- Project files with hierarchical organization
- AI sessions for conversation management

**Workflow Management**: The workflow system tracks multiple development stages (planning, blueprint, high-level design, low-level design, code generation) with JSON storage for flexible AI-generated content and planning data.

## Authentication System
JWT-based authentication provides stateless session management with bcrypt password hashing for security. The system includes user registration, login, and token-based API access control.

## Development Workflow Integration
The platform implements a structured development process mirroring real-world software engineering practices:

1. **Planning Phase**: Interactive questionnaires gather project requirements
2. **Blueprint Stage**: High-level system architecture and technology decisions
3. **Design Phases**: Both high-level and low-level design documentation
4. **Code Generation**: AI-powered implementation with file management
5. **Workspace**: VS Code-like interface for file editing and project management

# External Dependencies

## Frontend Dependencies
- **React Ecosystem**: React 18+ with TypeScript for component development
- **UI Components**: Radix UI primitives for accessible component foundations
- **Styling**: TailwindCSS for utility-first styling with PostCSS processing
- **State Management**: TanStack Query for server state, Zustand for client state
- **Development Tools**: Vite for build tooling with hot module replacement
- **Form Handling**: React Hook Form with Zod validation for type-safe forms
- **Code Editor**: Monaco Editor integration for in-browser code editing

## Backend Dependencies
- **Runtime**: Node.js with Express.js web framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: JWT for token-based auth, bcrypt for password hashing
- **Development**: tsx for TypeScript execution, esbuild for production builds
- **Database Provider**: Neon Database (serverless PostgreSQL) for cloud hosting

## Build and Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundling for production builds
- **Replit Integration**: Custom plugins for development environment integration
- **Database Management**: Drizzle Kit for schema migrations and database operations

## Third-party Services
- **Database Hosting**: Neon Database for serverless PostgreSQL hosting
- **Session Management**: Session storage with potential Redis backend support
- **Development Environment**: Replit-specific tooling for cloud development