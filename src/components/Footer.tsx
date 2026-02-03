"use client";

const Footer = () => {
  return (
    <footer className="editorial-footer">
      <div className="container footer-grid">
        <div className="footer-col footer-brand">
          <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-secondary)' }}>SRIVARI'S</h2>
          <p>
            Weaving legacy into every thread. Authentic Kanjivaram and Banarasi silks for the modern royalty.
          </p>
        </div>

        <div className="footer-col">
          <h4>Collections</h4>
          <ul className="footer-links" style={{ listStyle: 'none', padding: 0 }}>
            <li><a href="#">Kanjivaram Silk</a></li>
            <li><a href="#">Banarasi Silk</a></li>
            <li><a href="#">Mysore Silk</a></li>
            <li><a href="#">Tussar Georgette</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Support</h4>
          <ul className="footer-links" style={{ listStyle: 'none', padding: 0 }}>
            <li><a href="#">Order Tracking</a></li>
            <li><a href="#">Shipping Policy</a></li>
            <li><a href="#">Returns & Exchange</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Newsletter</h4>
          <p style={{ marginBottom: '1rem', color: '#888', fontSize: '0.9rem' }}>Subscribe for exclusive drops and heritage stories.</p>
          <form onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Your Email Address" className="newsletter-input" />
            <button type="submit" className="cta-button" style={{ padding: '0.8rem 2rem', fontSize: '0.8rem', marginTop: '1rem' }}>
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="container copyright">
        <p>&copy; {new Date().getFullYear()} Srivari's Saree Store. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
