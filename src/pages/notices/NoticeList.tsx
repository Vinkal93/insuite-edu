import { useState, useEffect } from 'react';
import { db, syncNotice } from '../../db/database';
import type { Notice } from '../../types';
import {
    requestNotificationPermission,
    getNotificationPermissionStatus,
    sendNoticeNotification,
    onForegroundMessage,
    showLocalNotification
} from '../../firebase';

export default function NoticeList() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<string>('default');
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'general',
        targetAudience: ['all'],
        isPinned: false,
        sendNotification: true,
    });

    useEffect(() => {
        loadData();
        // Check notification permission status
        const permStatus = getNotificationPermissionStatus();
        setNotificationPermission(permStatus);

        // Listen for foreground messages
        const unsubscribe = onForegroundMessage((payload) => {
            showLocalNotification(
                payload.notification?.title || 'New Notice',
                { body: payload.notification?.body }
            );
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const loadData = async () => {
        try {
            const allNotices = await db.notices.orderBy('publishDate').reverse().toArray();
            setNotices(allNotices);
        } catch (error) {
            console.error('Error loading notices:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'urgent': return 'danger';
            case 'event': return 'primary';
            case 'holiday': return 'success';
            case 'exam': return 'warning';
            default: return 'neutral';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'urgent': return 'priority_high';
            case 'event': return 'event';
            case 'holiday': return 'beach_access';
            case 'exam': return 'quiz';
            default: return 'campaign';
        }
    };

    // Request notification permission
    const handleRequestPermission = async () => {
        const token = await requestNotificationPermission();
        if (token) {
            setNotificationPermission('granted');
            console.log('Notification permission granted, token:', token);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const noticeData = {
                title: formData.title,
                content: formData.content,
                category: formData.category as any,
                targetRoles: [],
                targetAudience: formData.targetAudience as any,
                isPinned: formData.isPinned,
                publishDate: new Date(),
                createdBy: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const newNoticeId = await db.notices.add(noticeData);

            // Immediately sync to Firebase
            try {
                await syncNotice({ ...noticeData, id: newNoticeId });
                console.log('✅ Notice synced to Firebase');
            } catch (syncError) {
                console.error('Sync failed, will retry later:', syncError);
            }

            // Send push notification if enabled
            if (formData.sendNotification) {
                await sendNoticeNotification({
                    title: formData.title,
                    content: formData.content,
                    category: formData.category,
                    targetAudience: formData.targetAudience,
                });
            }

            setShowModal(false);
            setFormData({ title: '', content: '', category: 'general', targetAudience: ['all'], isPinned: false, sendNotification: true });
            loadData();
        } catch (error) {
            console.error('Error creating notice:', error);
            alert('Failed to create notice');
        }
    };

    if (loading) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    <span className="material-symbols-rounded" style={{ animation: 'pulse 1s infinite' }}>hourglass_empty</span>
                </div>
                <h3 className="empty-state-title">Loading...</h3>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
                <div>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Create and manage announcements for students, parents, and staff
                    </p>
                    {/* Notification Permission Banner */}
                    {notificationPermission !== 'granted' && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-2)',
                            marginTop: 'var(--spacing-2)',
                            padding: 'var(--spacing-2) var(--spacing-3)',
                            background: 'var(--warning-100)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-sm)'
                        }}>
                            <span className="material-symbols-rounded" style={{ color: 'var(--warning-600)', fontSize: '18px' }}>notifications_off</span>
                            <span style={{ color: 'var(--warning-700)' }}>Enable notifications to receive alerts</span>
                            <button
                                className="btn btn-sm"
                                style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: '12px' }}
                                onClick={handleRequestPermission}
                            >
                                Enable
                            </button>
                        </div>
                    )}
                </div>
                <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
                    <span className="material-symbols-rounded">add</span>
                    Post Notice
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="stat-card students">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">campaign</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Total Notices</p>
                        <h3 className="stat-value">{notices.length}</h3>
                    </div>
                </div>
                <div className="stat-card pending">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">priority_high</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Urgent</p>
                        <h3 className="stat-value">{notices.filter(n => n.category === 'urgent').length}</h3>
                    </div>
                </div>
                <div className="stat-card fees">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">push_pin</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Pinned</p>
                        <h3 className="stat-value">{notices.filter(n => n.isPinned).length}</h3>
                    </div>
                </div>
            </div>

            {/* Notices List */}
            <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                {notices.length > 0 ? (
                    notices.map((notice) => (
                        <div key={notice.id} className="card">
                            <div className="card-body">
                                <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'flex-start' }}>
                                    <div
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: 'var(--radius-lg)',
                                            background: `var(--${getCategoryColor(notice.category)}-100)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <span className="material-symbols-rounded" style={{ color: `var(--${getCategoryColor(notice.category)}-600)` }}>
                                            {getCategoryIcon(notice.category)}
                                        </span>
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
                                            <h3 style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>{notice.title}</h3>
                                            {notice.isPinned && (
                                                <span className="material-symbols-rounded" style={{ color: 'var(--warning-500)', fontSize: '20px' }}>
                                                    push_pin
                                                </span>
                                            )}
                                        </div>

                                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-3)', lineHeight: 1.6 }}>
                                            {notice.content}
                                        </p>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', fontSize: 'var(--font-size-sm)' }}>
                                            <span className={`badge badge-${getCategoryColor(notice.category)}`}>
                                                {notice.category}
                                            </span>
                                            <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>schedule</span>
                                                {formatDate(notice.publishDate)}
                                            </span>
                                            <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>group</span>
                                                {notice.targetAudience.join(', ')}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                        <button className="table-action-btn edit" title="Edit">
                                            <span className="material-symbols-rounded">edit</span>
                                        </button>
                                        <button className="table-action-btn delete" title="Delete">
                                            <span className="material-symbols-rounded">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <span className="material-symbols-rounded">campaign</span>
                            </div>
                            <h3 className="empty-state-title">No Notices Yet</h3>
                            <p className="empty-state-text">Create your first notice to share with your community.</p>
                            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                                <span className="material-symbols-rounded">add</span>
                                Post Notice
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                <span className="material-symbols-rounded">campaign</span>
                                Post New Notice
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label required">Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter notice title"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select
                                        className="form-control"
                                        value={formData.category}
                                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                    >
                                        <option value="general">General</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="event">Event</option>
                                        <option value="holiday">Holiday</option>
                                        <option value="exam">Exam</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Target Audience</label>
                                    <select
                                        className="form-control"
                                        value={formData.targetAudience[0]}
                                        onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: [e.target.value] }))}
                                    >
                                        <option value="all">All</option>
                                        <option value="students">Students</option>
                                        <option value="parents">Parents</option>
                                        <option value="teachers">Teachers</option>
                                        <option value="staff">Staff</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label required">Content</label>
                                <textarea
                                    className="form-control"
                                    placeholder="Write your notice content..."
                                    rows={5}
                                    value={formData.content}
                                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                />
                            </div>

                            <label className="checkbox-custom">
                                <input
                                    type="checkbox"
                                    checked={formData.isPinned}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                                />
                                <span className="checkmark"></span>
                                Pin this notice to top
                            </label>

                            <label className="checkbox-custom" style={{ marginTop: 'var(--spacing-3)' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.sendNotification}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sendNotification: e.target.checked }))}
                                />
                                <span className="checkmark"></span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '18px', color: 'var(--primary-500)' }}>notifications_active</span>
                                    Send push notification
                                </span>
                            </label>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSubmit}>
                                <span className="material-symbols-rounded">send</span>
                                Publish Notice
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
