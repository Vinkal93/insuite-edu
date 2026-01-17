import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../../db/database';
import type { Student, Class, FeeTransaction, Attendance } from '../../types';

export default function StudentProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [student, setStudent] = useState<Student | null>(null);
    const [studentClass, setStudentClass] = useState<Class | null>(null);
    const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Credentials panel state
    const [showPassword, setShowPassword] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [blockReason, setBlockReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadStudentData();
    }, [id]);

    const loadStudentData = async () => {
        try {
            if (!id) return;

            const studentData = await db.students.get(parseInt(id));
            if (studentData) {
                setStudent(studentData);

                // Load class
                const classData = await db.classes.get(studentData.classId);
                setStudentClass(classData || null);

                // Load transactions
                const trans = await db.feeTransactions
                    .where('studentId')
                    .equals(parseInt(id))
                    .reverse()
                    .toArray();
                setTransactions(trans);

                // Load attendance
                const att = await db.attendance
                    .where({ entityType: 'student', entityId: parseInt(id) })
                    .reverse()
                    .limit(30)
                    .toArray();
                setAttendance(att);
            }
        } catch (error) {
            console.error('Error loading student:', error);
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

    const getInitials = () => {
        if (!student) return '';
        return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();
    };

    const getAttendanceStats = () => {
        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;
        const absent = attendance.filter(a => a.status === 'absent').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        return { total, present, absent, percentage };
    };

    // Copy to clipboard
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        alert(`${label} copied to clipboard!`);
    };

    // Block/Unblock student
    const handleBlockStudent = async () => {
        if (!student?.id) return;
        setActionLoading(true);
        try {
            const isCurrentlyBlocked = student.isBlocked;
            await db.students.update(student.id, {
                isBlocked: !isCurrentlyBlocked,
                blockMessage: isCurrentlyBlocked ? undefined : blockReason,
                blockedAt: isCurrentlyBlocked ? undefined : new Date(),
                updatedAt: new Date(),
            });
            setStudent({
                ...student,
                isBlocked: !isCurrentlyBlocked,
                blockMessage: isCurrentlyBlocked ? undefined : blockReason,
                blockedAt: isCurrentlyBlocked ? undefined : new Date(),
            });
            setShowBlockModal(false);
            setBlockReason('');
        } catch (error) {
            console.error('Error updating student:', error);
        } finally {
            setActionLoading(false);
        }
    };

    // Reset password
    const handleResetPassword = async () => {
        if (!student?.id) return;
        const newPassword = `Pass${Math.random().toString(36).slice(-6)}`;
        setActionLoading(true);
        try {
            await db.students.update(student.id, {
                password: newPassword,
                updatedAt: new Date(),
            });
            setStudent({ ...student, password: newPassword });
            alert(`Password reset successfully!\nNew Password: ${newPassword}`);
        } catch (error) {
            console.error('Error resetting password:', error);
        } finally {
            setActionLoading(false);
        }
    };

    // Delete student
    const handleDeleteStudent = async () => {
        if (!student?.id) return;
        setActionLoading(true);
        try {
            await db.students.delete(student.id);
            setShowDeleteModal(false);
            navigate('/students');
        } catch (error) {
            console.error('Error deleting student:', error);
        } finally {
            setActionLoading(false);
        }
    };

    // Change student status
    const handleStatusChange = async (newStatus: 'active' | 'left' | 'transferred') => {
        if (!student?.id) return;
        setActionLoading(true);
        try {
            await db.students.update(student.id, {
                status: newStatus,
                updatedAt: new Date(),
            });
            setStudent({ ...student, status: newStatus });
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    <span className="material-symbols-rounded" style={{ animation: 'pulse 1s infinite' }}>
                        hourglass_empty
                    </span>
                </div>
                <h3 className="empty-state-title">Loading Profile...</h3>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    <span className="material-symbols-rounded">person_off</span>
                </div>
                <h3 className="empty-state-title">Student Not Found</h3>
                <p className="empty-state-text">The student you're looking for doesn't exist.</p>
                <Link to="/students" className="btn btn-primary">
                    <span className="material-symbols-rounded">arrow_back</span>
                    Back to Students
                </Link>
            </div>
        );
    }

    const attStats = getAttendanceStats();

    return (
        <div className="animate-fade-in">
            {/* Profile Header */}
            <div
                className="card"
                style={{
                    marginBottom: 'var(--spacing-6)',
                    background: 'linear-gradient(135deg, var(--primary-600), var(--secondary-600))',
                    color: 'white',
                    border: 'none',
                }}
            >
                <div className="card-body">
                    <div style={{ display: 'flex', gap: 'var(--spacing-6)', alignItems: 'center' }}>
                        {/* Avatar */}
                        <div
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: 'var(--radius-xl)',
                                background: 'rgba(255,255,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 'var(--font-size-4xl)',
                                fontWeight: 700,
                                flexShrink: 0,
                            }}
                        >
                            {student.photo ? (
                                <img
                                    src={student.photo}
                                    alt={student.firstName}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-xl)' }}
                                />
                            ) : (
                                getInitials()
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1 }}>
                            <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--spacing-1)' }}>
                                {student.firstName} {student.lastName}
                            </h1>
                            <p style={{ opacity: 0.9, marginBottom: 'var(--spacing-3)' }}>
                                {student.studentId} • {studentClass?.name || 'N/A'}
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', opacity: 0.9 }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>call</span>
                                    {student.fatherPhone}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', opacity: 0.9 }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>calendar_today</span>
                                    Admitted: {formatDate(student.admissionDate)}
                                </span>
                                <span className={`badge ${student.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                                    {student.status}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                            <button className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                                <span className="material-symbols-rounded">edit</span>
                                Edit
                            </button>
                            <Link
                                to="/fees"
                                className="btn"
                                style={{ background: 'white', color: 'var(--primary-600)' }}
                            >
                                <span className="material-symbols-rounded">payments</span>
                                Collect Fee
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="stat-card attendance">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">fact_check</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Attendance</p>
                        <h3 className="stat-value">{attStats.percentage}%</h3>
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                            {attStats.present}/{attStats.total} days
                        </span>
                    </div>
                </div>
                <div className="stat-card fees">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">payments</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Total Paid</p>
                        <h3 className="stat-value">
                            {formatCurrency(transactions.reduce((sum, t) => sum + t.paidAmount, 0))}
                        </h3>
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                            {transactions.length} transactions
                        </span>
                    </div>
                </div>
                <div className="stat-card students">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">grade</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Last Result</p>
                        <h3 className="stat-value">--</h3>
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                            No results yet
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                {[
                    { id: 'overview', label: 'Overview', icon: 'info' },
                    { id: 'fees', label: 'Fee History', icon: 'payments' },
                    { id: 'attendance', label: 'Attendance', icon: 'event_available' },
                    { id: 'documents', label: 'Documents', icon: 'folder' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="material-symbols-rounded" style={{ fontSize: '18px', marginRight: 'var(--spacing-2)' }}>
                            {tab.icon}
                        </span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)' }}>
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">
                                <span className="material-symbols-rounded">person</span>
                                Personal Information
                            </h3>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                                <div>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Date of Birth</p>
                                    <p style={{ fontWeight: 500 }}>{formatDate(student.dateOfBirth)}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Gender</p>
                                    <p style={{ fontWeight: 500, textTransform: 'capitalize' }}>{student.gender}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Blood Group</p>
                                    <p style={{ fontWeight: 500 }}>{student.bloodGroup || 'Not specified'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Address</p>
                                    <p style={{ fontWeight: 500 }}>{student.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">
                                <span className="material-symbols-rounded">family_restroom</span>
                                Parent Information
                            </h3>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                                <div>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Father's Name</p>
                                    <p style={{ fontWeight: 500 }}>{student.fatherName}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Father's Phone</p>
                                    <a href={`tel:${student.fatherPhone}`} style={{ fontWeight: 500, color: 'var(--primary-500)' }}>
                                        {student.fatherPhone}
                                    </a>
                                </div>
                                {student.motherName && (
                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Mother's Name</p>
                                        <p style={{ fontWeight: 500 }}>{student.motherName}</p>
                                    </div>
                                )}
                                {student.motherPhone && (
                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Mother's Phone</p>
                                        <a href={`tel:${student.motherPhone}`} style={{ fontWeight: 500, color: 'var(--primary-500)' }}>
                                            {student.motherPhone}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'fees' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <span className="material-symbols-rounded">receipt_long</span>
                            Fee History
                        </h3>
                    </div>
                    {transactions.length > 0 ? (
                        <div className="table-wrapper" style={{ border: 'none' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Receipt No.</th>
                                        <th>Amount</th>
                                        <th>Mode</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(t => (
                                        <tr key={t.id}>
                                            <td>
                                                <code style={{ background: 'var(--primary-50)', color: 'var(--primary-600)', padding: '2px 8px', borderRadius: '4px' }}>
                                                    {t.receiptNumber}
                                                </code>
                                            </td>
                                            <td style={{ fontWeight: 600, color: 'var(--success-600)' }}>
                                                {formatCurrency(t.paidAmount)}
                                            </td>
                                            <td>
                                                <span className="badge badge-neutral" style={{ textTransform: 'uppercase' }}>
                                                    {t.paymentMode}
                                                </span>
                                            </td>
                                            <td>{formatDate(t.paidDate)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state" style={{ padding: 'var(--spacing-10)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '48px', color: 'var(--text-tertiary)' }}>
                                payments
                            </span>
                            <h4 style={{ marginTop: 'var(--spacing-4)' }}>No Fee Records</h4>
                            <p style={{ color: 'var(--text-tertiary)' }}>No fee payments recorded yet.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <span className="material-symbols-rounded">event_available</span>
                            Recent Attendance
                        </h3>
                    </div>
                    {attendance.length > 0 ? (
                        <div className="card-body">
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
                                {attendance.map(a => (
                                    <div
                                        key={a.id}
                                        title={formatDate(a.date)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: 'var(--radius-sm)',
                                            background: a.status === 'present' ? 'var(--success-100)' :
                                                a.status === 'absent' ? 'var(--error-100)' :
                                                    'var(--warning-100)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 'var(--font-size-xs)',
                                            fontWeight: 600,
                                            color: a.status === 'present' ? 'var(--success-600)' :
                                                a.status === 'absent' ? 'var(--error-600)' :
                                                    'var(--warning-600)',
                                        }}
                                    >
                                        {a.status === 'present' ? 'P' : a.status === 'absent' ? 'A' : 'L'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state" style={{ padding: 'var(--spacing-10)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '48px', color: 'var(--text-tertiary)' }}>
                                event_busy
                            </span>
                            <h4 style={{ marginTop: 'var(--spacing-4)' }}>No Attendance Records</h4>
                            <p style={{ color: 'var(--text-tertiary)' }}>No attendance marked yet.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'documents' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--spacing-6)' }}>
                    {/* Left: Documents Section */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">
                                <span className="material-symbols-rounded">folder</span>
                                Documents
                            </h3>
                            <button className="btn btn-primary btn-sm">
                                <span className="material-symbols-rounded">upload</span>
                                Upload
                            </button>
                        </div>
                        <div className="empty-state" style={{ padding: 'var(--spacing-10)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '48px', color: 'var(--text-tertiary)' }}>
                                folder_open
                            </span>
                            <h4 style={{ marginTop: 'var(--spacing-4)' }}>No Documents</h4>
                            <p style={{ color: 'var(--text-tertiary)' }}>Upload student documents here.</p>
                        </div>
                    </div>

                    {/* Right: Student Credentials Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                        {/* Login Credentials Card */}
                        <div className="card">
                            <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <h3 className="card-title" style={{ fontSize: 'var(--font-size-md)' }}>
                                    <span className="material-symbols-rounded" style={{ color: 'var(--primary-500)' }}>key</span>
                                    Login Credentials
                                </h3>
                            </div>
                            <div className="card-body" style={{ padding: 'var(--spacing-4)' }}>
                                {/* User ID */}
                                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>User ID</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', background: 'var(--bg-secondary)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)' }}>
                                        <code style={{ flex: 1, fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-600)' }}>
                                            {student.studentId}
                                        </code>
                                        <button
                                            className="btn btn-sm"
                                            style={{ padding: '4px 8px', minWidth: 'auto' }}
                                            onClick={() => copyToClipboard(student.studentId, 'User ID')}
                                        >
                                            <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>content_copy</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Password */}
                                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Password</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', background: 'var(--bg-secondary)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)' }}>
                                        <code style={{ flex: 1, fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {showPassword ? (student.password || 'Not Set') : '••••••••'}
                                        </code>
                                        <button
                                            className="btn btn-sm"
                                            style={{ padding: '4px 8px', minWidth: 'auto' }}
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                        <button
                                            className="btn btn-sm"
                                            style={{ padding: '4px 8px', minWidth: 'auto' }}
                                            onClick={() => copyToClipboard(student.password || '', 'Password')}
                                        >
                                            <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>content_copy</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Reset Password Button */}
                                <button
                                    className="btn btn-sm"
                                    style={{ width: '100%', background: 'var(--warning-50)', color: 'var(--warning-700)', border: '1px solid var(--warning-200)' }}
                                    onClick={handleResetPassword}
                                    disabled={actionLoading}
                                >
                                    <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>lock_reset</span>
                                    Reset Password
                                </button>
                            </div>
                        </div>

                        {/* Account Status Card */}
                        <div className="card">
                            <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <h3 className="card-title" style={{ fontSize: 'var(--font-size-md)' }}>
                                    <span className="material-symbols-rounded" style={{ color: 'var(--secondary-500)' }}>shield_person</span>
                                    Account Status
                                </h3>
                            </div>
                            <div className="card-body" style={{ padding: 'var(--spacing-4)' }}>
                                {/* Current Status */}
                                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Current Status</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                        <span className={`badge ${student.status === 'active' ? 'badge-success' : student.status === 'left' ? 'badge-danger' : 'badge-warning'}`} style={{ textTransform: 'capitalize' }}>
                                            {student.status}
                                        </span>
                                        {student.isBlocked && (
                                            <span className="badge" style={{ background: 'var(--error-100)', color: 'var(--error-700)' }}>
                                                🚫 Blocked
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Block Info */}
                                {student.isBlocked && student.blockMessage && (
                                    <div style={{ marginBottom: 'var(--spacing-4)', padding: 'var(--spacing-3)', background: 'var(--error-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--error-200)' }}>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--error-700)', fontWeight: 500 }}>Block Reason:</p>
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--error-600)' }}>{student.blockMessage}</p>
                                        {student.blockedAt && (
                                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--error-500)', marginTop: '4px' }}>
                                                Blocked on: {formatDate(student.blockedAt)}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Status Change Dropdown */}
                                <div style={{ marginBottom: 'var(--spacing-3)' }}>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Change Status</p>
                                    <select
                                        className="form-control"
                                        style={{ fontSize: 'var(--font-size-sm)' }}
                                        value={student.status}
                                        onChange={(e) => handleStatusChange(e.target.value as 'active' | 'left' | 'transferred')}
                                        disabled={actionLoading}
                                    >
                                        <option value="active">Active</option>
                                        <option value="left">Left</option>
                                        <option value="transferred">Transferred</option>
                                    </select>
                                </div>

                                {/* Timestamps */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-3)' }}>
                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Created</p>
                                        <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500 }}>{formatDate(student.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Updated</p>
                                        <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500 }}>{formatDate(student.updatedAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone Card */}
                        <div className="card" style={{ border: '1px solid var(--error-200)' }}>
                            <div className="card-header" style={{ borderBottom: '1px solid var(--error-200)', background: 'var(--error-50)' }}>
                                <h3 className="card-title" style={{ fontSize: 'var(--font-size-md)', color: 'var(--error-700)' }}>
                                    <span className="material-symbols-rounded">warning</span>
                                    Danger Zone
                                </h3>
                            </div>
                            <div className="card-body" style={{ padding: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                                {/* Block/Unblock Button */}
                                <button
                                    className="btn btn-sm"
                                    style={{
                                        width: '100%',
                                        background: student.isBlocked ? 'var(--success-50)' : 'var(--warning-50)',
                                        color: student.isBlocked ? 'var(--success-700)' : 'var(--warning-700)',
                                        border: `1px solid ${student.isBlocked ? 'var(--success-200)' : 'var(--warning-200)'}`
                                    }}
                                    onClick={() => setShowBlockModal(true)}
                                    disabled={actionLoading}
                                >
                                    <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>
                                        {student.isBlocked ? 'lock_open' : 'block'}
                                    </span>
                                    {student.isBlocked ? 'Unblock Student' : 'Block Student'}
                                </button>

                                {/* Delete Button */}
                                <button
                                    className="btn btn-sm"
                                    style={{ width: '100%', background: 'var(--error-50)', color: 'var(--error-700)', border: '1px solid var(--error-200)' }}
                                    onClick={() => setShowDeleteModal(true)}
                                    disabled={actionLoading}
                                >
                                    <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>delete_forever</span>
                                    Delete Student
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Block Modal */}
            {showBlockModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90vw' }}>
                        <div className="card-header">
                            <h3 className="card-title">
                                <span className="material-symbols-rounded">{student.isBlocked ? 'lock_open' : 'block'}</span>
                                {student.isBlocked ? 'Unblock Student' : 'Block Student'}
                            </h3>
                        </div>
                        <div className="card-body">
                            {!student.isBlocked && (
                                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                                    <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '4px', display: 'block' }}>
                                        Reason for blocking
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        placeholder="Enter reason..."
                                        value={blockReason}
                                        onChange={(e) => setBlockReason(e.target.value)}
                                    />
                                </div>
                            )}
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                {student.isBlocked
                                    ? 'This will restore the student\'s access to the portal.'
                                    : 'This will prevent the student from logging into the portal.'}
                            </p>
                        </div>
                        <div style={{ padding: 'var(--spacing-4)', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
                            <button className="btn" onClick={() => { setShowBlockModal(false); setBlockReason(''); }}>
                                Cancel
                            </button>
                            <button
                                className={`btn ${student.isBlocked ? 'btn-success' : 'btn-warning'}`}
                                onClick={handleBlockStudent}
                                disabled={actionLoading}
                            >
                                {student.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90vw' }}>
                        <div className="card-header" style={{ background: 'var(--error-50)' }}>
                            <h3 className="card-title" style={{ color: 'var(--error-700)' }}>
                                <span className="material-symbols-rounded">delete_forever</span>
                                Delete Student
                            </h3>
                        </div>
                        <div className="card-body">
                            <p style={{ color: 'var(--error-700)', fontWeight: 500, marginBottom: 'var(--spacing-2)' }}>
                                ⚠️ This action cannot be undone!
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                Are you sure you want to permanently delete <strong>{student.firstName} {student.lastName}</strong>?
                                All associated data including fee records and attendance will be lost.
                            </p>
                        </div>
                        <div style={{ padding: 'var(--spacing-4)', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
                            <button className="btn" onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDeleteStudent}
                                disabled={actionLoading}
                            >
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
