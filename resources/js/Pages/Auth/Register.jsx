import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

const Register = () => {
    const { props } = usePage();
    const system = props.system ?? {};
    const isEnglish = system.default_language === 'en';
    const platformName = system.platform_name ?? 'Smart Learning';

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'student',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <div className="min-h-screen d-flex align-items-center position-relative overflow-hidden bg-gradient-to-br from-success/15 via-background to-accent/20">
            <Head title={isEnglish ? 'Register' : 'Daftar Akun'} />
            <div className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none">
                <div className="position-absolute top-0 start-0 rounded-circle" style={{ width: '22rem', height: '22rem', background: 'hsl(var(--success) / 0.14)', filter: 'blur(74px)', transform: 'translate(-30%, -35%)' }} />
                <div className="position-absolute bottom-0 end-0 rounded-circle" style={{ width: '24rem', height: '24rem', background: 'hsl(var(--accent-foreground) / 0.10)', filter: 'blur(80px)', transform: 'translate(32%, 28%)' }} />
            </div>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-10 col-lg-9">
                        <div className="card border-0 shadow-lg overflow-hidden position-relative" style={{ borderRadius: '20px', background: 'hsl(var(--card) / 0.94)', backdropFilter: 'blur(6px)' }}>
                            <div className="row g-0">
                                <div className="col-md-6 bg-white p-4 p-lg-5">
                                    <h3 className="fw-bold text-dark mb-2 text-start">{isEnglish ? 'Create Account' : 'Mulai Belajar'}</h3>
                                    <p className="text-muted mb-4 text-start">
                                        {isEnglish
                                            ? 'Complete your profile to create a new account.'
                                            : 'Lengkapi data diri untuk membuat akun baru.'}
                                    </p>

                                    <form onSubmit={handleSubmit} className="text-start">
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Nama Lengkap</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0"><i className="bi bi-person-badge text-muted"></i></span>
                                                <input
                                                    type="text"
                                                    className={`form-control bg-light border-start-0 ${errors.name ? 'is-invalid' : ''}`}
                                                    placeholder="Nama sesuai identitas"
                                                    value={data.name}
                                                    onChange={e => setData('name', e.target.value)}
                                                />
                                            </div>
                                            {errors.name && <small className="text-danger">{errors.name}</small>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Username</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0"><i className="bi bi-at text-muted"></i></span>
                                                <input
                                                    type="text"
                                                    className={`form-control bg-light border-start-0 ${errors.username ? 'is-invalid' : ''}`}
                                                    placeholder="username_anda"
                                                    value={data.username}
                                                    onChange={e => setData('username', e.target.value)}
                                                />
                                            </div>
                                            {errors.username && <small className="text-danger">{errors.username}</small>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Email Institusi</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0"><i className="bi bi-envelope text-muted"></i></span>
                                                <input
                                                    type="email"
                                                    className={`form-control bg-light border-start-0 ${errors.email ? 'is-invalid' : ''}`}
                                                    placeholder="nama@kampus.ac.id"
                                                    value={data.email}
                                                    onChange={e => setData('email', e.target.value)}
                                                />
                                            </div>
                                            {errors.email && <small className="text-danger">{errors.email}</small>}
                                        </div>

                                        <div className="mb-4">
                                            <label className="form-label fw-semibold">Password</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0"><i className="bi bi-shield-lock text-muted"></i></span>
                                                <input
                                                    type="password"
                                                    className={`form-control bg-light border-start-0 ${errors.password ? 'is-invalid' : ''}`}
                                                    placeholder="••••••••"
                                                    value={data.password}
                                                    onChange={e => setData('password', e.target.value)}
                                                />
                                            </div>
                                            {errors.password && <small className="text-danger">{errors.password}</small>}
                                        </div>

                                        <button
                                            type="submit"
                                            className="btn w-100 py-2 fw-bold text-white shadow-sm mt-2 border-0 gradient-success"
                                            style={{ borderRadius: '10px' }}
                                            disabled={processing}
                                        >
                                            {processing ? (isEnglish ? 'Processing...' : 'Sedang Memproses...') : (isEnglish ? 'Register Now' : 'Daftar Sekarang')}
                                        </button>
                                    </form>

                                    <div className="text-center mt-4 text-muted small">
                                        {isEnglish ? 'Already have an account?' : 'Sudah punya akun?'}{' '}
                                        <Link href="/login" className="fw-bold text-success text-decoration-none">
                                            {isEnglish ? 'Sign In' : 'Login Masuk'}
                                        </Link>
                                    </div>
                                </div>

                                <div className="col-md-6 gradient-success d-none d-md-flex align-items-center justify-content-center text-white p-5 text-center position-relative">
                                    <div className="position-absolute top-0 end-0 rounded-circle" style={{ width: '11rem', height: '11rem', background: 'hsl(var(--warning) / 0.24)', filter: 'blur(36px)', transform: 'translate(20%, -20%)' }} />
                                    <div className="position-absolute bottom-0 start-0 rounded-circle" style={{ width: '10rem', height: '10rem', background: 'hsl(var(--info) / 0.28)', filter: 'blur(34px)', transform: 'translate(-20%, 24%)' }} />
                                    <div>
                                        <i className="bi bi-journal-check" style={{ fontSize: '5rem' }}></i>
                                        <h2 className="fw-bold mt-3">{platformName}</h2>
                                        <p className="opacity-75">
                                            {isEnglish
                                                ? 'Join now and get access to thousands of learning resources.'
                                                : 'Dapatkan akses ke ribuan materi kuliah dan diskusikan dengan para pakar di bidangnya.'}
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
