import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Welcome to QC LIMS</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
