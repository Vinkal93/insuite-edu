import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { getSyncStatus, onSyncStatusChange, syncAllToFirestore, isAppOnline, type SyncStatus } from '../../db/firestoreSync';

interface HeaderProps {
    onMenuClick: () => void;
    sidebarCollapsed: boolean;
    onToggleSidebar?: () => void;
}

const pageTitles: Record<string, { title: string; icon: string }> = {
    '/': { title: 'Dashboard', icon: 'dashboard' },
    '/students': { title: 'Students', icon: 'school' },
    '/students/new': { title: 'New Admission', icon: 'person_add' },
    '/staff': { title: 'Staff', icon: 'badge' },
    '/classes': { title: 'Classes', icon: 'class' },
    '/attendance': { title: 'Attendance', icon: 'fact_check' },
    '/fees': { title: 'Fee Collection', icon: 'payments' },
    '/fees/structure': { title: 'Fee Structure', icon: 'receipt_long' },
    '/fees/pending': { title: 'Pending Fees', icon: 'pending' },
    '/exams': { title: 'Exams', icon: 'quiz' },
    '/exams/marks': { title: 'Enter Marks', icon: 'edit_note' },
    '/exams/results': { title: 'Results', icon: 'grade' },
    '/notices': { title: 'Notices', icon: 'campaign' },
    '/reports': { title: 'Reports', icon: 'analytics' },
    '/settings': { title: 'Settings', icon: 'settings' },
    '/admin/institutes': { title: 'Institutes', icon: 'business' },
    '/admin/users': { title: 'Platform Users', icon: 'manage_accounts' },
};

export default function Header({ onMenuClick, sidebarCollapsed, onToggleSidebar }: HeaderProps) {
    const location = useLocation();
    const { resolvedTheme, toggleTheme, themeColor, themeColors, setThemeColor } = useTheme();
    const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());
    const [isOnline, setIsOnline] = useState(isAppOnline());

    useEffect(() => {
        // Subscribe to sync status changes
        const unsubscribe = onSyncStatusChange((status) => {
            setSyncStatus(status);
        });

        // Listen for online/offline events
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            unsubscribe();
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleManualSync = async () => {
        if (!syncStatus.isSyncing && isOnline) {
            try {
                await syncAllToFirestore();
            } catch (error) {
                console.error('Manual sync failed:', error);
            }
        }
    };

    // Get page info
    const getPageInfo = () => {
        // Exact match first
        if (pageTitles[location.pathname]) {
            return pageTitles[location.pathname];
        }
        // Check for dynamic routes like /students/:id
        const basePath = '/' + location.pathname.split('/')[1];
        if (basePath === '/students' && location.pathname.length > 10) {
            return { title: 'Student Profile', icon: 'person' };
        }
        return pageTitles[basePath] || { title: 'InSuite Edu', icon: 'school' };
    };

    const { title, icon } = getPageInfo();

    // Get sync status icon and color
    const getSyncIcon = () => {
        if (!isOnline) return { icon: 'cloud_off', color: 'var(--text-tertiary)', title: 'Offline - Changes will sync when online' };
        if (syncStatus.isSyncing) return { icon: 'sync', color: 'var(--primary-500)', title: 'Syncing to cloud...' };
        if (syncStatus.error) return { icon: 'cloud_alert', color: 'var(--error-500)', title: `Sync error: ${syncStatus.error}` };
        if (syncStatus.lastSyncedAt) {
            const lastSync = new Date(syncStatus.lastSyncedAt);
            const timeAgo = Math.round((Date.now() - lastSync.getTime()) / 60000);
            return {
                icon: 'cloud_done',
                color: 'var(--success-500)',
                title: `Last synced: ${timeAgo < 1 ? 'Just now' : `${timeAgo}m ago`}`
            };
        }
        return { icon: 'cloud_upload', color: 'var(--text-secondary)', title: 'Click to sync to cloud' };
    };

    const syncInfo = getSyncIcon();

    return (
        <header className="header">
            <div className="header-left">
                {/* Mobile Menu Button */}
                <button
                    className="header-menu-btn mobile-only"
                    onClick={onMenuClick}
                    aria-label="Open menu"
                >
                    <span className="material-symbols-rounded">menu</span>
                </button>

                {/* Desktop Sidebar Toggle */}
                {sidebarCollapsed && onToggleSidebar && (
                    <button
                        className="header-menu-btn desktop-only"
                        onClick={onToggleSidebar}
                        title="Expand sidebar"
                    >
                        <span className="material-symbols-rounded">menu</span>
                    </button>
                )}

                <h1 className="page-title">
                    <span className="material-symbols-rounded desktop-only">{icon}</span>
                    {title}
                </h1>
            </div>

            <div className="header-right">
                {/* Search */}
                <div className="search-box desktop-only">
                    <span className="material-symbols-rounded">search</span>
                    <input type="text" placeholder="Search..." />
                </div>

                <div className="header-actions">
                    {/* Cloud Sync Status */}
                    <button
                        className="header-btn"
                        title={syncInfo.title}
                        onClick={handleManualSync}
                        disabled={syncStatus.isSyncing || !isOnline}
                        style={{ cursor: syncStatus.isSyncing ? 'wait' : 'pointer' }}
                    >
                        <span
                            className="material-symbols-rounded"
                            style={{
                                color: syncInfo.color,
                                animation: syncStatus.isSyncing ? 'spin 1s linear infinite' : 'none',
                            }}
                        >
                            {syncInfo.icon}
                        </span>
                    </button>

                    {/* Theme Color Picker */}
                    <div className="theme-color-picker">
                        <button
                            className="header-btn"
                            title="Theme Color"
                            style={{ position: 'relative' }}
                        >
                            <span className="material-symbols-rounded" style={{ color: themeColor.primary }}>palette</span>
                        </button>
                        <div className="color-picker-dropdown">
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-2)' }}>
                                Theme Color
                            </p>
                            <div className="color-options">
                                {themeColors.map((color) => (
                                    <button
                                        key={color.name}
                                        className={`color-option ${themeColor.name === color.name ? 'active' : ''}`}
                                        style={{ background: color.gradient }}
                                        onClick={() => setThemeColor(color)}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <button className="header-btn" title="Notifications">
                        <span className="material-symbols-rounded">notifications</span>
                        <span className="notification-dot"></span>
                    </button>

                    {/* Theme Toggle */}
                    <button
                        className="header-btn theme-toggle"
                        onClick={toggleTheme}
                        title={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        <span className="material-symbols-rounded">
                            {resolvedTheme === 'light' ? 'dark_mode' : 'light_mode'}
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
}

