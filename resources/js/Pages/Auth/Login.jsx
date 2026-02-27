import { React, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const { props } = usePage(); 
    const { data, setData, post, processing, errors } = useForm({
        account: '',
        password: '',
        remember: false,
    });

    const allErrors = { ...errors, ...props.errors };
    const handleSubmit = (e) => {
        e.preventDefault();
        post('/login', {
            onSuccess: () => console.log('Login Berhasil'),
            onError: (err) => console.log('Login Gagal:', err),
        });
    };

    return (
        <div className="vh-100 d-flex align-items-center bg-light">
            <Head title="Login" />
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-10 col-lg-8">
                        <div className="card border-0 shadow-lg overflow-hidden" style={{ borderRadius: '20px' }}>
                            <div className="row g-0">

                                {/* Sisi Kiri: Visual/Informasi */}
                                <div className="col-md-6 bg-primary d-none d-md-flex align-items-center justify-content-center text-white p-5">
                                    <div className="text-center">
                                        <i className="bi bi-mortarboard-fill" style={{ fontSize: '5rem' }}></i>
                                        <h2 className="fw-bold mt-3">Smart Learning</h2>
                                        <p className="opacity-75">Platform pembelajaran digital terpadu untuk masa depan yang lebih cerah.</p>
                                    </div>
                                </div>

                                {/* Sisi Kanan: Form */}
                                <div className="col-md-6 bg-white p-4 p-lg-5">
                                    <h3 className="fw-bold text-dark mb-2">Selamat Datang</h3>
                                    <p className="text-muted mb-4">Silakan masuk ke akun Anda</p>

                                    <form onSubmit={handleSubmit} className="text-start">

                                        {/* Alert dari Middleware (Akses Ilegal) */}
                                        {allErrors.loginAkses && (
                                            <div className="alert alert-danger py-2 small border-0 shadow-sm mb-3" role="alert">
                                                <i className="bi bi-shield-lock-fill me-2"></i>
                                                {allErrors.loginAkses}
                                            </div>
                                        )}

                                        {/* Alert dari Controller (Kredensial Salah) */}
                                        {allErrors.loginError && (
                                            <div className="alert alert-warning py-2 small border-0 shadow-sm mb-3" role="alert">
                                                <i className="bi bi-exclamation-circle-fill me-2"></i>
                                                {allErrors.loginError}
                                            </div>
                                        )}

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Username atau (NIM / NIDN)</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0"><i className="bi bi-person text-muted"></i></span>
                                                <input 
                                                    type="text" 
                                                    className={`form-control bg-light border-start-0 ${errors.account ? 'is-invalid' : ''}`}
                                                    placeholder="Username, NIM atau NIDN"
                                                    value={data.account}
                                                    onChange={e => setData('account', e.target.value)}
                                                />
                                                {errors.account && <div className="invalid-feedback">{errors.account}</div>}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Password</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0"><i className="bi bi-lock text-muted"></i></span>
                                                <input 
                                                    type={showPassword ? "text" : "password"}
                                                    className={`form-control modern-input bg-light border-start-0 ${errors.password ? 'is-invalid' : ''}`}
                                                    placeholder="Masukan password anda"
                                                    value={data.password}
                                                    onChange={e => setData('password', e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary password-toggle"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"} />
                                                </button>
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
                                            {/* <Link href="" className="small text-decoration-none">Lupa Password?</Link> */}
                                        </div>

                                        <button 
                                            type="submit" 
                                            className="btn btn-primary w-100 py-2 fw-bold shadow-sm"
                                            disabled={processing}
                                        >
                                            {processing ? 'Login in progress...' : 'Login'}
                                        </button>
                                    </form>

                                    <div className="text-center mt-4 text-muted small">
                                        Belum punya akun? <Link href="/register" className="fw-bold text-primary text-decoration-none">Daftar Akun</Link>
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

export default Login;