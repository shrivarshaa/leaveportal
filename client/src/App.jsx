import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import WardenDashboard from './pages/HODDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LeaveApplication from './pages/LeaveApplication';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PrivateRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/" />; // Redirect to home or unauthorized page
    }

    return children;
};

// Redirect based on role
const DashboardRedirect = () => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;

    switch (user.role) {
        case 'Student': return <Navigate to="/student-dashboard" />;
        case 'Faculty': return <Navigate to="/faculty-dashboard" />;
        case 'Warden': return <Navigate to="/warden-dashboard" />;
        case 'Admin': return <Navigate to="/admin-dashboard" />;
        default: return <Navigate to="/login" />;
    }
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="min-h-screen text-white">
                    <Navbar />
                    <div className="container mx-auto px-4 py-8">
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/" element={<DashboardRedirect />} />

                            <Route path="/student-dashboard" element={
                                <PrivateRoute roles={['Student']}>
                                    <StudentDashboard />
                                </PrivateRoute>
                            } />

                            <Route path="/apply-leave" element={
                                <PrivateRoute roles={['Student']}>
                                    <LeaveApplication />
                                </PrivateRoute>
                            } />

                            <Route path="/faculty-dashboard" element={
                                <PrivateRoute roles={['Faculty']}>
                                    <FacultyDashboard />
                                </PrivateRoute>
                            } />

                            <Route path="/warden-dashboard" element={
                                <PrivateRoute roles={['Warden']}>
                                    <WardenDashboard />
                                </PrivateRoute>
                            } />

                            <Route path="/admin-dashboard" element={
                                <PrivateRoute roles={['Admin']}>
                                    <AdminDashboard />
                                </PrivateRoute>
                            } />

                        </Routes>
                    </div>
                    <ToastContainer />
                </div>
            </AuthProvider>
        </Router>
    )
}

export default App
