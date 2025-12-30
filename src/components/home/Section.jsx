import React from 'react';
import '../../styles/home/Section.css';

const Section = ({ title, children, className = "" }) => (
    <div className={`home-section ${className}`}>
        <div className="section-header">
            <h2>{title}</h2>
        </div>
        <div className="section-content-scroll">
            {children}
        </div>
    </div>
);

export default Section;
