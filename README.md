# RecruitPro — Job Portal & Recruitment Management System

RecruitPro is a job recruitment platform that connects employers and job seekers through a streamlined hiring process.

A portfolio-grade application built using Django REST Framework, React (Vite), and MySQL.

## Features

- Custom user model with candidate, employer, and admin roles
- JWT authentication
- Company and employer ownership
- Job creation, editing, deletion, search, and filtering
- Candidate applications with duplicate-application protection
- Employer application review and status updates
- Resume upload endpoint
- Professional network with follows, connections, and posts
- OpenAPI / Swagger documentation
- Backend tests and Docker Compose support

## Architecture

React frontend → Django REST Framework API → Django ORM → MySQL database.

## Prerequisites

- Python 3.12+
- Node.js 20+
- Docker Desktop + Docker Compose (recommended)
- Git

## Quick Start with Docker

1. Copy `.env.example` to `.env`.
2. Update the environment variables and secrets.
3. Run:

```bash
docker compose up --build
```

4. Create a superuser:

```bash
docker compose exec backend python manage.py createsuperuser
```

5. Open:
   - Frontend: [http://localhost:5173/](http://localhost:5173/)
   - API: [http://localhost:8000/api/](http://localhost:8000/api/)
   - Swagger: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Testing

```bash
cd backend
pytest
```

## Production Considerations

- Keep `.env` and all credentials out of Git.
- Use secure private storage for resumes.
- Configure HTTPS and production security settings.
- Use a production application server such as Gunicorn.
- Configure database backups and monitoring.
- Add email verification, password reset, and upload scanning.

## Future Improvements

- Employer onboarding and company verification
- Candidate profile editor and skills
- Private resume preview and download
- Interview scheduling and notifications
- Email verification and password reset
- Analytics and reporting

## Author

Developed as a full-stack recruitment management project.
