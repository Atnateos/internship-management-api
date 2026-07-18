# Internship Applicant Management API

A backend API for administrators to manage internship applications, create, review, filter,
search, update status/notes, and view dashboard statistics for candidates. Built with NestJS,
Prisma, and JWT authentication.

## Technologies used

- **NestJS** (TypeScript) application framework
- **Prisma ORM** database access and migrations
- **SQLite** default local database (file-based, zero setup)
- **Passport + JWT** (`@nestjs/jwt`, `passport-jwt`) bearer-token authentication
- **bcrypt** password hashing
- **class-validator / class-transformer** request validation via DTOs
- **@nestjs/config + Joi** environment-based configuration with startup validation
- **Swagger / OpenAPI** (`@nestjs/swagger`) API documentation
- **Jest** unit and e2e testing

## Prerequisites

- Node.js 18+ and npm
- No external database server needed this project uses SQLite by default

## Setup instructions

1. **Clone the repository**
```bash
   git clone https://github.com/Atnateos/internship-management-api.git
   cd internship-management-api
```

2. **Install dependencies**
```bash
   npm install
```

3. **Configure environment variables**

   Copy the example file and fill in real values:
```bash
   cp .env.example .env
```
   Then edit `.env`:
   - `DATABASE_URL` defaults to `file:./dev.db` (SQLite), works out of the box
   - `JWT_SECRET` must be at least 16 characters. Generate one with:
```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
   - `JWT_EXPIRES_IN` defaults to `1d`
   - `PORT` defaults to `3000`

   The app validates these at startup and will refuse to boot with a clear error if any
   required variable is missing or invalid, rather than silently falling back to an
   insecure default.

4. **Run database migrations**
```bash
   npx prisma migrate deploy
```
   (Use `npx prisma migrate dev` instead if you plan to make schema changes locally.)

5. **Seed the database**
```bash
   npx prisma db seed
```
   This creates one admin user and one sample applicant. The seed script prints the
   admin credentials to the console when it runs:
   - Email: `admin@infnova.com`
   - Password: `SecurePassword123`

6. **Start the app**
```bash
   npm run start:dev
```
   The API runs at `http://localhost:3000` and Swagger docs are available at
   `http://localhost:3000/api/docs`.

## Authentication

All applicant and dashboard endpoints require a bearer token.

1. Log in via `POST /api/auth/login` with the seeded admin credentials above. The
   response contains a JWT `access_token`.
2. Include it on every subsequent request:
3. In Swagger UI, click the **Authorize** button and paste the token in (no need to
   type `Bearer ` yourself Swagger adds that prefix).
4. `GET /api/auth/me` returns the currently authenticated admin's profile and can be
   used to verify a token is valid.

Tokens are signed with `JWT_SECRET` and expire after `JWT_EXPIRES_IN` (default 1 day).
The JWT strategy also re-checks that the user still exists in the database on every
request, so a deleted user's old token stops working immediately.

## API overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Admin login, returns JWT |
| GET | `/api/auth/me` | Current authenticated admin |
| POST | `/api/applicants` | Create applicant |
| GET | `/api/applicants` | List applicants (paginated, searchable, filterable, sortable) |
| GET | `/api/applicants/:id` | Get single applicant |
| PATCH | `/api/applicants/:id` | Update applicant profile fields (name, email, phone, track) |
| DELETE | `/api/applicants/:id` | Soft-delete applicant |
| PATCH | `/api/applicants/:id/status` | Update applicant status |
| PATCH | `/api/applicants/:id/notes` | Update internal notes |
| GET | `/api/dashboard/summary` | Aggregate statistics |

Full request/response schemas, including query parameters for `GET /api/applicants`
(`search`, `status`, `track`, `sortBy`, `sortOrder`, `page`, `limit`), are documented in
Swagger at `/api/docs`.

## Architecture

The project follows standard NestJS module conventions, with a clear separation between
controllers (HTTP layer only), services (business logic), and DTOs (validation):
src/
├── auth/                 # Login, JWT strategy, auth guard
│   ├── dto/
│   ├── guards/
│   └── strategies/
├── applicants/            # Core applicant CRUD, search, filtering, status, notes
│   ├── dto/
│   └── constants/         # ApplicantStatus and InternshipTrack enums
├── dashboard/             # Aggregate statistics endpoint
└── common/
├── prisma/            # Global PrismaService/PrismaModule
└── filters/           # Centralized HTTP exception filter
Key design decisions:

- **Prisma models use `String` fields for `status` and `track`, not native Prisma
  enums.** SQLite doesn't support Prisma's native enum type, so validation is instead
  enforced at the application layer via TypeScript enums (`ApplicantStatus`,
  `InternshipTrack`) and `class-validator`'s `@IsEnum()` on incoming DTOs.
- **Status and notes updates are isolated to their own endpoints.** `UpdateApplicantDto`
  (used by the general `PATCH /:id`) deliberately excludes `status` and `notes`, so the
  only way to change an applicant's status is through `PATCH /:id/status`, where the
  Rejected → Accepted transition rule is enforced. This prevents that business rule
  from being bypassed through the general update endpoint.
- **Soft deletes** are implemented via a nullable `deletedAt` column rather than removing
  rows. Every read path (`findAll`, `findOne`) and the dashboard aggregation filters
  `deletedAt: null`, so deleted applicants never reappear in lists or statistics.
- **Global validation** (`ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and
  `transform`) rejects any request containing fields not defined on the relevant DTO,
  and a single `HttpExceptionFilter` centralizes error response formatting across the app.
- **Configuration is validated at startup**, not read ad hoc from `process.env`. A Joi
  schema in `AppModule` ensures `DATABASE_URL` and `JWT_SECRET` are present and
  well-formed before the app finishes bootstrapping.

## Testing

Run the test suite with:
```bash
npm run test        # unit tests
npm run test:e2e     # end-to-end tests
npm run test:cov     # coverage report
```

## Assumptions and known limitations

- SQLite is used as the default database for ease of local setup, per the assignment's
  recommendation. Prisma's schema is written in a database-agnostic way; switching to
  PostgreSQL or MySQL only requires updating `DATABASE_URL` and the `provider` in
  `prisma/schema.prisma`, then re-running migrations.
- `sortBy` on `GET /api/applicants` currently accepts any string and passes it directly
  to Prisma's `orderBy`. Sorting by a non-existent field will currently surface as a
  generic error rather than a specific validation message; a stricter whitelist of
  sortable fields would be a reasonable follow-up.
- Email uniqueness is enforced by a database-level unique constraint on the raw string
  as submitted; email comparison is currently case-sensitive (e.g. `A@x.com` and
  `a@x.com` would be treated as distinct). Normalizing email casing before writes/lookups
  would close this gap.
- There is currently one seeded admin user and no admin self-registration endpoint or
  password-reset flow, since the brief scopes authentication to a single administrator
  role.
- Automated test coverage focuses on the core business rules (auth, status transitions,
  soft-delete exclusion); it is not yet exhaustive across every endpoint and edge case.