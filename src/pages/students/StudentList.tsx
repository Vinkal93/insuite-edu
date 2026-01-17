import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../db/database';
import type { Student, Class } from '../../types';

export default function StudentList() {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterClass, setFilterClass] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('active');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const allStudents = await db.students.toArray();
            const allClasses = await db.classes.toArray();
            setStudents(allStudents);
            setClasses(allClasses);
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch =
            student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.fatherPhone.includes(searchQuery);

        const matchesClass = filterClass === 'all' || student.classId === parseInt(filterClass);
        const matchesStatus = filterStatus === 'all' || student.status === filterStatus;

        return matchesSearch && matchesClass && matchesStatus;
    });

    const getClassName = (classId: number) => {
        const cls = classes.find(c => c.id === classId);
        return cls?.name || 'N/A';
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    <span className="material-symbols-rounded" style={{ animation: 'pulse 1s infinite' }}>
                        hourglass_empty
                    </span>
                </div>
                <h3 className="empty-state-title">Loading Students...</h3>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center' }}>
                    {/* Search */}
                    <div className="search-box" style={{ width: '300px' }}>
                        <span className="material-symbols-rounded">search</span>
                        <input
                            type="text"
                            placeholder="Search by name, ID, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Class Filter */}
                    <select
                        className="form-control"
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        style={{ width: 'auto', height: '44px' }}
                    >
                        <option value="all">All Classes</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        className="form-control"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ width: 'auto', height: '44px' }}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="left">Left</option>
                        <option value="transferred">Transferred</option>
                    </select>
                </div>

                <Link to="/students/new" className="btn btn-primary btn-lg">
                    <span className="material-symbols-rounded">person_add</span>
                    New Admission
                </Link>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="stat-card students">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">group</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Total Students</p>
                        <h3 className="stat-value">{students.length}</h3>
                    </div>
                </div>
                <div className="stat-card fees">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">check_circle</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Active Students</p>
                        <h3 className="stat-value">{students.filter(s => s.status === 'active').length}</h3>
                    </div>
                </div>
                <div className="stat-card pending">
                    <div className="stat-icon">
                        <span className="material-symbols-rounded">filter_list</span>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Filtered Results</p>
                        <h3 className="stat-value">{filteredStudents.length}</h3>
                    </div>
                </div>
            </div>

            {/* Student Table */}
            {filteredStudents.length > 0 ? (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Student ID</th>
                                <th>Class</th>
                                <th>Father's Name</th>
                                <th>Contact</th>
                                <th>Admission Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student) => (
                                <tr key={student.id}>
                                    <td>
                                        <div className="table-avatar">
                                            {student.photo ? (
                                                <img src={student.photo} alt={student.firstName} />
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    {getInitials(student.firstName, student.lastName)}
                                                </div>
                                            )}
                                            <div className="table-avatar-info">
                                                <span className="table-avatar-name">
                                                    {student.firstName} {student.lastName}
                                                </span>
                                                <span className="table-avatar-sub">{student.gender}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <code style={{
                                            background: 'var(--primary-50)',
                                            color: 'var(--primary-600)',
                                            padding: 'var(--spacing-1) var(--spacing-2)',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: 'var(--font-size-sm)',
                                        }}>
                                            {student.studentId}
                                        </code>
                                    </td>
                                    <td>{getClassName(student.classId)}</td>
                                    <td>{student.fatherName}</td>
                                    <td>
                                        <a
                                            href={`tel:${student.fatherPhone}`}
                                            style={{ color: 'var(--primary-500)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}
                                        >
                                            <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>call</span>
                                            {student.fatherPhone}
                                        </a>
                                    </td>
                                    <td>{formatDate(student.admissionDate)}</td>
                                    <td>
                                        <span className={`badge ${student.status === 'active' ? 'badge-success' :
                                                student.status === 'left' ? 'badge-danger' : 'badge-warning'
                                            }`}>
                                            <span className={`status-dot ${student.status}`}></span>
                                            {student.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <Link
                                                to={`/students/${student.id}`}
                                                className="table-action-btn"
                                                title="View Profile"
                                            >
                                                <span className="material-symbols-rounded">visibility</span>
                                            </Link>
                                            <button className="table-action-btn edit" title="Edit">
                                                <span className="material-symbols-rounded">edit</span>
                                            </button>
                                            <button className="table-action-btn" title="Collect Fee">
                                                <span className="material-symbols-rounded">payments</span>
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
                            <span className="material-symbols-rounded">school</span>
                        </div>
                        <h3 className="empty-state-title">No Students Found</h3>
                        <p className="empty-state-text">
                            {searchQuery || filterClass !== 'all' || filterStatus !== 'all'
                                ? 'No students match your search criteria. Try adjusting your filters.'
                                : 'Get started by adding your first student.'}
                        </p>
                        <Link to="/students/new" className="btn btn-primary">
                            <span className="material-symbols-rounded">person_add</span>
                            Add New Student
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
