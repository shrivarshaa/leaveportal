import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const WardenDashboard = () => {
    const [leaves, setLeaves] = useState([]);
    const [view, setView] = useState('leaves'); // 'leaves' or 'inbox'
    const [messages, setMessages] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const { user } = useAuth();

    const fetchLeaves = async () => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            const { data } = await axios.get('/api/leaves', config);
            setLeaves(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch leaves');
        }
    };

    const fetchMessages = async () => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            const { data } = await axios.get('/api/messages', config);
            setMessages(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchLeaves();
        fetchMessages();
    }, []);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!selectedStudent || !replyContent.trim()) return;
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.post('/api/messages', { recipientId: selectedStudent._id, content: replyContent }, config);
            setReplyContent('');
            fetchMessages();
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    };

    const handleAction = async (id, status) => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.put(`/api/leaves/${id}/status`, { status }, config);
            toast.success(`Leave ${status} successfully`);
            fetchLeaves();
        } catch (error) {
            toast.error(`Failed to ${status} leave`);
        }
    };

    return (
        <div className="max-w-7xl mx-auto mt-24 px-4 sm:px-6 lg:px-8 pb-12">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="heading-primary text-3xl">Warden Dashboard</h1>
                    <p className="text-gray-400 mt-1">Final review and management of hostel leave requests</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl backdrop-blur-md border border-white/10">
                    <button onClick={() => setView('leaves')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'leaves' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Leaves</button>
                    <button onClick={() => setView('inbox')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'inbox' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Inbox</button>
                </div>
            </div>

            {view === 'leaves' ? (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/10">
                            <thead>
                                <tr className="bg-white/5 text-gray-300 uppercase text-xs tracking-wider">
                                    <th className="py-4 px-6 text-left font-semibold">Student</th>
                                    <th className="py-4 px-6 text-left font-semibold">Type</th>
                                    <th className="py-4 px-6 text-left font-semibold">Dates</th>
                                    <th className="py-4 px-6 text-center font-semibold">Faculty Status</th>
                                    <th className="py-4 px-6 text-center font-semibold">Warden Status</th>
                                    <th className="py-4 px-6 text-center font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-gray-300">
                                {leaves
                                    .sort((a, b) => (b.leaveType === 'Emergency') - (a.leaveType === 'Emergency'))
                                    .map((leave) => (
                                        <tr key={leave._id} className={`hover:bg-white/5 transition-colors duration-200 ${leave.leaveType === 'Emergency' ? 'bg-red-500/5' : ''}`}>
                                            <td className="py-4 px-6 text-left">
                                                <div className="flex items-center gap-2">
                                                    {leave.leaveType === 'Emergency' && (
                                                        <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" title="High Priority"></span>
                                                    )}
                                                    <div className="font-bold text-white">{leave.student?.name}</div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-left">
                                                <span className={leave.leaveType === 'Emergency' ? 'text-red-400 font-bold' : ''}>
                                                    {leave.leaveType}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-left">
                                                <div className="text-sm">
                                                    {new Date(leave.startDate).toLocaleDateString()} -
                                                    <br />
                                                    {new Date(leave.endDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${leave.facultyApproval.status === 'Approved' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                                                    leave.facultyApproval.status === 'Rejected' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                                        'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                                    }`}>
                                                    {leave.facultyApproval.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${leave.wardenApproval?.status === 'Approved' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                                                    leave.wardenApproval?.status === 'Rejected' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                                        'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                                    }`}>
                                                    {leave.wardenApproval?.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {(leave.wardenApproval?.status === 'Pending' || !leave.wardenApproval) && (
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <button onClick={() => handleAction(leave._id, 'Approved')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-1.5 px-4 rounded-lg text-xs transition-all duration-300 shadow-lg shadow-green-500/20">
                                                            Approve
                                                        </button>
                                                        <button onClick={() => handleAction(leave._id, 'Rejected')} className="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-4 rounded-lg text-xs transition-all duration-300 shadow-lg shadow-red-500/20">
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="glass-card h-[600px] flex flex-col overflow-hidden">
                    <div className="flex flex-1 overflow-hidden">
                        <div className="w-1/3 border-r border-white/10 bg-black/20 overflow-y-auto">
                            <div className="p-4 border-b border-white/10 bg-white/5">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Conversations</h3>
                            </div>
                            {Array.from(new Set(messages.map(m => m.sender?._id === user?._id ? m.recipient?._id : m.sender?._id)))
                                .map(id => {
                                    const lastMsg = messages.find(m => m.sender?._id === id || m.recipient?._id === id);
                                    const contact = lastMsg?.sender?._id === user?._id ? lastMsg.recipient : lastMsg.sender;
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => setSelectedStudent(contact)}
                                            className={`w-full p-4 text-left hover:bg-white/5 transition-colors border-b border-white/5 ${selectedStudent?._id === id ? 'bg-primary/20 border-r-2 border-r-primary' : ''}`}
                                        >
                                            <div className="font-bold text-sm text-white truncate">{contact?.name || 'Unknown'}</div>
                                            <div className="text-[10px] text-gray-500 truncate">{lastMsg?.content}</div>
                                        </button>
                                    );
                                })}
                            {messages.length === 0 && <div className="p-8 text-center text-gray-500 text-xs italic">No messages found</div>}
                        </div>
                        <div className="flex-1 flex flex-col bg-white/5">
                            {selectedStudent ? (
                                <>
                                    <div className="p-4 border-b border-white/10 bg-white/5">
                                        <h3 className="font-bold text-white">{selectedStudent.name}</h3>
                                        <p className="text-[10px] text-primary uppercase font-bold tracking-widest">Student</p>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {messages
                                            .filter(m => (m.sender?._id === selectedStudent._id && m.recipient?._id === user?._id) || (m.sender?._id === user?._id && m.recipient?._id === selectedStudent._id))
                                            .slice().reverse()
                                            .map((msg, idx) => (
                                                <div key={msg._id || idx} className={`flex ${msg.sender?._id === user?._id ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender?._id === user?._id ? 'bg-primary text-white rounded-tr-none' : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/10'}`}>
                                                        {msg.content}
                                                        <div className="text-[10px] mt-1 opacity-50 text-right">
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                    <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
                                        <input type="text" className="glass-input !bg-white/5 flex-1" placeholder="Reply to student..." required value={replyContent} onChange={(e) => setReplyContent(e.target.value)} />
                                        <button type="submit" className="p-3 bg-primary text-white rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l7-7-7-7M5 12h14" /></svg></button>
                                    </form>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                                    <h3 className="text-sm font-medium">Select a student conversation</h3>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WardenDashboard;
