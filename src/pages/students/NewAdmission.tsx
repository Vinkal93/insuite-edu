import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, generateStudentId, syncStudent } from '../../db/database';
import type { Class, Gender } from '../../types';
import { generatePassword, sendWelcomeEmail, getStudentLoginUrl, getWelcomeMessage, type EmailSettings } from '../../utils/emailService';

interface FormData {
    // Personal Info
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: Gender;
    bloodGroup: string;

    // Contact Info
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;

    // Parent Info
    fatherName: string;
    fatherPhone: string;
    fatherOccupation: string;
    motherName: string;
    motherPhone: string;

    // Academic Info
    classId: string;
    previousSchool: string;

    // Photo
    photo: string;
}

const initialFormData: FormData = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    bloodGroup: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    fatherName: '',
    fatherPhone: '',
    fatherOccupation: '',
    motherName: '',
    motherPhone: '',
    classId: '',
    previousSchool: '',
    photo: '',
};

const steps = [
    { id: 1, title: 'Personal Info', icon: 'person' },
    { id: 2, title: 'Contact', icon: 'location_on' },
    { id: 3, title: 'Parent/Guardian', icon: 'family_restroom' },
    { id: 4, title: 'Academic', icon: 'school' },
    { id: 5, title: 'Photo & Submit', icon: 'photo_camera' },
];

export default function NewAdmission() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Partial<FormData>>({});

    // Credentials modal state
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [newStudentCredentials, setNewStudentCredentials] = useState<{
        studentId: string;
        password: string;
        studentName: string;
        email: string;
    } | null>(null);

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        const allClasses = await db.classes.toArray();
        setClasses(allClasses);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when field is edited
        if (errors[name as keyof FormData]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const validateStep = (step: number): boolean => {
        const newErrors: Partial<FormData> = {};

        switch (step) {
            case 1:
                if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
                if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
                if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
                break;
            case 2:
                if (!formData.address.trim()) newErrors.address = 'Address is required';
                break;
            case 3:
                if (!formData.fatherName.trim()) newErrors.fatherName = 'Father\'s name is required';
                if (!formData.fatherPhone.trim()) newErrors.fatherPhone = 'Father\'s phone is required';
                else if (!/^\d{10}$/.test(formData.fatherPhone)) newErrors.fatherPhone = 'Enter valid 10-digit phone';
                break;
            case 4:
                if (!formData.classId) newErrors.classId = 'Please select a class';
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length));
        }
    };

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        setLoading(true);
        try {
            const studentId = await generateStudentId();
            const password = generatePassword(8);
            const studentName = `${formData.firstName} ${formData.lastName}`;

            const studentData = {
                studentId,
                firstName: formData.firstName,
                lastName: formData.lastName,
                dateOfBirth: new Date(formData.dateOfBirth),
                gender: formData.gender,
                bloodGroup: formData.bloodGroup || undefined,
                phone: formData.phone || undefined,
                email: formData.email || undefined,
                address: formData.address,
                city: formData.city || undefined,
                state: formData.state || undefined,
                pincode: formData.pincode || undefined,
                photo: formData.photo || undefined,
                classId: parseInt(formData.classId),
                admissionDate: new Date(),
                fatherName: formData.fatherName,
                fatherPhone: formData.fatherPhone,
                fatherOccupation: formData.fatherOccupation || undefined,
                motherName: formData.motherName || undefined,
                motherPhone: formData.motherPhone || undefined,
                previousSchool: formData.previousSchool || undefined,
                password: password,
                status: 'active' as const,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const newStudentId = await db.students.add(studentData);

            // Immediately sync the new student to Firebase
            try {
                await syncStudent({ ...studentData, id: newStudentId });
                console.log('✅ New student synced to Firebase');
            } catch (syncError) {
                console.error('Sync failed, will retry later:', syncError);
            }

            // Store credentials to show in modal
            setNewStudentCredentials({
                studentId,
                password,
                studentName,
                email: formData.email,
            });

            // Try to send welcome email if email is provided
            if (formData.email) {
                const loginUrl = getStudentLoginUrl();
                // Get email settings from app settings
                const appSettings = await db.appSettings.toCollection().first();
                const emailSettings: EmailSettings = {
                    serviceId: (appSettings as any)?.emailjsServiceId || '',
                    templateId: (appSettings as any)?.emailjsTemplateId || '',
                    publicKey: (appSettings as any)?.emailjsPublicKey || '',
                    enabled: (appSettings as any)?.welcomeEmailEnabled || false,
                };

                await sendWelcomeEmail(
                    {
                        studentName,
                        studentEmail: formData.email,
                        studentId,
                        password,
                        loginUrl,
                    },
                    emailSettings
                );
            }

            // Show credentials modal
            setShowCredentialsModal(true);
        } catch (error) {
            console.error('Error adding student:', error);
            alert('Failed to add student. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Copy to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    // Share on WhatsApp
    const shareOnWhatsApp = () => {
        if (!newStudentCredentials) return;
        const message = getWelcomeMessage({
            studentName: newStudentCredentials.studentName,
            studentEmail: newStudentCredentials.email,
            studentId: newStudentCredentials.studentId,
            password: newStudentCredentials.password,
            loginUrl: getStudentLoginUrl(),
        });
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
    };

    // Close modal and navigate
    const handleCloseCredentials = () => {
        setShowCredentialsModal(false);
        navigate('/students', { state: { message: 'Student admitted successfully!' } });
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="step-content animate-fade-in">
                        <h3 style={{ marginBottom: 'var(--spacing-6)', color: 'var(--text-primary)' }}>
                            Personal Information
                        </h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label required">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    className={`form-control ${errors.firstName ? 'error' : ''}`}
                                    placeholder="Enter first name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    autoFocus
                                />
                                {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label required">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    className={`form-control ${errors.lastName ? 'error' : ''}`}
                                    placeholder="Enter last name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                />
                                {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label required">Date of Birth</label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    className={`form-control ${errors.dateOfBirth ? 'error' : ''}`}
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                />
                                {errors.dateOfBirth && <span className="form-error">{errors.dateOfBirth}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label required">Gender</label>
                                <select
                                    name="gender"
                                    className="form-control"
                                    value={formData.gender}
                                    onChange={handleChange}
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Blood Group</label>
                                <select
                                    name="bloodGroup"
                                    className="form-control"
                                    value={formData.bloodGroup}
                                    onChange={handleChange}
                                >
                                    <option value="">Select</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="step-content animate-fade-in">
                        <h3 style={{ marginBottom: 'var(--spacing-6)', color: 'var(--text-primary)' }}>
                            Contact Information
                        </h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-control"
                                    placeholder="Enter phone number"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-control"
                                    placeholder="Enter email address"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Address</label>
                            <textarea
                                name="address"
                                className={`form-control ${errors.address ? 'error' : ''}`}
                                placeholder="Enter complete address"
                                value={formData.address}
                                onChange={handleChange}
                                rows={3}
                            />
                            {errors.address && <span className="form-error">{errors.address}</span>}
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    className="form-control"
                                    placeholder="Enter city"
                                    value={formData.city}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    className="form-control"
                                    placeholder="Enter state"
                                    value={formData.state}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Pincode</label>
                                <input
                                    type="text"
                                    name="pincode"
                                    className="form-control"
                                    placeholder="Enter pincode"
                                    value={formData.pincode}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="step-content animate-fade-in">
                        <h3 style={{ marginBottom: 'var(--spacing-6)', color: 'var(--text-primary)' }}>
                            Parent / Guardian Information
                        </h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label required">Father's Name</label>
                                <input
                                    type="text"
                                    name="fatherName"
                                    className={`form-control ${errors.fatherName ? 'error' : ''}`}
                                    placeholder="Enter father's name"
                                    value={formData.fatherName}
                                    onChange={handleChange}
                                />
                                {errors.fatherName && <span className="form-error">{errors.fatherName}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label required">Father's Phone</label>
                                <input
                                    type="tel"
                                    name="fatherPhone"
                                    className={`form-control ${errors.fatherPhone ? 'error' : ''}`}
                                    placeholder="Enter 10-digit phone"
                                    value={formData.fatherPhone}
                                    onChange={handleChange}
                                    maxLength={10}
                                />
                                {errors.fatherPhone && <span className="form-error">{errors.fatherPhone}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Father's Occupation</label>
                                <input
                                    type="text"
                                    name="fatherOccupation"
                                    className="form-control"
                                    placeholder="Enter occupation"
                                    value={formData.fatherOccupation}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Mother's Name</label>
                                <input
                                    type="text"
                                    name="motherName"
                                    className="form-control"
                                    placeholder="Enter mother's name"
                                    value={formData.motherName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Mother's Phone</label>
                                <input
                                    type="tel"
                                    name="motherPhone"
                                    className="form-control"
                                    placeholder="Enter phone number"
                                    value={formData.motherPhone}
                                    onChange={handleChange}
                                    maxLength={10}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="step-content animate-fade-in">
                        <h3 style={{ marginBottom: 'var(--spacing-6)', color: 'var(--text-primary)' }}>
                            Academic Information
                        </h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label required">Select Class</label>
                                <select
                                    name="classId"
                                    className={`form-control ${errors.classId ? 'error' : ''}`}
                                    value={formData.classId}
                                    onChange={handleChange}
                                >
                                    <option value="">Choose a class</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                                {errors.classId && <span className="form-error">{errors.classId}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Previous School</label>
                                <input
                                    type="text"
                                    name="previousSchool"
                                    className="form-control"
                                    placeholder="Enter previous school name"
                                    value={formData.previousSchool}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="step-content animate-fade-in">
                        <h3 style={{ marginBottom: 'var(--spacing-6)', color: 'var(--text-primary)' }}>
                            Upload Photo & Submit
                        </h3>
                        <div className="form-group">
                            <label className="form-label">Student Photo</label>
                            <div className="file-upload">
                                <input
                                    type="file"
                                    id="photo"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="photo" style={{ cursor: 'pointer', display: 'block' }}>
                                    {formData.photo ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                                            <img
                                                src={formData.photo}
                                                alt="Preview"
                                                style={{
                                                    width: '120px',
                                                    height: '120px',
                                                    objectFit: 'cover',
                                                    borderRadius: 'var(--radius-lg)'
                                                }}
                                            />
                                            <div>
                                                <p style={{ color: 'var(--success-600)', fontWeight: 600 }}>Photo uploaded!</p>
                                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>
                                                    Click to change
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="file-upload-icon">
                                                <span className="material-symbols-rounded">cloud_upload</span>
                                            </div>
                                            <p className="file-upload-text">
                                                <strong>Click to upload</strong> or drag and drop
                                            </p>
                                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                                                PNG, JPG up to 2MB
                                            </p>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="card" style={{ marginTop: 'var(--spacing-6)' }}>
                            <div className="card-header">
                                <h4 className="card-title">
                                    <span className="material-symbols-rounded">summarize</span>
                                    Review Information
                                </h4>
                            </div>
                            <div className="card-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Name</p>
                                        <p style={{ fontWeight: 600 }}>{formData.firstName} {formData.lastName}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Class</p>
                                        <p style={{ fontWeight: 600 }}>{classes.find(c => c.id === parseInt(formData.classId))?.name || '-'}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Father's Name</p>
                                        <p style={{ fontWeight: 600 }}>{formData.fatherName}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Contact</p>
                                        <p style={{ fontWeight: 600 }}>{formData.fatherPhone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="card">
                <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                    <h2 className="card-title" style={{ fontSize: 'var(--font-size-xl)' }}>
                        <span className="material-symbols-rounded">person_add</span>
                        New Student Admission
                    </h2>
                </div>
                <div className="card-body">
                    {/* Stepper */}
                    <div className="stepper">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={`step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                            >
                                <div className="step-number">
                                    {currentStep > step.id ? (
                                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>check</span>
                                    ) : (
                                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>{step.icon}</span>
                                    )}
                                </div>
                                <span className="step-label">{step.title}</span>
                            </div>
                        ))}
                    </div>

                    {/* Step Content */}
                    {renderStepContent()}

                    {/* Actions */}
                    <div className="step-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handlePrev}
                            disabled={currentStep === 1}
                        >
                            <span className="material-symbols-rounded">arrow_back</span>
                            Previous
                        </button>

                        {currentStep < steps.length ? (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleNext}
                            >
                                Next
                                <span className="material-symbols-rounded">arrow_forward</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="material-symbols-rounded" style={{ animation: 'pulse 1s infinite' }}>
                                            progress_activity
                                        </span>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-rounded">check_circle</span>
                                        Submit Admission
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Student Credentials Modal */}
            {showCredentialsModal && newStudentCredentials && (
                <div className="modal-overlay" onClick={handleCloseCredentials}>
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '450px' }}
                    >
                        <div className="modal-header" style={{ background: 'var(--success-50)', borderBottom: '1px solid var(--success-200)' }}>
                            <h2 className="modal-title" style={{ color: 'var(--success-700)' }}>
                                <span className="material-symbols-rounded">check_circle</span>
                                Admission Successful!
                            </h2>
                        </div>
                        <div className="modal-body">
                            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'var(--success-100)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto var(--spacing-4)'
                                }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '40px', color: 'var(--success-600)' }}>
                                        person_add
                                    </span>
                                </div>
                                <h3 style={{ marginBottom: 'var(--spacing-2)' }}>{newStudentCredentials.studentName}</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>has been successfully admitted!</p>
                            </div>

                            <div style={{
                                background: 'var(--bg-secondary)',
                                padding: 'var(--spacing-4)',
                                borderRadius: 'var(--radius-lg)',
                                marginBottom: 'var(--spacing-4)'
                            }}>
                                <h4 style={{ marginBottom: 'var(--spacing-3)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--primary-500)' }}>key</span>
                                    Login Credentials
                                </h4>

                                {/* Student ID */}
                                <div style={{ marginBottom: 'var(--spacing-3)' }}>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Student ID</p>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-2)',
                                        background: 'var(--bg-primary)',
                                        padding: 'var(--spacing-3)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-light)'
                                    }}>
                                        <code style={{ flex: 1, fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-600)' }}>
                                            {newStudentCredentials.studentId}
                                        </code>
                                        <button
                                            className="btn btn-sm"
                                            style={{ padding: '4px 8px', minWidth: 'auto' }}
                                            onClick={() => copyToClipboard(newStudentCredentials.studentId)}
                                        >
                                            <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>content_copy</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Password</p>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-2)',
                                        background: 'var(--bg-primary)',
                                        padding: 'var(--spacing-3)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-light)'
                                    }}>
                                        <code style={{ flex: 1, fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {newStudentCredentials.password}
                                        </code>
                                        <button
                                            className="btn btn-sm"
                                            style={{ padding: '4px 8px', minWidth: 'auto' }}
                                            onClick={() => copyToClipboard(newStudentCredentials.password)}
                                        >
                                            <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>content_copy</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                padding: 'var(--spacing-3)',
                                background: 'var(--primary-50)',
                                borderRadius: 'var(--radius-lg)',
                                marginBottom: 'var(--spacing-4)'
                            }}>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--primary-700)' }}>
                                    💡 Share these credentials with the student or parent. They can use them to login to the Student Portal.
                                </p>
                            </div>

                            {/* Share buttons */}
                            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                                <button
                                    className="btn btn-secondary"
                                    style={{ flex: 1 }}
                                    onClick={() => {
                                        copyToClipboard(`Student ID: ${newStudentCredentials.studentId}\nPassword: ${newStudentCredentials.password}\nLogin: ${getStudentLoginUrl()}`);
                                        alert('Credentials copied to clipboard!');
                                    }}
                                >
                                    <span className="material-symbols-rounded">content_copy</span>
                                    Copy All
                                </button>
                                <button
                                    className="btn"
                                    style={{ flex: 1, background: '#25D366', color: 'white' }}
                                    onClick={shareOnWhatsApp}
                                >
                                    <span className="material-symbols-rounded">chat</span>
                                    WhatsApp
                                </button>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={handleCloseCredentials}>
                                <span className="material-symbols-rounded">done</span>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
