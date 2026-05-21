import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Results from './pages/Results'
import CommentsPage from './pages/CommentsPage'
import { LanguageProvider } from './contexts/LanguageContext'

export default function App() {
  return (
    <LanguageProvider>
      <Routes>
        <Route path="/"                                   element={<Home />} />
        <Route path="/results"                            element={<Results />} />
        <Route path="/comments/:videoId/:sentiment"       element={<CommentsPage />} />
      </Routes>
    </LanguageProvider>
  )
}
