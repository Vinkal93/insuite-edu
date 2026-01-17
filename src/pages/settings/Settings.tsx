import { useState, useEffect } from 'react';
import { db } from '../../db/database';
import { useTheme } from '../../context/ThemeContext';
import type { Institute, PaymentGatewayConfig, PaymentGatewayType } from '../../types';

// Payment Gateway definitions
const PAYMENT_GATEWAYS = [
    { id: 'razorpay' as PaymentGatewayType, name: 'Razorpay', icon: '💳', color: '#3399FF', description: 'Accept all payment methods including UPI, Cards, Netbanking' },
    { id: 'phonepe' as PaymentGatewayType, name: 'PhonePe', icon: '📱', color: '#5F259F', description: 'India\'s most trusted UPI payment gateway' },
    { id: 'paytm' as PaymentGatewayType, name: 'Paytm', icon: '🔵', color: '#00BAF2', description: 'Accept payments via Paytm wallet and UPI' },
    { id: 'stripe' as PaymentGatewayType, name: 'Stripe', icon: '💎', color: '#635BFF', description: 'Global payment processing for international cards' },
    { id: 'upi_direct' as PaymentGatewayType, name: 'UPI Direct', icon: '🏦', color: '#128C7E', description: 'Direct UPI payments without gateway fees' },
];

export default function Settings() {
    const { theme, setTheme, themeColor, themeColors, setThemeColor } = useTheme();
    const [activeTab, setActiveTab] = useState('general');
    const [institute, setInstitute] = useState<Institute | null>(null);
    const [loading, setLoading] = useState(true);

    // Payment Gateway state
    const [paymentGateways, setPaymentGateways] = useState<PaymentGatewayConfig[]>([]);
    const [showGatewayModal, setShowGatewayModal] = useState(false);
    const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayType | null>(null);
    const [gatewayFormData, setGatewayFormData] = useState<Partial<PaymentGatewayConfig>>({});
    const [savingGateway, setSavingGateway] = useState(false);

    // Erase data confirmation state
    const [showEraseModal, setShowEraseModal] = useState(false);
    const [eraseStep, setEraseStep] = useState(1);
    const [confirmText, setConfirmText] = useState('');
    const [erasing, setErasing] = useState(false);
    const CONFIRM_PHRASE = 'DELETE ALL DATA';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [inst, gateways] = await Promise.all([
                db.institute.toCollection().first(),
                db.paymentGatewayConfigs.toArray(),
            ]);
            setInstitute(inst || null);
            setPaymentGateways(gateways);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openGatewayConfig = (gatewayId: PaymentGatewayType) => {
        const existing = paymentGateways.find(g => g.provider === gatewayId);
        setSelectedGateway(gatewayId);
        setGatewayFormData(existing || {
            provider: gatewayId,
            displayName: PAYMENT_GATEWAYS.find(g => g.id === gatewayId)?.name || '',
            isActive: false,
            isTestMode: true,
        });
        setShowGatewayModal(true);
    };

    const saveGatewayConfig = async () => {
        if (!selectedGateway) return;

        setSavingGateway(true);
        try {
            const gatewayData: PaymentGatewayConfig = {
                ...gatewayFormData,
                provider: selectedGateway,
                displayName: PAYMENT_GATEWAYS.find(g => g.id === selectedGateway)?.name || '',
                isActive: gatewayFormData.isActive || false,
                isTestMode: gatewayFormData.isTestMode !== false,
                createdAt: gatewayFormData.createdAt || new Date(),
                updatedAt: new Date(),
            };

            const existing = paymentGateways.find(g => g.provider === selectedGateway);
            if (existing?.id) {
                await db.paymentGatewayConfigs.update(existing.id, gatewayData);
            } else {
                await db.paymentGatewayConfigs.add(gatewayData);
            }

            // Reload gateways
            const gateways = await db.paymentGatewayConfigs.toArray();
            setPaymentGateways(gateways);
            setShowGatewayModal(false);
            setSelectedGateway(null);
            setGatewayFormData({});
        } catch (error) {
            console.error('Error saving gateway config:', error);
            alert('Failed to save gateway configuration');
        } finally {
            setSavingGateway(false);
        }
    };

    const toggleGatewayActive = async (gatewayId: PaymentGatewayType) => {
        const existing = paymentGateways.find(g => g.provider === gatewayId);
        if (existing?.id) {
            await db.paymentGatewayConfigs.update(existing.id, { isActive: !existing.isActive, updatedAt: new Date() });
            const gateways = await db.paymentGatewayConfigs.toArray();
            setPaymentGateways(gateways);
        }
    };

    const isGatewayConfigured = (gatewayId: PaymentGatewayType) => {
        const gateway = paymentGateways.find(g => g.provider === gatewayId);
        if (!gateway) return false;

        switch (gatewayId) {
            case 'razorpay':
                return !!(gateway.razorpayKeyId && gateway.razorpayKeySecret);
            case 'phonepe':
                return !!(gateway.phonepeMerchantId && gateway.phonepeApiKey);
            case 'paytm':
                return !!(gateway.paytmMid && gateway.paytmMerchantKey);
            case 'stripe':
                return !!(gateway.stripePublishableKey && gateway.stripeSecretKey);
            case 'upi_direct':
                return !!gateway.upiId;
            default:
                return false;
        }
    };

    const isGatewayActive = (gatewayId: PaymentGatewayType) => {
        return paymentGateways.find(g => g.provider === gatewayId)?.isActive || false;
    };

    const handleEraseAllData = async () => {
        if (confirmText !== CONFIRM_PHRASE) return;

        setErasing(true);
        try {
            // Delete all data from each table
            await db.students.clear();
            await db.staff.clear();
            await db.classes.clear();
            await db.batches.clear();
            await db.sections.clear();
            await db.subjects.clear();
            await db.attendance.clear();
            await db.feeStructures.clear();
            await db.feeTransactions.clear();
            await db.discounts.clear();
            await db.exams.clear();
            await db.examSchedules.clear();
            await db.examResults.clear();
            await db.notices.clear();
            await db.messages.clear();
            await db.certificates.clear();
            await db.idCards.clear();
            await db.studentDocuments.clear();

            // Reset modal
            setShowEraseModal(false);
            setEraseStep(1);
            setConfirmText('');

            // Reload page to reflect changes
            window.location.reload();
        } catch (error) {
            console.error('Error erasing data:', error);
            alert('Error erasing data. Please try again.');
        } finally {
            setErasing(false);
        }
    };

    const closeEraseModal = () => {
        setShowEraseModal(false);
        setEraseStep(1);
        setConfirmText('');
    };

    const tabs = [
        { id: 'general', label: 'General', icon: 'settings' },
        { id: 'institute', label: 'Institute', icon: 'business' },
        { id: 'academic', label: 'Academic', icon: 'school' },
        { id: 'fees', label: 'Fee Settings', icon: 'payments' },
        { id: 'notifications', label: 'Notifications', icon: 'notifications' },
        { id: 'users', label: 'Users & Roles', icon: 'manage_accounts' },
        { id: 'backup', label: 'Backup & Data', icon: 'backup' },
    ];

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
            <div className="settings-layout">
                {/* Sidebar */}
                <div className="card settings-sidebar">
                    <div className="card-header">
                        <h3 className="card-title">
                            <span className="material-symbols-rounded">settings</span>
                            Settings
                        </h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <div style={{ display: 'grid', gap: '2px' }}>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-3)',
                                        padding: 'var(--spacing-4)',
                                        background: activeTab === tab.id ? 'var(--primary-50)' : 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background var(--transition-fast)',
                                        borderLeft: activeTab === tab.id ? '3px solid var(--primary-500)' : '3px solid transparent',
                                        fontWeight: activeTab === tab.id ? 500 : 400,
                                        color: activeTab === tab.id ? 'var(--primary-600)' : 'var(--text-primary)',
                                    }}
                                >
                                    <span className="material-symbols-rounded" style={{ fontSize: '22px' }}>
                                        {tab.icon}
                                    </span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="settings-content">
                    {activeTab === 'general' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <span className="material-symbols-rounded">settings</span>
                                    General Settings
                                </h3>
                            </div>
                            <div className="card-body">
                                <div style={{ display: 'grid', gap: 'var(--spacing-6)' }}>
                                    {/* Theme Mode */}
                                    <div>
                                        <h4 style={{ fontWeight: 600, marginBottom: 'var(--spacing-3)' }}>Appearance Mode</h4>
                                        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                                            {(['light', 'dark', 'system'] as const).map((t) => (
                                                <button
                                                    key={t}
                                                    onClick={() => setTheme(t)}
                                                    style={{
                                                        padding: 'var(--spacing-4) var(--spacing-6)',
                                                        borderRadius: 'var(--radius-lg)',
                                                        border: `2px solid ${theme === t ? 'var(--primary-500)' : 'var(--border-light)'}`,
                                                        background: theme === t ? 'var(--primary-50)' : 'var(--bg-primary)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: 'var(--spacing-2)',
                                                    }}
                                                >
                                                    <span className="material-symbols-rounded" style={{ fontSize: '24px', color: theme === t ? 'var(--primary-600)' : 'var(--text-secondary)' }}>
                                                        {t === 'light' ? 'light_mode' : t === 'dark' ? 'dark_mode' : 'monitor'}
                                                    </span>
                                                    <span style={{ fontSize: 'var(--font-size-sm)', textTransform: 'capitalize', fontWeight: theme === t ? 600 : 400 }}>
                                                        {t}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Theme Color */}
                                    <div>
                                        <h4 style={{ fontWeight: 600, marginBottom: 'var(--spacing-3)' }}>Theme Color</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 'var(--spacing-3)' }}>
                                            {themeColors.map((color) => (
                                                <button
                                                    key={color.name}
                                                    onClick={() => setThemeColor(color)}
                                                    style={{
                                                        padding: 'var(--spacing-4)',
                                                        borderRadius: 'var(--radius-lg)',
                                                        border: `2px solid ${themeColor.name === color.name ? color.primary : 'var(--border-light)'}`,
                                                        background: 'var(--bg-primary)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: 'var(--spacing-2)',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: 'var(--radius-full)',
                                                            background: color.gradient,
                                                            boxShadow: themeColor.name === color.name ? `0 4px 12px ${color.primary}40` : 'none',
                                                        }}
                                                    />
                                                    <span style={{
                                                        fontSize: 'var(--font-size-sm)',
                                                        fontWeight: themeColor.name === color.name ? 600 : 400,
                                                        color: themeColor.name === color.name ? color.primary : 'var(--text-secondary)',
                                                    }}>
                                                        {color.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Language */}
                                    <div className="form-group" style={{ maxWidth: '300px' }}>
                                        <label className="form-label">Language</label>
                                        <select className="form-control">
                                            <option>English</option>
                                            <option>Hindi</option>
                                            <option>Marathi</option>
                                        </select>
                                    </div>

                                    {/* Date Format */}
                                    <div className="form-group" style={{ maxWidth: '300px' }}>
                                        <label className="form-label">Date Format</label>
                                        <select className="form-control">
                                            <option>DD/MM/YYYY</option>
                                            <option>MM/DD/YYYY</option>
                                            <option>YYYY-MM-DD</option>
                                        </select>
                                    </div>

                                    {/* Currency */}
                                    <div className="form-group" style={{ maxWidth: '300px' }}>
                                        <label className="form-label">Currency</label>
                                        <select className="form-control">
                                            <option>₹ INR (Indian Rupee)</option>
                                            <option>$ USD (US Dollar)</option>
                                            <option>€ EUR (Euro)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'institute' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <span className="material-symbols-rounded">business</span>
                                    Institute Details
                                </h3>
                            </div>
                            <div className="card-body">
                                <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Institute Name</label>
                                            <input type="text" className="form-control" defaultValue={institute?.name || ''} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Principal Name</label>
                                            <input type="text" className="form-control" defaultValue={institute?.principalName || ''} />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Address</label>
                                        <textarea className="form-control" rows={2} defaultValue={institute?.address || ''} />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">City</label>
                                            <input type="text" className="form-control" defaultValue={institute?.city || ''} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">State</label>
                                            <input type="text" className="form-control" defaultValue={institute?.state || ''} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Pincode</label>
                                            <input type="text" className="form-control" defaultValue={institute?.pincode || ''} />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Phone</label>
                                            <input type="tel" className="form-control" defaultValue={institute?.phone || ''} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email</label>
                                            <input type="email" className="form-control" defaultValue={institute?.email || ''} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Website</label>
                                            <input type="url" className="form-control" defaultValue={institute?.website || ''} />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Logo</label>
                                        <div className="file-upload">
                                            <input type="file" id="logo" accept="image/*" style={{ display: 'none' }} />
                                            <label htmlFor="logo" style={{ cursor: 'pointer', display: 'block' }}>
                                                <div className="file-upload-icon">
                                                    <span className="material-symbols-rounded">cloud_upload</span>
                                                </div>
                                                <p className="file-upload-text">
                                                    <strong>Click to upload</strong> or drag and drop
                                                </p>
                                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                                                    PNG, JPG up to 2MB
                                                </p>
                                            </label>
                                        </div>
                                    </div>

                                    <button className="btn btn-primary" style={{ width: 'fit-content' }}>
                                        <span className="material-symbols-rounded">save</span>
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'academic' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <span className="material-symbols-rounded">school</span>
                                    Academic Settings
                                </h3>
                            </div>
                            <div className="card-body">
                                <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Current Session</label>
                                            <input type="text" className="form-control" defaultValue="2025-26" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Session Start</label>
                                            <input type="date" className="form-control" defaultValue="2025-04-01" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Session End</label>
                                            <input type="date" className="form-control" defaultValue="2026-03-31" />
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ maxWidth: '300px' }}>
                                        <label className="form-label">Grading System</label>
                                        <select className="form-control">
                                            <option>Percentage Based</option>
                                            <option>CGPA Based</option>
                                            <option>Grade Based</option>
                                        </select>
                                    </div>

                                    <div className="form-group" style={{ maxWidth: '300px' }}>
                                        <label className="form-label">Promote Students Method</label>
                                        <select className="form-control">
                                            <option>Manual Promotion</option>
                                            <option>Auto Promote All</option>
                                            <option>Auto Based on Result</option>
                                        </select>
                                    </div>

                                    <button className="btn btn-primary" style={{ width: 'fit-content' }}>
                                        <span className="material-symbols-rounded">save</span>
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'backup' && (
                        <div style={{ display: 'grid', gap: 'var(--spacing-6)' }}>
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">
                                        <span className="material-symbols-rounded">backup</span>
                                        Backup & Restore
                                    </h3>
                                </div>
                                <div className="card-body">
                                    <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                                        <div
                                            style={{
                                                padding: 'var(--spacing-4)',
                                                background: 'var(--success-50)',
                                                borderRadius: 'var(--radius-lg)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-3)',
                                            }}
                                        >
                                            <span className="material-symbols-rounded" style={{ color: 'var(--success-600)' }}>check_circle</span>
                                            <div>
                                                <p style={{ fontWeight: 500, color: 'var(--success-700)' }}>Last Backup: Today, 10:30 AM</p>
                                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--success-600)' }}>All data is safely backed up</p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                                            <button className="btn btn-primary">
                                                <span className="material-symbols-rounded">backup</span>
                                                Create Backup Now
                                            </button>
                                            <button className="btn btn-secondary">
                                                <span className="material-symbols-rounded">restore</span>
                                                Restore from Backup
                                            </button>
                                            <button className="btn btn-secondary">
                                                <span className="material-symbols-rounded">download</span>
                                                Export All Data
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">
                                        <span className="material-symbols-rounded">delete_forever</span>
                                        Danger Zone
                                    </h3>
                                </div>
                                <div className="card-body">
                                    <div
                                        style={{
                                            padding: 'var(--spacing-4)',
                                            background: 'var(--error-50)',
                                            borderRadius: 'var(--radius-lg)',
                                            border: '1px solid var(--error-200)',
                                        }}
                                    >
                                        <h4 style={{ color: 'var(--error-700)', marginBottom: 'var(--spacing-2)' }}>Reset All Data</h4>
                                        <p style={{ color: 'var(--error-600)', marginBottom: 'var(--spacing-4)', fontSize: 'var(--font-size-sm)' }}>
                                            This will permanently delete all data including students, fees, attendance, and settings. This action cannot be undone.
                                        </p>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => setShowEraseModal(true)}
                                        >
                                            <span className="material-symbols-rounded">delete_forever</span>
                                            Erase All Data
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'fees' && (
                        <div style={{ display: 'grid', gap: 'var(--spacing-6)' }}>
                            {/* Payment Gateways Section */}
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">
                                        <span className="material-symbols-rounded">account_balance</span>
                                        Payment Gateways
                                    </h3>
                                </div>
                                <div className="card-body">
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-4)' }}>
                                        Connect payment gateways to collect fees online from students. Configure your preferred payment methods below.
                                    </p>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-4)' }}>
                                        {PAYMENT_GATEWAYS.map((gateway) => {
                                            const configured = isGatewayConfigured(gateway.id);
                                            const active = isGatewayActive(gateway.id);

                                            return (
                                                <div
                                                    key={gateway.id}
                                                    style={{
                                                        padding: 'var(--spacing-4)',
                                                        borderRadius: 'var(--radius-lg)',
                                                        border: `2px solid ${active ? gateway.color : 'var(--border-light)'}`,
                                                        background: active ? `${gateway.color}08` : 'var(--bg-primary)',
                                                        transition: 'all var(--transition-fast)',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                                                            <div
                                                                style={{
                                                                    width: '48px',
                                                                    height: '48px',
                                                                    borderRadius: 'var(--radius-lg)',
                                                                    background: `${gateway.color}15`,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontSize: '24px',
                                                                }}
                                                            >
                                                                {gateway.icon}
                                                            </div>
                                                            <div>
                                                                <h4 style={{ fontWeight: 600 }}>{gateway.name}</h4>
                                                                {configured ? (
                                                                    <span className={`badge ${active ? 'badge-success' : 'badge-neutral'}`}>
                                                                        {active ? 'Active' : 'Configured'}
                                                                    </span>
                                                                ) : (
                                                                    <span className="badge badge-warning">Not Configured</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {configured && (
                                                            <button
                                                                onClick={() => toggleGatewayActive(gateway.id)}
                                                                style={{
                                                                    width: '44px',
                                                                    height: '24px',
                                                                    borderRadius: '12px',
                                                                    border: 'none',
                                                                    background: active ? 'var(--success-500)' : 'var(--border-medium)',
                                                                    cursor: 'pointer',
                                                                    position: 'relative',
                                                                    transition: 'background var(--transition-fast)',
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        width: '20px',
                                                                        height: '20px',
                                                                        borderRadius: '50%',
                                                                        background: 'white',
                                                                        position: 'absolute',
                                                                        top: '2px',
                                                                        left: active ? '22px' : '2px',
                                                                        transition: 'left var(--transition-fast)',
                                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                                                    }}
                                                                />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-3)' }}>
                                                        {gateway.description}
                                                    </p>

                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        style={{ width: '100%' }}
                                                        onClick={() => openGatewayConfig(gateway.id)}
                                                    >
                                                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>
                                                            {configured ? 'edit' : 'add'}
                                                        </span>
                                                        {configured ? 'Edit Configuration' : 'Configure'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Fee Receipt Settings */}
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">
                                        <span className="material-symbols-rounded">receipt_long</span>
                                        Receipt Settings
                                    </h3>
                                </div>
                                <div className="card-body">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Receipt Prefix</label>
                                            <input type="text" className="form-control" defaultValue="RCP" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Late Fee per Day (₹)</label>
                                            <input type="number" className="form-control" defaultValue="50" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Max Late Fee Days</label>
                                            <input type="number" className="form-control" defaultValue="15" />
                                        </div>
                                    </div>
                                    <button className="btn btn-primary" style={{ marginTop: 'var(--spacing-4)' }}>
                                        <span className="material-symbols-rounded">save</span>
                                        Save Settings
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {['notifications', 'users'].includes(activeTab) && (
                        <div className="card">
                            <div className="empty-state" style={{ padding: 'var(--spacing-12)' }}>
                                <div className="empty-state-icon">
                                    <span className="material-symbols-rounded">{tabs.find(t => t.id === activeTab)?.icon}</span>
                                </div>
                                <h3 className="empty-state-title">{tabs.find(t => t.id === activeTab)?.label}</h3>
                                <p className="empty-state-text">
                                    Configure {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} settings here. Coming soon!
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Erase All Data Confirmation Modal */}
            {showEraseModal && (
                <div className="modal-overlay" onClick={closeEraseModal}>
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '500px' }}
                    >
                        <div className="modal-header" style={{ background: 'var(--error-50)', borderBottom: '1px solid var(--error-200)' }}>
                            <h2 className="modal-title" style={{ color: 'var(--error-700)' }}>
                                <span className="material-symbols-rounded">warning</span>
                                Erase All Data
                            </h2>
                            <button className="modal-close" onClick={closeEraseModal}>
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            {eraseStep === 1 && (
                                <div style={{ textAlign: 'center', padding: 'var(--spacing-4)' }}>
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'var(--error-100)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto var(--spacing-4)'
                                    }}>
                                        <span className="material-symbols-rounded" style={{ fontSize: '40px', color: 'var(--error-600)' }}>
                                            delete_forever
                                        </span>
                                    </div>
                                    <h3 style={{ marginBottom: 'var(--spacing-3)', color: 'var(--error-700)' }}>
                                        Are you sure you want to erase all data?
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-4)' }}>
                                        This will permanently delete:
                                    </p>
                                    <ul style={{
                                        textAlign: 'left',
                                        background: 'var(--error-50)',
                                        padding: 'var(--spacing-4)',
                                        borderRadius: 'var(--radius-lg)',
                                        marginBottom: 'var(--spacing-4)',
                                        listStyle: 'none'
                                    }}>
                                        <li style={{ padding: 'var(--spacing-2) 0', color: 'var(--error-700)' }}>
                                            ❌ All Students & Staff records
                                        </li>
                                        <li style={{ padding: 'var(--spacing-2) 0', color: 'var(--error-700)' }}>
                                            ❌ All Fee transactions & structures
                                        </li>
                                        <li style={{ padding: 'var(--spacing-2) 0', color: 'var(--error-700)' }}>
                                            ❌ All Attendance records
                                        </li>
                                        <li style={{ padding: 'var(--spacing-2) 0', color: 'var(--error-700)' }}>
                                            ❌ All Exam results & schedules
                                        </li>
                                        <li style={{ padding: 'var(--spacing-2) 0', color: 'var(--error-700)' }}>
                                            ❌ All Notices & messages
                                        </li>
                                    </ul>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'center' }}>
                                        <button className="btn btn-secondary" onClick={closeEraseModal}>
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => setEraseStep(2)}
                                        >
                                            I understand, continue
                                        </button>
                                    </div>
                                </div>
                            )}

                            {eraseStep === 2 && (
                                <div style={{ padding: 'var(--spacing-4)' }}>
                                    <div style={{
                                        background: 'var(--warning-50)',
                                        padding: 'var(--spacing-4)',
                                        borderRadius: 'var(--radius-lg)',
                                        marginBottom: 'var(--spacing-4)',
                                        border: '1px solid var(--warning-200)'
                                    }}>
                                        <h4 style={{ color: 'var(--warning-700)', marginBottom: 'var(--spacing-2)' }}>
                                            ⚠️ Final Confirmation Required
                                        </h4>
                                        <p style={{ color: 'var(--warning-600)', fontSize: 'var(--font-size-sm)' }}>
                                            This action is <strong>irreversible</strong>. Once erased, your data cannot be recovered.
                                        </p>
                                    </div>

                                    <div style={{ marginBottom: 'var(--spacing-4)' }}>
                                        <label style={{ display: 'block', marginBottom: 'var(--spacing-2)', fontWeight: 500 }}>
                                            Type <strong style={{ color: 'var(--error-600)' }}>{CONFIRM_PHRASE}</strong> to confirm:
                                        </label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={confirmText}
                                            onChange={(e) => setConfirmText(e.target.value)}
                                            placeholder="Type the confirmation phrase..."
                                            style={{
                                                width: '100%',
                                                borderColor: confirmText === CONFIRM_PHRASE ? 'var(--success-500)' : 'var(--border-medium)'
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
                                        <button className="btn btn-secondary" onClick={() => setEraseStep(1)}>
                                            Go Back
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={handleEraseAllData}
                                            disabled={confirmText !== CONFIRM_PHRASE || erasing}
                                            style={{
                                                opacity: confirmText !== CONFIRM_PHRASE ? 0.5 : 1,
                                                cursor: confirmText !== CONFIRM_PHRASE ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {erasing ? (
                                                <>
                                                    <span className="material-symbols-rounded" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span>
                                                    Erasing...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-rounded">delete_forever</span>
                                                    Erase All Data Permanently
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Gateway Configuration Modal */}
            {showGatewayModal && selectedGateway && (
                <div className="modal-overlay" onClick={() => setShowGatewayModal(false)}>
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '550px' }}
                    >
                        <div className="modal-header">
                            <h2 className="modal-title">
                                <span style={{ fontSize: '24px', marginRight: '8px' }}>
                                    {PAYMENT_GATEWAYS.find(g => g.id === selectedGateway)?.icon}
                                </span>
                                Configure {PAYMENT_GATEWAYS.find(g => g.id === selectedGateway)?.name}
                            </h2>
                            <button className="modal-close" onClick={() => setShowGatewayModal(false)}>
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            {/* Test Mode Toggle */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 'var(--spacing-3)',
                                background: gatewayFormData.isTestMode ? 'var(--warning-50)' : 'var(--success-50)',
                                borderRadius: 'var(--radius-lg)',
                                marginBottom: 'var(--spacing-4)',
                            }}>
                                <div>
                                    <p style={{ fontWeight: 600, color: gatewayFormData.isTestMode ? 'var(--warning-700)' : 'var(--success-700)' }}>
                                        {gatewayFormData.isTestMode ? '🧪 Test Mode' : '🚀 Production Mode'}
                                    </p>
                                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                        {gatewayFormData.isTestMode ? 'Use test credentials for development' : 'Using live credentials'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setGatewayFormData(prev => ({ ...prev, isTestMode: !prev.isTestMode }))}
                                    style={{
                                        width: '44px',
                                        height: '24px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: gatewayFormData.isTestMode ? 'var(--warning-500)' : 'var(--success-500)',
                                        cursor: 'pointer',
                                        position: 'relative',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            background: 'white',
                                            position: 'absolute',
                                            top: '2px',
                                            left: gatewayFormData.isTestMode ? '2px' : '22px',
                                            transition: 'left var(--transition-fast)',
                                        }}
                                    />
                                </button>
                            </div>

                            {/* Gateway-specific fields */}
                            {selectedGateway === 'razorpay' && (
                                <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label required">Razorpay Key ID</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="rzp_test_xxxxxxxxxxxxx"
                                            value={gatewayFormData.razorpayKeyId || ''}
                                            onChange={(e) => setGatewayFormData(prev => ({ ...prev, razorpayKeyId: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">Razorpay Key Secret</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Enter your key secret"
                                            value={gatewayFormData.razorpayKeySecret || ''}
                                            onChange={(e) => setGatewayFormData(prev => ({ ...prev, razorpayKeySecret: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedGateway === 'phonepe' && (
                                <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label required">Merchant ID</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter PhonePe Merchant ID"
                                            value={gatewayFormData.phonepeMerchantId || ''}
                                            onChange={(e) => setGatewayFormData(prev => ({ ...prev, phonepeMerchantId: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">API Key</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Enter API Key"
                                            value={gatewayFormData.phonepeApiKey || ''}
                                            onChange={(e) => setGatewayFormData(prev => ({ ...prev, phonepeApiKey: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Salt Key</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Salt Key"
                                                value={gatewayFormData.phonepeSaltKey || ''}
                                                onChange={(e) => setGatewayFormData(prev => ({ ...prev, phonepeSaltKey: e.target.value }))}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Salt Index</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="1"
                                                value={gatewayFormData.phonepeSaltIndex || ''}
                                                onChange={(e) => setGatewayFormData(prev => ({ ...prev, phonepeSaltIndex: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedGateway === 'paytm' && (
                                <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label required">Merchant ID (MID)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter Paytm MID"
                                            value={gatewayFormData.paytmMid || ''}
                                            onChange={(e) => setGatewayFormData(prev => ({ ...prev, paytmMid: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">Merchant Key</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Enter Merchant Key"
                                            value={gatewayFormData.paytmMerchantKey || ''}
                                            onChange={(e) => setGatewayFormData(prev => ({ ...prev, paytmMerchantKey: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedGateway === 'stripe' && (
                                <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label required">Publishable Key</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="pk_test_xxxxxxxxxxxxx"
                                            value={gatewayFormData.stripePublishableKey || ''}
                                            onChange={(e) => setGatewayFormData(prev => ({ ...prev, stripePublishableKey: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">Secret Key</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="sk_test_xxxxxxxxxxxxx"
                                            value={gatewayFormData.stripeSecretKey || ''}
                                            onChange={(e) => setGatewayFormData(prev => ({ ...prev, stripeSecretKey: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedGateway === 'upi_direct' && (
                                <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                                    <div style={{
                                        padding: 'var(--spacing-3)',
                                        background: 'var(--primary-50)',
                                        borderRadius: 'var(--radius-lg)',
                                    }}>
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--primary-700)' }}>
                                            💡 UPI Direct allows you to receive payments directly to your UPI ID without any gateway fees.
                                        </p>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">UPI ID</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="yourname@upi or yourname@paytm"
                                            value={gatewayFormData.upiId || ''}
                                            onChange={(e) => setGatewayFormData(prev => ({ ...prev, upiId: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Merchant/Institute Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Your Institute Name"
                                            value={gatewayFormData.merchantName || ''}
                                            onChange={(e) => setGatewayFormData(prev => ({ ...prev, merchantName: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Enable gateway toggle */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-3)',
                                marginTop: 'var(--spacing-4)',
                                padding: 'var(--spacing-3)',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-lg)',
                            }}>
                                <input
                                    type="checkbox"
                                    id="gatewayActive"
                                    checked={gatewayFormData.isActive || false}
                                    onChange={(e) => setGatewayFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <label htmlFor="gatewayActive" style={{ cursor: 'pointer' }}>
                                    <strong>Enable this payment gateway</strong>
                                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                        Students will be able to pay using this gateway
                                    </p>
                                </label>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowGatewayModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={saveGatewayConfig}
                                disabled={savingGateway}
                            >
                                {savingGateway ? (
                                    <>
                                        <span className="material-symbols-rounded" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-rounded">save</span>
                                        Save Configuration
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
