import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db/database';
import { useAuth } from '../context/AuthContext';
import type { Student, FeeTransaction, Notice } from '../types';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';

interface DashboardStats {
    totalStudents: number;
    totalTeachers: number;
    todayCollections: number;
    pendingFees: number;
    attendancePercentage: number;
}

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalStudents: 0,
        totalTeachers: 0,
        todayCollections: 0,
        pendingFees: 0,
        attendancePercentage: 0,
    });
    const [recentStudents, setRecentStudents] = useState<Student[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<FeeTransaction[]>([]);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Get counts
            const students = await db.students.where('status').equals('active').count();
            const teachers = await db.staff.where('role').equals('teacher').count();

            // Get today's collections
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTransactions = await db.feeTransactions
                .where('paidDate')
                .aboveOrEqual(today)
                .toArray();
            const todayAmount = todayTransactions.reduce((sum, t) => sum + t.paidAmount, 0);

            // Get all transactions for pending calculation (simplified)
            const allStudents = await db.students.where('status').equals('active').toArray();
            const pendingCount = allStudents.length * 0; // Placeholder - would need fee tracking logic

            // Recent students
            const recent = await db.students
                .orderBy('createdAt')
                .reverse()
                .limit(5)
                .toArray();

            // Recent transactions
            const recentTrans = await db.feeTransactions
                .orderBy('createdAt')
                .reverse()
                .limit(5)
                .toArray();

            // Get notices
            const allNotices = await db.notices
                .orderBy('publishDate')
                .reverse()
                .limit(3)
                .toArray();

            setStats({
                totalStudents: students,
                totalTeachers: teachers,
                todayCollections: todayAmount,
                pendingFees: pendingCount,
                attendancePercentage: 92, // Placeholder
            });
            setRecentStudents(recent);
            setRecentTransactions(recentTrans);
            setNotices(allNotices);
        } catch (error) {
            console.error('Error loading dashboard:', error);
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
        });
    };

    // Sample chart data
    const feeChartData = [
        { month: 'Aug', amount: 45000 },
        { month: 'Sep', amount: 52000 },
        { month: 'Oct', amount: 48000 },
        { month: 'Nov', amount: 61000 },
        { month: 'Dec', amount: 55000 },
        { month: 'Jan', amount: 72000 },
    ];

    const attendanceData = [
        { day: 'Mon', present: 92, absent: 8 },
        { day: 'Tue', present: 88, absent: 12 },
        { day: 'Wed', present: 95, absent: 5 },
        { day: 'Thu', present: 90, absent: 10 },
        { day: 'Fri', present: 85, absent: 15 },
    ];

    if (loading) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    <span className="material-symbols-rounded" style={{ animation: 'pulse 1s infinite' }}>
                        hourglass_empty
                    </span>
                </div>
                <h3 className="empty-state-title">Loading Dashboard...</h3>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Welcome Banner */}
            <div
                className="card"
                style={{
                    marginBottom: 'var(--spacing-6)',
                    background: 'linear-gradient(135deg, var(--primary-600), var(--secondary-600))',
                    color: 'white',
                    border: 'none',
                }}
            >
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-2)' }}>
                            Welcome back, {user?.email.split('@')[0]}! 👋
                        </h2>
                        <p style={{ opacity: 0.9 }}>
                            Here's what's happening at your institute today.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                        <Link to="/students/new" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                            <span className="material-symbols-rounded">person_add</span>
                            New Admission
                        </Link>
                        <Link to="/fees" className="btn" style={{ background: 'white', color: 'var(--primary-600)' }}>
                            <span className="material-symbols-rounded">payments</span>
                            Collect Fee
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card students">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">school</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Total Students</p>
                        <h3 className="stat-value">{stats.totalStudents}</h3>
                        <span className="stat-trend positive">
                            <span className="material-symbols-rounded">trending_up</span>
                            +12 this month
                        </span>
                    </div>
                </div>

                <div className="stat-card teachers">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">badge</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Total Teachers</p>
                        <h3 className="stat-value">{stats.totalTeachers}</h3>
                        <span className="stat-trend positive">
                            <span className="material-symbols-rounded">check_circle</span>
                            All Active
                        </span>
                    </div>
                </div>

                <div className="stat-card fees">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">payments</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Today's Collection</p>
                        <h3 className="stat-value">{formatCurrency(stats.todayCollections)}</h3>
                        <span className="stat-trend positive">
                            <span className="material-symbols-rounded">trending_up</span>
                            +8.2% vs yesterday
                        </span>
                    </div>
                </div>

                <div className="stat-card attendance">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">fact_check</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Today's Attendance</p>
                        <h3 className="stat-value">{stats.attendancePercentage}%</h3>
                        <span className="stat-trend positive">
                            <span className="material-symbols-rounded">trending_up</span>
                            Above average
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="card-header">
                    <h3 className="card-title">
                        <span className="material-symbols-rounded">flash_on</span>
                        Quick Actions
                    </h3>
                </div>
                <div className="card-body">
                    <div className="quick-actions">
                        <Link to="/students/new" className="quick-action-btn">
                            <span className="material-symbols-rounded">person_add</span>
                            <span>New Admission</span>
                        </Link>
                        <Link to="/fees" className="quick-action-btn">
                            <span className="material-symbols-rounded">receipt_long</span>
                            <span>Collect Fee</span>
                        </Link>
                        <Link to="/attendance" className="quick-action-btn">
                            <span className="material-symbols-rounded">fact_check</span>
                            <span>Mark Attendance</span>
                        </Link>
                        <Link to="/exams/marks" className="quick-action-btn">
                            <span className="material-symbols-rounded">edit_note</span>
                            <span>Enter Marks</span>
                        </Link>
                        <Link to="/notices" className="quick-action-btn">
                            <span className="material-symbols-rounded">campaign</span>
                            <span>Post Notice</span>
                        </Link>
                        <Link to="/reports" className="quick-action-btn">
                            <span className="material-symbols-rounded">analytics</span>
                            <span>View Reports</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="dashboard-grid">
                {/* Fee Collection Chart */}
                <div className="card span-2">
                    <div className="card-header">
                        <h3 className="card-title">
                            <span className="material-symbols-rounded">show_chart</span>
                            Fee Collection Trend
                        </h3>
                        <select className="form-control" style={{ width: 'auto', height: '36px', fontSize: 'var(--font-size-sm)' }}>
                            <option>Last 6 Months</option>
                            <option>This Year</option>
                            <option>All Time</option>
                        </select>
                    </div>
                    <div className="card-body">
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={feeChartData}>
                                    <defs>
                                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                                    <XAxis dataKey="month" stroke="var(--text-tertiary)" />
                                    <YAxis stroke="var(--text-tertiary)" tickFormatter={(value) => `₹${value / 1000}k`} />
                                    <Tooltip
                                        formatter={(value) => [formatCurrency(value as number), 'Collection']}
                                        contentStyle={{
                                            background: 'var(--bg-primary)',
                                            border: '1px solid var(--border-light)',
                                            borderRadius: 'var(--radius-lg)',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorAmount)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Weekly Attendance */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <span className="material-symbols-rounded">calendar_month</span>
                            Weekly Attendance
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="chart-container" style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={attendanceData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                                    <XAxis dataKey="day" stroke="var(--text-tertiary)" />
                                    <YAxis stroke="var(--text-tertiary)" />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--bg-primary)',
                                            border: '1px solid var(--border-light)',
                                            borderRadius: 'var(--radius-lg)',
                                        }}
                                    />
                                    <Bar dataKey="present" fill="#22c55e" radius={[4, 4, 0, 0]} name="Present %" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Recent Admissions */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <span className="material-symbols-rounded">person_add</span>
                            Recent Admissions
                        </h3>
                        <Link to="/students" className="btn btn-ghost btn-sm">View All</Link>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <div className="recent-list" style={{ padding: '0 var(--spacing-6)' }}>
                            {recentStudents.length > 0 ? (
                                recentStudents.map((student) => (
                                    <div key={student.id} className="recent-item">
                                        <div className="recent-icon admission">
                                            <span className="material-symbols-rounded">person</span>
                                        </div>
                                        <div className="recent-content">
                                            <div className="recent-title">{student.firstName} {student.lastName}</div>
                                            <div className="recent-meta">{student.studentId}</div>
                                        </div>
                                        <span className="badge badge-success">New</span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                    No recent admissions
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <span className="material-symbols-rounded">receipt_long</span>
                            Recent Transactions
                        </h3>
                        <Link to="/fees" className="btn btn-ghost btn-sm">View All</Link>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <div className="recent-list" style={{ padding: '0 var(--spacing-6)' }}>
                            {recentTransactions.length > 0 ? (
                                recentTransactions.map((transaction) => (
                                    <div key={transaction.id} className="recent-item">
                                        <div className="recent-icon fee">
                                            <span className="material-symbols-rounded">payments</span>
                                        </div>
                                        <div className="recent-content">
                                            <div className="recent-title">{transaction.receiptNumber}</div>
                                            <div className="recent-meta">
                                                {transaction.paymentMode.toUpperCase()} • {formatDate(transaction.paidDate)}
                                            </div>
                                        </div>
                                        <span className="recent-amount">{formatCurrency(transaction.paidAmount)}</span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                    No recent transactions
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notices */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <span className="material-symbols-rounded">campaign</span>
                            Latest Notices
                        </h3>
                        <Link to="/notices" className="btn btn-ghost btn-sm">View All</Link>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <div className="recent-list" style={{ padding: '0 var(--spacing-6)' }}>
                            {notices.length > 0 ? (
                                notices.map((notice) => (
                                    <div key={notice.id} className="recent-item">
                                        <div className="recent-icon notice">
                                            <span className="material-symbols-rounded">
                                                {notice.category === 'urgent' ? 'priority_high' : 'notifications'}
                                            </span>
                                        </div>
                                        <div className="recent-content">
                                            <div className="recent-title">{notice.title}</div>
                                            <div className="recent-meta">
                                                {formatDate(notice.publishDate)} • {notice.category}
                                            </div>
                                        </div>
                                        {notice.isPinned && (
                                            <span className="material-symbols-rounded" style={{ color: 'var(--warning-500)' }}>
                                                push_pin
                                            </span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                    No notices
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
