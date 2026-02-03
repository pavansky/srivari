"use client";

import Link from "next/link";
import { ShoppingBag, User, Search } from "lucide-react";
import { useEffect, useState } from "react";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container header-content">
        <nav className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/collections">Sarees</Link>
          <Link href="/about">Heritage</Link>
        </nav>

        <div className="logo">
          <Link href="/">
            <h1>SRIVARI'S</h1>
            <span className="tagline">The Royal Drape</span>
          </Link>
        </div>

        <div className="actions">
          <Link href="#" className="icon-link">
            <Search size={20} />
          </Link>
          <Link href="/admin" className="icon-link">
            <User size={20} />
          </Link>
          <Link href="/cart" className="icon-link">
            <ShoppingBag size={20} />
          </Link>
        </div>
      </div>


    </header>
  );
};

export default Header;
