import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../services/supabaseClient';
import { FiSearch, FiBell, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { PiPlantFill } from 'react-icons/pi';

export default function Navbar({ userEmail }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button
          className="navbar-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>

        <div className="navbar-brand">
          <div className="navbar-logo" style={{ background: 'transparent', width: '42px', height: '42px', boxShadow: 'none' }}>
            <img src="/kisanstocks-logo.svg" alt="KS" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
          </div>
          <div>
            <span className="navbar-title" style={{fontSize: '1.4rem'}}>KisanStocks</span>
          </div>
        </div>
      </div>

      <div className={`navbar-center ${mobileOpen ? 'navbar-center--open' : ''}`}>
        {/* Search removed per request */}
      </div>

      <div className="navbar-right">
        <div className="navbar-user">
          <div className="navbar-avatar">
            {userEmail ? userEmail[0].toUpperCase() : 'U'}
          </div>
        </div>

        <button
          className="navbar-signout-btn"
          onClick={handleSignOut}
          title="Sign out"
        >
          <FiLogOut size={16} />
          <span className="navbar-signout-text">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
