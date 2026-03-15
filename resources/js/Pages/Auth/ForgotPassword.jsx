import { Head, Link, useForm, usePage } from '@inertiajs/react';

const ForgotPassword = () => {
    const { props } = usePage();
    const system = props.system ?? {};
    const flash = props.flash ?? {};
    const isEnglish = system.default_language === 'en';
    const platformName = system.platform_name ?? 'Smart Learning';

    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const handleSubmit = (event) => {
        event.preventDefault();
        post('/forgot-password');
    };

    return (
        <div className="min-h-screen d-flex align-items-center position-relative overflow-hidden bg-gradient-to-br from-warning/15 via-background to-info/20">
            <Head title={isEnglish ? 'Forgot Password' : 'Lupa Password'} />
            <div className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none">
                <div className="position-absolute top-0 start-0 rounded-circle" style={{ width: '20rem', height: '20rem', background: 'hsl(var(--warning) / 0.14)', filter: 'blur(70px)', transform: 'translate(-28%, -32%)' }} />
                <div className="position-absolute bottom-0 end-0 rounded-circle" style={{ width: '24rem', height: '24rem', background: 'hsl(var(--info) / 0.12)', filter: 'blur(82px)', transform: 'translate(30%, 24%)' }} />
            </div>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6">
                        <div className="card border-0 shadow-lg p-4 p-lg-5 position-relative" style={{ borderRadius: '20px', background: 'hsl(var(--card) / 0.95)', backdropFilter: 'blur(6px)' }}>
                            <div className="text-center mb-4">
                                <i className="bi bi-key-fill text-warning" style={{ fontSize: '3rem' }}></i>
                                <h2 className="fw-bold mt-3">{platformName}</h2>
                                <p className="text-muted mb-0">
                                    {isEnglish
                                        ? 'Enter your email and we will send a password reset link.'
                                        : 'Masukkan email akun Anda dan kami akan mengirim tautan reset password.'}
                                </p>
                            </div>

                            {flash.success && (
                                <div className="alert alert-success small py-2" role="alert">
                                    {flash.success}
                                </div>
                            )}

                            {errors.email && (
                                <div className="alert alert-danger small py-2" role="alert">
                                    {errors.email}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="form-label fw-semibold">Email</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-end-0"><i className="bi bi-envelope text-muted"></i></span>
                                        <input
                                            type="email"
                                            className={`form-control bg-light border-start-0 ${errors.email ? 'is-invalid' : ''}`}
                                            placeholder="nama@kampus.ac.id"
                                            value={data.email}
                                            onChange={(event) => setData('email', event.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn w-100 py-2 fw-bold text-dark shadow-sm border-0"
                                    style={{ borderRadius: '10px', background: 'linear-gradient(135deg, #facc15 0%, #f59e0b 100%)' }}
                                    disabled={processing}
                                >
                                    {processing
                                        ? (isEnglish ? 'Sending link...' : 'Mengirim tautan...')
                                        : (isEnglish ? 'Send Reset Link' : 'Kirim Tautan Reset')}
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

export default ForgotPassword;
