import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../db/database';
import type { Student, Class } from '../../types';

export default function PendingFees() {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [allStudents, allClasses] = await Promise.all([
                db.students.where('status').equals('active').toArray(),
                db.classes.toArray(),
            ]);
            setStudents(allStudents);
            setClasses(allClasses);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getClassName = (classId: number) => {
        return classes.find(c => c.id === classId)?.name || 'N/A';
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    // For demo, show all students as having pending fees with random amounts
    const pendingStudents = students.map(s => ({
        ...s,
        pendingAmount: Math.floor(Math.random() * 5000) + 1000,
        dueMonths: Math.floor(Math.random() * 3) + 1,
    })).filter(s => s.pendingAmount > 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
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

    const totalPending = pendingStudents.reduce((sum, s) => sum + s.pendingAmount, 0);

    return (
        <div className="animate-fade-in">
            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="stat-card pending">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">warning</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Total Pending</p>
                        <h3 className="stat-value" style={{ color: 'var(--error-600)' }}>{formatCurrency(totalPending)}</h3>
                    </div>
                </div>
                <div className="stat-card students">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">group</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Defaulters</p>
                        <h3 className="stat-value">{pendingStudents.length}</h3>
                    </div>
                </div>
                <div className="stat-card fees">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">calendar_month</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Avg Due Months</p>
                        <h3 className="stat-value">
                            {Math.round(pendingStudents.reduce((sum, s) => sum + s.dueMonths, 0) / pendingStudents.length || 0)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
                <div className="search-box" style={{ width: '300px' }}>
                    <span className="material-symbols-rounded">search</span>
                    <input type="text" placeholder="Search students..." />
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                    <button className="btn btn-secondary">
                        <span className="material-symbols-rounded">sms</span>
                        Send Reminders
                    </button>
                    <button className="btn btn-secondary">
                        <span className="material-symbols-rounded">download</span>
                        Export List
                    </button>
                </div>
            </div>

            {/* Table */}
            {pendingStudents.length > 0 ? (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Class</th>
                                <th>Contact</th>
                                <th>Due Months</th>
                                <th>Pending Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingStudents.map((student) => (
                                <tr key={student.id}>
                                    <td>
                                        <div className="table-avatar">
                                            <div className="avatar-placeholder">
                                                {getInitials(student.firstName, student.lastName)}
                                            </div>
                                            <div className="table-avatar-info">
                                                <span className="table-avatar-name">
                                                    {student.firstName} {student.lastName}
                                                </span>
                                                <span className="table-avatar-sub">{student.studentId}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{getClassName(student.classId)}</td>
                                    <td>
                                        <a href={`tel:${student.fatherPhone}`} style={{ color: 'var(--primary-500)' }}>
                                            {student.fatherPhone}
                                        </a>
                                    </td>
                                    <td>
                                        <span className={`badge ${student.dueMonths > 2 ? 'badge-danger' : 'badge-warning'}`}>
                                            {student.dueMonths} month{student.dueMonths > 1 ? 's' : ''}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 700, color: 'var(--error-600)' }}>
                                            {formatCurrency(student.pendingAmount)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <Link to={`/fees?student=${student.id}`} className="btn btn-sm btn-primary">
                                                <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>payments</span>
                                                Collect
                                            </Link>
                                            <button className="table-action-btn" title="Send Reminder">
                                                <span className="material-symbols-rounded">sms</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-rounded">check_circle</span>
                        </div>
                        <h3 className="empty-state-title">No Pending Fees! 🎉</h3>
                        <p className="empty-state-text">All students have cleared their dues.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
