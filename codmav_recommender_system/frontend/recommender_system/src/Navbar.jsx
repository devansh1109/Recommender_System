import React from 'react';
import './navbar.css';

const Navbar = () => {
    return ( 
        <div className="navbar-container">
            <div className="navbar">
                <div className="logo-container">
                    <img src="https://research.pes.edu/wp-content/uploads/2023/03/PESU-new-logo.png" alt="PESU Logo" />
                </div>
                <div className="nav-links">
                    <a href="/centres">Centres</a>
                    <a href="/professors">Faculty</a>
                    <a>PHD program</a>
                    <a href="patent-process">research-grant</a>
                    <a>Conference</a>
                    <a>journals</a>
                    <a>Community</a>
                    <a href="research-support">Research Support</a>
                    <a href="research-support">contact us</a>
                    <a href="/login">login</a>
                </div>
            </div>
        </div>
     );
}
 
export default Navbar;