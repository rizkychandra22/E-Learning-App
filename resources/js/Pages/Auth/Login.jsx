import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

const Login = () => {
    const { props } = usePage();
    const system = props.system ?? {};
    const flash = props.flash ?? {};
    const isEnglish = system.default_language === 'en';
    const platformName = system.platform_name ?? 'Smart Learning';
    const allowRegistration = !!system.allow_registration;
    const maintenanceMode = !!system.maintenance_mode;

    const { data, setData, post, processing, errors, setError, clearErrors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        clearErrors();

        let hasError = false;
        if (!data.email.trim()) {
            setError('email', 'Email / NIM wajib diisi.');
            hasError = true;
        }

        if (!data.password) {
            setError('password', 'Password wajib diisi.');
            hasError = true;
        }

        if (hasError) {
            return;
        }

        post('/login');
    };

    return (
        <div className="vh-100 d-flex align-items-center bg-light">
            <Head title="Login" />
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-10 col-lg-8">
                        <div className="card border-0 shadow-lg overflow-hidden" style={{ borderRadius: '20px' }}>
                            <div className="row g-0">
                                <div className="col-md-6 bg-primary d-none d-md-flex align-items-center justify-content-center text-white p-5">
                                    <div className="text-center">
                                        <i className="bi bi-mortarboard-fill" style={{ fontSize: '5rem' }}></i>
                                        <h2 className="fw-bold mt-3">{platformName}</h2>
                                        <p className="opacity-75">
                                            {isEnglish
                                                ? 'Integrated digital learning platform for a better future.'
                                                : 'Platform pembelajaran digital terpadu untuk masa depan yang lebih cerah.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="col-md-6 bg-white p-4 p-lg-5">
                                    <h3 className="fw-bold text-dark mb-2">{isEnglish ? 'Welcome Back' : 'Selamat Datang'}</h3>
                                    <p className="text-muted mb-4">{isEnglish ? 'Please sign in to continue' : 'Silakan masuk ke akun Anda'}</p>

                                    {maintenanceMode && (
                                        <div className="alert alert-warning small py-2" role="alert">
                                            {isEnglish
                                                ? 'Maintenance mode is active. Only Super Admin can access the system.'
                                                : 'Mode maintenance aktif. Saat ini hanya Super Admin yang bisa mengakses sistem.'}
                                        </div>
                                    )}
                                    {(errors.session || errors.loginAkses || errors.register || errors.email) && (
                                        <div className="alert alert-danger small py-2" role="alert">
                                            {errors.session || errors.loginAkses || errors.register || errors.email}
                                        </div>
                                    )}
                                    {flash.success && (
                                        <div className="alert alert-success small py-2" role="alert">
                                            {flash.success}
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} className="text-start">
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">{isEnglish ? 'Email / Username / Code' : 'Email / NIM'}</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0"><i className="bi bi-person text-muted"></i></span>
                                                <input
                                                    type="text"
                                                    className={`form-control bg-light border-start-0 ${errors.email ? 'is-invalid' : ''}`}
                                                    placeholder="nama@kampus.ac.id"
                                                    value={data.email}
                                                    onChange={e => setData('email', e.target.value)}
                                                />
                                                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Password</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0"><i className="bi bi-lock text-muted"></i></span>
                                                <input
                                                    type="password"
                                                    className={`form-control bg-light border-start-0 ${errors.password ? 'is-invalid' : ''}`}
                                                    placeholder="••••••••"
                                                    value={data.password}
                                                    onChange={e => setData('password', e.target.value)}
                                                />
                                                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-between mb-4">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="remember"
                                                    checked={data.remember}
                                                    onChange={e => setData('remember', e.target.checked)}
                                                />
                                                <label className="form-check-label small" htmlFor="remember">Ingat Saya</label>
                                            </div>
                                            <Link href="#" className="small text-decoration-none">Lupa Password?</Link>
                                        </div>

                                        <button
                                            type="submit"
                                            className="btn btn-primary w-100 py-2 fw-bold shadow-sm"
                                            disabled={processing}
                                        >
                                            {processing ? (isEnglish ? 'Signing in...' : 'Logging in...') : (isEnglish ? 'Sign In' : 'Masuk')}
                                        </button>
                                    </form>

                                    {allowRegistration && !maintenanceMode && (
                                        <div className="text-center mt-3 text-muted small">
                                            {isEnglish ? "Don't have an account?" : 'Belum punya akun?'}{' '}
                                            <Link href="/register" className="fw-bold text-primary text-decoration-none">
                                                {isEnglish ? 'Register' : 'Daftar'}
                                            </Link>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
