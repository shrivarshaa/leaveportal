import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Student', // Default
        studentId: '',
        facultyId: '',
        department: ''
    });

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData);
            toast.success('Registered successfully');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="glass-card max-w-md w-full space-y-8 p-10 transform hover:scale-[1.01] transition-all duration-300">
                <div>
                    <h2 className="heading-primary text-center text-3xl">Create Account</h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Join the portal to manage your leaves
                    </p>
                </div>
                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                            <input name="name" type="text" className="glass-input" placeholder="John Doe" onChange={handleChange} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                            <input name="email" type="email" className="glass-input" placeholder="john@example.com" onChange={handleChange} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                            <input name="password" type="password" className="glass-input" placeholder="••••••••" onChange={handleChange} required />
                        </div>
                        {/* Role is Student by default and locked */}
                        <input type="hidden" name="role" value="Student" />

                        <div className="animate-fade-in">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Student ID</label>
                            <input name="studentId" type="text" className="glass-input" placeholder="Format: 123456" onChange={handleChange} required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Department</label>
                            <input name="department" type="text" className="glass-input" placeholder="e.g. Computer Science" onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button type="submit" className="w-full btn-primary flex justify-center py-3 px-4 text-sm tracking-wide">
                            Register
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
