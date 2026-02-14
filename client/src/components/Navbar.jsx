import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="fixed w-full z-50 top-0 start-0 border-b border-white/20 bg-white/10 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <span className="heading-primary text-2xl">Easy Connect</span>
                        </Link>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {!user ? (
                                <>
                                    <Link to="/login" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300">Login</Link>
                                    <Link to="/register" className="btn-primary px-4 py-2 text-sm">Register</Link>
                                </>
                            ) : (
                                <>
                                    <span className="text-gray-300 px-3 py-2 text-sm font-medium">Hello, {user.name}</span>
                                    <button onClick={handleLogout} className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 backdrop-blur-sm">Logout</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
