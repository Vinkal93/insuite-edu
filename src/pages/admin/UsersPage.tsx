import { useState, useEffect } from 'react';
import { db } from '../../db/database';
import { useAuth } from '../../context/AuthContext';
import type { Student } from '../../types';

export default function UsersPage() {
    const { blockStudent, unblockStudent, updateStudentCredentials } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'blocked'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'block' | 'unblock' | 'credentials' | null>(null);
    const [blockMessage, setBlockMessage] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newStudentId, setNewStudentId] = useState('');

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const allStudents = await db.students.toArray();
            setStudents(allStudents);
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBlock = async () => {
        if (!selectedStudent || !blockMessage) return;

        try {
            await blockStudent(selectedStudent.id!, blockMessage);
            await loadStudents();
            closeModal();
        } catch (error) {
            console.error('Error blocking student:', error);
        }
    };

    const handleUnblock = async () => {
        if (!selectedStudent) return;

        try {
            await unblockStudent(selectedStudent.id!);
            await loadStudents();
            closeModal();
        } catch (error) {
            console.error('Error unblocking student:', error);
        }
    };

    const handleUpdateCredentials = async () => {
        if (!selectedStudent) return;

        try {
            const updates: { password?: string; studentIdField?: string } = {};
            if (newPassword) updates.password = newPassword;
            if (newStudentId && newStudentId !== selectedStudent.studentId) {
                updates.studentIdField = newStudentId;
            }

            await updateStudentCredentials(selectedStudent.id!, updates);
            await loadStudents();
            closeModal();
        } catch (error) {
            console.error('Error updating credentials:', error);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedStudent(null);
        setModalType(null);
        setBlockMessage('');
        setNewPassword('');
        setNewStudentId('');
    };

    const filteredStudents = students
        .filter(s => {
            if (filter === 'blocked') return s.isBlocked;
            if (filter === 'active') return !s.isBlocked && s.status === 'active';
            return true;
        })
        .filter(s => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                s.firstName.toLowerCase().includes(query) ||
                s.lastName.toLowerCase().includes(query) ||
                s.studentId.toLowerCase().includes(query) ||
                s.fatherPhone.includes(query)
            );
        });

    if (loading) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    <span className="material-symbols-rounded spinning">progress_activity</span>
                </div>
                <h3 className="empty-state-title">Loading...</h3>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Platform Users</h1>
                    <p>Manage student credentials and access</p>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="stat-card" onClick={() => setFilter('all')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ background: 'var(--primary-100)' }}>
                        <span className="material-symbols-rounded" style={{ color: 'var(--primary-600)' }}>school</span>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{students.length}</div>
                        <div className="stat-label">Total Students</div>
                    </div>
                </div>
                <div className="stat-card" onClick={() => setFilter('active')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ background: 'var(--success-100)' }}>
                        <span className="material-symbols-rounded" style={{ color: 'var(--success-600)' }}>check_circle</span>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{students.filter(s => !s.isBlocked && s.status === 'active').length}</div>
                        <div className="stat-label">Active</div>
                    </div>
                </div>
                <div className="stat-card" onClick={() => setFilter('blocked')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ background: 'var(--error-100)' }}>
                        <span className="material-symbols-rounded" style={{ color: 'var(--error-600)' }}>block</span>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{students.filter(s => s.isBlocked).length}</div>
                        <div className="stat-label">Blocked</div>
                    </div>
                </div>
            </div>

            {/* Users List */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">
                        <span className="material-symbols-rounded">group</span>
                        Students
                    </h3>
                    <div className="search-box" style={{ marginLeft: 'auto' }}>
                        <span className="material-symbols-rounded">search</span>
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="card-body">
                    {filteredStudents.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <span className="material-symbols-rounded">person_search</span>
                            </div>
                            <h3 className="empty-state-title">No students found</h3>
                            <p className="empty-state-text">Try adjusting your search or filter.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Student ID</th>
                                        <th>Class</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                                                    <div className="avatar">
                                                        {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <strong>{student.firstName} {student.lastName}</strong>
                                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', margin: 0 }}>
                                                            {student.fatherName}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                                                    {student.studentId}
                                                </code>
                                            </td>
                                            <td>Class {student.classId}</td>
                                            <td>{student.fatherPhone}</td>
                                            <td>
                                                {student.isBlocked ? (
                                                    <span className="badge badge-error">Blocked</span>
                                                ) : student.status === 'active' ? (
                                                    <span className="badge badge-success">Active</span>
                                                ) : (
                                                    <span className="badge badge-secondary">{student.status}</span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                                    <button
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={() => {
                                                            setSelectedStudent(student);
                                                            setNewStudentId(student.studentId);
                                                            setModalType('credentials');
                                                            setShowModal(true);
                                                        }}
                                                    >
                                                        <span className="material-symbols-rounded">key</span>
                                                        Credentials
                                                    </button>
                                                    {student.isBlocked ? (
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => {
                                                                setSelectedStudent(student);
                                                                setModalType('unblock');
                                                                setShowModal(true);
                                                            }}
                                                        >
                                                            <span className="material-symbols-rounded">lock_open</span>
                                                            Unblock
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => {
                                                                setSelectedStudent(student);
                                                                setModalType('block');
                                                                setShowModal(true);
                                                            }}
                                                        >
                                                            <span className="material-symbols-rounded">block</span>
                                                            Block
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                {modalType === 'block' ? 'Block Student' :
                                    modalType === 'unblock' ? 'Unblock Student' : 'Update Credentials'}
                            </h3>
                            <button className="modal-close" onClick={closeModal}>
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: 'var(--spacing-4)' }}>
                                <strong>{selectedStudent?.firstName} {selectedStudent?.lastName}</strong>
                                <span style={{ color: 'var(--text-tertiary)', marginLeft: 'var(--spacing-2)' }}>
                                    ({selectedStudent?.studentId})
                                </span>
                            </p>

                            {modalType === 'credentials' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Student ID</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newStudentId}
                                            onChange={(e) => setNewStudentId(e.target.value.toUpperCase())}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">New Password</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Leave blank to keep current"
                                        />
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--spacing-1)' }}>
                                            Leave blank to keep the current password
                                        </p>
                                    </div>
                                </>
                            )}

                            {modalType === 'block' && (
                                <div className="form-group">
                                    <label className="form-label required">Block Message</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={blockMessage}
                                        onChange={(e) => setBlockMessage(e.target.value)}
                                        placeholder="This message will be shown to the student when they try to login..."
                                        required
                                    />
                                </div>
                            )}

                            {modalType === 'unblock' && (
                                <p>Are you sure you want to unblock this student? They will be able to login again.</p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={closeModal}>
                                Cancel
                            </button>
                            {modalType === 'credentials' && (
                                <button
                                    className="btn btn-primary"
                                    onClick={handleUpdateCredentials}
                                >
                                    Update Credentials
                                </button>
                            )}
                            {modalType === 'block' && (
                                <button
                                    className="btn btn-danger"
                                    onClick={handleBlock}
                                    disabled={!blockMessage}
                                >
                                    Block Student
                                </button>
                            )}
                            {modalType === 'unblock' && (
                                <button
                                    className="btn btn-success"
                                    onClick={handleUnblock}
                                >
                                    Unblock Student
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
