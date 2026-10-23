import { Eye, EyeOff } from 'lucide-react'

function Field({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  required = true,
  passwordVisible,
  onTogglePassword,
}) {
  const inputType = type === 'password' && passwordVisible ? 'text' : type

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={type === 'password' ? 'password-wrap' : undefined}>
        <input
          id={id}
          name={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {type === 'password' && (
          <button
            className="password-toggle"
            type="button"
            onClick={onTogglePassword}
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
          >
            {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {error && <span className="field-error" id={`${id}-error`}>{error}</span>}
    </div>
  )
}

export default Field
