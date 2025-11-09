import './Header.css'

const Header = () => {
  return (
    <header className="header">
      <div className="logo">
        {/* Simple tilted bone icon - humerus */}
        <svg className="logo-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="rotate(-25 24 24)">
            {/* Upper end (proximal - head of humerus) */}
            <circle
              cx="24"
              cy="10"
              r="3.5"
              fill="currentColor"
              opacity="0.9"
            />

            {/* Shaft of humerus */}
            <rect
              x="22"
              y="10"
              width="4"
              height="24"
              fill="currentColor"
              opacity="0.9"
              rx="1"
            />

            {/* Lower end (distal - condyles) */}
            <ellipse
              cx="21"
              cy="34"
              rx="2.5"
              ry="3"
              fill="currentColor"
              opacity="0.9"
            />
            <ellipse
              cx="27"
              cy="34"
              rx="2.5"
              ry="3"
              fill="currentColor"
              opacity="0.9"
            />
          </g>
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
