import { useState, useEffect } from 'react';
import { db } from '../../db/database';
import { useAuth } from '../../context/AuthContext';
import type { FeeTransaction, Attendance, Class } from '../../types';

export default function StudentDashboard() {
    const { student, logout, updateStudentPassword } = useAuth();
    const [studentClass, setStudentClass] = useState<Class | null>(null);
    const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        if (student) {
            loadData();
        }
    }, [student]);

    const loadData = async () => {
        if (!student?.id) return;

        try {
            // Load class
            const cls = await db.classes.get(student.classId);
            setStudentClass(cls || null);

            // Load transactions
            const trans = await db.feeTransactions
                .where('studentId')
                .equals(student.id)
                .reverse()
                .toArray();
            setTransactions(trans);

            // Load attendance
            const att = await db.attendance
                .where({ entityType: 'student', entityId: student.id })
                .reverse()
                .limit(30)
                .toArray();
            setAttendance(att);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getAttendanceStats = () => {
        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;
        const absent = attendance.filter(a => a.status === 'absent').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        return { total, present, absent, percentage };
    };

    const handlePasswordChange = async () => {
        setPasswordError('');

        if (!passwordData.new || passwordData.new.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        if (passwordData.new !== passwordData.confirm) {
            setPasswordError('Passwords do not match');
            return;
        }

        if (student?.password && passwordData.current !== student.password) {
            setPasswordError('Current password is incorrect');
            return;
        }

        const success = await updateStudentPassword(student!.id!, passwordData.new);
        if (success) {
            setShowPasswordModal(false);
            setPasswordData({ current: '', new: '', confirm: '' });
            alert('Password updated successfully!');
        } else {
            setPasswordError('Failed to update password');
        }
    };

    const shareOnWhatsApp = (type: 'profile' | 'fees') => {
        if (!student) return;

        let message = '';

        if (type === 'profile') {
            message = `📚 *Student Profile*\n\n` +
                `👤 Name: ${student.firstName} ${student.lastName}\n` +
                `🆔 ID: ${student.studentId}\n` +
                `📖 Class: ${studentClass?.name || 'N/A'}\n` +
                `👨 Father: ${student.fatherName}\n` +
                `📞 Contact: ${student.fatherPhone}\n` +
                `📍 Address: ${student.address}\n\n` +
                `📊 Attendance: ${getAttendanceStats().percentage}%\n\n` +
                `Powered by InSuite Edu`;
        } else {
            const totalPaid = transactions.reduce((sum, t) => sum + t.paidAmount, 0);
            const feeDetails = transactions.slice(0, 5).map(t =>
                `📅 ${formatDate(t.paidDate)}: ${formatCurrency(t.paidAmount)} (${t.receiptNumber})`
            ).join('\n');

            message = `💰 *Fee Payment Record*\n\n` +
                `👤 ${student.firstName} ${student.lastName}\n` +
                `🆔 ${student.studentId}\n` +
                `📖 ${studentClass?.name || 'N/A'}\n\n` +
                `✅ Total Paid: ${formatCurrency(totalPaid)}\n` +
                `📝 Transactions: ${transactions.length}\n\n` +
                `*Recent Payments:*\n${feeDetails}\n\n` +
                `Powered by InSuite Edu`;
        }

        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <div className="student-portal-loading">
                <div className="login-logo">E</div>
                <p>Loading your profile...</p>
            </div>
        );
    }

    if (!student) {
        return <div>No student data available</div>;
    }

    const attStats = getAttendanceStats();
    const totalPaid = transactions.reduce((sum, t) => sum + t.paidAmount, 0);

    return (
        <div className="student-portal">
            {/* Header */}
            <header className="student-header">
                <div className="student-header-left">
                    <div className="student-logo">E</div>
                    <div>
                        <h1>InSuite Edu</h1>
                        <p>Student Portal</p>
                    </div>
                </div>
                <div className="student-header-right">
                    <button className="btn btn-ghost" onClick={() => setShowPasswordModal(true)}>
                        <span className="material-symbols-rounded">key</span>
                        <span className="hide-mobile">Change Password</span>
                    </button>
                    <button className="btn btn-secondary" onClick={logout}>
                        <span className="material-symbols-rounded">logout</span>
                        <span className="hide-mobile">Logout</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="student-content">
                {/* Profile Card */}
                <div className="student-profile-card">
                    <div className="profile-avatar">
                        {student.photo ? (
                            <img src={student.photo} alt={student.firstName} />
                        ) : (
                            `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`
                        )}
                    </div>
                    <div className="profile-info">
                        <h2>{student.firstName} {student.lastName}</h2>
                        <p className="student-id">{student.studentId}</p>
                        <div className="profile-meta">
                            <span>
                                <span className="material-symbols-rounded">school</span>
                                {studentClass?.name || 'N/A'}
                            </span>
                            <span>
                                <span className="material-symbols-rounded">person</span>
                                {student.fatherName}
                            </span>
                            <span>
                                <span className="material-symbols-rounded">call</span>
                                {student.fatherPhone}
                            </span>
                        </div>
                    </div>
                    <div className="profile-actions">
                        <button className="btn btn-success" onClick={() => shareOnWhatsApp('profile')}>
                            <span className="material-symbols-rounded">share</span>
                            Share on WhatsApp
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="student-stats">
                    <div className="student-stat attendance">
                        <span className="material-symbols-rounded">fact_check</span>
                        <div>
                            <h3>{attStats.percentage}%</h3>
                            <p>Attendance</p>
                        </div>
                    </div>
                    <div className="student-stat fees">
                        <span className="material-symbols-rounded">payments</span>
                        <div>
                            <h3>{formatCurrency(totalPaid)}</h3>
                            <p>Total Paid</p>
                        </div>
                    </div>
                    <div className="student-stat transactions">
                        <span className="material-symbols-rounded">receipt_long</span>
                        <div>
                            <h3>{transactions.length}</h3>
                            <p>Transactions</p>
                        </div>
                    </div>
                </div>

                {/* Fee History */}
                <div className="student-section">
                    <div className="section-header">
                        <h3>
                            <span className="material-symbols-rounded">payments</span>
                            Fee Payment History
                        </h3>
                        <button className="btn btn-primary btn-sm" onClick={() => shareOnWhatsApp('fees')}>
                            <span className="material-symbols-rounded">share</span>
                            Share
                        </button>
                    </div>

                    {transactions.length > 0 ? (
                        <div className="fee-list">
                            {transactions.map(t => (
                                <div key={t.id} className="fee-item">
                                    <div className="fee-icon">
                                        <span className="material-symbols-rounded">receipt</span>
                                    </div>
                                    <div className="fee-details">
                                        <h4>{t.receiptNumber}</h4>
                                        <p>{formatDate(t.paidDate)} • {t.paymentMode.toUpperCase()}</p>
                                    </div>
                                    <div className="fee-amount">
                                        {formatCurrency(t.paidAmount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-message">
                            <span className="material-symbols-rounded">receipt_long</span>
                            <p>No fee payments recorded yet</p>
                        </div>
                    )}
                </div>

                {/* Attendance Record */}
                <div className="student-section">
                    <div className="section-header">
                        <h3>
                            <span className="material-symbols-rounded">calendar_month</span>
                            Recent Attendance
                        </h3>
                    </div>

                    {attendance.length > 0 ? (
                        <div className="attendance-grid">
                            {attendance.map(a => (
                                <div
                                    key={a.id}
                                    className={`attendance-dot ${a.status}`}
                                    title={`${formatDate(a.date)}: ${a.status}`}
                                >
                                    {a.status === 'present' ? 'P' : a.status === 'absent' ? 'A' : 'L'}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-message">
                            <span className="material-symbols-rounded">event_busy</span>
                            <p>No attendance records yet</p>
                        </div>
                    )}

                    <div className="attendance-legend">
                        <span className="legend-item present">
                            <span className="legend-dot"></span> Present ({attStats.present})
                        </span>
                        <span className="legend-item absent">
                            <span className="legend-dot"></span> Absent ({attStats.absent})
                        </span>
                    </div>
                </div>
            </main>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="modal-backdrop" onClick={() => setShowPasswordModal(false)}>
                    <div className="modal animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                <span className="material-symbols-rounded">key</span>
                                Change Password
                            </h2>
                            <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            {passwordError && (
                                <div style={{
                                    padding: 'var(--spacing-3)',
                                    background: 'var(--error-50)',
                                    border: '1px solid var(--error-200)',
                                    borderRadius: 'var(--radius-lg)',
                                    color: 'var(--error-600)',
                                    marginBottom: 'var(--spacing-4)',
                                }}>
                                    {passwordError}
                                </div>
                            )}

                            {student.password && (
                                <div className="form-group">
                                    <label className="form-label required">Current Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={passwordData.current}
                                        onChange={e => setPasswordData(p => ({ ...p, current: e.target.value }))}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label required">New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={passwordData.new}
                                    onChange={e => setPasswordData(p => ({ ...p, new: e.target.value }))}
                                    placeholder="Minimum 6 characters"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label required">Confirm Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={passwordData.confirm}
                                    onChange={e => setPasswordData(p => ({ ...p, confirm: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handlePasswordChange}>
                                Update Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
