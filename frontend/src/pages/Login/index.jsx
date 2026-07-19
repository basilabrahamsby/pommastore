import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  const setAuth = useAuthStore(s => s.setAuth)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      const form = new URLSearchParams()
      form.append('username', email.trim())
      form.append('password', password)
      const { data } = await api.post('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      setAuth(data.access_token, data.user)
      toast.success(`Welcome back, ${data.user.full_name || 'Admin'}!`)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      
      {/* Animated Business Growth Image Full Background */}
      <div style={styles.growthBgWrapper}>
        <img src="/erp-growth-bg.png" alt="Business Growth" style={styles.growthBgImage} />
        {/* Overlay to fade the edges and darken behind the form */}
        <div style={styles.growthBgOverlay} />
      </div>

      {/* Animated Background Elements */}
      <div style={{...styles.floatingOrb, top: '10%', right: '15%', animation: 'floatY 6s ease-in-out infinite'}} />
      <div style={{...styles.floatingOrb, bottom: '20%', left: '10%', width: 120, height: 120, animation: 'floatYB 8s ease-in-out infinite'}} />
      <div style={{...styles.sparkle, top: '25%', right: '25%', animation: 'pulseOrb 4s ease-in-out infinite'}} />
      <div style={{...styles.sparkle, bottom: '15%', right: '20%', animation: 'pulseOrb 5s ease-in-out infinite 1s'}} />

      {/* Central Login Card */}
      <div style={styles.formInner}>
        <div style={styles.formHeader}>
          {/* Logo */}
          <div style={styles.logoBlock}>
            <img src={`${import.meta.env.BASE_URL}logo_centered.png`.replace(/\/\//g, '/')} alt="Pommastore Logo" style={{ height: '76px', objectFit: 'contain', marginBottom: 12, marginLeft: 'auto', marginRight: 'auto', display: 'block' }} />
            <p style={styles.logoSub}>Admin ERP Platform</p>
          </div>
        </div>

        <div style={styles.cardBox}>
          <div style={{marginBottom: 32, textAlign: 'center'}}>
            <h2 style={styles.formTitle}>Welcome back</h2>
            <p style={styles.formSubtitle}>Sign in to your admin account</p>
          </div>

          {errorMsg && (
            <div style={styles.errorBanner}>
              <span style={{marginRight: 6}}>⚠️</span> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div className="form-group">
              <label className="form-label" style={{fontSize:'0.82rem'}}>Email Address</label>
              <input
                id="login-email"
                className="input"
                type="email"
                placeholder="admin@pommastore.in"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                required
                style={{height: 48, fontSize: '0.9rem'}}
              />
            </div>

            <div className="form-group">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <label className="form-label" style={{fontSize:'0.82rem'}}>Password</label>
                <span style={{fontSize:'0.72rem', color:'var(--gold)', cursor:'pointer'}}>Forgot password?</span>
              </div>
              <input
                id="login-password"
                className="input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
                required
                style={{height: 48, fontSize: '0.9rem'}}
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              style={styles.submitBtn}
            >
              {loading ? (
                <span style={{display:'flex', alignItems:'center', gap: 8, justifyContent:'center'}}>
                  <span style={styles.spinner} /> Signing in…
                </span>
              ) : 'Sign In to Dashboard'}
            </button>
          </form>

          {/* Trust badges */}
          <div style={styles.trustRow}>
            {['🔒 256-bit Encrypted', '✅ Role-Based Access', '📋 Audit Logged'].map(t => (
              <span key={t} style={styles.trustBadge}>{t}</span>
            ))}
          </div>

          <p style={styles.footer}>
            Pommastore ERP v1.0 &nbsp;·&nbsp; For authorized personnel only<br />
            <span style={{marginTop: 6, display: 'inline-block'}}>
              Powered by <a href="https://teqmates.com" target="_blank" rel="noreferrer" style={styles.footerLink}>TeqMates</a>
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: '100vh',
    background: 'var(--bg-base)',
    position: 'relative',
    overflow: 'hidden',
  },

  growthBgWrapper: {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.35, /* Subtle background */
  },
  growthBgImage: {
    width: '120%',
    height: '120%',
    objectFit: 'cover',
    animation: 'panSlow 35s ease-in-out infinite alternate',
    filter: 'contrast(1.2) brightness(0.8)',
  },
  growthBgOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at center, rgba(8,8,15,0.4) 0%, var(--bg-base) 80%)',
  },
  
  floatingOrb: {
    position: 'absolute',
    width: 240, height: 240,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(210, 22, 141, 0.06) 0%, transparent 60%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  sparkle: {
    position: 'absolute',
    width: 3, height: 3,
    borderRadius: '50%',
    background: '#d2168d',
    boxShadow: '0 0 12px 3px rgba(210, 22, 141, 0.6)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  formInner: {
    width: '100%',
    maxWidth: 440,
    margin: '0 auto',
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
  },

  logoBlock: { marginBottom: 36, textAlign: 'center' },
  logoIcon: { fontSize: '2.4rem', marginBottom: 12 },
  logoText: {
    fontFamily: "'Cinzel', serif",
    fontSize: '2.2rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #c9a84c 0%, #f0d98a 50%, #c9a84c 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '0.1em',
    margin: 0,
    lineHeight: 1.1,
  },
  logoSub: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    marginTop: 8,
  },

  cardBox: {
    background: 'rgba(19, 19, 31, 0.65)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 'var(--radius-xl)',
    padding: '48px 40px',
    width: '100%',
    boxShadow: '0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
  },

  formHeader: { width: '100%' },
  formTitle: {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 6px',
    lineHeight: 1.2,
  },
  formSubtitle: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    margin: 0,
  },

  errorBanner: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.82rem',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    fontWeight: 500,
  },

  form: { display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 },

  submitBtn: {
    width: '100%',
    height: 50,
    background: 'linear-gradient(135deg, #9b1067, #d2168d, #f731ad)',
    border: 'none',
    borderRadius: 10,
    color: '#08080f',
    fontSize: '0.92rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.03em',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 20px rgba(210, 22, 141, 0.25)',
    marginTop: 4,
  },

  spinner: {
    display: 'inline-block',
    width: 14,
    height: 14,
    border: '2px solid rgba(0,0,0,0.2)',
    borderTop: '2px solid #000',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },

  trustRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 28,
  },
  trustBadge: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border)',
    borderRadius: 99,
    padding: '4px 10px',
  },

  footer: {
    textAlign: 'center',
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    borderTop: '1px solid var(--border)',
    paddingTop: 20,
  },
  footerLink: {
    color: 'var(--gold)',
    textDecoration: 'none',
    fontWeight: 600,
  },
}
