import { Head } from '@inertiajs/react';
import { Users, Star } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';

const courses = [
    { id: 1, title: 'Algoritma & Pemrograman', instructor: 'Dr. Budi Santoso', students: 45, rating: 4.8, category: 'Informatika', progress: 85 },
    { id: 2, title: 'Basis Data Lanjutan', instructor: 'Prof. Siti Rahayu', students: 38, rating: 4.6, category: 'Informatika', progress: 62 },
    { id: 3, title: 'Pemrograman Web Modern', instructor: 'Dr. Ahmad Fauzi', students: 52, rating: 4.9, category: 'Teknologi', progress: 45 },
    { id: 4, title: 'Machine Learning Dasar', instructor: 'Dr. Maya Dewi', students: 31, rating: 4.7, category: 'Data Science', progress: 28 },
    { id: 5, title: 'Struktur Data', instructor: 'Dr. Budi Santoso', students: 40, rating: 4.5, category: 'Informatika', progress: 70 },
    { id: 6, title: 'Jaringan Komputer', instructor: 'Prof. Eko Prasetyo', students: 35, rating: 4.4, category: 'Jaringan', progress: 55 },
];

const gradients = ['gradient-primary', 'gradient-accent', 'gradient-warm', 'gradient-success'];

export default function Courses() {
    return (
        <ProtectedLayout>
            <Head title="Kursus" />
            <div className="space-y-6 max-w-7xl">
                <div className="animate-fade-in">
                    <h1 className="text-2xl font-bold tracking-tight">Kursus</h1>
                    <p className="text-muted-foreground mt-1">Jelajahi dan kelola kursus yang tersedia</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {courses.map((course, index) => (
                        <div key={course.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-card hover:shadow-card-lg transition-all duration-300 animate-fade-in group" style={{ animationDelay: `${index * 60}ms` }}>
                            <div className={cn('h-32 flex items-end p-4', gradients[index % gradients.length])}>
                                <span className="text-xs font-medium px-2 py-1 rounded-md bg-background/20 text-primary-foreground backdrop-blur-sm">{course.category}</span>
                            </div>
                            <div className="p-5 space-y-3">
                                <h3 className="font-semibold group-hover:text-primary transition-colors">{course.title}</h3>
                                <p className="text-sm text-muted-foreground">{course.instructor}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{course.students}</span>
                                    <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-warning" />{course.rating}</span>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Progress</span><span className="font-medium">{course.progress}%</span></div>
                                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden"><div className={cn('h-full rounded-full', gradients[index % gradients.length])} style={{ width: `${course.progress}%` }} /></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ProtectedLayout>
    );
}
