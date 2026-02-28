import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

const Login = () => {
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
                                        <h2 className="fw-bold mt-3">Smart Learning</h2>
                                        <p className="opacity-75">Platform pembelajaran digital terpadu untuk masa depan yang lebih cerah.</p>
                                    </div>
                                </div>

                                <div className="col-md-6 bg-white p-4 p-lg-5">
                                    <h3 className="fw-bold text-dark mb-2">Selamat Datang</h3>
                                    <p className="text-muted mb-4">Silakan masuk ke akun Anda</p>

                                    <form onSubmit={handleSubmit} className="text-start">
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Email / NIM</label>
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
                                            {processing ? 'Logging in...' : 'Masuk'}
                                        </button>
                                    </form>

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
