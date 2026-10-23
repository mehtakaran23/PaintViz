import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout.jsx'
import Field from '../components/ui/Field.jsx'
import LoadingIndicator from '../components/ui/LoadingIndicator.jsx'
import { useAuth } from '../context/useAuth.js'

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
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
    if (!form.name.trim()) nextErrors.name = 'Tell us your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.'
    const passwordBytes = new TextEncoder().encode(form.password).length
    if (passwordBytes < 8 || passwordBytes > 72) nextErrors.password = 'Use 8 to 72 characters.'
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
      await register({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setFormError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Make room for ideas."
      description="Create your free studio and start seeing your space differently."
      visualTitle="Your next favourite room is one decision away."
      visualDescription="Save the possibilities, compare the moods and find a shade that belongs in your home."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && <div className="form-error" role="alert">{formError}</div>}
        <Field id="name" label="Your name" value={form.name} onChange={updateField} placeholder="Alex Morgan" autoComplete="name" error={errors.name} />
        <Field id="email" label="Email address" type="email" value={form.email} onChange={updateField} placeholder="you@example.com" autoComplete="email" error={errors.email} />
        <Field id="password" label="Create a password" type="password" value={form.password} onChange={updateField} placeholder="8 to 72 characters" autoComplete="new-password" error={errors.password} passwordVisible={passwordVisible} onTogglePassword={() => setPasswordVisible((visible) => !visible)} />
        <button className="button button-primary auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <LoadingIndicator label="Creating your studio..." /> : 'Create my studio'}
        </button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
    </AuthLayout>
  )
}

export default Register
