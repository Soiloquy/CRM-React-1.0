import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

async function bootstrap() {
  const { worker } = await import('./mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
  })

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

bootstrap()
