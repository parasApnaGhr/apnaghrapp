import Topbar from './Topbar'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import MobileHeader from './MobileHeader'

function Shell({ active, go, showSidebar = true, children }) {
  return (
    <div className="app-shell">
      <Topbar go={go} />
      <MobileHeader go={go} />
      <div className="workspace">
        {showSidebar && <Sidebar active={active} go={go} />}
        <main className="main-panel">{children}</main>
      </div>
      {showSidebar && <BottomNav active={active} go={go} />}
    </div>
  )
}

export default Shell
