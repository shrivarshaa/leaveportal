import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminDashboard = () => {
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            try {
                const { data } = await axios.get('/api/admin/analytics', config);
                setAnalytics(data);
            } catch (error) {
                console.error(error);
                toast.error('Failed to fetch analytics');
            }
        };
        fetchAnalytics();
    }, []);

    if (!analytics) return <div className="p-10">Loading analytics...</div>;

    // Generate last 12 months labels
    const last12Months = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        last12Months.push({
            month: d.getMonth() + 1,
            year: d.getFullYear(),
            label: d.toLocaleString('default', { month: 'short' })
        });
    }

    const barData = {
        labels: last12Months.map(m => m.label),
        datasets: [
            {
                label: 'Monthly Leave Trends',
                data: last12Months.map(m => {
                    const found = analytics.monthlyLeaves?.find(ml => ml._id.month === m.month && ml._id.year === m.year);
                    return found ? found.count : 0;
                }),
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                borderColor: '#6366f1',
                borderWidth: 2,
                borderRadius: 8,
            },
        ],
    };

    const pieData = {
        labels: analytics.deptStats?.map(d => d.name) || [],
        datasets: [
            {
                data: analytics.deptStats?.map(d => d.leaveCount) || [],
                backgroundColor: ['#60a5fa', '#a78bfa', '#f472b6', '#fbbf24'],
                borderWidth: 0,
            },
        ],
    };

    return (
        <div className="max-w-7xl mx-auto mt-24 px-4 sm:px-6 lg:px-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="heading-primary text-3xl">Admin Dashboard</h1>
                    <p className="text-gray-400 mt-1">System-wide analytics and trends</p>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">Live System Status: <span className="text-green-500">Active</span></span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="glass-card p-6 border-l-4 border-blue-500">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase">Users</h3>
                    <p className="text-4xl font-extrabold text-white mt-2">{analytics.totalUsers}</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-indigo-500">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase">Total Leaves</h3>
                    <p className="text-4xl font-extrabold text-white mt-2">{analytics.totalLeaves}</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-yellow-500">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase">Pending</h3>
                    <p className="text-4xl font-extrabold text-white mt-2">{analytics.pendingLeaves}</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-green-500">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase">Approved</h3>
                    <p className="text-4xl font-extrabold text-white mt-2">{analytics.approvedLeaves}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-8">
                    <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                        Monthly Trends
                    </h3>
                    <div className="h-[300px]">
                        <Bar data={barData} options={{
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } } }
                        }} />
                    </div>
                </div>
                <div className="glass-card p-8">
                    <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                        Dept. Distribution
                    </h3>
                    <div className="h-[250px] flex items-center justify-center">
                        <Pie data={pieData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                {/* New Section: Student Performance Table */}
                <div className="lg:col-span-3 glass-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-white">Student Performance Metrics</h3>
                        <span className="text-xs text-gray-400">Attendance & Leave Tracking</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-xs uppercase text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">Student Name</th>
                                    <th className="px-6 py-3">Student ID</th>
                                    <th className="px-6 py-3">Department</th>
                                    <th className="px-6 py-3 text-center">Attendance</th>
                                    <th className="px-6 py-3 text-center">Approved</th>
                                    <th className="px-6 py-3 text-center">Total Leaves</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                                {analytics.studentStats?.map((student, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-bold text-white">{student.name}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-indigo-300">{student.studentId}</td>
                                        <td className="px-6 py-4">{student.department}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-16 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${parseFloat(student.attendancePercentage) >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                                                        style={{ width: `${student.attendancePercentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`font-bold ${parseFloat(student.attendancePercentage) >= 75 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {student.attendancePercentage}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-indigo-400">{student.approvedLeaves}</td>
                                        <td className="px-6 py-4 text-center text-gray-500">{student.totalLeaves}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* New Section: Detailed Department Table */}
                <div className="lg:col-span-3 glass-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 bg-white/5">
                        <h3 className="font-bold text-white">Department Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-xs uppercase text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">Department</th>
                                    <th className="px-6 py-3">Total Students</th>
                                    <th className="px-6 py-3">Leave Activity</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                                {analytics.deptStats?.map((dept, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-bold text-white">{dept.name}</td>
                                        <td className="px-6 py-4">{dept.userCount}</td>
                                        <td className="px-6 py-4">{dept.leaveCount} Applications</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-md text-[10px] font-bold uppercase border border-green-500/20">Optimal</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
