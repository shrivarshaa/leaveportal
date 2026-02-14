import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StudentDashboard = () => {
    const [leaves, setLeaves] = useState([]);
    const [stats, setStats] = useState({ percentage: 0, totalDays: 0, presentDays: 0 });
    const [messages, setMessages] = useState([]);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [facultyList, setFacultyList] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState('');
    const { user } = useAuth();

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            const [leaveRes, statsRes, msgRes, userRes] = await Promise.all([
                axios.get('/api/leaves/my-leaves', config),
                axios.get('/api/attendance/stats', config),
                axios.get('/api/messages', config),
                axios.get('/api/users/faculty', config)
            ]);
            setLeaves(leaveRes.data);
            setStats(statsRes.data);
            setMessages(msgRes.data);
            setFacultyList(userRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const sendMessage = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.post('/api/messages', { recipientId: selectedFaculty, content: messageContent }, config);
            setMessageContent('');
            fetchData();
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleCancel = async (id) => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        if (window.confirm('Are you sure you want to cancel this leave application?')) {
            try {
                await axios.put(`/api/leaves/${id}/cancel`, {}, config);
                fetchData();
            } catch (error) {
                console.error('Error cancelling leave:', error);
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto mt-24 px-4 sm:px-6 lg:px-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="heading-primary text-3xl">Welcome, {user?.name}</h1>
                    <p className="text-gray-400 mt-1">Here's your academic and leave summary</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsMessageModalOpen(true)}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        Contact Teacher
                    </button>
                    <Link to="/apply-leave" className="btn-primary">Apply for Leave</Link>
                </div>
            </div>

            {/* Chat Modal */}
            {isMessageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-2xl h-[600px] flex flex-col relative animate-fade-in shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div>
                                <h2 className="text-xl font-bold text-white">Chat with Faculty</h2>
                                <p className="text-xs text-gray-400">Select a teacher to start your conversation</p>
                            </div>
                            <button
                                onClick={() => setIsMessageModalOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Sidebar: Faculty List */}
                            <div className="w-1/3 border-r border-white/10 bg-black/20 overflow-y-auto">
                                {facultyList.map(f => (
                                    <button
                                        key={f._id}
                                        onClick={() => setSelectedFaculty(f._id)}
                                        className={`w-full p-4 text-left hover:bg-white/5 transition-colors border-b border-white/5 ${selectedFaculty === f._id ? 'bg-primary/20 border-r-2 border-r-primary' : ''}`}
                                    >
                                        <div className="font-bold text-sm text-white truncate">{f.name}</div>
                                        <div className="text-[10px] text-gray-400 uppercase tracking-tighter">{f.department} • {f.role}</div>
                                    </button>
                                ))}
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 flex flex-col bg-white/5">
                                {selectedFaculty ? (
                                    <>
                                        {/* Message History */}
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                            {messages
                                                .filter(m => (m.sender?._id === selectedFaculty && m.recipient?._id === user?._id) || (m.sender?._id === user?._id && m.recipient?._id === selectedFaculty))
                                                .slice().reverse()
                                                .map((msg, idx) => (
                                                    <div key={msg._id || idx} className={`flex ${msg.sender?._id === user?._id ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender?._id === user?._id
                                                            ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20'
                                                            : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/10'}`}>
                                                            {msg.content}
                                                            <div className="text-[10px] mt-1 opacity-50 text-right">
                                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            {messages.filter(m => (m.sender?._id === selectedFaculty && m.recipient?._id === user?._id) || (m.sender?._id === user?._id && m.recipient?._id === selectedFaculty)).length === 0 && (
                                                <div className="h-full flex items-center justify-center text-gray-500 text-xs italic">
                                                    No messages yet. Say hello!
                                                </div>
                                            )}
                                        </div>

                                        {/* Input Box */}
                                        <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
                                            <input
                                                type="text"
                                                className="glass-input !bg-white/5 flex-1"
                                                placeholder="Type your message..."
                                                required
                                                value={messageContent}
                                                onChange={(e) => setMessageContent(e.target.value)}
                                            />
                                            <button type="submit" className="p-3 bg-primary hover:bg-primary-hover text-white rounded-xl transition-all shadow-lg shadow-primary/20 group">
                                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l7-7-7-7M5 12h14" /></svg>
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                        </div>
                                        <p className="text-sm font-medium">Your Conversations</p>
                                        <p className="text-xs max-w-[200px] mt-1">Select a teacher from the list to view history or send a message</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}


            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="glass-card p-6 flex items-center justify-between border-l-4 border-accent">
                    <div>
                        <p className="text-sm text-gray-400 uppercase font-semibold">Attendance</p>
                        <h3 className="text-3xl font-bold text-white mt-1">{stats.percentage}%</h3>
                        <p className="text-xs text-gray-500 mt-1">{stats.presentDays} / {stats.totalDays} Total Days</p>
                    </div>
                    <div className="h-12 w-12 rounded-full border-2 border-accent/20 flex items-center justify-center">
                        <span className="text-accent text-xl font-bold">A</span>
                    </div>
                </div>

                <div className="glass-card p-6 flex items-center justify-between border-l-4 border-primary">
                    <div>
                        <p className="text-sm text-gray-400 uppercase font-semibold">Active Leaves</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
                            {leaves.filter(l => l.status === 'Pending').length}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Pending Approval</p>
                    </div>
                    <div className="h-12 w-12 rounded-full border-2 border-primary/20 flex items-center justify-center">
                        <span className="text-primary text-xl font-bold">L</span>
                    </div>
                </div>

                <div className="glass-card p-6 flex items-center justify-between border-l-4 border-green-500 shadow-lg shadow-green-500/10">
                    <div>
                        <p className="text-sm text-gray-400 uppercase font-semibold">Streak</p>
                        <h3 className="text-3xl font-bold text-white mt-1 flex items-center gap-2">
                            {stats.streak} {stats.streak > 0 && <span className="text-2xl animate-bounce">🔥</span>}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Continuous Attendance</p>
                    </div>
                    <div className="h-12 w-12 rounded-full border-2 border-green-500/20 flex items-center justify-center bg-green-500/5">
                        <span className="text-green-500 text-xl font-bold">S</span>
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden mb-12">
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Leave Application History</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                        <thead>
                            <tr className="bg-white/5 text-gray-300 uppercase text-xs tracking-wider">
                                <th className="py-4 px-6 text-left font-semibold">Type</th>
                                <th className="py-4 px-6 text-left font-semibold">From</th>
                                <th className="py-4 px-6 text-left font-semibold">To</th>
                                <th className="py-4 px-6 text-center font-semibold">Overall Status</th>
                                <th className="py-4 px-6 text-center font-semibold">Faculty Approval</th>
                                <th className="py-4 px-6 text-center font-semibold">Warden Approval</th>
                                <th className="py-4 px-6 text-center font-semibold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                            {leaves
                                .sort((a, b) => (b.leaveType === 'Emergency') - (a.leaveType === 'Emergency'))
                                .map((leave) => (
                                    <tr key={leave._id} className={`hover:bg-white/5 transition-colors duration-200 ${leave.leaveType === 'Emergency' ? 'bg-red-500/5' : ''}`}>
                                        <td className="py-4 px-6 text-left font-medium">
                                            <div className="flex items-center gap-2">
                                                {leave.leaveType}
                                                {leave.leaveType === 'Emergency' && (
                                                    <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 rounded uppercase font-bold tracking-tighter">Urgent</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-left">{new Date(leave.startDate).toLocaleDateString()}</td>
                                        <td className="py-4 px-6 text-left">{new Date(leave.endDate).toLocaleDateString()}</td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border
                                            ${leave.status === 'Approved' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                                                    leave.status === 'Rejected' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                                        'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'}`}>
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`text-xs ${leave.facultyApproval.status === 'Approved' ? 'text-green-400' : leave.facultyApproval.status === 'Rejected' ? 'text-red-400' : 'text-yellow-400'}`}>
                                                {leave.facultyApproval.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`text-xs ${leave.wardenApproval?.status === 'Approved' ? 'text-green-400' : leave.wardenApproval?.status === 'Rejected' ? 'text-red-400' : 'text-yellow-400'}`}>
                                                {leave.wardenApproval?.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {leave.status === 'Pending' && (
                                                <button
                                                    onClick={() => handleCancel(leave._id)}
                                                    className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1 rounded text-xs font-bold transition-all border border-red-500/20"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            {leave.status === 'Cancelled' && (
                                                <span className="text-gray-600 text-[10px] uppercase font-bold">Withdrawn</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
                {leaves.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-400 italic">No leave applications found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
