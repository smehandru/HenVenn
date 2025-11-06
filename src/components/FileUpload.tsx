import { useRef } from 'react'
import './FileUpload.css'

interface FileUploadProps {
  onFileUpload: (file: File) => void
  disabled?: boolean
}

const FileUpload = ({ onFileUpload, disabled = false }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      onFileUpload(file)
    } else {
      alert('Vennligst last opp en PDF-fil')
    }
  }

  return (
    <div className="file-upload">
      <button
        className="upload-button"
        onClick={handleClick}
        disabled={disabled}
        style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        Last opp PDF
      </button>
      <p className="upload-instruction">Last opp henvisninger først</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
    </div>
  )
}

export default FileUpload
