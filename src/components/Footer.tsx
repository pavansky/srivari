const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="brand">
            <h2>SRIVARI'S</h2>
            <p>Timeless Elegance, Woven Tradition.</p>
          </div>
          <div className="links">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="/about">About Us</a></li>
              <li><a href="/collections">Collections</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/admin">Admin Login</a></li>
            </ul>
          </div>
          <div className="contact">
            <h3>Visit Us</h3>
            <p>123, Heritage Lane,<br />Malleswaram, Bangalore - 560003</p>
            <p>+91 97399 88771</p>
          </div>
        </div>
        <div className="copyright">
          <p>&copy; {new Date().getFullYear()} Srivari's Saree Store. All rights reserved.</p>
        </div>
      </div>
      <style jsx>{`
          .footer {
            background-color: #1a1a1a;
            color: #fff;
            padding: 4rem 0 2rem;
            margin-top: 4rem;
          }
          .footer-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
          }
          .brand h2 {
            font-family: var(--font-serif);
            color: var(--color-secondary);
            margin-bottom: 1rem;
          }
          .links h3, .contact h3 {
            font-family: var(--font-serif);
            color: var(--color-secondary);
            margin-bottom: 1rem;
            font-size: 1.2rem;
          }
          .links ul {
            list-style: none;
          }
          .links li {
            margin-bottom: 0.5rem;
          }
          .links a {
            color: #ccc;
            transition: color 0.3s;
          }
          .links a:hover {
            color: var(--color-secondary);
          }
          .contact p {
            color: #ccc;
            line-height: 1.6;
          }
          .copyright {
            text-align: center;
            border-top: 1px solid #333;
            padding-top: 2rem;
            font-size: 0.8rem;
            color: #666;
          }
        `}</style>
    </footer>
  );
};

export default Footer;
