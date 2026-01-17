import { useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend,
} from 'recharts';

export default function Reports() {
    const [selectedReport, setSelectedReport] = useState('overview');

    const reports = [
        { id: 'overview', name: 'Dashboard Overview', icon: 'dashboard', description: 'Summary of all key metrics' },
        { id: 'fees', name: 'Fee Collection', icon: 'payments', description: 'Daily, monthly, yearly fee reports' },
        { id: 'attendance', name: 'Attendance Report', icon: 'fact_check', description: 'Student and staff attendance' },
        { id: 'exams', name: 'Exam Analysis', icon: 'grade', description: 'Result analysis and comparison' },
        { id: 'students', name: 'Student Report', icon: 'school', description: 'Enrollment and demographics' },
        { id: 'staff', name: 'Staff Report', icon: 'badge', description: 'Staff details and salary' },
    ];

    // Demo data
    const feeData = [
        { month: 'Jul', collected: 125000, pending: 25000 },
        { month: 'Aug', collected: 145000, pending: 20000 },
        { month: 'Sep', collected: 130000, pending: 35000 },
        { month: 'Oct', collected: 160000, pending: 15000 },
        { month: 'Nov', collected: 155000, pending: 22000 },
        { month: 'Dec', collected: 140000, pending: 30000 },
    ];

    const attendanceData = [
        { name: 'Present', value: 85, color: '#22c55e' },
        { name: 'Absent', value: 10, color: '#ef4444' },
        { name: 'Late', value: 3, color: '#f59e0b' },
        { name: 'Leave', value: 2, color: '#6366f1' },
    ];

    const classWiseData = [
        { class: 'Class 1', students: 45, boys: 25, girls: 20 },
        { class: 'Class 2', students: 42, boys: 22, girls: 20 },
        { class: 'Class 3', students: 48, boys: 26, girls: 22 },
        { class: 'Class 4', students: 40, boys: 20, girls: 20 },
        { class: 'Class 5', students: 44, boys: 24, girls: 20 },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 'var(--spacing-6)' }}>
                {/* Sidebar */}
                <div className="card" style={{ height: 'fit-content', position: 'sticky', top: 'var(--spacing-6)' }}>
                    <div className="card-header">
                        <h3 className="card-title">
                            <span className="material-symbols-rounded">analytics</span>
                            Reports
                        </h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <div style={{ display: 'grid', gap: '2px' }}>
                            {reports.map((report) => (
                                <button
                                    key={report.id}
                                    onClick={() => setSelectedReport(report.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-3)',
                                        padding: 'var(--spacing-4)',
                                        background: selectedReport === report.id ? 'var(--primary-50)' : 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background var(--transition-fast)',
                                        borderLeft: selectedReport === report.id ? '3px solid var(--primary-500)' : '3px solid transparent',
                                    }}
                                >
                                    <span
                                        className="material-symbols-rounded"
                                        style={{
                                            color: selectedReport === report.id ? 'var(--primary-600)' : 'var(--text-tertiary)',
                                            fontSize: '22px',
                                        }}
                                    >
                                        {report.icon}
                                    </span>
                                    <div>
                                        <div style={{ fontWeight: 500, color: selectedReport === report.id ? 'var(--primary-600)' : 'var(--text-primary)' }}>
                                            {report.name}
                                        </div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                                            {report.description}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
                        <div>
                            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600 }}>
                                {reports.find(r => r.id === selectedReport)?.name}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                {reports.find(r => r.id === selectedReport)?.description}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                            <button className="btn btn-secondary">
                                <span className="material-symbols-rounded">download</span>
                                Export PDF
                            </button>
                            <button className="btn btn-secondary">
                                <span className="material-symbols-rounded">table_chart</span>
                                Export Excel
                            </button>
                        </div>
                    </div>

                    {/* Report Content */}
                    {selectedReport === 'overview' && (
                        <div style={{ display: 'grid', gap: 'var(--spacing-6)' }}>
                            {/* Stats */}
                            <div className="stats-grid">
                                <div className="stat-card students">
                                    <div className="stat-icon">
                                        <span className="material-symbols-rounded">school</span>
                                    </div>
                                    <div className="stat-content">
                                        <p className="stat-label">Total Students</p>
                                        <h3 className="stat-value">342</h3>
                                    </div>
                                </div>
                                <div className="stat-card teachers">
                                    <div className="stat-icon">
                                        <span className="material-symbols-rounded">badge</span>
                                    </div>
                                    <div className="stat-content">
                                        <p className="stat-label">Total Staff</p>
                                        <h3 className="stat-value">28</h3>
                                    </div>
                                </div>
                                <div className="stat-card fees">
                                    <div className="stat-icon">
                                        <span className="material-symbols-rounded">payments</span>
                                    </div>
                                    <div className="stat-content">
                                        <p className="stat-label">This Month</p>
                                        <h3 className="stat-value">{formatCurrency(155000)}</h3>
                                    </div>
                                </div>
                                <div className="stat-card attendance">
                                    <div className="stat-icon">
                                        <span className="material-symbols-rounded">fact_check</span>
                                    </div>
                                    <div className="stat-content">
                                        <p className="stat-label">Avg Attendance</p>
                                        <h3 className="stat-value">92%</h3>
                                    </div>
                                </div>
                            </div>

                            {/* Charts */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-6)' }}>
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            <span className="material-symbols-rounded">show_chart</span>
                                            Fee Collection (Last 6 Months)
                                        </h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="chart-container">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={feeData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                                                    <XAxis dataKey="month" stroke="var(--text-tertiary)" />
                                                    <YAxis stroke="var(--text-tertiary)" tickFormatter={(v) => `₹${v / 1000}k`} />
                                                    <Tooltip
                                                        formatter={(value) => [formatCurrency(value as number), '']}
                                                        contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px' }}
                                                    />
                                                    <Legend />
                                                    <Bar dataKey="collected" fill="#22c55e" name="Collected" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            <span className="material-symbols-rounded">pie_chart</span>
                                            Today's Attendance
                                        </h3>
                                    </div>
                                    <div className="card-body">
                                        <div style={{ height: '250px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={attendanceData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={90}
                                                        paddingAngle={2}
                                                        dataKey="value"
                                                    >
                                                        {attendanceData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Class-wise Students */}
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">
                                        <span className="material-symbols-rounded">groups</span>
                                        Class-wise Student Count
                                    </h3>
                                </div>
                                <div className="card-body">
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={classWiseData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                                                <XAxis dataKey="class" stroke="var(--text-tertiary)" />
                                                <YAxis stroke="var(--text-tertiary)" />
                                                <Tooltip
                                                    contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px' }}
                                                />
                                                <Legend />
                                                <Line type="monotone" dataKey="boys" stroke="#6366f1" strokeWidth={3} dot={{ r: 6 }} name="Boys" />
                                                <Line type="monotone" dataKey="girls" stroke="#ec4899" strokeWidth={3} dot={{ r: 6 }} name="Girls" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedReport === 'fees' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <span className="material-symbols-rounded">payments</span>
                                    Fee Collection Report
                                </h3>
                                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                    <input type="date" className="form-control" style={{ height: '40px' }} />
                                    <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-tertiary)' }}>to</span>
                                    <input type="date" className="form-control" style={{ height: '40px' }} />
                                    <button className="btn btn-primary">Generate</button>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="chart-container" style={{ height: '400px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={feeData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                                            <XAxis dataKey="month" stroke="var(--text-tertiary)" />
                                            <YAxis stroke="var(--text-tertiary)" tickFormatter={(v) => `₹${v / 1000}k`} />
                                            <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                                            <Legend />
                                            <Bar dataKey="collected" fill="#22c55e" name="Collected" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {(selectedReport !== 'overview' && selectedReport !== 'fees') && (
                        <div className="card">
                            <div className="empty-state" style={{ padding: 'var(--spacing-12)' }}>
                                <div className="empty-state-icon">
                                    <span className="material-symbols-rounded">{reports.find(r => r.id === selectedReport)?.icon}</span>
                                </div>
                                <h3 className="empty-state-title">{reports.find(r => r.id === selectedReport)?.name}</h3>
                                <p className="empty-state-text">
                                    This report will be available soon. Select date range and filters to generate detailed reports.
                                </p>
                                <button className="btn btn-primary">
                                    <span className="material-symbols-rounded">add</span>
                                    Generate Report
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
