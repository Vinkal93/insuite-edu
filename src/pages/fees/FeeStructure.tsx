import { useState, useEffect } from 'react';
import { db } from '../../db/database';
import type { FeeStructure, Class } from '../../types';

export default function FeeStructurePage() {
    const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [fees, allClasses] = await Promise.all([
                db.feeStructures.toArray(),
                db.classes.toArray(),
            ]);
            setFeeStructures(fees);
            setClasses(allClasses);
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

    const getFrequencyLabel = (freq: string) => {
        const labels: Record<string, string> = {
            monthly: 'Monthly',
            quarterly: 'Quarterly',
            half_yearly: 'Half Yearly',
            yearly: 'Yearly',
            one_time: 'One Time',
        };
        return labels[freq] || freq;
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
                <p style={{ color: 'var(--text-secondary)' }}>
                    Define fee types and amounts for different classes
                </p>
                <button className="btn btn-primary btn-lg">
                    <span className="material-symbols-rounded">add</span>
                    Add Fee Structure
                </button>
            </div>

            {/* Fee Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-5)' }}>
                {feeStructures.map((fee) => (
                    <div key={fee.id} className="card">
                        <div className="card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-4)' }}>
                                <div>
                                    <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>{fee.name}</h3>
                                    <span className={`badge ${fee.isActive ? 'badge-success' : 'badge-neutral'}`}>
                                        {fee.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: 'var(--radius-lg)',
                                        background: 'var(--success-100)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <span className="material-symbols-rounded" style={{ color: 'var(--success-600)' }}>
                                        payments
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
                                <div>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Amount</p>
                                    <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--success-600)' }}>
                                        {formatCurrency(fee.amount)}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Frequency</p>
                                        <p style={{ fontWeight: 500 }}>{getFrequencyLabel(fee.frequency)}</p>
                                    </div>
                                    {fee.dueDay && (
                                        <div>
                                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Due Day</p>
                                            <p style={{ fontWeight: 500 }}>{fee.dueDay}th of month</p>
                                        </div>
                                    )}
                                </div>
                                {fee.lateFeePerDay && (
                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Late Fee</p>
                                        <p style={{ fontWeight: 500, color: 'var(--warning-600)' }}>
                                            {formatCurrency(fee.lateFeePerDay)}/day (max {fee.lateFeeMaxDays} days)
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 'var(--spacing-2)',
                                paddingTop: 'var(--spacing-4)',
                                borderTop: '1px solid var(--border-light)',
                            }}>
                                <button className="table-action-btn edit" title="Edit">
                                    <span className="material-symbols-rounded">edit</span>
                                </button>
                                <button className="table-action-btn delete" title="Delete">
                                    <span className="material-symbols-rounded">delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add New Card */}
                <div
                    className="card"
                    style={{
                        cursor: 'pointer',
                        border: '2px dashed var(--border-light)',
                        background: 'transparent',
                    }}
                >
                    <div className="card-body" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '200px',
                    }}>
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--bg-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 'var(--spacing-4)',
                            }}
                        >
                            <span className="material-symbols-rounded" style={{ fontSize: '32px', color: 'var(--text-tertiary)' }}>
                                add
                            </span>
                        </div>
                        <h3 style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Add New Fee</h3>
                    </div>
                </div>
            </div>
        </div>
    );
}
