import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout.jsx'
import Field from '../components/ui/Field.jsx'
import LoadingIndicator from '../components/ui/LoadingIndicator.jsx'
import { useAuth } from '../context/useAuth.js'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setErrors((current) => ({ ...current, [event.target.name]: '' }))
    setFormError('')
  }

  function validate() {
    const nextErrors = {}
    if (!form.email.trim()) nextErrors.email = 'Enter your email address.'
    if (!form.password) nextErrors.password = 'Enter your password.'
    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    setFormError('')
    try {
      await login({ email: form.email.trim(), password: form.password })
      const destination = location.state?.from?.pathname || '/dashboard'
      navigate(destination, { replace: true })
    } catch (error) {
      setFormError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back."
      description="Step back into your creative space and continue exploring."
      visualTitle="A better room starts with a better question."
      visualDescription="Keep your favourite directions close, and let the next decision feel a little easier."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && <div className="form-error" role="alert">{formError}</div>}
        <Field id="email" label="Email address" type="email" value={form.email} onChange={updateField} placeholder="you@example.com" autoComplete="email" error={errors.email} />
        <Field id="password" label="Password" type="password" value={form.password} onChange={updateField} placeholder="Enter your password" autoComplete="current-password" error={errors.password} passwordVisible={passwordVisible} onTogglePassword={() => setPasswordVisible((visible) => !visible)} />
        <button className="button button-primary auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <LoadingIndicator label="Signing in..." /> : 'Log in to PaintViz'}
        </button>
      </form>
      <p className="auth-switch">New to PaintViz? <Link to="/register">Create an account</Link></p>
    </AuthLayout>
  )
}

export default Login
