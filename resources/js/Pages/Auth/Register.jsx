import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

const Register = () => {
    // Menghapus password_confirmation dan menambahkan username
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
        <div className="vh-100 d-flex align-items-center bg-light">
            <Head title="Daftar Akun" />
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-10 col-lg-9">
                        <div className="card border-0 shadow-lg overflow-hidden" style={{ borderRadius: '20px' }}>
                            <div className="row g-0">
                                
                                {/* SISI KIRI: FORM DAFTAR */}
                                <div className="col-md-6 bg-white p-4 p-lg-5">
                                    <h3 className="fw-bold text-dark mb-2 text-start">Mulai Belajar</h3>
                                    <p className="text-muted mb-4 text-start">Lengkapi data diri untuk membuat akun baru.</p>

                                    <form onSubmit={handleSubmit} className="text-start">
                                        {/* Nama Lengkap */}
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

                                        {/* Username */}
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

                                        {/* Email */}
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Email</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0"><i className="bi bi-envelope text-muted"></i></span>
                                                <input 
                                                    type="email" 
                                                    className={`form-control bg-light border-start-0 ${errors.email ? 'is-invalid' : ''}`}
                                                    placeholder="nama@gmail.com"
                                                    value={data.email}
                                                    onChange={e => setData('email', e.target.value)}
                                                />
                                            </div>
                                            {errors.email && <small className="text-danger">{errors.email}</small>}
                                        </div>

                                        {/* Password */}
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
                                            className="btn btn-success w-100 py-2 fw-bold shadow-sm mt-2"
                                            disabled={processing}
                                        >
                                            {processing ? 'Sedang Memproses...' : 'Daftar Sekarang'}
                                        </button>
                                    </form>

                                    <div className="text-center mt-4 text-muted small">
                                        Sudah punya akun? <Link href="/login" className="fw-bold text-success text-decoration-none">Login Masuk</Link>
                                    </div>
                                </div>

                                {/* SISI KANAN: VISUAL */}
                                <div className="col-md-6 bg-success d-none d-md-flex align-items-center justify-content-center text-white p-5 text-center">
                                    <div>
                                        <i className="bi bi-journal-check" style={{ fontSize: '5rem' }}></i>
                                        <h2 className="fw-bold mt-3">Bergabung Sekarang</h2>
                                        <p className="opacity-75">Dapatkan akses ke ribuan materi kuliah dan diskusikan dengan para pakar di bidangnya.</p>
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