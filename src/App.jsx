import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav.jsx'
import Home from './pages/Home.jsx'
import Create from './pages/Create.jsx'
import MapPage from './pages/MapPage.jsx'
import ReviewPage from './pages/ReviewPage.jsx'

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/review" element={<ReviewPage />} />
      </Routes>
    </>
  )
}
