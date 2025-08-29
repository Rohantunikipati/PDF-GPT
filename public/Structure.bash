PDF-GPT/
│── src/
│   ├── app/
│   │   ├── (public)/                    # Public routes (no auth needed)
│   │   │   └── page.tsx                 # Landing page
│   │   │
│   │   ├── (protected)/                 # Auth-protected routes
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx             # Dashboard with chat + upload
│   │   │   └── layout.tsx               # Layout wrapping Clerk auth
│   │   │
│   │   ├── api/                         # API Routes
│   │   │   ├── upload/route.ts          # Handle PDF upload + QStash enqueue
│   │   │   ├── process/route.ts         # QStash webhook → extract + embed PDF
│   │   │   └── query/route.ts           # Query vectors + OpenAI completion
│   │   │
│   │   ├── layout.tsx                   # Root layout
│   │   └── page.tsx                     # Redirect → (public) or dashboard
│   │
│   ├── lib/
│   │   ├── auth.ts                      # Clerk helper (get user, protect routes)
│   │   ├── redis.ts                     # Upstash Redis client
│   │   ├── vector.ts                    # Upstash Vector client
│   │   ├── qstash.ts                    # Upstash QStash client
│   │   └── openai.ts                    # OpenAI embeddings + chat client
│   │
│   ├── utils/
│   │   ├── pdf.ts                       # Extract + chunk PDF text
│   │   └── embeddings.ts                # Generate embeddings helper
│   │
│   ├── components/
│   │   ├── ui/                          # Buttons, Inputs, Modals, etc.
│   │   ├── navbar.tsx
│   │   ├── upload-form.tsx              # PDF Upload form
│   │   └── chat-box.tsx                 # Chat UI
│   │
│   └── styles/
│       └── globals.css
│
├── public/                              # Static assets
├── middleware.ts                        # Clerk middleware for route protection
├── .env.local                           # API keys (Clerk, OpenAI, Upstash)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
