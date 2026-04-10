import { Head, Link, useForm, usePage } from '@inertiajs/react';

const ResetPassword = ({ token, email }) => {
    const { props } = usePage();
    const system = props.system ?? {};
    const isEnglish = system.default_language === 'en';

    const { data, setData, post, processing, errors } = useForm({
        token: token ?? '',
        email: email ?? '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (event) => {
        event.preventDefault();
        post('/reset-password');
    };

    return (
        <div className="min-h-screen d-flex align-items-center position-relative overflow-hidden bg-gradient-to-br from-info/15 via-background to-primary/20">
            <Head title={isEnglish ? 'Reset Password' : 'Reset Password'} />
            <div className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none">
                <div className="position-absolute top-0 start-0 rounded-circle" style={{ width: '22rem', height: '22rem', background: 'hsl(var(--info) / 0.14)', filter: 'blur(74px)', transform: 'translate(-30%, -35%)' }} />
                <div className="position-absolute bottom-0 end-0 rounded-circle" style={{ width: '22rem', height: '22rem', background: 'hsl(var(--primary) / 0.12)', filter: 'blur(76px)', transform: 'translate(28%, 24%)' }} />
            </div>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6">
                        <div className="card border-0 shadow-lg p-4 p-lg-5" style={{ borderRadius: '20px', background: 'hsl(var(--card) / 0.95)', backdropFilter: 'blur(6px)' }}>
                            <div className="text-center mb-4">
                                <i className="bi bi-shield-lock-fill text-info" style={{ fontSize: '3rem' }}></i>
                                <h3 className="fw-bold mt-3">{isEnglish ? 'Create a New Password' : 'Buat Password Baru'}</h3>
                                <p className="text-muted mb-0">
                                    {isEnglish
                                        ? 'Use a strong password with letters and numbers.'
                                        : 'Gunakan password yang kuat dengan kombinasi huruf dan angka.'}
                                </p>
                            </div>

                            {(errors.email || errors.password || errors.password_confirmation) && (
                                <div className="alert alert-danger small py-2" role="alert">
                                    {errors.email || errors.password || errors.password_confirmation}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Email</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-end-0"><i className="bi bi-envelope text-muted"></i></span>
                                        <input
                                            type="email"
                                            className={`form-control bg-light border-start-0 ${errors.email ? 'is-invalid' : ''}`}
                                            value={data.email}
                                            onChange={(event) => setData('email', event.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Password Baru</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-end-0"><i className="bi bi-lock text-muted"></i></span>
                                        <input
                                            type="password"
                                            className={`form-control bg-light border-start-0 ${errors.password ? 'is-invalid' : ''}`}
                                            value={data.password}
                                            onChange={(event) => setData('password', event.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label fw-semibold">Konfirmasi Password Baru</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-end-0"><i className="bi bi-shield-check text-muted"></i></span>
                                        <input
                                            type="password"
                                            className={`form-control bg-light border-start-0 ${errors.password_confirmation ? 'is-invalid' : ''}`}
                                            value={data.password_confirmation}
                                            onChange={(event) => setData('password_confirmation', event.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn w-100 py-2 fw-bold text-white shadow-sm border-0 gradient-primary"
                                    style={{ borderRadius: '10px' }}
                                    disabled={processing}
                                >
                                    {processing
                                        ? (isEnglish ? 'Updating password...' : 'Memperbarui password...')
                                        : (isEnglish ? 'Reset Password' : 'Reset Password')}
                                </button>
                            </form>

                            <div className="text-center mt-4 text-muted small">
                                <Link href="/login" className="fw-bold text-decoration-none">
                                    {isEnglish ? 'Back to login' : 'Kembali ke login'}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;

