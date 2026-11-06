# RecruitPro — Job Portal & Recruitment Management System

A portfolio-grade full-stack starter built with Django REST Framework, React (Vite), and MySQL.

## Features in this starter
- Custom user model with candidate / employer / admin roles
- JWT authentication
- Company and employer ownership
- Job CRUD, public job listing, search and filters
- Candidate applications with duplicate-application protection
- Employer application review and status updates
- Resume upload endpoint
- Signed-in professional network with follows, instant connections, and work-photo posts
- OpenAPI / Swagger documentation
- Backend tests, Docker Compose, environment configuration

This is a runnable MVP foundation. Before production, complete the hardening checklist below (especially email verification, password reset, malware scanning for uploads, rate limiting, backups, monitoring and privacy/legal review).

## Architecture
React browser app -> HTTPS/JSON -> Django REST Framework -> Django ORM -> MySQL.
Media files are stored in a persistent media volume in local Docker. For production, use private object storage (e.g. S3-compatible) and signed download URLs.

## Prerequisites
- Python 3.12+
- Node.js 20+
- Docker Desktop + Docker Compose (recommended)
- Git

## Quick start with Docker
1. Copy `.env.example` to `.env` and change all secrets.
2. Run:
   ```bash
   docker compose up --build
   ```
3. In another terminal:
   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```
4. API: http://localhost:8000/api/
5. Swagger: http://localhost:8000/api/docs/
6. React: http://localhost:5173/

The development container generates initial migrations for the scaffold apps and applies them on startup. Commit generated migration files to Git before team collaboration. For production, remove `makemigrations` from the startup command and run committed migrations as a controlled release step. If MySQL is still initializing, restart the backend container after it becomes healthy.

## Local development without Docker

### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

For local MySQL, create a database named `recruitpro` and set DB_HOST, DB_USER, DB_PASSWORD in `.env`. Generate and commit migrations once with `python manage.py makemigrations accounts companies jobs applications`, then run `python manage.py migrate`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:8000`.

## API overview
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register/` | Public | Register candidate/employer |
| POST | `/api/auth/token/` | Public | Obtain JWT pair |
| POST | `/api/auth/token/refresh/` | Public | Refresh access token |
| GET | `/api/auth/me/` | Authenticated | Current user |
| GET/POST | `/api/companies/` | Public GET / Employer POST | List/create company |
| GET/PATCH | `/api/companies/{id}/` | Public GET / Owner PATCH | Company details |
| GET | `/api/jobs/` | Public | List/search/filter jobs |
| POST | `/api/jobs/` | Employer | Create job |
| GET | `/api/jobs/{id}/` | Public | Job detail |
| PATCH/DELETE | `/api/jobs/{id}/` | Owner | Update/delete own job |
| GET/POST | `/api/applications/` | Candidate | List/apply |
| GET | `/api/applications/employer/` | Employer | Applications to own jobs |
| PATCH | `/api/applications/{id}/status/` | Job owner | Update application status |
| POST | `/api/resumes/` | Candidate | Upload PDF/DOC/DOCX resume |
| GET | `/api/network/people/` | Authenticated | Discover candidate and employer profiles |
| POST/DELETE | `/api/network/follows/{user_id}/` | Authenticated | Follow/unfollow a member |
| POST/DELETE | `/api/network/connections/{user_id}/` | Authenticated | Connect instantly/disconnect |
| GET | `/api/network/connections/` | Authenticated | List connections |
| GET | `/api/network/following/` | Authenticated | List followed members |
| GET/POST | `/api/network/posts/` | Authenticated | Read feed/create a text or photo post |
| PATCH/DELETE | `/api/network/posts/{id}/` | Post author | Edit/delete own post |
| GET | `/api/network/posts/{id}/image/` | Authenticated | View a post image |
| GET | `/api/schema/` | Public | OpenAPI schema |
| GET | `/api/docs/` | Public | Swagger UI |

The network page is available at `/network` after signing in. Posts are visible only to signed-in members; each post can contain text and one image up to 5 MB. Connections are created immediately, while follows are one-way.

### Example registration
```json
{
  "email": "candidate@example.com",
  "password": "StrongPassword!234",
  "role": "CANDIDATE",
  "first_name": "Asha",
  "last_name": "Rao"
}
```
For an employer, registration creates the user account; create a company and employer profile through Django admin in this MVP. Extend this to an onboarding endpoint in the next iteration.

### Example job creation
```json
{
  "company": 1,
  "title": "Python Developer",
  "description": "Build and maintain Django REST APIs.",
  "location": "Madurai",
  "employment_type": "FULL_TIME",
  "experience_min": 2,
  "experience_max": 4,
  "salary_min": "500000.00",
  "salary_max": "900000.00",
  "status": "PUBLISHED"
}
```

## Testing
```bash
cd backend
pytest
```
The test settings use SQLite for quick automated tests. Integration-test against MySQL before release.

## Git workflow
```bash
git init
git add .
git commit -m "chore: scaffold RecruitPro full-stack application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/recruitpro.git
git push -u origin main
```
Suggested branch names: `feature/auth`, `feature/job-search`, `feature/applications`, `fix/<issue>`.

## Production deployment checklist
1. Deploy backend to a container platform or VM; use Gunicorn behind Nginx / managed ingress.
2. Provision managed MySQL with private networking, TLS and automated backups.
3. Store secrets in the host's secret manager; never commit `.env`.
4. Set `DEBUG=False`, exact `ALLOWED_HOSTS`, HTTPS, secure cookies and trusted CSRF origins.
5. Put resumes in private object storage; authorize every download and scan uploads.
6. Build React (`npm run build`) and host static assets behind CDN / Nginx.
7. Run `python manage.py migrate` as a release step, not on every web-worker start.
8. Configure structured logs, error monitoring, uptime checks and database alerts.
9. Add CI: lint, tests, dependency audit, build.
10. Test restore from backup and document rollback steps.

## Suggested next milestones
- Employer onboarding and company verification
- Candidate profile editor and skills
- Resume private download / preview
- Interview scheduling and notifications
- Email verification and password reset
- Pagination, throttling, audit logs and admin analytics
- Celery + Redis for background email and resume parsing
- React role-based routes, forms, validation and dashboard screens
