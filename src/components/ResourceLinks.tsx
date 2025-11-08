import './ResourceLinks.css'

const ResourceLinks = () => {
  const openMetodebok = () => {
    window.open('https://metodebok.no/bok/ousortopedi/ortopedi-(ous-ullevål)', '_blank', 'noopener,noreferrer')
  }

  const openPrioriteringsveileder = () => {
    window.open('https://www.helsedirektoratet.no/veiledere/prioriteringsveiledere/ortopedi', '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="resource-links">
      <button className="resource-button metodebok-button" onClick={openMetodebok}>
        📖 Metodebok
      </button>
      <button className="resource-button veileder-button" onClick={openPrioriteringsveileder}>
        📋 Prioriteringsveileder
      </button>
    </div>
  )
}

export default ResourceLinks
