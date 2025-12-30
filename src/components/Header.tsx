import Link from 'next/link';
import { ShoppingBag, User } from 'lucide-react';

const Header = () => {
    return (
        <header className="header">
            <div className="container header-content">
                <nav className="nav-links">
                    <Link href="/">Home</Link>
                    <Link href="/collections">Collections</Link>
                    <Link href="/about">Our Heritage</Link>
                </nav>

                <div className="logo">
                    <Link href="/">
                        <h1>SRIVARI'S</h1>
                        <span className="tagline">The Royal Drape</span>
                    </Link>
                </div>

                <div className="actions">
                    <Link href="/admin" className="icon-link">
                        <User size={20} />
                    </Link>
                    <Link href="/cart" className="icon-link">
                        <ShoppingBag size={20} />
                    </Link>
                </div>
            </div>

            <style jsx>{`
        .header {
          padding: 2rem 0;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          position: sticky;
          top: 0;
          background: rgba(253, 251, 247, 0.95);
          backdrop-filter: blur(10px);
          z-index: 100;
        }
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          text-align: center;
        }
        .logo h1 {
          font-family: var(--font-serif);
          font-size: 2.5rem;
          letter-spacing: 0.1em;
          color: var(--color-primary);
          margin-bottom: 0.2rem;
        }
        .tagline {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          color: var(--color-secondary);
        }
        .nav-links {
          display: flex;
          gap: 2rem;
        }
        .nav-links a {
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: color 0.3s;
        }
        .nav-links a:hover {
          color: var(--color-primary);
        }
        .actions {
          display: flex;
          gap: 1.5rem;
        }
        .icon-link {
          color: var(--color-text-main);
          transition: color 0.3s;
        }
        .icon-link:hover {
          color: var(--color-primary);
        }
        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 1rem;
          }
          .nav-links {
            display: none; /* Mobile menu to be implemented */
          }
        }
      `}</style>
        </header>
    );
};

export default Header;
