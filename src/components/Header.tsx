import './Header.css'

const Header = () => {
  return (
    <header className="header">
      <div className="logo">
        {/* Modern minimalist logo: Circuit board around a bone */}
        <svg className="logo-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Bone shape (central element) */}
          <path
            d="M18 14C18 12.3431 16.6569 11 15 11C13.3431 11 12 12.3431 12 14C12 15.1046 12.5965 16.0687 13.5 16.5858V31.4142C12.5965 31.9313 12 32.8954 12 34C12 35.6569 13.3431 37 15 37C16.6569 37 18 35.6569 18 34C18 32.8954 17.4035 31.9313 16.5 31.4142V16.5858C17.4035 16.0687 18 15.1046 18 14Z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M36 14C36 12.3431 34.6569 11 33 11C31.3431 11 30 12.3431 30 14C30 15.1046 30.5965 16.0687 31.5 16.5858V31.4142C30.5965 31.9313 30 32.8954 30 34C30 35.6569 31.3431 37 33 37C34.6569 37 36 35.6569 36 34C36 32.8954 35.4035 31.9313 34.5 31.4142V16.5858C35.4035 16.0687 36 15.1046 36 14Z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M15 19H33"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.9"
          />
          <path
            d="M15 24H33"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.9"
          />
          <path
            d="M15 29H33"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Circuit board elements around the bone */}
          {/* Top-left circuit nodes */}
          <circle cx="6" cy="8" r="1.5" fill="currentColor" opacity="0.6" />
          <circle cx="10" cy="6" r="1.5" fill="currentColor" opacity="0.6" />
          <path d="M6 8L10 6" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <path d="M10 6L12 11" stroke="currentColor" strokeWidth="1" opacity="0.4" />

          {/* Top-right circuit nodes */}
          <circle cx="42" cy="8" r="1.5" fill="currentColor" opacity="0.6" />
          <circle cx="38" cy="6" r="1.5" fill="currentColor" opacity="0.6" />
          <path d="M42 8L38 6" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <path d="M38 6L36 11" stroke="currentColor" strokeWidth="1" opacity="0.4" />

          {/* Bottom-left circuit nodes */}
          <circle cx="6" cy="40" r="1.5" fill="currentColor" opacity="0.6" />
          <circle cx="10" cy="42" r="1.5" fill="currentColor" opacity="0.6" />
          <path d="M6 40L10 42" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <path d="M10 42L12 37" stroke="currentColor" strokeWidth="1" opacity="0.4" />

          {/* Bottom-right circuit nodes */}
          <circle cx="42" cy="40" r="1.5" fill="currentColor" opacity="0.6" />
          <circle cx="38" cy="42" r="1.5" fill="currentColor" opacity="0.6" />
          <path d="M42 40L38 42" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <path d="M38 42L36 37" stroke="currentColor" strokeWidth="1" opacity="0.4" />

          {/* Side circuit connections */}
          <circle cx="4" cy="24" r="1.5" fill="currentColor" opacity="0.6" />
          <path d="M4 24L12 24" stroke="currentColor" strokeWidth="1" opacity="0.4" />

          <circle cx="44" cy="24" r="1.5" fill="currentColor" opacity="0.6" />
          <path d="M44 24L36 24" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        </svg>
        <span className="logo-text">HenVenn</span>
      </div>
    </header>
  )
}

export default Header
