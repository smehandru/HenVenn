import './Header.css'

const Header = () => {
  return (
    <header className="header">
      <div className="logo">
        {/* Modern minimalist logo: Laptop showing a humerus bone on screen */}
        <svg className="logo-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Laptop base/keyboard */}
          <path
            d="M4 36L6 34H42L44 36V38H4V36Z"
            fill="currentColor"
            opacity="0.8"
          />

          {/* Laptop screen frame */}
          <rect
            x="8"
            y="8"
            width="32"
            height="24"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            opacity="0.9"
          />

          {/* Screen background */}
          <rect
            x="10"
            y="10"
            width="28"
            height="20"
            fill="currentColor"
            opacity="0.1"
          />

          {/* Humerus bone on screen - simplified anatomical shape */}
          {/* Upper end (proximal - head of humerus) */}
          <circle
            cx="24"
            cy="14"
            r="2.5"
            fill="currentColor"
            opacity="0.9"
          />

          {/* Shaft of humerus */}
          <rect
            x="22.5"
            y="14"
            width="3"
            height="10"
            fill="currentColor"
            opacity="0.9"
            rx="0.5"
          />

          {/* Lower end (distal - condyles) */}
          <ellipse
            cx="22"
            cy="25"
            rx="1.8"
            ry="2"
            fill="currentColor"
            opacity="0.9"
          />
          <ellipse
            cx="26"
            cy="25"
            rx="1.8"
            ry="2"
            fill="currentColor"
            opacity="0.9"
          />
        </svg>
        <div className="logo-content">
          <span className="logo-text">HenVenn</span>
          <span className="logo-subtitle">- Klinisk beslutningsstøtte for henvisningsarbeid</span>
        </div>
      </div>
    </header>
  )
}

export default Header
