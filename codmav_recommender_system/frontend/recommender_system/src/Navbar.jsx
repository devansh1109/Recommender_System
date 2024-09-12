import React from 'react';
import './navbar.css';

const Navbar = () => {
    return ( 
        <div className="navbar-container">
            <div className="navbar">
                <div className="logo-container">
                    <img src="https://research.pes.edu/wp-content/uploads/2023/03/PESU-new-logo.png" alt="PESU Logo" />
                </div>
                    <a href="http://localhost:3000/centres">Centres</a>
                    <a href="http://localhost:3000/professors">Faculty</a>
                    <a href='http://localhost:3000/rprogram'>PHD program</a>
                    <a href="http://localhost:3000/patent-process">research-grant</a>
                    <a href='http://localhost:3000/conference'>Conference</a>
                    <a href='http://localhost:3000/journals'>journals</a>
                    <a href='http://localhost:3000/journals'>Community</a>
                    <a href="http://localhost:3000/research-support">Research Support</a>
                    <a href="http://localhost:3000/Contact">contact-us</a>
            </div>
        </div>
     );
}
 
export default Navbar;