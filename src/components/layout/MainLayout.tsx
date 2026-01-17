import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
    children?: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className={`app-wrapper ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
            <Sidebar
                collapsed={sidebarCollapsed}
                setCollapsed={setSidebarCollapsed}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            {/* Expand button when sidebar is collapsed - floating button */}
            {sidebarCollapsed && (
                <button
                    className="sidebar-expand-btn"
                    onClick={toggleSidebar}
                    title="Expand sidebar"
                >
                    <span className="material-symbols-rounded">chevron_right</span>
                </button>
            )}

            <div className={`main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Header
                    onMenuClick={() => setMobileOpen(true)}
                    sidebarCollapsed={sidebarCollapsed}
                    onToggleSidebar={toggleSidebar}
                />
                <main className="main-content">
                    {children || <Outlet />}
                </main>
            </div>
        </div>
    );
}
