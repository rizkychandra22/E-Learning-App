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
        <div className="min-h-screen d-flex align-items-center position-relative overflow-hidden bg-gradient-to-br from-primary/15 via-background to-accent/20">
            <Head title="Login" />
            <div className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none">
                <div className="position-absolute top-0 start-0 rounded-circle" style={{ width: '22rem', height: '22rem', background: 'hsl(var(--primary) / 0.12)', filter: 'blur(70px)', transform: 'translate(-30%, -35%)' }} />
                <div className="position-absolute bottom-0 end-0 rounded-circle" style={{ width: '24rem', height: '24rem', background: 'hsl(var(--accent-foreground) / 0.10)', filter: 'blur(80px)', transform: 'translate(32%, 28%)' }} />
            </div>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-10 col-lg-8">
                        <div className="card border-0 shadow-lg overflow-hidden position-relative" style={{ borderRadius: '20px', background: 'hsl(var(--card) / 0.94)', backdropFilter: 'blur(6px)' }}>
                            <div className="row g-0">
                                <div className="col-md-6 gradient-primary d-none d-md-flex align-items-center justify-content-center text-white p-5 position-relative">
                                    <div className="position-absolute top-0 end-0 rounded-circle" style={{ width: '11rem', height: '11rem', background: 'hsl(var(--warning) / 0.25)', filter: 'blur(36px)', transform: 'translate(20%, -20%)' }} />
                                    <div className="position-absolute bottom-0 start-0 rounded-circle" style={{ width: '10rem', height: '10rem', background: 'hsl(var(--info) / 0.3)', filter: 'blur(34px)', transform: 'translate(-20%, 24%)' }} />
                                    <div className="text-center">
                                        <i className="bi bi-mortarboard-fill" style={{ fontSize: '5rem' }}></i>
                                        <h2 className="fw-bold mt-3 mb-3" style={{ fontSize: '2.1rem', lineHeight: 1.2 }}>{platformName}</h2>
                                        <p className="opacity-75 mb-0" style={{ fontSize: '1.1rem', lineHeight: 1.45 }}>
                                            {isEnglish
                                                ? 'Integrated digital learning platform for a better future.'
                                                : 'Platform pembelajaran digital terpadu untuk masa depan yang lebih cerah.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="col-md-6 bg-white p-4 p-lg-5">
                                    <h3 className="fw-bold text-dark mb-2" style={{ fontSize: '2rem', lineHeight: 1.2 }}>{isEnglish ? 'Welcome Back' : 'Selamat Datang'}</h3>
                                    <p className="text-muted mb-4" style={{ fontSize: '1.15rem' }}>{isEnglish ? 'Please sign in to continue' : 'Silakan masuk ke akun Anda'}</p>

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
                                            <label className="form-label fw-semibold mb-2" style={{ fontSize: '1rem' }}>{isEnglish ? 'Email / Username / Code' : 'Email / NIM'}</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0 py-2.5"><i className="bi bi-person text-muted" style={{ fontSize: '1rem' }}></i></span>
                                                <input
                                                    type="text"
                                                    className={`form-control bg-light border-start-0 py-2.5 ${errors.email ? 'is-invalid' : ''}`}
                                                    placeholder="nama@kampus.ac.id"
                                                    value={data.email}
                                                    onChange={e => setData('email', e.target.value)}
                                                    style={{ fontSize: '1rem' }}
                                                />
                                                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold mb-2" style={{ fontSize: '1rem' }}>Password</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0 py-2.5"><i className="bi bi-lock text-muted" style={{ fontSize: '1rem' }}></i></span>
                                                <input
                                                    type="password"
                                                    className={`form-control bg-light border-start-0 py-2.5 ${errors.password ? 'is-invalid' : ''}`}
                                                    placeholder="••••••••"
                                                    value={data.password}
                                                    onChange={e => setData('password', e.target.value)}
                                                    style={{ fontSize: '1rem' }}
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
                                                <label className="form-check-label" style={{ fontSize: '0.95rem' }} htmlFor="remember">Ingat Saya</label>
                                            </div>
                                            <Link href="/forgot-password" className="text-decoration-none" style={{ fontSize: '0.95rem' }}>Lupa Password?</Link>
                                        </div>

                                        <button
                                            type="submit"
                                            className="btn w-100 py-2 fw-bold text-white shadow-sm border-0 gradient-primary d-flex align-items-center justify-content-center gap-2"
                                            style={{ borderRadius: '10px' }}
                                            disabled={processing}
                                        >
                                            {processing && <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>}
                                            <span style={{ fontSize: '1rem', lineHeight: 1.1 }}>
                                                {processing ? (isEnglish ? 'Signing in...' : 'Logging in...') : (isEnglish ? 'Sign In' : 'Masuk')}
                                            </span>
                                        </button>
                                    </form>

                                    {allowRegistration && !maintenanceMode && (
                                        <div className="text-center mt-3 text-muted" style={{ fontSize: '0.95rem' }}>
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

