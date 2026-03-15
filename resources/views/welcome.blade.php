<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Smart Learning</title>
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" rel="stylesheet" />
        <style>
            :root {
                --ink: #0f172a;
                --muted: #475569;
                --surface: #ffffff;
                --surface-2: #f8fafc;
                --brand: #4f46e5;
                --brand-2: #6366f1;
                --brand-3: #f97316;
                --shadow: 0 30px 80px rgba(15, 23, 42, 0.16);
                --shadow-soft: 0 18px 45px rgba(15, 23, 42, 0.12);
            }

            * { box-sizing: border-box; }
            body {
                margin: 0;
                font-family: "Inter", system-ui, -apple-system, sans-serif;
                color: var(--ink);
                background: radial-gradient(1200px 600px at 80% -10%, rgba(79, 70, 229, 0.18), transparent 60%),
                            radial-gradient(900px 500px at 10% 10%, rgba(99, 102, 241, 0.12), transparent 60%),
                            #f1f5f9;
                min-height: 100vh;
            }
            a { color: inherit; text-decoration: none; }
            img { max-width: 100%; display: block; }

            .container {
                width: min(1160px, 92%);
                margin: 0 auto;
                position: relative;
            }
            .bg-grid {
                position: absolute;
                inset: 0;
                background-image:
                    linear-gradient(rgba(99, 102, 241, 0.08) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(99, 102, 241, 0.06) 1px, transparent 1px);
                background-size: 40px 40px;
                mask-image: radial-gradient(circle at 30% 10%, rgba(0,0,0,0.7), transparent 55%);
                pointer-events: none;
                z-index: 0;
            }

            .nav {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 26px 0;
                position: relative;
                z-index: 1;
            }
            .brand {
                display: flex;
                align-items: center;
                gap: 12px;
                font-weight: 700;
                letter-spacing: -0.02em;
                font-size: 1.1rem;
            }
            .brand-badge {
                width: 40px;
                height: 40px;
                border-radius: 14px;
                background: linear-gradient(135deg, #4f46e5, #7c3aed);
                display: grid;
                place-items: center;
                color: #fff;
                box-shadow: var(--shadow-soft);
            }
            .brand-badge svg {
                width: 22px;
                height: 22px;
            }
            .nav-links {
                display: flex;
                gap: 22px;
                color: var(--muted);
                font-weight: 500;
                font-size: 0.95rem;
            }
            .nav-cta {
                display: flex;
                gap: 10px;
            }
            .btn {
                padding: 10px 18px;
                border-radius: 999px;
                font-weight: 600;
                font-size: 0.95rem;
                border: 1px solid transparent;
                transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
            }
            .btn-outline {
                border-color: #cbd5f5;
                color: var(--brand);
                background: transparent;
            }
            .btn-solid {
                background: linear-gradient(120deg, var(--brand), #3b82f6);
                color: #fff;
                box-shadow: var(--shadow-soft);
            }
            .btn:hover { transform: translateY(-2px); }

            .hero {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 40px;
                align-items: center;
                padding: 24px 0 36px;
                position: relative;
                z-index: 1;
            }
            .hero-copy h1 {
                font-size: clamp(1.9rem, 2.6vw + 1.4rem, 3.2rem);
                letter-spacing: -0.03em;
                margin: 0 0 16px;
            }
            .hero-title .accent {
                background: linear-gradient(120deg, #4f46e5, #22d3ee);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
            }
            .hero-copy p {
                color: var(--muted);
                font-size: 1rem;
                line-height: 1.8;
                margin: 0 0 26px;
            }
            .hero-cta {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                align-items: center;
            }
            .hero-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 6px 12px;
                border-radius: 999px;
                background: rgba(79, 70, 229, 0.12);
                color: #4338ca;
                font-size: 0.8rem;
                font-weight: 600;
                margin-bottom: 14px;
            }
            .hero-badge-dot {
                width: 8px;
                height: 8px;
                border-radius: 999px;
                background: #22c55e;
                box-shadow: 0 0 10px rgba(34, 197, 94, 0.6);
                animation: pulse 2.6s ease-in-out infinite;
            }
            .hero-meta {
                display: flex;
                gap: 20px;
                margin-top: 26px;
                color: var(--muted);
                font-size: 0.9rem;
            }
            .meta-card {
                background: var(--surface);
                border-radius: 16px;
                padding: 12px 16px;
                box-shadow: var(--shadow-soft);
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .hero-art {
                position: relative;
                background: linear-gradient(150deg, #ffffff, #f8fafc);
                border-radius: 28px;
                box-shadow: var(--shadow);
                overflow: hidden;
                min-height: 340px;
                place-items: center;
            }
            .hero-art::before {
                content: "";
                position: absolute;
                inset: 10px;
                border-radius: 22px;
                border: 1px solid rgba(99, 102, 241, 0.25);
                box-shadow: 0 0 25px rgba(99, 102, 241, 0.2);
                pointer-events: none;
            }
            .hero-art::after {
                content: "";
                position: absolute;
                inset: -40%;
                background: conic-gradient(from 120deg, rgba(34, 211, 238, 0.12), rgba(79, 70, 229, 0.12), transparent 60%);
                animation: spin 16s linear infinite;
                opacity: 0.6;
            }
            .team-illustration {
                max-width: 85%;
                width: 850%;
                height: 85%;
                object-fit: contain;
                position: relative;
                z-index: 1;
            }
            .glow-bar {
                position: absolute;
                inset: auto 0 0 0;
                height: 6px;
                background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.6), transparent);
                opacity: 0.7;
                animation: shimmer 4s ease-in-out infinite;
            }
            .scanline {
                position: absolute;
                left: 12px;
                right: 12px;
                height: 2px;
                background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.8), transparent);
                opacity: 0.6;
                animation: scan 5.5s ease-in-out infinite;
                pointer-events: none;
            }
            .orb {
                position: absolute;
                border-radius: 50%;
                opacity: 0.7;
                filter: blur(0.5px);
                animation: float 6s ease-in-out infinite;
            }
            .orb.one { width: 120px; height: 120px; background: rgba(59, 130, 246, 0.18); top: -30px; right: -20px; }
            .orb.two { width: 80px; height: 80px; background: rgba(20, 184, 166, 0.2); bottom: 30px; left: -20px; animation-delay: -2s; }
            .orb.three { width: 60px; height: 60px; background: rgba(249, 115, 22, 0.2); top: 120px; left: 40px; animation-delay: -3s; }

            .insight-panel {
                width: min(440px, 100%);
                background: rgba(255, 255, 255, 0.92);
                border-radius: 24px;
                padding: 20px;
                border: 1px solid rgba(226, 232, 240, 0.9);
                box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.2), 0 18px 45px rgba(15, 23, 42, 0.12);
                position: relative;
                z-index: 2;
                backdrop-filter: blur(6px);
            }
            .insight-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 14px;
            }
            .insight-title {
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 700;
                font-size: 0.95rem;
            }
            .insight-badge {
                width: 34px;
                height: 34px;
                border-radius: 12px;
                background: linear-gradient(135deg, #4f46e5, #7c3aed);
                display: grid;
                place-items: center;
                color: #fff;
                box-shadow: var(--shadow-soft);
                animation: float 6s ease-in-out infinite;
            }
            .insight-badge svg { width: 18px; height: 18px; }
            .insight-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
            }
            .insight-card {
                background: linear-gradient(180deg, #ffffff, #f8fafc);
                border-radius: 16px;
                padding: 12px 14px;
                border: 1px solid #e2e8f0;
                min-height: 72px;
            }
            .insight-card h4 {
                margin: 0 0 6px;
                font-size: 0.75rem;
                color: var(--muted);
                font-weight: 600;
            }
            .insight-value {
                font-size: 1.2rem;
                font-weight: 700;
                letter-spacing: -0.01em;
            }

            .section {
                padding: 0;
            }

            footer {
                padding: 50px 0 50px;
                color: var(--muted);
                font-size: 0.9rem;
                text-align: center;
                position: relative;
                z-index: 1;
            }

            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            @keyframes pulse {
                0%, 100% { transform: translateY(0); box-shadow: 0 0 0 rgba(0,0,0,0); }
                50% { transform: translateY(-4px); box-shadow: 0 16px 30px rgba(15, 23, 42, 0.12); }
            }
            @keyframes shimmer {
                0%, 100% { transform: translateX(-20%); opacity: 0.4; }
                50% { transform: translateX(20%); opacity: 0.9; }
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            @keyframes scan {
                0% { top: 18px; }
                50% { top: calc(100% - 24px); }
                100% { top: 18px; }
            }

            @media (max-width: 980px) {
                .hero { grid-template-columns: 1fr; }
                .nav-links { display: none; }
            }
            @media (max-width: 640px) {
                .insight-panel { width: 100%; }
                .insight-grid { grid-template-columns: 1fr; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="bg-grid"></div>
            <header class="nav">
                <div class="brand">
                    <div class="brand-badge" aria-hidden="true">
                        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                            <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 7.14V13a1 1 0 0 0-1 1v2h3v-2a1 1 0 0 0-1-1V6.739l.686-.275a.5.5 0 0 0 .025-.917z"/>
                            <path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466z"/>
                        </svg>
                    </div>
                    Smart Learning
                </div>
                <nav class="nav-links"></nav>
                <div class="nav-cta">
                    @if (Route::has('login'))
                        @auth
                            <a class="btn btn-outline" href="{{ url('/dashboard') }}">Dashboard</a>
                        @else
                            <a class="btn btn-outline" href="{{ route('login') }}">Masuk</a>
                            @if (Route::has('register'))
                                <a class="btn btn-solid" href="{{ route('register') }}">Daftar</a>
                            @endif
                        @endauth
                    @endif
                </div>
            </header>

            <section class="hero">
                <div class="hero-copy">
                    <div class="hero-badge"><span class="hero-badge-dot"></span>Platform belajar terintegrasi</div>
                    <h1 class="hero-title">E-Learning yang terasa <span class="accent">hidup</span>, fokus, dan siap tumbuh.</h1>
                    <p>
                        Smart Learning membantu kampus mengelola kursus, pembayaran, dan performa akademik
                        dalam satu ruang kerja yang elegan. Cepat, rapi, dan mudah dipantau.
                    </p>
                    <div class="hero-cta">
                        <a class="btn btn-solid" href="{{ route('login') }}">Mulai Sekarang</a>
                        <a class="btn btn-outline" href="{{ route('login') }}">Lihat Dashboard</a>
                    </div>
                    <div class="hero-meta">
                        <div class="meta-card">
                            <span>99.9% uptime</span>
                        </div>
                        <div class="meta-card">
                            <span>Role ready</span>
                        </div>
                        <div class="meta-card">
                            <span>Analytics realtime</span>
                        </div>
                    </div>
                </div>

                <div class="hero-art">
                    <div class="orb one"></div>
                    <div class="orb two"></div>
                    <div class="orb three"></div>
                    <div class="scanline"></div>

                    <img src="{{ asset('images/Gemini2-Photoroom.png') }}" alt="Team Development" class="team-illustration">
                    <div class="glow-bar"></div>
                </div>
            </section>

            <footer>
                Smart Learning - Sistem E-Learning terpadu untuk kampus yang adaptif.
            </footer>
        </div>
    </body>
</html>
