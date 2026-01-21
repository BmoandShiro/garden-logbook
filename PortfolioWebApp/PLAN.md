# Portfolio WebApp - Planning Document

## Overview
A dark-themed, impressive portfolio webapp to serve as a resume, accessible via Tailscale funnel on a different port than the garden logbook (port 3000).

## Tech Stack Recommendations

### Frontend Framework Options:
1. **Next.js 14+ (Recommended)**
   - Server-side rendering for better SEO
   - Built-in routing
   - Easy deployment
   - Great for portfolio sites
   - Can use App Router for modern React patterns

2. **React + Vite**
   - Fast development experience
   - Lightweight
   - Good for client-side rendering

3. **Astro**
   - Excellent for static sites
   - Can integrate React components
   - Great performance

**Recommendation: Next.js 14** - Best balance of features, SEO, and impressiveness for hiring managers.

### Styling:
- **Tailwind CSS** - Modern, utility-first, easy dark theme
- **Framer Motion** - Smooth animations and transitions
- **Shadcn/ui** - Beautiful, accessible component library

### Additional Libraries:
- **React Icons** - Icon library
- **React Typewriter** or similar - Cool text effects
- **Three.js** or **React Three Fiber** (optional) - 3D elements for wow factor

## Port Configuration
- **Port: 3001** (or 3002, 3003, etc.)
- Ensure it doesn't conflict with garden logbook on 3000
- **Docker Port Mapping**: 3001:3001 (host:container)

## Docker Setup

### Why Docker?
- **Portability**: Work from any computer with Docker installed
- **Consistency**: Same environment across all machines
- **Easy Setup**: No need to install Node.js, npm, etc. on each machine
- **Isolation**: Won't conflict with other projects or system dependencies

### Docker Configuration:

#### Development Setup:
- **Dockerfile.dev**: Multi-stage build for development
- **docker-compose.yml**: Easy development workflow
- **Volume mounting**: Hot reload for instant changes
- **Node.js version**: Latest LTS (20.x)

#### Production Setup:
- **Dockerfile**: Optimized production build
- **Multi-stage build**: Smaller final image
- **Next.js standalone output**: Minimal dependencies

#### Files to Create:
- `Dockerfile` - Production build
- `Dockerfile.dev` - Development build (optional, can use docker-compose)
- `docker-compose.yml` - Development environment
- `docker-compose.prod.yml` - Production environment (optional)
- `.dockerignore` - Exclude unnecessary files

#### Docker Commands:
```bash
# Development
docker-compose up          # Start dev server
docker-compose up -d       # Start in background
docker-compose down        # Stop containers

# Production
docker build -t portfolio .
docker run -p 3001:3001 portfolio
```

#### Benefits:
- ✅ Works on any OS (Linux, macOS, Windows)
- ✅ No local Node.js installation needed
- ✅ Consistent Node/npm versions
- ✅ Easy to share with others
- ✅ Can run multiple instances easily

## Site Structure & Sections

### 1. **Hero Section**
   - Name and title
   - Brief tagline/description
   - Animated background or particle effect
   - CTA buttons (View Projects, Contact, Download Resume)
   - Smooth scroll indicator

### 2. **About Me**
   - Professional summary
   - Skills overview (with icons/visualizations)
   - Tech stack badges
   - Personal interests (optional, brief)

### 3. **Projects Showcase** (Main Focus)
   - Featured projects section
   - Project cards with:
     - Screenshot/demo image
     - Title and description
     - Tech stack used
     - Live demo link (if available)
     - GitHub link
     - Key features list
   - Filter by technology/category
   - Search functionality
   - Detailed project modals/pages

### 4. **Skills & Technologies**
   - Categorized skills (Frontend, Backend, Tools, etc.)
   - Proficiency indicators or icons
   - Interactive skill visualization

### 5. **Experience** (Optional)
   - Work history
   - Education
   - Certifications

### 6. **GitHub Integration**
   - Showcase GitHub projects
   - GitHub stats widget
   - Contribution graph
   - Recent activity

### 7. **Contact Section**
   - Contact form
   - Social links (GitHub, LinkedIn, etc.)
   - Email
   - Resume download

### 8. **Footer**
   - Quick links
   - Copyright
   - "Made with ❤️" note

## Design Principles

### Dark Theme Palette:
- **Background**: Deep dark (#0a0a0a, #111111)
- **Surface**: Slightly lighter (#1a1a1a, #1f1f1f)
- **Primary Accent**: Vibrant color (blue, purple, or green)
- **Text**: Light gray (#e5e5e5) with white for headings
- **Borders**: Subtle gray (#2a2a2a)
- **Gradients**: Subtle, modern gradients

### Visual Effects:
- Smooth scroll animations
- Hover effects on cards
- Parallax scrolling (subtle)
- Glassmorphism effects
- Gradient accents
- Particle effects or animated background
- Smooth page transitions

### Typography:
- Modern, readable font (Inter, Poppins, or similar)
- Clear hierarchy
- Good contrast for accessibility

## Features to Impress Hiring Managers

1. **Performance**
   - Fast load times
   - Optimized images
   - Lazy loading
   - Code splitting

2. **Responsive Design**
   - Mobile-first approach
   - Works on all screen sizes
   - Touch-friendly interactions

3. **Interactive Elements**
   - Smooth animations
   - Micro-interactions
   - Hover states
   - Loading states

4. **Accessibility**
   - Semantic HTML
   - ARIA labels
   - Keyboard navigation
   - Screen reader friendly

5. **Modern Tech Stack**
   - Latest frameworks
   - Best practices
   - Clean code structure

6. **Project Details**
   - Live demos where possible
   - Code quality showcase
   - Problem-solving narratives
   - Impact/results metrics

## Project Showcase Format

For each project (webapp, screenshot app, GitHub projects):

### Project Card:
- Hero image/screenshot
- Project name
- Brief description (1-2 sentences)
- Tech stack badges
- Links (Live Demo, GitHub)

### Project Detail Page/Modal:
- Full description
- Problem statement
- Solution approach
- Key features (bulleted)
- Technologies used
- Screenshots/gifs
- Challenges overcome
- Results/impact
- Code snippets (optional)
- Live demo embed (if applicable)

## Implementation Phases

### Phase 1: Setup & Foundation
- [ ] Initialize Next.js project
- [ ] Set up Docker configuration (Dockerfile, docker-compose.yml)
- [ ] Configure Tailwind with dark theme
- [ ] Set up project structure
- [ ] Configure port (3001) in Docker and Next.js
- [ ] Test Docker setup (build and run)
- [ ] Basic routing

### Phase 2: Core Layout
- [ ] Navigation bar
- [ ] Hero section
- [ ] Footer
- [ ] Dark theme implementation
- [ ] Responsive layout

### Phase 3: Content Sections
- [ ] About section
- [ ] Skills section
- [ ] Projects showcase (with sample data)
- [ ] Contact section

### Phase 4: Projects Integration
- [ ] Add garden logbook project
- [ ] Add other webapp project
- [ ] Add screenshot portable app
- [ ] Integrate GitHub projects API
- [ ] Project detail pages/modals

### Phase 5: Polish & Enhancements
- [ ] Animations (Framer Motion)
- [ ] Visual effects
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Accessibility improvements

### Phase 6: Deployment Prep
- [ ] Optimize Docker production build
- [ ] Test Docker setup on different machines
- [ ] Test on Tailscale funnel
- [ ] Final polish
- [ ] Documentation (README with Docker instructions)

## File Structure

```
PortfolioWebApp/
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx           # Home page
│   ├── projects/
│   │   ├── page.tsx       # Projects listing
│   │   └── [slug]/
│   │       └── page.tsx   # Individual project
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── About.tsx
│   │   ├── Projects.tsx
│   │   ├── Skills.tsx
│   │   └── Contact.tsx
│   └── ui/                # Reusable UI components
│       ├── ProjectCard.tsx
│       ├── SkillBadge.tsx
│       └── ...
├── data/
│   └── projects.ts        # Project data
├── lib/
│   └── utils.ts
├── public/
│   ├── images/
│   └── resume.pdf
├── Dockerfile             # Production Dockerfile
├── Dockerfile.dev         # Development Dockerfile (optional)
├── docker-compose.yml     # Development environment
├── docker-compose.prod.yml # Production environment (optional)
├── .dockerignore          # Docker ignore file
├── .env.example           # Environment variables template
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Next Steps

1. **Confirm Tech Stack** - Do you prefer Next.js, or another framework?
2. **Gather Assets** - Collect screenshots, project descriptions, resume PDF
3. **List All Projects** - Create a list of all projects to showcase
4. **Design Mockup** (Optional) - Sketch or describe preferred layout
5. **Start Implementation** - Begin with Phase 1

## Questions to Consider

1. Do you want a blog section for articles/thoughts?
2. Should we integrate with GitHub API for dynamic project fetching?
3. Do you want analytics (privacy-friendly)?
4. Any specific color scheme preferences beyond dark theme?
5. Do you want a contact form with email functionality?
6. Should projects be filterable by category/technology?

---

**Ready to start?** Let me know if you'd like to adjust anything in this plan, or if you're ready to begin implementation!
