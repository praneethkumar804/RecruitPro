import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import api, { getJobs, login, register } from './api'
import Network from './Network'

const iconPaths = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-12 0v2h6v-2" /></>,
  pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
  arrowUp: <><path d="M12 19V5m-7 7 7-7 7 7" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  building: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 21v-4h6v4M8 7h1m6 0h1M8 11h1m6 0h1" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8m-8 4h8" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m18 6-12 12M6 6l12 12" />,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>,
  logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
}

function Icon({ name, size = 18, className = '' }) {
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>
}

function messageFromError(error) {
  const data = error?.response?.data
  if (typeof data === 'string') return data
  if (data?.detail) return data.detail
  if (data && typeof data === 'object') {
    const fields = Object.entries(data)
      .map(([field, messages]) => {
        const text = Array.isArray(messages) ? messages.join(' ') : String(messages)
        return text ? `${field}: ${text}` : ''
      })
      .filter(Boolean)
    if (fields.length) return fields.join(' · ')
  }
  return error?.message || 'Something went wrong. Please try again.'
}

function formatSalary(min, max) {
  if (!min && !max) return 'Salary not listed'
  const format = value => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value))
  if (min && max) return `₹${format(min)} – ₹${format(max)}`
  return min ? `From ₹${format(min)}` : `Up to ₹${format(max)}`
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value))
}

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      setAuthLoading(false)
      return
    }
    api.get('/auth/me/')
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      })
      .finally(() => setAuthLoading(false))
  }, [])

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  return <div className="app-shell">
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="RecruitPro home"><span className="brand-symbol"><Icon name="spark" size={19} /></span>recruit<span className="brand-accent">pro</span></Link>
        <button className="mobile-menu-button" onClick={() => setMobileOpen(open => !open)} aria-label="Toggle navigation"><Icon name={mobileOpen ? 'close' : 'menu'} /></button>
        <nav className={`main-nav ${mobileOpen ? 'nav-open' : ''}`}>
          <Link to="/" onClick={() => setMobileOpen(false)}>Find a job</Link>
          {user && <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>}
          {user && <Link to="/network" onClick={() => setMobileOpen(false)}>Network</Link>}
          <Link to={user?.role === 'EMPLOYER' ? '/dashboard' : '/register'} state={user ? undefined : { role: 'EMPLOYER' }} onClick={() => setMobileOpen(false)}>For employers</Link>
        </nav>
        <div className="header-actions">
          {user ? <><Link className="avatar-link" to="/dashboard"><span className="avatar">{(user.first_name || user.email || 'U')[0].toUpperCase()}</span><span className="header-user">{user.first_name || 'My account'}</span></Link><button className="icon-button logout-button" onClick={logout} title="Sign out" aria-label="Sign out"><Icon name="logout" /></button></>
            : <><Link className="button button-quiet header-login" to="/login">Sign in</Link><Link className="button button-primary header-join" to="/register">Get started <Icon name="arrow" size={16} /></Link></>}
        </div>
      </div>
    </header>
    <main>
      {authLoading ? <div className="page-loading"><span className="spinner" /> Getting things ready…</div> : <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs/:id" element={<JobDetail user={user} />} />
        <Route path="/login" element={<AuthPage mode="login" onAuthenticated={setUser} />} />
        <Route path="/register" element={<AuthPage mode="register" onAuthenticated={setUser} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <SignInPrompt />} />
        <Route path="/network" element={user ? <Network user={user} /> : <SignInPrompt />} />
        <Route path="*" element={<NotFound />} />
      </Routes>}
    </main>
    <footer className="site-footer">
      <div className="footer-inner"><Link className="brand footer-brand" to="/"><span className="brand-symbol"><Icon name="spark" size={17} /></span>recruit<span className="brand-accent">pro</span></Link><p>Good work should find good people.</p><span>© {new Date().getFullYear()} RecruitPro</span></div>
    </footer>
  </div>
}

function Home() {
  const [jobs, setJobs] = useState([])
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [type, setType] = useState('')
  const [filters, setFilters] = useState({ search: '', location: '', type: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    getJobs({
      ...(filters.search && { search: filters.search }),
      ...(filters.location && { location: filters.location }),
      ...(filters.type && { employment_type: filters.type }),
      ordering: '-created_at',
    })
      .then(data => { if (active) { setJobs(Array.isArray(data) ? data : data.results || []); setError('') } })
      .catch(err => { if (active) setError(messageFromError(err)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [filters])

  function submitSearch(event) {
    event.preventDefault()
    setFilters({ search: search.trim(), location: location.trim(), type })
  }

  const activeFilters = useMemo(() => [filters.search, filters.location, filters.type].filter(Boolean).length, [filters])

  return <>
    <section className="hero">
      <div className="hero-decoration hero-decoration-one" /><div className="hero-decoration hero-decoration-two" />
      <div className="hero-inner">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> YOUR NEXT CHAPTER STARTS HERE</div>
          <h1>Find work that<br /><span>feels like you.</span></h1>
          <p>Discover opportunities built around your ambitions. The right role is closer than you think.</p>
        </div>
        <div className="hero-note"><span className="note-icon"><Icon name="spark" size={17} /></span><span><strong>Make your next move</strong><small>Explore roles from growing teams</small></span></div>
        <form className="search-panel" onSubmit={submitSearch}>
          <label className="search-field"><Icon name="search" /><span className="sr-only">Job title or keyword</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Job title, skill, or keyword" /></label>
          <span className="search-divider" />
          <label className="search-field search-location"><Icon name="pin" /><span className="sr-only">Location</span><input value={location} onChange={event => setLocation(event.target.value)} placeholder="City or region" /></label>
          <button type="submit" className="button button-primary search-button">Search jobs <Icon name="arrow" size={17} /></button>
        </form>
        <div className="hero-footnote"><span><Icon name="check" size={15} /> Real opportunities</span><span><Icon name="check" size={15} /> A better next step</span></div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
        <div className="art-card art-card-main"><div className="art-window-dots"><i /><i /><i /></div><div className="art-avatar art-avatar-one">A</div><div className="art-lines"><i /><i /><i /></div><div className="art-mini-card"><span className="mini-check"><Icon name="check" size={15} /></span><span><b>You're on your way</b><small>New opportunity found</small></span></div></div>
        <div className="art-badge"><span><Icon name="spark" size={17} /></span> A fresh start<br /><b>looks good on you.</b></div>
      </div>
    </section>

    <section className="jobs-section page-width" id="opportunities">
      <div className="section-topline"><span className="section-kicker">CURATED FOR YOUR NEXT MOVE</span><span className="live-indicator"><i /> Updated opportunities</span></div>
      <div className="section-heading"><div><h2>Explore open roles</h2><p>Find a position that fits your life and your goals.</p></div><div className="job-count">{loading ? '…' : jobs.length}<span> roles</span></div></div>
      <div className="filter-row">
        <div className="filter-label">Filter by</div>
        {[['', 'All roles'], ['FULL_TIME', 'Full-time'], ['PART_TIME', 'Part-time'], ['CONTRACT', 'Contract'], ['INTERN', 'Internship']].map(([value, label]) =>
          <button key={value || 'all'} className={`filter-chip ${type === value ? 'chip-active' : ''}`} onClick={() => { setType(value); setFilters(current => ({ ...current, type: value })) }}>{label}</button>)}
        {activeFilters > 0 && <button className="clear-filters" onClick={() => { setType(''); setSearch(''); setLocation(''); setFilters({ search: '', location: '', type: '' }) }}>Clear filters</button>}
      </div>
      {error && <div className="notice notice-error"><strong>Couldn't load opportunities.</strong> {error} <button onClick={() => setFilters({ ...filters })}>Try again</button></div>}
      {loading ? <div className="job-grid">{[1, 2, 3].map(item => <div className="job-card skeleton-card" key={item}><span className="skeleton skeleton-logo" /><span className="skeleton skeleton-line" /><span className="skeleton skeleton-line short" /><span className="skeleton skeleton-line" /></div>)}</div>
        : jobs.length ? <div className="job-grid">{jobs.map(job => <JobCard key={job.id} job={job} />)}</div>
          : !error && <div className="empty-state"><span className="empty-icon"><Icon name="search" size={23} /></span><h3>No matching roles just yet</h3><p>Try a different title or location. New opportunities are added as teams grow.</p><button className="button button-secondary" onClick={() => { setType(''); setSearch(''); setLocation(''); setFilters({ search: '', location: '', type: '' }) }}>See all opportunities</button></div>}
    </section>
  </>
}

function JobCard({ job }) {
  const companyInitial = (job.company_name || 'C').trim()[0].toUpperCase()
  return <article className="job-card">
    <div className="job-card-top"><div className="company-logo">{companyInitial}</div><span className="job-date">{formatDate(job.created_at)}</span></div>
    <div className="job-card-company">{job.company_name || 'Growing team'}</div>
    <h3><Link to={`/jobs/${job.id}`}>{job.title}</Link></h3>
    <div className="job-meta"><span><Icon name="pin" size={15} />{job.location}</span><span><Icon name="briefcase" size={15} />{(job.employment_type || 'ROLE').replaceAll('_', ' ').toLowerCase()}</span></div>
    <div className="job-card-bottom"><span className="salary-label">{formatSalary(job.salary_min, job.salary_max)}</span><Link className="card-arrow" to={`/jobs/${job.id}`} aria-label={`View ${job.title}`}><Icon name="arrow" size={17} /></Link></div>
  </article>
}

function JobDetail({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [applications, setApplications] = useState([])
  const [resume, setResume] = useState(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    api.get(`/jobs/${id}/`)
      .then(({ data }) => { if (active) setJob(data) })
      .catch(err => { if (active) setError(messageFromError(err)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (user?.role === 'CANDIDATE') api.get('/applications/').then(({ data }) => setApplications(Array.isArray(data) ? data : data.results || [])).catch(() => {})
  }, [user, id])

  async function submitApplication(event) {
    event.preventDefault()
    if (!user) { navigate('/login', { state: { from: `/jobs/${id}` } }); return }
    if (user.role !== 'CANDIDATE') { setMessage('Applications are available to candidate accounts.'); return }
    if (!resume) { setMessage('Choose a PDF, DOC, or DOCX resume first.'); return }
    setSubmitting(true)
    setMessage('')
    let stage = 'Resume upload'
    try {
      const body = new FormData()
      body.append('file', resume)
      const resumeResponse = await api.post('/resumes/', body)
      if (!resumeResponse.data?.id) throw new Error('The server did not return an uploaded resume ID.')
      stage = 'Application submission'
      await api.post('/applications/', { job: job.id, resume: resumeResponse.data.id, cover_letter: coverLetter })
      setApplications(previous => [...previous, { job: job.id }])
      setMessage('Application sent! You can follow its progress from your dashboard.')
      setResume(null)
      setCoverLetter('')
    } catch (err) {
      setMessage(`${stage} failed — ${messageFromError(err)}`)
    } finally { setSubmitting(false) }
  }

  if (loading) return <div className="page-loading"><span className="spinner" /> Loading opportunity…</div>
  if (error || !job) return <div className="page-width standalone-state"><div className="empty-state"><h2>Opportunity unavailable</h2><p>{error || 'This job could not be found.'}</p><Link className="button button-secondary" to="/">Browse all roles</Link></div></div>

  const alreadyApplied = applications.some(application => String(application.job) === String(job.id))
  return <div className="detail-page page-width">
    <Link to="/" className="back-link">← Back to opportunities</Link>
    <div className="detail-layout">
      <article className="detail-main">
        <div className="detail-company-row"><div className="company-logo company-logo-large">{(job.company_name || 'C')[0].toUpperCase()}</div><div><span className="detail-company">{job.company_name || 'Growing team'}</span><span className="detail-date">Posted {formatDate(job.created_at)}</span></div></div>
        <h1>{job.title}</h1>
        <div className="detail-tags"><span><Icon name="pin" size={15} />{job.location}</span><span><Icon name="briefcase" size={15} />{(job.employment_type || '').replaceAll('_', ' ')}</span><span><Icon name="clock" size={15} />{job.experience_min}–{job.experience_max ?? '–'} years experience</span></div>
        <div className="detail-salary">{formatSalary(job.salary_min, job.salary_max)} <span>per year</span></div>
        <div className="detail-divider" />
        <h2>About the role</h2><p className="job-description">{job.description}</p>
        <div className="detail-callout"><span className="callout-icon"><Icon name="spark" /></span><div><strong>Could this be your next move?</strong><p>Share what makes you a great fit and take the next step with this team.</p></div></div>
      </article>
      <aside className="apply-card">
        <span className="section-kicker">YOUR NEXT STEP</span><h2>Make it yours.</h2><p>Send your profile to {job.company_name || 'the hiring team'}.</p>
        {alreadyApplied ? <div className="notice notice-success"><Icon name="check" /> You've applied for this role. Track your application in your dashboard.</div>
          : <form onSubmit={submitApplication} className="apply-form">
            <label className="form-label">Resume <span>PDF, DOC, DOCX · up to 5 MB</span><input type="file" accept=".pdf,.doc,.docx" onChange={event => setResume(event.target.files?.[0] || null)} required /></label>
            <label className="form-label">Note to the team <span>Optional</span><textarea rows="5" maxLength="4000" value={coverLetter} onChange={event => setCoverLetter(event.target.value)} placeholder="Tell them what interests you about this role…" /></label>
            {message && <div className={`form-message ${message.startsWith('Application sent') ? 'message-success' : ''}`}>{message}</div>}
            <button type="submit" disabled={submitting} className="button button-primary button-full">{submitting ? 'Sending application…' : user ? 'Apply for this role' : 'Sign in to apply'} <Icon name="arrow" size={17} /></button>
          </form>}
        <div className="apply-privacy"><Icon name="check" size={15} /> Your information stays private</div>
      </aside>
    </div>
  </div>
}

function AuthPage({ mode, onAuthenticated }) {
  const isRegister = mode === 'register'
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = location.state?.from || '/dashboard'
  const [role, setRole] = useState(location.state?.role || 'CANDIDATE')
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', username: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await register({ ...form, role })
      }
      await login(form.email, form.password)
      const { data } = await api.get('/auth/me/')
      onAuthenticated(data)
      navigate(returnTo, { replace: true })
    } catch (err) {
      setError(messageFromError(err))
    } finally { setLoading(false) }
  }

  return <div className="auth-page">
    <div className="auth-visual"><div className="auth-visual-inner"><div className="eyebrow"><span className="eyebrow-dot" /> THE FUTURE IS A GOOD FIT</div><h1>{isRegister ? <>A better next<br /><span>step starts here.</span></> : <>Good to see<br /><span>you again.</span></>}</h1><p>{isRegister ? 'Create your free account and make room for what comes next.' : 'Your next opportunity could be just around the corner.'}</p><div className="auth-visual-bottom"><span className="visual-mark"><Icon name="spark" size={18} /></span><span>For the work you want.<br /><b>And the life around it.</b></span></div></div><div className="auth-circle circle-a" /><div className="auth-circle circle-b" /></div>
    <div className="auth-form-wrap"><div className="auth-form-inner">
      <span className="section-kicker">{isRegister ? 'START YOUR JOURNEY' : 'WELCOME BACK'}</span>
      <h2>{isRegister ? 'Create your account' : 'Sign in to RecruitPro'}</h2>
      <p className="auth-subtitle">{isRegister ? 'A few details and you’re on your way.' : 'Pick up right where you left off.'}</p>
      {isRegister && <div className="role-picker"><button type="button" className={role === 'CANDIDATE' ? 'role-selected' : ''} onClick={() => setRole('CANDIDATE')}><Icon name="file" size={17} /> I'm looking for work</button><button type="button" className={role === 'EMPLOYER' ? 'role-selected' : ''} onClick={() => setRole('EMPLOYER')}><Icon name="building" size={17} /> I'm hiring</button></div>}
      <form className="auth-form" onSubmit={submit}>
        {isRegister && <div className="form-row"><label className="form-label">First name<input value={form.first_name} onChange={event => setForm({ ...form, first_name: event.target.value })} autoComplete="given-name" required /></label><label className="form-label">Last name<input value={form.last_name} onChange={event => setForm({ ...form, last_name: event.target.value })} autoComplete="family-name" required /></label></div>}
        {isRegister && <label className="form-label">Username<input value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} autoComplete="username" required /></label>}
        <label className="form-label">Email address<input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} autoComplete="email" required /></label>
        <label className="form-label">Password<input type="password" minLength={8} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} autoComplete={isRegister ? 'new-password' : 'current-password'} required />{isRegister && <span className="password-hint">Use at least 8 characters.</span>}</label>
        {error && <div role="alert" className="form-message">{error}</div>}
        <button className="button button-primary button-full auth-submit" disabled={loading}>{loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} <Icon name="arrow" size={17} /></button>
      </form>
      <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to RecruitPro?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
    </div></div>
  </div>
}

function SignInPrompt() {
  const location = useLocation()
  return <div className="page-width standalone-state"><div className="empty-state"><span className="empty-icon"><Icon name="briefcase" size={23} /></span><h2>Sign in to see your dashboard</h2><p>Keep track of applications, manage roles, and take your next step.</p><Link className="button button-primary" to="/login" state={{ from: location.pathname }}>Sign in <Icon name="arrow" size={16} /></Link></div></div>
}

function Dashboard({ user }) {
  return <div className="dashboard-page page-width">
    <div className="dashboard-welcome"><div><span className="section-kicker">{user.role === 'EMPLOYER' ? 'EMPLOYER WORKSPACE' : 'YOUR CAREER SPACE'}</span><h1>{user.role === 'EMPLOYER' ? 'Let’s find your next great hire.' : `Welcome back${user.first_name ? `, ${user.first_name}` : ''}.`}</h1><p>{user.role === 'EMPLOYER' ? 'Post opportunities and keep your hiring moving.' : 'Your next opportunity starts with one small step.'}</p></div><span className="dashboard-avatar">{(user.first_name || user.email || 'U')[0].toUpperCase()}</span></div>
    {user.role === 'EMPLOYER' ? <EmployerDashboard user={user} /> : <CandidateDashboard />}
  </div>
}

function CandidateDashboard() {
  const [applications, setApplications] = useState([])
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let active = true
    Promise.all([api.get('/applications/'), api.get('/resumes/')])
      .then(([apps, files]) => {
        if (active) {
          setApplications(Array.isArray(apps.data) ? apps.data : apps.data.results || [])
          setResumes(Array.isArray(files.data) ? files.data : files.data.results || [])
        }
      })
      .catch(err => { if (active) setError(messageFromError(err)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [refresh])

  async function uploadResume(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    setNotice('')
    try {
      const body = new FormData()
      body.append('file', file)
      await api.post('/resumes/', body)
      setNotice('Resume uploaded successfully.')
      setRefresh(value => value + 1)
    } catch (err) { setNotice(messageFromError(err)) }
    finally { setUploading(false); event.target.value = '' }
  }

  const statuses = applications.reduce((counts, app) => ({ ...counts, [app.status]: (counts[app.status] || 0) + 1 }), {})
  return <div className="dashboard-content">
    <div className="stats-grid"><StatCard label="Applications sent" value={applications.length} icon="arrowUp" /><StatCard label="In review" value={(statuses.REVIEWING || 0) + (statuses.SUBMITTED || 0)} icon="clock" /><StatCard label="Shortlisted" value={statuses.SHORTLISTED || 0} icon="check" /></div>
    <div className="dashboard-columns">
      <section className="panel applications-panel"><div className="panel-heading"><div><span className="section-kicker">YOUR PROGRESS</span><h2>Applications</h2></div><Link to="/" className="text-link">Explore jobs <Icon name="arrow" size={15} /></Link></div>
        {error && <div className="notice notice-error">{error}</div>}
        {loading ? <p className="muted-copy">Loading your applications…</p> : applications.length ? <div className="application-list">{applications.map(application => <div className="application-row" key={application.id}><div className="application-company">{(application.job_title || 'J')[0]}</div><div className="application-info"><strong>{application.job_title || `Job #${application.job}`}</strong><span>Applied {formatDate(application.applied_at)}</span></div><span className={`status-pill status-${(application.status || '').toLowerCase()}`}>{(application.status || '').replaceAll('_', ' ')}</span></div>)}</div> : <div className="panel-empty"><span className="empty-icon"><Icon name="briefcase" /></span><h3>Your next step is out there</h3><p>When you apply for a role, it’ll show up here.</p><Link className="button button-primary" to="/">Find a role <Icon name="arrow" size={16} /></Link></div>}
      </section>
      <section className="panel resume-panel"><div className="panel-heading"><div><span className="section-kicker">BE READY TO APPLY</span><h2>Your resumes</h2></div><span className="resume-count">{resumes.length}/5</span></div><p className="panel-description">Keep your experience ready to share with hiring teams.</p>
        <label className={`upload-box ${uploading ? 'uploading' : ''}`}><input type="file" accept=".pdf,.doc,.docx" disabled={uploading || resumes.length >= 5} onChange={uploadResume} /><span className="upload-icon"><Icon name="file" size={19} /></span><strong>{uploading ? 'Uploading resume…' : 'Add a resume'}</strong><small>PDF, DOC, or DOCX · max 5 MB</small></label>
        {notice && <p className="inline-notice">{notice}</p>}
        <div className="resume-list">{resumes.map(item => <div key={item.id} className="resume-item"><Icon name="file" size={17} /><span>{item.original_name || 'Resume'}</span><small>{formatDate(item.uploaded_at)}</small></div>)}</div>
      </section>
    </div>
  </div>
}

function StatCard({ label, value, icon }) {
  return <div className="stat-card"><span className="stat-icon"><Icon name={icon} /></span><span className="stat-value">{value}</span><span className="stat-label">{label}</span></div>
}

function EmployerDashboard({ user }) {
  const companyStorageKey = `recruitpro_company_id_${user.id}`
  const [companyId, setCompanyId] = useState(() => (
    user.company_id ? String(user.company_id) : localStorage.getItem(companyStorageKey) || ''
  ))
  const [applications, setApplications] = useState([])
  const [jobs, setJobs] = useState([])
  const [companyForm, setCompanyForm] = useState({ name: '', location: '', website: '', description: '' })
  const [jobForm, setJobForm] = useState({ title: '', description: '', location: '', employment_type: 'FULL_TIME', experience_min: 0, experience_max: '', salary_min: '', salary_max: '', status: 'PUBLISHED' })
  const [editingJobId, setEditingJobId] = useState(null)
  const [loading, setLoading] = useState(Boolean(companyId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (user.company_id) {
      const profileCompanyId = String(user.company_id)
      setCompanyId(profileCompanyId)
      localStorage.setItem(companyStorageKey, profileCompanyId)
    }
  }, [companyStorageKey, user.company_id])

  const loadWorkspace = useCallback(async () => {
    if (!companyId) { setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const [appsResponse, jobsResponse] = await Promise.all([api.get('/applications/employer/'), getJobs({ company: companyId, ordering: '-created_at' })])
      setApplications(Array.isArray(appsResponse.data) ? appsResponse.data : appsResponse.data.results || [])
      const allJobs = Array.isArray(jobsResponse) ? jobsResponse : jobsResponse.results || []
      setJobs(allJobs.filter(job => String(job.company) === String(companyId)))
    } catch (err) { setError(messageFromError(err)) }
    finally { setLoading(false) }
  }, [companyId])

  useEffect(() => { loadWorkspace() }, [loadWorkspace, refresh])

  async function createCompany(event) {
    event.preventDefault()
    setSaving(true); setError('')
    try {
      const { data } = await api.post('/companies/', companyForm)
      localStorage.setItem(companyStorageKey, String(data.id))
      setCompanyId(String(data.id))
      setNotice('Your company profile is ready. You can now post a role.')
    } catch (err) { setError(messageFromError(err)) }
    finally { setSaving(false) }
  }

  function resetJobForm() {
    setEditingJobId(null)
    setJobForm({ title: '', description: '', location: '', employment_type: 'FULL_TIME', experience_min: 0, experience_max: '', salary_min: '', salary_max: '', status: 'PUBLISHED' })
  }

  function editJob(job) {
    setEditingJobId(job.id)
    setJobForm({
      title: job.title,
      description: job.description,
      location: job.location,
      employment_type: job.employment_type,
      experience_min: job.experience_min ?? 0,
      experience_max: job.experience_max ?? '',
      salary_min: job.salary_min ?? '',
      salary_max: job.salary_max ?? '',
      status: job.status,
    })
    setError('')
    setNotice('')
  }

  async function saveJob(event) {
    event.preventDefault()
    setSaving(true); setError(''); setNotice('')
    const payload = {
      ...jobForm,
      company: Number(companyId),
      experience_min: Number(jobForm.experience_min || 0),
      experience_max: jobForm.experience_max === '' ? null : Number(jobForm.experience_max),
      salary_min: jobForm.salary_min || null,
      salary_max: jobForm.salary_max || null,
    }
    try {
      if (editingJobId) {
        await api.patch(`/jobs/${editingJobId}/`, payload)
        setNotice('Your opportunity was updated.')
      } else {
        await api.post('/jobs/', payload)
        setNotice('Your opportunity is live.')
      }
      resetJobForm()
      setRefresh(value => value + 1)
    } catch (err) { setError(messageFromError(err)) }
    finally { setSaving(false) }
  }

  async function deleteJob(job) {
    const confirmed = window.confirm(`Delete "${job.title}"? This will also remove its applications and cannot be undone.`)
    if (!confirmed) return
    setError('')
    setNotice('')
    try {
      await api.delete(`/jobs/${job.id}/`)
      setJobs(items => items.filter(item => item.id !== job.id))
      setApplications(items => items.filter(item => String(item.job) !== String(job.id)))
      if (editingJobId === job.id) resetJobForm()
      setNotice('The opportunity was deleted.')
    } catch (err) { setError(messageFromError(err)) }
  }

  async function updateStatus(application, status) {
    setError('')
    try {
      await api.patch(`/applications/${application.id}/status/`, { status })
      setApplications(items => items.map(item => item.id === application.id ? { ...item, status } : item))
    } catch (err) { setError(messageFromError(err)) }
  }

  if (!companyId) return <div className="employer-setup">
    <div className="setup-intro"><span className="setup-icon"><Icon name="building" size={22} /></span><span className="section-kicker">ONE-TIME SETUP</span><h2>Introduce your company.</h2><p>Create your company profile to start sharing openings with candidates. You’ll be connected as its employer.</p></div>
    <form className="panel setup-form" onSubmit={createCompany}><div className="form-row"><label className="form-label">Company name<input required value={companyForm.name} onChange={event => setCompanyForm({ ...companyForm, name: event.target.value })} /></label><label className="form-label">Location<input required value={companyForm.location} onChange={event => setCompanyForm({ ...companyForm, location: event.target.value })} placeholder="City, country" /></label></div><label className="form-label">Website <span>Optional</span><input type="url" value={companyForm.website} onChange={event => setCompanyForm({ ...companyForm, website: event.target.value })} placeholder="https://" /></label><label className="form-label">About your company <span>Optional</span><textarea rows="4" value={companyForm.description} onChange={event => setCompanyForm({ ...companyForm, description: event.target.value })} /></label>{error && <div className="form-message">{error}</div>}<button disabled={saving} className="button button-primary">{saving ? 'Creating profile…' : 'Create company profile'} <Icon name="arrow" size={17} /></button></form>
  </div>

  return <div className="dashboard-content employer-content">
    <div className="stats-grid"><StatCard label="Open roles" value={jobs.length} icon="briefcase" /><StatCard label="Candidates" value={applications.length} icon="file" /><StatCard label="Shortlisted" value={applications.filter(application => application.status === 'SHORTLISTED').length} icon="check" /></div>
    {error && <div className="notice notice-error">{error}</div>}{notice && <div className="notice notice-success"><Icon name="check" />{notice}</div>}
    <div className="dashboard-columns employer-columns">
      <section className="panel post-job-panel"><div className="panel-heading"><div><span className="section-kicker">GROW YOUR TEAM</span><h2>{editingJobId ? 'Edit opportunity' : 'Post an opportunity'}</h2></div></div><form className="post-job-form" onSubmit={saveJob}>
        <label className="form-label">Job title<input required value={jobForm.title} onChange={event => setJobForm({ ...jobForm, title: event.target.value })} placeholder="e.g. Product Designer" /></label>
        <div className="form-row"><label className="form-label">Location<input required value={jobForm.location} onChange={event => setJobForm({ ...jobForm, location: event.target.value })} /></label><label className="form-label">Employment type<select value={jobForm.employment_type} onChange={event => setJobForm({ ...jobForm, employment_type: event.target.value })}><option value="FULL_TIME">Full-time</option><option value="PART_TIME">Part-time</option><option value="CONTRACT">Contract</option><option value="INTERN">Internship</option></select></label></div>
        <label className="form-label">Role description<textarea rows="5" required value={jobForm.description} onChange={event => setJobForm({ ...jobForm, description: event.target.value })} /></label>
        <div className="form-row"><label className="form-label">Experience from (years)<input type="number" min="0" value={jobForm.experience_min} onChange={event => setJobForm({ ...jobForm, experience_min: event.target.value })} /></label><label className="form-label">Experience to (years)<input type="number" min="0" value={jobForm.experience_max} onChange={event => setJobForm({ ...jobForm, experience_max: event.target.value })} /></label></div>
        <div className="form-row"><label className="form-label">Salary from (₹/year)<input type="number" min="0" value={jobForm.salary_min} onChange={event => setJobForm({ ...jobForm, salary_min: event.target.value })} /></label><label className="form-label">Salary to (₹/year)<input type="number" min="0" value={jobForm.salary_max} onChange={event => setJobForm({ ...jobForm, salary_max: event.target.value })} /></label></div>
        <div className="job-form-actions"><button disabled={saving} className="button button-primary button-full">{saving ? 'Saving…' : editingJobId ? 'Save changes' : 'Publish opportunity'} <Icon name="arrow" size={17} /></button>{editingJobId && <button type="button" className="button button-secondary button-full" onClick={resetJobForm}>Cancel edit</button>}</div>
      </form></section>
      <div className="employer-right-column">
        <section className="panel employer-roles-panel"><div className="panel-heading"><div><span className="section-kicker">YOUR TEAM</span><h2>Posted roles</h2></div></div>
          {loading ? <p className="muted-copy">Loading roles…</p> : jobs.length ? <div className="role-list">{jobs.map(job => <div className="role-row" key={job.id}><div className="role-icon"><Icon name="briefcase" size={17} /></div><div className="role-info"><strong>{job.title}</strong><span>{job.location}</span></div><span className={`status-pill ${job.status === 'PUBLISHED' ? 'status-hired' : ''}`}>{job.status}</span><div className="role-actions"><button type="button" className="text-button" onClick={() => editJob(job)}>Edit</button><button type="button" className="text-button text-button-danger" onClick={() => deleteJob(job)}>Delete</button></div></div>)}</div> : <p className="muted-copy">Your published opportunities will appear here.</p>}
        </section>
        <section className="panel employer-apps-panel"><div className="panel-heading"><div><span className="section-kicker">FIND YOUR PEOPLE</span><h2>Recent applicants</h2></div></div>
          {loading ? <p className="muted-copy">Loading applicants…</p> : applications.length ? <div className="applicant-list">{applications.map(application => <div className="applicant-row" key={application.id}><div className="applicant-avatar">{(application.candidate_email || 'C')[0].toUpperCase()}</div><div className="applicant-details"><strong>{application.candidate_email || 'Candidate'}</strong><span>{application.job_title} · {formatDate(application.applied_at)}</span><div className="applicant-actions">{application.resume_file ? <a className="text-button" href={application.resume_file} target="_blank" rel="noreferrer">View resume</a> : <span className="muted-copy">No resume</span>}<select aria-label={`Application status for ${application.candidate_email}`} value={application.status} onChange={event => updateStatus(application, event.target.value)}><option value="SUBMITTED">Submitted</option><option value="REVIEWING">Reviewing</option><option value="SHORTLISTED">Shortlisted</option><option value="REJECTED">Rejected</option><option value="HIRED">Hired</option></select></div></div></div>)}</div> : <p className="muted-copy">Candidates who apply to your roles will appear here.</p>}
        </section>
      </div>
    </div>
  </div>
}

function NotFound() {
  return <div className="page-width standalone-state"><div className="empty-state"><span className="section-kicker">LOST YOUR WAY?</span><h2>That page moved on.</h2><p>The opportunity is still out there. Let’s find another route.</p><Link to="/" className="button button-primary">Back to home <Icon name="arrow" size={16} /></Link></div></div>
}

export default App
