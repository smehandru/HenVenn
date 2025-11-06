import { useRef } from 'react'
import './FileUpload.css'

interface FileUploadProps {
  onFileUpload: (file: File) => void
}

const FileUpload = ({ onFileUpload }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
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
      <button className="upload-button" onClick={handleClick}>
        Last opp PDF
      </button>
      <p className="upload-instruction">Last opp henvisninger først</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default FileUpload
