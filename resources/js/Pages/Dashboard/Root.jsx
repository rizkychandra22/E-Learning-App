// resources/js/Pages/Dashboard/Index.jsx
import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';

const Index = () => {
    const { auth } = usePage().props; 

    return (
        <div className="p-5">
            <Head title="Dashboard Root" />
            <div className="container">
                <div className="card shadow-sm border-0 p-4">
                    <h1 className="fw-bold">Selamat Datang, {auth.user ? auth.user.username : 'Guest'}!</h1>
                    <p className="text-muted">Anda login sebagai: <strong>{auth.user?.role}</strong></p>
                    <hr />
                    <Link href="/logout" className="btn btn-danger">Logout</Link>
                </div>
            </div>
        </div>
    );
};

export default Index;