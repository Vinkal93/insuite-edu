import { useState, useEffect } from 'react';
import { db, generateReceiptNumber, syncFeeTransaction } from '../../db/database';
import type { Student, Class, FeeStructure, PaymentMode } from '../../types';
import jsPDF from 'jspdf';

export default function FeeCollection() {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        discount: '',
        discountReason: '',
        paymentMode: 'cash' as PaymentMode,
        transactionId: '',
        feeMonth: '',
        remarks: '',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [allStudents, allClasses, allFees, allTransactions] = await Promise.all([
                db.students.where('status').equals('active').toArray(),
                db.classes.toArray(),
                db.feeStructures.where('isActive').equals(1).toArray(),
                db.feeTransactions.orderBy('createdAt').reverse().limit(10).toArray(),
            ]);

            setStudents(allStudents);
            setClasses(allClasses);
            setFeeStructures(allFees);
            setTransactions(allTransactions);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.fatherPhone.includes(searchQuery)
    );

    const selectStudent = (student: Student) => {
        setSelectedStudent(student);
        setSearchQuery('');
        setShowForm(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getClassName = (classId: number) => {
        return classes.find(c => c.id === classId)?.name || 'N/A';
    };

    const handleSubmit = async () => {
        if (!selectedStudent) return;
        if (!formData.amount || isNaN(parseFloat(formData.amount))) {
            alert('Please enter a valid amount');
            return;
        }

        setSubmitting(true);
        try {
            const receiptNumber = await generateReceiptNumber();
            const amount = parseFloat(formData.amount);
            const discount = parseFloat(formData.discount) || 0;
            const totalAmount = amount - discount;

            const transactionData = {
                studentId: selectedStudent.id!,
                receiptNumber,
                amount,
                discount: discount || undefined,
                discountReason: formData.discountReason || undefined,
                totalAmount,
                paidAmount: totalAmount,
                dueAmount: 0,
                paymentMode: formData.paymentMode,
                transactionId: formData.transactionId || undefined,
                feeMonth: formData.feeMonth || undefined,
                paidDate: new Date(),
                collectedBy: 1,
                remarks: formData.remarks || undefined,
                createdAt: new Date(),
            };

            const newTransactionId = await db.feeTransactions.add(transactionData);

            // Immediately sync to Firebase
            try {
                await syncFeeTransaction({ ...transactionData, id: newTransactionId });
                console.log('✅ Fee transaction synced to Firebase');
            } catch (syncError) {
                console.error('Sync failed, will retry later:', syncError);
            }

            // Generate PDF receipt
            generateReceipt(receiptNumber, selectedStudent, totalAmount, formData.paymentMode);

            // Reset form
            setShowForm(false);
            setSelectedStudent(null);
            setFormData({
                amount: '',
                discount: '',
                discountReason: '',
                paymentMode: 'cash',
                transactionId: '',
                feeMonth: '',
                remarks: '',
            });

            // Reload transactions
            loadData();
            alert('Fee collected successfully! Receipt downloaded.');
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('Failed to save transaction');
        } finally {
            setSubmitting(false);
        }
    };

    const generateReceipt = (receiptNo: string, student: Student, amount: number, mode: PaymentMode) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('InSuite Academy', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Fee Receipt', pageWidth / 2, 30, { align: 'center' });

        // Receipt details
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);

        let y = 55;
        const leftX = 20;
        const rightX = pageWidth - 20;

        doc.setFont('helvetica', 'bold');
        doc.text('Receipt No:', leftX, y);
        doc.setFont('helvetica', 'normal');
        doc.text(receiptNo, leftX + 35, y);

        doc.setFont('helvetica', 'bold');
        doc.text('Date:', rightX - 60, y);
        doc.setFont('helvetica', 'normal');
        doc.text(new Date().toLocaleDateString('en-IN'), rightX - 35, y);

        y += 20;
        doc.setDrawColor(229, 231, 235);
        doc.line(leftX, y, rightX, y);
        y += 15;

        // Student details
        const details = [
            ['Student Name', `${student.firstName} ${student.lastName}`],
            ['Student ID', student.studentId],
            ['Class', getClassName(student.classId)],
            ['Father\'s Name', student.fatherName],
        ];

        details.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label + ':', leftX, y);
            doc.setFont('helvetica', 'normal');
            doc.text(value, leftX + 50, y);
            y += 10;
        });

        y += 10;
        doc.line(leftX, y, rightX, y);
        y += 15;

        // Amount
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Amount Paid:', leftX, y);
        doc.setTextColor(34, 197, 94);
        doc.text(formatCurrency(amount), leftX + 50, y);
        y += 12;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Payment Mode: ' + mode.toUpperCase(), leftX, y);

        // Footer
        y = 250;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('This is a computer generated receipt.', pageWidth / 2, y, { align: 'center' });
        doc.text('Thank you for your payment!', pageWidth / 2, y + 8, { align: 'center' });

        doc.save(`Receipt_${receiptNo}.pdf`);
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 'var(--spacing-6)' }}>
                {/* Main Content */}
                <div>
                    {/* Search */}
                    <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                        <div className="card-header">
                            <h3 className="card-title">
                                <span className="material-symbols-rounded">search</span>
                                Find Student
                            </h3>
                        </div>
                        <div className="card-body">
                            <div className="search-box" style={{ width: '100%' }}>
                                <span className="material-symbols-rounded">search</span>
                                <input
                                    type="text"
                                    placeholder="Search by name, ID, or phone number..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {searchQuery && filteredStudents.length > 0 && (
                                <div style={{ marginTop: 'var(--spacing-4)', maxHeight: '300px', overflowY: 'auto' }}>
                                    {filteredStudents.slice(0, 5).map(student => (
                                        <div
                                            key={student.id}
                                            onClick={() => selectStudent(student)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-3)',
                                                padding: 'var(--spacing-3)',
                                                borderRadius: 'var(--radius-lg)',
                                                cursor: 'pointer',
                                                transition: 'background var(--transition-fast)',
                                            }}
                                            className="recent-item"
                                        >
                                            <div
                                                style={{
                                                    width: '44px',
                                                    height: '44px',
                                                    borderRadius: 'var(--radius-full)',
                                                    background: 'linear-gradient(135deg, var(--primary-400), var(--secondary-400))',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600 }}>{student.firstName} {student.lastName}</div>
                                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                                    {student.studentId} • {getClassName(student.classId)}
                                                </div>
                                            </div>
                                            <span className="material-symbols-rounded" style={{ color: 'var(--primary-500)' }}>
                                                arrow_forward
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Collection Form */}
                    {showForm && selectedStudent && (
                        <div className="card animate-slide-up">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <span className="material-symbols-rounded">payments</span>
                                    Collect Fee
                                </h3>
                                <button className="btn btn-ghost" onClick={() => { setShowForm(false); setSelectedStudent(null); }}>
                                    <span className="material-symbols-rounded">close</span>
                                </button>
                            </div>
                            <div className="card-body">
                                {/* Selected Student Info */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-4)',
                                        padding: 'var(--spacing-4)',
                                        background: 'var(--primary-50)',
                                        borderRadius: 'var(--radius-lg)',
                                        marginBottom: 'var(--spacing-6)',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: 'var(--radius-full)',
                                            background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: 'var(--font-size-lg)',
                                        }}
                                    >
                                        {selectedStudent.firstName.charAt(0)}{selectedStudent.lastName.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 style={{ fontWeight: 600 }}>{selectedStudent.firstName} {selectedStudent.lastName}</h4>
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                            {selectedStudent.studentId} • {getClassName(selectedStudent.classId)} • {selectedStudent.fatherPhone}
                                        </p>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label required">Amount (₹)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Enter amount"
                                            value={formData.amount}
                                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Discount (₹)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="0"
                                            value={formData.discount}
                                            onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                {formData.discount && (
                                    <div className="form-group">
                                        <label className="form-label">Discount Reason</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Reason for discount"
                                            value={formData.discountReason}
                                            onChange={(e) => setFormData(prev => ({ ...prev, discountReason: e.target.value }))}
                                        />
                                    </div>
                                )}

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label required">Payment Mode</label>
                                        <select
                                            className="form-control"
                                            value={formData.paymentMode}
                                            onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value as PaymentMode }))}
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="upi">UPI</option>
                                            <option value="card">Card</option>
                                            <option value="bank">Bank Transfer</option>
                                            <option value="cheque">Cheque</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Fee Month</label>
                                        <input
                                            type="month"
                                            className="form-control"
                                            value={formData.feeMonth}
                                            onChange={(e) => setFormData(prev => ({ ...prev, feeMonth: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                {(formData.paymentMode === 'upi' || formData.paymentMode === 'card' || formData.paymentMode === 'bank') && (
                                    <div className="form-group">
                                        <label className="form-label">Transaction ID</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter transaction ID"
                                            value={formData.transactionId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Remarks</label>
                                    <textarea
                                        className="form-control"
                                        placeholder="Any additional notes..."
                                        rows={2}
                                        value={formData.remarks}
                                        onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                                    />
                                </div>

                                {/* Total */}
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: 'var(--spacing-4)',
                                        background: 'var(--success-50)',
                                        borderRadius: 'var(--radius-lg)',
                                        marginTop: 'var(--spacing-4)',
                                    }}
                                >
                                    <span style={{ fontWeight: 600, color: 'var(--success-700)' }}>Total Payable:</span>
                                    <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--success-600)' }}>
                                        {formatCurrency((parseFloat(formData.amount) || 0) - (parseFloat(formData.discount) || 0))}
                                    </span>
                                </div>

                                <button
                                    className="btn btn-success btn-lg"
                                    style={{ width: '100%', marginTop: 'var(--spacing-6)' }}
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="material-symbols-rounded" style={{ animation: 'pulse 1s infinite' }}>progress_activity</span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-rounded">receipt</span>
                                            Collect & Generate Receipt
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Recent Transactions */}
                    <div className="card" style={{ marginTop: 'var(--spacing-6)' }}>
                        <div className="card-header">
                            <h3 className="card-title">
                                <span className="material-symbols-rounded">history</span>
                                Recent Transactions
                            </h3>
                        </div>
                        {transactions.length > 0 ? (
                            <div className="table-wrapper" style={{ border: 'none' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Receipt</th>
                                            <th>Student</th>
                                            <th>Amount</th>
                                            <th>Mode</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((t) => (
                                            <tr key={t.id}>
                                                <td>
                                                    <code style={{ background: 'var(--primary-50)', color: 'var(--primary-600)', padding: '2px 8px', borderRadius: '4px' }}>
                                                        {t.receiptNumber}
                                                    </code>
                                                </td>
                                                <td>
                                                    {(() => {
                                                        const student = students.find(s => s.id === t.studentId);
                                                        return student ? `${student.firstName} ${student.lastName}` : 'N/A';
                                                    })()}
                                                </td>
                                                <td style={{ fontWeight: 600, color: 'var(--success-600)' }}>
                                                    {formatCurrency(t.paidAmount)}
                                                </td>
                                                <td>
                                                    <span className="badge badge-neutral" style={{ textTransform: 'uppercase' }}>
                                                        {t.paymentMode}
                                                    </span>
                                                </td>
                                                <td>{new Date(t.paidDate).toLocaleDateString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: 'var(--spacing-8)' }}>
                                <span className="material-symbols-rounded" style={{ fontSize: '48px', color: 'var(--text-tertiary)' }}>
                                    receipt_long
                                </span>
                                <p style={{ marginTop: 'var(--spacing-4)', color: 'var(--text-tertiary)' }}>No transactions yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar - Quick Stats */}
                <div>
                    <div className="card" style={{ position: 'sticky', top: 'var(--spacing-6)' }}>
                        <div className="card-header">
                            <h3 className="card-title">
                                <span className="material-symbols-rounded">analytics</span>
                                Today's Summary
                            </h3>
                        </div>
                        <div className="card-body">
                            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-2)' }}>
                                    Total Collection Today
                                </p>
                                <h2 style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 700, color: 'var(--success-600)' }}>
                                    {formatCurrency(transactions.reduce((sum, t) => {
                                        const today = new Date().toDateString();
                                        const transDate = new Date(t.paidDate).toDateString();
                                        return today === transDate ? sum + t.paidAmount : sum;
                                    }, 0))}
                                </h2>
                            </div>

                            <div style={{ display: 'grid', gap: 'var(--spacing-3)' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: 'var(--spacing-3)',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Transactions</span>
                                    <span style={{ fontWeight: 600 }}>
                                        {transactions.filter(t => new Date(t.paidDate).toDateString() === new Date().toDateString()).length}
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: 'var(--spacing-3)',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Cash</span>
                                    <span style={{ fontWeight: 600 }}>
                                        {formatCurrency(transactions.filter(t => t.paymentMode === 'cash').reduce((s, t) => s + t.paidAmount, 0))}
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: 'var(--spacing-3)',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Online</span>
                                    <span style={{ fontWeight: 600 }}>
                                        {formatCurrency(transactions.filter(t => t.paymentMode !== 'cash').reduce((s, t) => s + t.paidAmount, 0))}
                                    </span>
                                </div>
                            </div>

                            <div style={{ marginTop: 'var(--spacing-6)' }}>
                                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--spacing-3)' }}>
                                    Quick Actions
                                </h4>
                                <div style={{ display: 'grid', gap: 'var(--spacing-2)' }}>
                                    <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                        <span className="material-symbols-rounded">download</span>
                                        Export Today's Report
                                    </button>
                                    <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                        <span className="material-symbols-rounded">print</span>
                                        Print Summary
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
