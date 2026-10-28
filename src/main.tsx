import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {import.meta.env.MODE === 'apew-preview' && <div role="status" className="preview-notice">合成データのプレビュー</div>}
    <App />
  </StrictMode>,
)

