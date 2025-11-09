import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* --- Background Video --- */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        src="/videos/bg-video.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* --- Dark Overlay --- */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      {/* --- Navbar --- */}
      <nav className="absolute top-0 left-0 w-full z-20 flex justify-between items-center px-8 py-4 bg-black/30 backdrop-blur-md text-white shadow-lg">
      <Link to="/" className="text-2xl font-bold text-primary-600">Procuroid</Link>


        <div className="space-x-4">
          <button
            onClick={() => navigate('/signin')}
            className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/30 transition"
          >
            Log In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* --- Hero Content --- */}
      <div className="relative z-10 flex flex-col justify-center items-start h-full px-12 max-w-2xl text-white">
        <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
          Simplify Your Procurement Workflow
        </h1>
        <p className="text-lg mb-6 drop-shadow-md">
          Automate, manage, and track procurement operations seamlessly with Procuroid.
        </p>
        <button
          onClick={() => navigate('/signin')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold shadow-lg transition-transform hover:scale-105"
        >
          Get Started
        </button>
      </div>

      {/* --- Footer --- */}
      <footer className="absolute bottom-0 w-full text-center text-white/80 py-4 text-sm z-10">
        © {new Date().getFullYear()} Procuroid. All rights reserved.
      </footer>
    </div>
  );
}
