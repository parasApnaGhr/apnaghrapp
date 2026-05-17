import { useCallback, useMemo, useState } from 'react'
import Shell from './components/layout/Shell'
import AuthScreen from './screens/AuthScreen'
import BookingsScreen from './screens/BookingsScreen'
import CartScreen from './screens/CartScreen'
import HomeScreen from './screens/HomeScreen'
import NotificationsScreen from './screens/NotificationsScreen'
import PaymentsScreen from './screens/PaymentsScreen'
import PrivacyScreen from './screens/PrivacyScreen'
import ProfileScreen from './screens/ProfileScreen'
import PropertyDetailScreen from './screens/PropertyDetailScreen'
import SuccessScreen from './screens/SuccessScreen'
import SupportScreen from './screens/SupportScreen'
import TripScreen from './screens/TripScreen'

function App() {
  const [screen, setScreen] = useState('auth')
  const [authMode, setAuthMode] = useState('login')
  const [cartVisits, setCartVisits] = useState([])
  const isLoggedIn = screen !== 'auth' && screen !== 'public-detail'

  const go = useCallback((next) => {
    setScreen(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const addVisitToCart = useCallback((visit) => {
    setCartVisits((currentVisits) => {
      const nextVisit = {
        ...visit,
        cartId: `${visit.id}-${Date.now()}`,
      }

      return [...currentVisits, nextVisit]
    })
    go('home')
  }, [go])

  const content = useMemo(() => {
    const screens = {
      auth: <AuthScreen go={go} authMode={authMode} setAuthMode={setAuthMode} />,
      home: <HomeScreen go={go} />,
      'public-detail': <PropertyDetailScreen go={go} isPublic />,
      detail: <PropertyDetailScreen go={go} onAddVisit={addVisitToCart} />,
      cart: <CartScreen go={go} cartVisits={cartVisits} />,
      bookings: <BookingsScreen go={go} />,
      trip: <TripScreen />,
      payments: <PaymentsScreen />,
      notifications: <NotificationsScreen />,
      profile: <ProfileScreen go={go} />,
      privacy: <PrivacyScreen />,
      support: <SupportScreen />,
      success: <SuccessScreen go={go} />,
    }

    return screens[screen] || screens.auth
  }, [screen, authMode, cartVisits, addVisitToCart, go])

  if (!isLoggedIn && screen === 'auth') {
    return content
  }

  return (
    <Shell active={screen} go={go} showSidebar={isLoggedIn}>
      {content}
    </Shell>
  )
}

export default App
