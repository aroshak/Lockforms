# LockForms

> **The beauty of Typeform. The security of localhost.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)

LockForms is a **secure, self-hostable form builder** with a glassmorphic, Apple-inspired design. It runs as a single codebase in two modes:

- **SaaS Mode** — Cloud-hosted, multi-tenant
- **Appliance Mode** — On-premises Docker deployment, fully air-gapped with RSA license enforcement

---

## ✨ Features

### Form Builder
- 🎨 **Drag-and-drop** question builder with `@dnd-kit`
- 📋 **14+ question types**: Text, Email, Number, Paragraph, Date, DateTime, Rating (⭐ stars), Scale (1–10), Radio, Checkbox, Dropdown, Picture Choice, File Upload, Signature, Statement, Website URL
- 🔀 **Conditional Logic Jumps** — route respondents based on answers
- 🎭 **4 Transition Styles** — Tunnel (3D depth), Flow (slide), Fade, Stack
- 🎨 **7 Themes** — Midnight, Sunrise, Ocean, Forest, Crisp White, Soft Pearl, Corporate
- ⚡ **Keyboard Shortcuts** — A/B/C shortcuts for choice questions, Enter to advance

### Form Renderer
- ⌨️ **Typeform-style** one-question-at-a-time experience
- 🌊 **Fluid animations** powered by Framer Motion
- 📱 **Fully responsive** across all screen sizes
- 🔒 **Password-protected forms** with server-side token validation
- 🪄 **Welcome & End screens** fully customizable

### Sharing & Embedding
- 🔗 **4 access levels**: Public, Link-Only (token), Password-Protected, Private
- `<iframe>` **embed support** with domain whitelisting
- 📏 Custom embed dimensions (width/height)
- 🏷️ Optional "Powered by LockForms" branding

### Admin Dashboard
- 📊 **Submissions analytics** — answer distributions, response counts
- 👁️ **Individual submission viewer** — expandable answer cards
- 🔄 **Form duplication** with React Portal modal
- 🗑️ **Form management** (create, edit, delete, duplicate)

### Security
- 🔐 **JWT session management** with encrypted cookies
- 🔑 **bcrypt** password hashing
- 🛡️ **Strict CSP headers** and `X-Frame-Options` on admin routes
- 🧹 **Input sanitization** with `isomorphic-dompurify`
- ✅ **Zod validation** for all environment variables and form submissions
- 🏢 **RSA license key** verification for Appliance Mode

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, TypeScript, React 19) |
| **Database** | PostgreSQL 15+ |
| **ORM** | Prisma |
| **Validation** | Zod |
| **Styling** | Tailwind CSS + custom glassmorphism utilities |
| **Animations** | Framer Motion |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **Auth** | JWT (jose) + bcryptjs |
| **Sanitization** | isomorphic-dompurify |
| **Icons** | Lucide React |
| **Signature** | react-signature-canvas |
| **Testing** | Jest + React Testing Library + Playwright (E2E) |
| **Deployment** | Docker + Docker Compose |

---

## 🚀 Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)
- OR: Node.js 20+, PostgreSQL 15+

### Option 1: Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/aroshak/Lockforms.git
cd Lockforms

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env — set your admin password hash (see below)
# ADMIN_PASSWORD_HASH=$(node -e "const b=require('bcryptjs');b.hash('yourpassword',10).then(h=>console.log(h))")

# 4. Start everything
docker compose up -d

# 5. Run database migrations
docker compose exec app npx prisma migrate deploy

# 6. Open in browser
open http://localhost:3000
```

### Option 2: Local Development

```bash
# 1. Clone and install dependencies
git clone https://github.com/aroshak/Lockforms.git
cd Lockforms
npm install

# 2. Set up PostgreSQL and update .env
cp .env.example .env
# Edit DATABASE_URL in .env

# 3. Run migrations
npx prisma migrate deploy
npx prisma generate

# 4. Start the dev server
npm run dev
```

---

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
# Database
DATABASE_URL="postgresql://lockforms_user:your_password@localhost:5432/lockforms_db"

# Admin Authentication (required)
# Generate with: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('yourpassword', 10).then(h => console.log(h))"
ADMIN_PASSWORD_HASH="$2b$10$..."

# Application URL (for share/embed link generation)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# License key (Appliance Mode only — optional for development)
# LICENSE_KEY="your-rsa-signed-license-key"
```

### Generating an Admin Password Hash

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-secure-password', 10).then(h => console.log(h))"
```

Paste the output as `ADMIN_PASSWORD_HASH` in your `.env`.

---

## 🐳 Docker Deployment

The project ships with a production-ready, security-hardened Docker configuration:

```bash
# Production deployment
docker compose -f docker-compose.yml up -d --build

# View logs
docker compose logs -f app

# Stop
docker compose down
```

### Environment Variables for Docker Compose

```bash
POSTGRES_USER=lockforms_user     # default: lockforms
POSTGRES_PASSWORD=your_password  # CHANGE THIS
POSTGRES_DB=lockforms_db         # default: lockforms
```

---

## 🗂️ Project Structure

```
LockForms/
├── src/
│   ├── app/
│   │   ├── admin/              # Protected admin dashboard
│   │   │   ├── builder/        # Form builder page + server actions
│   │   │   ├── submissions/    # Submissions analytics & viewer
│   │   │   ├── login/          # Admin login
│   │   │   ├── CopyFormButton.tsx
│   │   │   ├── DeleteFormButton.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx        # Dashboard
│   │   ├── api/
│   │   │   └── forms/[slug]/
│   │   │       ├── route.ts           # GET form (with access control)
│   │   │       ├── submit/route.ts    # POST submission
│   │   │       ├── share/route.ts     # GET/POST share settings
│   │   │       └── verify-password/route.ts
│   │   ├── f/
│   │   │   ├── [slug]/page.tsx  # Public form renderer
│   │   │   └── demo/page.tsx    # Live demo
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx             # Landing page
│   ├── components/
│   │   ├── form-builder/
│   │   │   ├── FormBuilder.tsx
│   │   │   ├── SortableQuestionItem.tsx
│   │   │   ├── OptionsEditor.tsx
│   │   │   └── FormSettingsPanel.tsx
│   │   ├── form-renderer/
│   │   │   ├── FormRenderer.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── SelectInput.tsx
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── EndScreen.tsx
│   │   │   └── PasswordPrompt.tsx
│   │   ├── share/
│   │   │   ├── SharePanel.tsx
│   │   │   ├── AccessLevelSelector.tsx
│   │   │   ├── EmbedCustomizer.tsx
│   │   │   ├── EmbedCodeBlock.tsx
│   │   │   └── QuickShareButton.tsx
│   │   └── ui/                  # Base UI components
│   ├── hooks/
│   │   └── useCopyToClipboard.ts
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── embed.ts
│   │   ├── env.ts
│   │   ├── server-utils.ts
│   │   ├── utils.ts
│   │   ├── license/validator.ts
│   │   ├── sanitization/answers.ts
│   │   └── validation/submission.ts
│   ├── middleware.ts
│   └── types/
│       └── form.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── e2e/                          # Playwright E2E tests
├── Dockerfile
├── docker-compose.yml
├── next.config.js
├── tailwind.config.ts
└── .env.example
```

---

## 🧪 Testing

```bash
# Unit tests (Jest + React Testing Library)
npm test

# Watch mode
npm run test:watch

# E2E tests (Playwright)
npx playwright test

# E2E with UI
npx playwright test --ui
```

---

## 📐 Question Types Reference

| Type | Description | Input |
|---|---|---|
| `text` | Short text | Single-line input |
| `email` | Email address | Validated email input |
| `number` | Numeric value | Number input |
| `paragraph` | Long text | Multi-line textarea |
| `date` | Date picker | Date input |
| `datetime` | Date & time | Datetime-local input |
| `rating` | Star rating | ⭐ 1–5 stars |
| `scale` | Numeric scale | 🔢 Configurable range (default 1–10) |
| `radio` | Single choice | Radio buttons with A/B/C shortcuts |
| `checkbox` | Multiple choice | Checkboxes with A/B/C shortcuts |
| `dropdown` | Searchable select | Custom dropdown with A/B/C shortcuts |
| `picture-choice` | Image selection | Grid of images with radio/checkbox logic |
| `file` | File upload | Drag-and-drop, base64 encoded |
| `signature` | Signature pad | Canvas drawing → PNG |
| `statement` | Info block | Display-only text/instructions |
| `website` | URL input | Validated URL input |

---

## 🔒 Security Model

### Admin Authentication
- Password hashed with **bcrypt** (cost factor 10)
- Session stored as **JWT** in an `HttpOnly` encrypted cookie
- Protected by Next.js **Middleware** on all `/admin` routes

### Form Access Control
| Level | Description |
|---|---|
| `public` | Anyone with the link |
| `link-only` | Requires a secret share token |
| `password-protected` | Requires password + server-validates token |
| `private` | Disabled, returns 403 |

### Security Headers (Admin)
```
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### Docker Security
- Runs as **non-root** user (`nextjs:nodejs`)
- **Capability dropping**: `cap_drop: ALL`, `cap_add: NET_BIND_SERVICE`
- No secrets in image — all via environment variables

---

## 🏢 Appliance Mode (On-Premises)

LockForms supports fully air-gapped deployment with license enforcement:

1. **Generate a license key** (RSA-signed) containing: `customerId`, `expiresAt`, `features`
2. Set `LICENSE_KEY` environment variable on the appliance
3. The app validates the signature on startup using the embedded public key
4. **Fonts** are self-hosted via `next/font/google` (runtime fetch on first build, then cached)

For fully air-gapped builds, replace with `next/font/local` and bundle the font files.

---

## 🎨 Design System

LockForms uses a custom glassmorphism design system built on Tailwind CSS:

```css
/* Key utility classes */
.glass          /* Frosted glass card */
.glass-strong   /* Stronger blur + border */
.gradient-text  /* Animated gradient text */
.btn-primary    /* Primary CTA button */
.custom-scrollbar /* Styled scrollbars */
```

**Color palette:**
- Primary: `#8257e5` (purple)
- Surface: `rgba(255,255,255,0.05)`  
- Border: `rgba(255,255,255,0.1)`

---

## 🛣️ Roadmap

- [ ] Advanced form logic (variables, calculations, hidden fields)
- [ ] Webhook integrations (Zapier, Make, custom endpoints)
- [ ] Team collaboration & role-based access
- [ ] Custom domain support (SaaS mode)
- [ ] Submission export (CSV, PDF)
- [ ] Email notifications on submission
- [ ] Form versioning & A/B testing
- [ ] White-label branding (Appliance Mode)
- [ ] API key authentication for programmatic access
- [ ] Stripe billing integration (SaaS Mode)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feat/my-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is proprietary software.

For Appliance Mode licensing, contact: **support@lockforms.io**

---

<div align="center">
  <br/>
  <strong>Built with ❤️ for teams that care about security and user experience.</strong>
  <br/>
  <a href="https://lockforms.io">lockforms.io</a>
</div>
