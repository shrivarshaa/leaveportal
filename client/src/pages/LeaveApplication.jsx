import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const LeaveApplication = () => {
    const [leaveType, setLeaveType] = useState('Medical');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [file, setFile] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('leaveType', leaveType);
        formData.append('startDate', startDate);
        formData.append('endDate', endDate);
        formData.append('reason', reason);
        if (file) {
            formData.append('documents', file);
        }

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            };
            await axios.post('/api/leaves/apply', formData, config);
            toast.success('Leave applied successfully');
            navigate('/student-dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to apply');
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-24 mb-10">
            <div className="glass-card p-8">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/student-dashboard')}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                        title="Go Back"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h2 className="heading-primary text-2xl">Apply for Leave</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Leave Type</label>
                        <div className="relative">
                            <select className="glass-input appearance-none cursor-pointer" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                                <option value="Medical" className="text-gray-800">Medical Leave</option>
                                <option value="Casual" className="text-gray-800">Casual Leave</option>
                                <option value="On-Duty" className="text-gray-800">On-Duty</option>
                                <option value="Emergency" className="text-gray-800">Emergency Leave</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">Start Date</label>
                            <input type="date" className="glass-input [color-scheme:dark]" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">End Date</label>
                            <input type="date" className="glass-input [color-scheme:dark]" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-gray-300 text-sm font-medium">Reason</label>
                            <button
                                type="button"
                                onClick={() => {
                                    const templates = {
                                        'Medical': 'I am writing to request a medical leave as I am suffering from a severe viral infection and have been advised by my physician to take complete bed rest for recovery.',
                                        'Casual': 'I am requesting a casual leave to attend an important family event that requires my presence. I will ensure all my academic responsibilities are up to date.',
                                        'On-Duty': 'I am applying for an On-Duty leave to represent our college in the upcoming inter-collegiate tech symposium. I will submit the participation certificate upon my return.',
                                        'Emergency': 'I request an immediate emergency leave due to a critical health situation in my family that requires my urgent attention at home.'
                                    };
                                    setReason(templates[leaveType]);
                                    toast.info('AI Assistant: Professional template applied!');
                                }}
                                className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-1 rounded-full hover:bg-indigo-500/30 transition-all flex items-center gap-1"
                            >
                                <span className="animate-pulse">✨</span> AI Leave Assistant
                            </button>
                        </div>
                        <textarea className="glass-input h-32 resize-none" placeholder="Provide detailed reason for leave..." value={reason} onChange={(e) => setReason(e.target.value)} required></textarea>
                    </div>

                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Supporting Document (Optional)</label>
                        <input type="file" className="glass-input file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20" onChange={(e) => setFile(e.target.files[0])} />
                    </div>

                    <button type="submit" className="btn-primary w-full mt-4">Submit Application</button>
                </form>
            </div>
        </div>
    );
};

export default LeaveApplication;
