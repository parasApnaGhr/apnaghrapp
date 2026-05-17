import { BrowserRouter, Routes, Route } from 'react-router-dom'

import SignIn from './pages/SignIn'
import Home from './pages/Home'

import Bookings from './pages/Bookings'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/home" element={<Home />} />
     
         <Route path="/bookings" element={<Bookings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App