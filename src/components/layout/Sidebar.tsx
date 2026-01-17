import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface NavItem {
    path: string;
    label: string;
    icon: string;
    roles?: UserRole[];
}

const navItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: 'dashboard' },
    { path: '/students', label: 'Students', icon: 'school' },
    { path: '/staff', label: 'Staff', icon: 'badge', roles: ['super_admin', 'admin'] },
    { path: '/classes', label: 'Classes', icon: 'class' },
    { path: '/attendance', label: 'Attendance', icon: 'event_available' },
    { path: '/fees', label: 'Fees', icon: 'account_balance_wallet' },
    { path: '/exams', label: 'Exams', icon: 'quiz' },
    { path: '/notices', label: 'Notices', icon: 'notifications' },
    { path: '/reports', label: 'Reports', icon: 'bar_chart', roles: ['super_admin', 'admin', 'accountant'] },
    { path: '/settings', label: 'Settings', icon: 'settings' },
];

const superAdminItems: NavItem[] = [
    { path: '/admin/institutes', label: 'Institutes', icon: 'business' },
    { path: '/admin/users', label: 'Platform Users', icon: 'manage_accounts' },
];

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
    const { user, hasPermission, logout, isSuperAdmin } = useAuth();
    const location = useLocation();

    // Close mobile sidebar on route change
    useEffect(() => {
        if (mobileOpen) {
            setMobileOpen(false);
        }
    }, [location.pathname]);

    const filterNavItems = (items: NavItem[]): NavItem[] => {
        return items.filter(item => {
            if (!item.roles) return true;
            return hasPermission(item.roles);
        });
    };

    const handleOverlayClick = () => {
        setMobileOpen(false);
    };

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
                onClick={handleOverlayClick}
            />

            <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
                {/* Header */}
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="brand-logo">
                            <span>E</span>
                        </div>
                        <div className="brand-text">
                            <span className="brand-name">InSuite Edu</span>
                            <span className="brand-tagline">{isSuperAdmin ? 'Super Admin' : 'School Management'}</span>
                        </div>
                    </div>

                    {/* Collapse button - desktop only */}
                    <button
                        className="collapse-btn"
                        onClick={toggleCollapse}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <span className="material-symbols-rounded">
                            {collapsed ? 'chevron_right' : 'chevron_left'}
                        </span>
                    </button>

                    {/* Close button - mobile only */}
                    <button
                        className="close-btn"
                        onClick={() => setMobileOpen(false)}
                    >
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <ul className="nav-menu">
                        {filterNavItems(navItems).map((item) => (
                            <li key={item.path} className="nav-item">
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                    title={collapsed ? item.label : undefined}
                                    end={item.path === '/'}
                                >
                                    <span className="nav-icon material-symbols-rounded">{item.icon}</span>
                                    <span className="nav-text">{item.label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    {/* Super Admin Section */}
                    {isSuperAdmin && (
                        <div className="nav-section">
                            <p className="nav-section-title">Admin Panel</p>
                            <ul className="nav-menu">
                                {superAdminItems.map((item) => (
                                    <li key={item.path} className="nav-item">
                                        <NavLink
                                            to={item.path}
                                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <span className="nav-icon material-symbols-rounded">{item.icon}</span>
                                            <span className="nav-text">{item.label}</span>
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </nav>

                {/* Session Card */}
                <div className="session-card">
                    <div className="session-info">
                        <h4>InSuite Edu</h4>
                        <p>Session Active</p>
                    </div>
                    <div className="session-status">
                        <span className="status-dot"></span>
                        <span className="status-text">Online</span>
                    </div>
                </div>

                {/* User Footer */}
                <div className="sidebar-footer">
                    <div className="user-card">
                        <div className="user-avatar">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user?.email?.split('@')[0] || 'User'}</span>
                        </div>
                        <button
                            className="logout-btn"
                            onClick={logout}
                            title="Logout"
                        >
                            <span className="material-symbols-rounded">logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
