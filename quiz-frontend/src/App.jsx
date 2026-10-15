import { useState, useEffect, useCallback } from 'react'
import './App.css'

const API_BASE = `${import.meta.env.VITE_API_URL}/api`
// ──────────────────────────────────────────────────
// Fallback quizzes (offline / demo mode)
// ──────────────────────────────────────────────────
const FALLBACK_QUIZZES = [
  {
    id: 1,
    title: 'Java 21 Modern Features & Core OOP',
    description: 'Test your knowledge of Java 21 LTS features, records, pattern matching, virtual threads, and OOP principles.',
    category: 'Java',
    questionCount: 4,
    timeLimitMinutes: 5,
    passingScore: 75,
    questions: [
      { id: 1, questionText: 'Which major concurrency feature was made permanent in Java 21 (JEP 444)?', options: ['Virtual Threads (Project Loom)', 'Coroutines', 'Reactive Streams', 'Green Threads 2.0'], correctIndex: 0, explanation: 'Virtual threads are lightweight threads that drastically reduce the effort of writing high-throughput concurrent applications.' },
      { id: 2, questionText: 'Which keyword defines an immutable data-carrier class with built-in getters, equals, and hashCode?', options: ['interface', 'record', 'sealed', 'struct'], correctIndex: 1, explanation: 'Records provide a concise syntax for declaring classes that are transparent holders for shallowly immutable data.' },
      { id: 3, questionText: 'What is the default initial capacity of an ArrayList in Java?', options: ['0 (until first element, then 10)', '16', '32', '8'], correctIndex: 0, explanation: 'An ArrayList initializes with an empty array and expands to capacity 10 upon first addition.' },
      { id: 4, questionText: 'Can an abstract class in Java have concrete methods?', options: ['Yes — both abstract and concrete methods', 'No — only interfaces can have default methods', 'No — all methods must be abstract', 'Only if marked static'], correctIndex: 0, explanation: 'Abstract classes can provide full implementations alongside abstract method signatures.' }
    ]
  },
  {
    id: 2,
    title: 'Spring Boot 3.x & REST Architecture',
    description: 'Evaluate your skills in Spring Boot 3 autoconfiguration, JPA repositories, dependency injection, and REST controllers.',
    category: 'Spring Boot',
    questionCount: 3,
    timeLimitMinutes: 4,
    passingScore: 66,
    questions: [
      { id: 5, questionText: 'Which annotation combines @Controller and @ResponseBody in Spring?', options: ['@RestController', '@Service', '@Component', '@Endpoint'], correctIndex: 0, explanation: '@RestController is a convenience annotation that combines @Controller and @ResponseBody.' },
      { id: 6, questionText: 'Minimum Java version required by Spring Boot 3.x?', options: ['Java 17', 'Java 8', 'Java 11', 'Java 21'], correctIndex: 0, explanation: 'Spring Boot 3 requires Java 17 as the minimum baseline.' },
      { id: 7, questionText: 'Default embedded HTTP server in Spring Boot starter web?', options: ['Apache Tomcat', 'Jetty', 'Undertow', 'Netty'], correctIndex: 0, explanation: 'Apache Tomcat is the default embedded servlet container in spring-boot-starter-web.' }
    ]
  },
  {
    id: 3,
    title: 'React.js & State Management',
    description: 'Master React hooks, components, Virtual DOM, and state management fundamentals.',
    category: 'React',
    questionCount: 3,
    timeLimitMinutes: 4,
    passingScore: 66,
    questions: [
      { id: 8, questionText: 'Which hook manages side-effects like data fetching in React functional components?', options: ['useEffect', 'useState', 'useMemo', 'useCallback'], correctIndex: 0, explanation: 'useEffect lets you synchronize a component with external systems such as APIs or event listeners.' },
      { id: 9, questionText: 'Why is Vite significantly faster than Webpack dev servers?', options: ['Native ES Modules (ESM) + esbuild', 'Python bundler', 'Skips minification', 'No build step needed'], correctIndex: 0, explanation: 'Vite serves source code over native ESM, offloading orchestration to the browser engine.' },
      { id: 10, questionText: 'What does JSX stand for?', options: ['JavaScript XML', 'Java Syntax Extension', 'JSON Structured XML', 'JavaScript XHR'], correctIndex: 0, explanation: 'JSX stands for JavaScript XML, allowing HTML-like structures inside JavaScript.' }
    ]
  }
]

// ──────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────
const saveAuth = (token, user) => {
  localStorage.setItem('qp_token', token)
  localStorage.setItem('qp_user', JSON.stringify(user))
}
const clearAuth = () => {
  localStorage.removeItem('qp_token')
  localStorage.removeItem('qp_user')
}
const loadAuth = () => {
  const token = localStorage.getItem('qp_token')
  const raw = localStorage.getItem('qp_user')
  if (token && raw) {
    try { return { token, user: JSON.parse(raw) } } catch { /* */ }
  }
  return null
}

// ──────────────────────────────────────────────────
// Auth Forms
// ──────────────────────────────────────────────────
function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    setSuccess('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) { setError('Email and password are required.'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed. Check your credentials.'); return }
      saveAuth(data.token, data.user)
      onAuthSuccess(data.token, data.user)
    } catch {
      setError('Cannot reach the server. Please start the backend and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.username || !form.email || !form.password) { setError('All fields are required.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, email: form.email, password: form.password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed.'); return }
      saveAuth(data.token, data.user)
      setSuccess('Account created! Signing you in…')
      setTimeout(() => onAuthSuccess(data.token, data.user), 800)
    } catch {
      setError('Cannot reach the server. Please start the backend and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-icon">⚡</span>
          <span className="auth-brand-name">QuizPulse</span>
        </div>
        <p className="auth-tagline">Full-Stack Learning Engine</p>

        <div className="auth-tabs">
          <button
            id="tab-login"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setSuccess('') }}
          >Sign In</button>
          <button
            id="tab-signup"
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
          >Create Account</button>
        </div>

        {error && <div className="auth-alert error" role="alert">⚠ {error}</div>}
        {success && <div className="auth-alert success" role="status">✔ {success}</div>}

        {mode === 'login' ? (
          <form id="form-login" onSubmit={handleLogin} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                autoComplete="current-password"
                required
              />
            </div>
            <button id="btn-login-submit" type="submit" className="btn-auth" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Sign In →'}
            </button>
            <p className="auth-switch">
              No account yet?{' '}
              <button type="button" className="link-btn" onClick={() => { setMode('signup'); setError(''); setSuccess('') }}>
                Create one
              </button>
            </p>
          </form>
        ) : (
          <form id="form-signup" onSubmit={handleSignup} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="signup-username">Username</label>
              <input
                id="signup-username"
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="e.g. javadev21"
                autoComplete="username"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="signup-email">Email Address</label>
              <input
                id="signup-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="signup-confirm">Confirm Password</label>
              <input
                id="signup-confirm"
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                placeholder="Repeat password"
                autoComplete="new-password"
                required
              />
            </div>
            <button id="btn-signup-submit" type="submit" className="btn-auth" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Account →'}
            </button>
            <p className="auth-switch">
              Already have an account?{' '}
              <button type="button" className="link-btn" onClick={() => { setMode('login'); setError(''); setSuccess('') }}>
                Sign in
              </button>
            </p>
          </form>
        )}

        <p className="auth-demo-note">
          🔒 Passwords are hashed with BCrypt · Tokens expire in 24 h
        </p>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────
// Main App
// ──────────────────────────────────────────────────
function App() {
  // Auth state
  const [authToken, setAuthToken] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true) // loading persisted session

  // Backend / quiz state
  const [backendStatus, setBackendStatus] = useState('checking')
  const [quizzes, setQuizzes] = useState(FALLBACK_QUIZZES)
  const [activeCategory, setActiveCategory] = useState('All')

  // Quiz-taking state
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [quizResult, setQuizResult] = useState(null)

  // ── Restore session from localStorage ──
  useEffect(() => {
    const saved = loadAuth()
    if (saved) {
      setAuthToken(saved.token)
      setCurrentUser(saved.user)
    }
    setAuthLoading(false)
  }, [])

  const handleAuthSuccess = useCallback((token, user) => {
    setAuthToken(token)
    setCurrentUser(user)
  }, [])

  const handleLogout = useCallback(() => {
    clearAuth()
    setAuthToken(null)
    setCurrentUser(null)
    setCurrentQuiz(null)
    setQuizResult(null)
  }, [])

  // ── Backend health check ──
  useEffect(() => {
    if (!authToken) return
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`)
        if (res.ok) {
          setBackendStatus('connected')
          const qRes = await fetch(`${API_BASE}/quizzes`)
          if (qRes.ok) {
            const data = await qRes.json()
            if (data && data.length > 0) setQuizzes(data)
          }
        } else {
          setBackendStatus('offline')
        }
      } catch {
        setBackendStatus('offline')
      }
    }
    checkBackend()
    const interval = setInterval(checkBackend, 10000)
    return () => clearInterval(interval)
  }, [authToken])

  // ── Timer ──
  useEffect(() => {
    if (!currentQuiz || quizResult) return
    if (timeLeft <= 0) { handleFinishQuiz(); return }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [currentQuiz, timeLeft, quizResult])

  const handleStartQuiz = async (quiz) => {
    let fullQuiz = quiz
    if (backendStatus === 'connected') {
      try {
        const res = await fetch(`${API_BASE}/quizzes/${quiz.id}`)
        if (res.ok) fullQuiz = await res.json()
      } catch { /* use local */ }
    }
    if (!fullQuiz.questions || fullQuiz.questions.length === 0) {
      const fallback = FALLBACK_QUIZZES.find(q => q.id === quiz.id)
      if (fallback) fullQuiz = fallback
    }
    setCurrentQuiz(fullQuiz)
    setCurrentQuestionIdx(0)
    setUserAnswers({})
    setTimeLeft(fullQuiz.timeLimitMinutes * 60)
    setQuizResult(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSelectOption = (questionId, optionIdx) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: optionIdx }))
  }

  const handleFinishQuiz = async () => {
    if (!currentQuiz) return
    if (backendStatus === 'connected') {
      try {
        const res = await fetch(`${API_BASE}/quizzes/${currentQuiz.id}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ answers: userAnswers })
        })
        if (res.ok) { setQuizResult(await res.json()); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
      } catch { /* fall through */ }
    }
    // Client-side evaluation
    const questions = currentQuiz.questions || []
    let score = 0
    const breakdown = questions.map(q => {
      const userChoice = userAnswers[q.id]
      const isCorrect = userChoice === q.correctIndex
      if (isCorrect) score++
      return { questionId: q.id, questionText: q.questionText, options: q.options, correctIndex: q.correctIndex, userChoice: userChoice !== undefined ? userChoice : null, isCorrect, explanation: q.explanation || '' }
    })
    const percentage = Math.round((score / questions.length) * 100)
    const passed = percentage >= (currentQuiz.passingScore || 70)
    setQuizResult({ quizId: currentQuiz.id, score, totalQuestions: questions.length, percentage, passingScore: currentQuiz.passingScore || 70, passed, breakdown })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const categories = ['All', 'Java', 'Spring Boot', 'React']
  const filteredQuizzes = activeCategory === 'All' ? quizzes : quizzes.filter(q => q.category === activeCategory)
  const currentQuestion = currentQuiz?.questions?.[currentQuestionIdx]

  // ── Gate: show auth page if not logged in ──
  if (authLoading) return <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><span className="spinner large" /></div>
  if (!authToken) return <AuthPage onAuthSuccess={handleAuthSuccess} />

  // ── Authenticated App ──
  return (
    <div className="app-container">
      {/* Navbar */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="brand-icon">⚡</div>
          <div className="brand-text">
            <h1>QuizPulse</h1>
            <p>Full-Stack Learning Engine</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="status-badge" title="Spring Boot backend status">
            <div className={`status-dot ${backendStatus === 'connected' ? 'online' : 'offline'}`} />
            <span>{backendStatus === 'connected' ? 'API: Connected' : 'API: Offline (Demo)'}</span>
          </div>

          <div className="user-chip">
            <div className="user-avatar">{currentUser?.username?.[0]?.toUpperCase() || '?'}</div>
            <span className="user-name">{currentUser?.username}</span>
            <button id="btn-logout" className="btn-logout" onClick={handleLogout} title="Sign out">⎋</button>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      {!currentQuiz && !quizResult && (
        <main>
          <section className="hero-section">
            <div className="hero-pill">✨ Modern Tech Skill Assessments</div>
            <h2 className="hero-title">
              Welcome back, <span>{currentUser?.username}</span>!
            </h2>
            <p className="hero-subtitle">
              Interactive assessments with real-time feedback, detailed explanations, and instant score analytics powered by Java 21 and Spring Boot 3.
            </p>
          </section>

          <div className="filter-bar">
            {categories.map(cat => (
              <button
                key={cat}
                id={`filter-${cat.replace(' ', '-')}`}
                className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >{cat}</button>
            ))}
          </div>

          <div className="quiz-grid">
            {filteredQuizzes.map(quiz => (
              <div key={quiz.id} className="quiz-card">
                <div>
                  <div className="quiz-card-top">
                    <span className="category-tag">{quiz.category}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>Pass: {quiz.passingScore}%</span>
                  </div>
                  <h3>{quiz.title}</h3>
                  <p>{quiz.description}</p>
                </div>
                <div>
                  <div className="quiz-meta-row">
                    <div className="quiz-meta-item"><span>⏱</span><span>{quiz.timeLimitMinutes} Mins</span></div>
                    <div className="quiz-meta-item"><span>📝</span><span>{quiz.questionCount || quiz.questions?.length} Qs</span></div>
                  </div>
                  <button id={`btn-start-${quiz.id}`} className="btn-start" onClick={() => handleStartQuiz(quiz)}>
                    Start Assessment ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* Quiz Interface */}
      {currentQuiz && !quizResult && currentQuestion && (
        <div className="quiz-active-wrapper">
          <div className="quiz-active-header">
            <div className="quiz-active-info">
              <h2>{currentQuiz.title}</h2>
              <p>Category: {currentQuiz.category} · Passing: {currentQuiz.passingScore}%</p>
            </div>
            <div className={`timer-box ${timeLeft < 60 ? 'warning' : ''}`}>
              <span>⏱</span>
              <span className="timer-time">{formatTimer(timeLeft)}</span>
            </div>
          </div>

          <div className="stepper-bar">
            {currentQuiz.questions.map((q, idx) => (
              <button
                key={q.id}
                className={`step-pill ${idx === currentQuestionIdx ? 'current' : ''} ${userAnswers[q.id] !== undefined ? 'answered' : ''}`}
                onClick={() => setCurrentQuestionIdx(idx)}
              >{idx + 1}</button>
            ))}
          </div>

          <div className="question-card">
            <span className="question-badge">Question {currentQuestionIdx + 1} of {currentQuiz.questions.length}</span>
            <h3 className="question-text">{currentQuestion.questionText}</h3>
            <div className="options-list">
              {currentQuestion.options.map((opt, optIdx) => (
                <button
                  key={optIdx}
                  className={`option-item ${userAnswers[currentQuestion.id] === optIdx ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                >
                  <div className="option-letter">{String.fromCharCode(65 + optIdx)}</div>
                  <div className="option-content">{opt}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="quiz-controls">
            <button className="btn-secondary" disabled={currentQuestionIdx === 0} onClick={() => setCurrentQuestionIdx(p => p - 1)}>⬅ Previous</button>
            {currentQuestionIdx < currentQuiz.questions.length - 1
              ? <button className="btn-primary" onClick={() => setCurrentQuestionIdx(p => p + 1)}>Next ➡</button>
              : <button className="btn-primary btn-submit" onClick={handleFinishQuiz}>Submit Assessment ✔</button>
            }
          </div>
        </div>
      )}

      {/* Results */}
      {quizResult && (
        <div className="result-wrapper">
          <div className="result-card">
            <div className={`result-badge ${quizResult.passed ? 'passed' : 'failed'}`}>
              {quizResult.passed ? '🎉 Assessment Passed' : '⚠️ Need More Practice'}
            </div>
            <div className="result-score-circle">{quizResult.percentage}%</div>
            <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>
              {quizResult.passed ? 'Outstanding Work!' : 'Good Effort, Keep Learning!'}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              You answered {quizResult.score} out of {quizResult.totalQuestions} correctly.
            </p>
            <div className="result-stats-grid">
              <div className="stat-item"><div className="stat-label">Total</div><div className="stat-val">{quizResult.totalQuestions}</div></div>
              <div className="stat-item"><div className="stat-label">Correct</div><div className="stat-val correct">{quizResult.score}</div></div>
              <div className="stat-item"><div className="stat-label">Wrong</div><div className="stat-val wrong">{quizResult.totalQuestions - quizResult.score}</div></div>
            </div>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => { setQuizResult(null); setCurrentQuiz(null) }}>Back to Quizzes</button>
              {currentQuiz && <button className="btn-secondary" onClick={() => handleStartQuiz(currentQuiz)}>Retake Quiz</button>}
            </div>
          </div>

          <h3 className="review-header">Detailed Question Breakdown</h3>
          <div className="review-list">
            {quizResult.breakdown?.map((item, idx) => (
              <div key={idx} className={`review-item ${item.isCorrect ? 'correct' : 'wrong'}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dim)' }}>Question {idx + 1}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: item.isCorrect ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {item.isCorrect ? '✔ Correct' : '✖ Incorrect'}
                  </span>
                </div>
                <h4 style={{ fontSize: '16px', marginBottom: '12px' }}>{item.questionText}</h4>
                <div style={{ fontSize: '14px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Your Answer: </span>
                  <strong style={{ color: item.isCorrect ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {item.userChoice !== null && item.options ? item.options[item.userChoice] : 'Not answered'}
                  </strong>
                </div>
                {!item.isCorrect && item.options && (
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Correct Answer: </span>
                    <strong style={{ color: 'var(--accent-emerald)' }}>{item.options[item.correctIndex]}</strong>
                  </div>
                )}
                {item.explanation && (
                  <div className="review-explanation">💡 <strong>Explanation:</strong> {item.explanation}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
