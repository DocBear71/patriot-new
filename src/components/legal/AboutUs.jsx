// file: src/components/legal/AboutUs.jsx v1 - Patriot Thanks About Us component

import React from 'react';

const AboutUs = () => {
    return (
            <div style={{
                maxWidth: '900px',
                margin: '0 auto',
                padding: '20px 40px',
                lineHeight: '1.6',
                fontFamily: 'Arial, sans-serif'
            }}>
                {/* Header Section */}
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '32px', color: '#2c3e50', marginBottom: '10px' }}>
                        About Patriot Thanks
                    </h1>
                    <p style={{ fontSize: '18px', color: '#7f8c8d', fontStyle: 'italic' }}>
                        Connecting those who serve with businesses that appreciate their sacrifice
                    </p>
                    <div style={{
                        backgroundColor: '#e8f5e8',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginTop: '1rem',
                        border: '2px solid #28a745'
                    }}>
                        <p style={{
                            fontSize: '16px',
                            color: '#155724',
                            margin: '0',
                            fontWeight: 'bold'
                        }}>
                            🇺🇸 Bridging the gap between service members, first responders, their families, and appreciative local businesses across the United States.
                        </p>
                    </div>
                </div>

                {/* About the Platform Section */}
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '1rem' }}>Our Mission</h2>
                    <p style={{ color: '#444', fontSize: '16px', marginBottom: '1rem' }}>
                        Patriot Thanks is a comprehensive web and mobile platform designed to connect veterans, active-duty military personnel, first responders, and their families with local businesses that offer discounts and incentives in appreciation of their service. Our platform serves a dual purpose: making it easier for those who serve our communities to find businesses that appreciate their service, while helping local businesses increase their customer base by showcasing their support for these important community members.
                    </p>

                    <p style={{ color: '#444', fontSize: '16px', marginBottom: '1rem' }}>
                        Whether you're looking for a restaurant that offers military discounts, a retailer with first responder incentives, or a service provider that values your family's sacrifice, Patriot Thanks connects you with local businesses that want to show appreciation for service members and their families. We help you find establishments that truly value your service and sacrifice, while providing businesses with a trusted platform to reach and serve those who serve.
                    </p>

                    <div style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', margin: '1.5rem 0' }}>
                        <h3 style={{ fontSize: '20px', color: '#2c3e50', marginBottom: '1rem' }}>What We Offer</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            <div>
                                <h4 style={{ color: '#e74c3c', fontSize: '16px', marginBottom: '0.5rem' }}>🔍 Easy Discovery</h4>
                                <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
                                    Find local businesses offering military and first responder discounts with our intuitive search and location-based discovery tools.
                                </p>
                            </div>
                            <div>
                                <h4 style={{ color: '#e74c3c', fontSize: '16px', marginBottom: '0.5rem' }}>✅ Verified Benefits</h4>
                                <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
                                    Access exclusive verified discounts and incentives specifically for service members, veterans, first responders, and their families.
                                </p>
                            </div>
                            <div>
                                <h4 style={{ color: '#e74c3c', fontSize: '16px', marginBottom: '0.5rem' }}>🏪 Business Directory</h4>
                                <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
                                    Comprehensive directory of participating businesses with detailed information about their discount programs and requirements.
                                </p>
                            </div>
                            <div>
                                <h4 style={{ color: '#e74c3c', fontSize: '16px', marginBottom: '0.5rem' }}>📱 Mobile Access</h4>
                                <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
                                    Available as a responsive web app and progressive web app (PWA) for easy access on any device, anywhere.
                                </p>
                            </div>
                            <div>
                                <h4 style={{ color: '#e74c3c', fontSize: '16px', marginBottom: '0.5rem' }}>⭐ Reviews & Ratings</h4>
                                <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
                                    Read and share experiences with fellow service members to help build a trusted community of recommendations.
                                </p>
                            </div>
                            <div>
                                <h4 style={{ color: '#e74c3c', fontSize: '16px', marginBottom: '0.5rem' }}>🔒 Secure Verification</h4>
                                <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
                                    Secure verification system to protect the integrity of discounts and ensure benefits reach those who have earned them.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Who We Serve Section */}
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '1rem' }}>Who We Serve</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        <div style={{ backgroundColor: '#e8f5e8', padding: '1.5rem', borderRadius: '8px', border: '1px solid #28a745' }}>
                            <h3 style={{ fontSize: '18px', color: '#155724', marginBottom: '1rem' }}>🇺🇸 Military Community</h3>
                            <ul style={{ color: '#155724', fontSize: '15px', marginLeft: '1.5rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}>Active-duty military personnel (all branches)</li>
                                <li style={{ marginBottom: '0.5rem' }}>Veterans of the U.S. Armed Forces</li>
                                <li style={{ marginBottom: '0.5rem' }}>National Guard and Reserve members</li>
                                <li style={{ marginBottom: '0.5rem' }}>Military retirees</li>
                                <li>Military spouses and dependents</li>
                            </ul>
                        </div>

                        <div style={{ backgroundColor: '#fff3cd', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ffc107' }}>
                            <h3 style={{ fontSize: '18px', color: '#856404', marginBottom: '1rem' }}>🚒 First Responders</h3>
                            <ul style={{ color: '#856404', fontSize: '15px', marginLeft: '1.5rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}>Police officers and law enforcement</li>
                                <li style={{ marginBottom: '0.5rem' }}>Firefighters and fire department personnel</li>
                                <li style={{ marginBottom: '0.5rem' }}>Emergency Medical Services (EMS) and paramedics</li>
                                <li style={{ marginBottom: '0.5rem' }}>Emergency dispatchers</li>
                                <li>First responder families</li>
                            </ul>
                        </div>

                        <div style={{ backgroundColor: '#e3f2fd', padding: '1.5rem', borderRadius: '8px', border: '1px solid #2196f3' }}>
                            <h3 style={{ fontSize: '18px', color: '#1565c0', marginBottom: '1rem' }}>🏪 Local Businesses</h3>
                            <ul style={{ color: '#1565c0', fontSize: '15px', marginLeft: '1.5rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}>Restaurants and food service</li>
                                <li style={{ marginBottom: '0.5rem' }}>Retail stores and shopping</li>
                                <li style={{ marginBottom: '0.5rem' }}>Automotive services</li>
                                <li style={{ marginBottom: '0.5rem' }}>Professional services</li>
                                <li>Entertainment and recreation venues</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* About the Creator Section */}
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '2rem' }}>About the Creator</h2>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        marginBottom: '2rem'
                    }}>
                        <div style={{
                            textAlign: 'center',
                            marginBottom: '2rem',
                            marginRight: '0'
                        }}>
                            <div style={{
                                width: '200px',
                                height: '200px',
                                borderRadius: '50%',
                                backgroundColor: '#e9ecef',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem auto',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                border: '4px solid #f8f9fa',
                                overflow: 'hidden'
                            }}>
                                <img
                                        alt="Dr. Edward McKeown"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            borderRadius: '50%'
                                        }}
                                        src="/images/edmckeown.jpg"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                />
                                <span style={{
                                    fontSize: '24px',
                                    color: '#6c757d',
                                    display: 'none'
                                }}>🇺🇸</span>
                            </div>
                            <h3 style={{fontSize: '20px', color: '#2c3e50', marginBottom: '0.5rem'}}>Dr. Edward McKeown</h3>
                            <p style={{ fontSize: '16px', color: '#7f8c8d', fontStyle: 'italic', margin: '0' }}>
                                U.S. Marine Corps Veteran<br/>
                                Founder & Creator of Patriot Thanks
                            </p>
                        </div>

                        <div style={{
                            flex: 1,
                            maxWidth: '800px',
                            textAlign: 'left'
                        }}>
                            <p style={{ color: '#444', fontSize: '16px', marginBottom: '1rem' }}>
                                Dr. Edward McKeown, a United States Marine Corps veteran, is the founder and creator of Patriot Thanks. Born in Mexico, Missouri, Dr. McKeown brings over 30 years of experience in hospitality management, food safety, business operations, and now technology to this innovative platform designed to honor and support those who serve our communities.
                            </p>

                            <p style={{ color: '#444', fontSize: '16px', marginBottom: '1rem' }}>
                                Dr. McKeown's educational journey spans decades of continuous learning. He began at Pima Community College in 1996, earning his Associate's degree in General Studies with an emphasis on culinary arts, plus a certificate in Hotel Food & Beverage Management. He continued at the University of Nevada, Las Vegas, earning his Bachelor's (2006) and Master's (2008) degrees in Hotel Administration, followed by his Ph.D. in Hospitality and Tourism Management from Purdue University in 2014, focusing on food safety procedures at public food cook-off competitions.
                            </p>

                            <p style={{ color: '#444', fontSize: '16px', marginBottom: '1rem' }}>
                                Making a career pivot toward technology, Dr. McKeown is currently pursuing dual degrees in Computer Software Development and Web Application Development at Kirkwood Community College, along with certifications in Java Programming and .NET Programming. This unique combination of hospitality expertise, business experience, and technical skills enables him to create platforms that truly serve both service members and the businesses that want to support them.
                            </p>
                        </div>
                    </div>

                    <div style={{ backgroundColor: '#fff3cd', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
                        <h3 style={{ fontSize: '18px', color: '#856404', marginBottom: '1rem' }}>Professional Background & Service</h3>
                        <p style={{ color: '#856404', fontSize: '15px', marginBottom: '1rem' }}>
                            Throughout his career, Dr. McKeown has worked with major companies including Waffle House, Hilton Hotels, The Flamingo Hotel and Casino, Burger King, and Popeye's Chicken. He is a certified ServSafe Food Protection Manager and Instructor and holds multiple certifications in food safety and responsible alcohol service training.
                        </p>
                        <p style={{ color: '#856404', fontSize: '15px', marginBottom: '1rem' }}>
                            As an active member of Kirkwood's Veterans' Association, Dr. McKeown continues to support fellow veterans in their educational and career transitions. He's also known in his community for occasionally donning the red suit to play Santa for special needs children, demonstrating his commitment to giving back to those who need extra support.
                        </p>
                        <p style={{ color: '#856404', fontSize: '15px', margin: '0' }}>
                            Dr. McKeown is also the author of the "Doc Bear's Comfort Food Survival Guide" cookbook series and operates Doc Bear Enterprises, where he provides food safety training, technology solutions, and now platforms like Patriot Thanks that serve communities. He's a certified BBQ judge through the Kansas City BBQ Society and has published research papers on food safety and hospitality management.
                        </p>
                    </div>
                </section>

                {/* Our Commitment Section */}
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '1rem' }}>Our Commitment</h2>
                    <p style={{ color: '#444', fontSize: '16px', marginBottom: '1rem' }}>
                        Patriot Thanks was born from a simple belief: those who serve our communities deserve recognition and support from local businesses. By connecting service members, veterans, first responders, and their families with businesses that offer meaningful discounts and incentives, we're building stronger community bonds while helping local businesses thrive.
                    </p>

                    <p style={{ color: '#444', fontSize: '16px', marginBottom: '1rem' }}>
                        Our platform makes it easy for businesses to demonstrate their appreciation while reaching new customers who value that support. Together, we're creating a network of mutual respect and community support that benefits everyone involved.
                    </p>

                    <div style={{ backgroundColor: '#d1ecf1', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #17a2b8' }}>
                        <h3 style={{ fontSize: '18px', color: '#0c5460', marginBottom: '1rem' }}>Why Patriot Thanks Matters</h3>
                        <ul style={{ color: '#0c5460', fontSize: '15px', marginLeft: '1.5rem' }}>
                            <li style={{ marginBottom: '0.5rem' }}>Honoring service by making it easier to find appreciative businesses</li>
                            <li style={{ marginBottom: '0.5rem' }}>Supporting military families during transitions and challenging times</li>
                            <li style={{ marginBottom: '0.5rem' }}>Helping first responders feel valued in their communities</li>
                            <li style={{ marginBottom: '0.5rem' }}>Connecting local businesses with customers who value their support</li>
                            <li style={{ marginBottom: '0.5rem' }}>Building stronger community connections between those who serve and those they protect</li>
                            <li>Creating a trusted platform where service and appreciation meet</li>
                        </ul>
                    </div>
                </section>

                {/* Technology Section */}
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '1rem' }}>Built with Modern Technology</h2>
                    <p style={{ color: '#444', fontSize: '16px', marginBottom: '1rem' }}>
                        Patriot Thanks is built using cutting-edge web technologies including React and Next.js for a responsive, intuitive user interface. The platform is designed to work seamlessly across all devices and is available as a Progressive Web App (PWA), allowing for offline access and app-like functionality on mobile devices.
                    </p>

                    <p style={{ color: '#444', fontSize: '16px', marginBottom: '1rem' }}>
                        We prioritize security and privacy, implementing robust verification systems to protect the integrity of military and first responder discounts while safeguarding user information. Our platform integrates with reliable business databases and verification services to provide accurate, up-to-date information about participating businesses and their discount programs.
                    </p>

                    <p style={{ color: '#444', fontSize: '16px' }}>
                        The platform is optimized for mobile-first usage, recognizing that many service members and first responders need quick, reliable access to discount information while on the go. With fast loading times, intuitive navigation, and offline capabilities, Patriot Thanks ensures that finding and using service member discounts is always convenient and reliable.
                    </p>
                </section>

                {/* Contact Section */}
                <section style={{
                    backgroundColor: '#f8f9fa',
                    padding: '2rem',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <h2 style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '1rem' }}>Join Our Mission</h2>
                    <p style={{ color: '#666', fontSize: '16px', marginBottom: '1.5rem' }}>
                        Whether you're a service member looking for appreciative businesses, a business owner wanting to support those who serve, or simply someone who believes in honoring our military and first responders, we invite you to be part of the Patriot Thanks community.
                    </p>
                    <div style={{ color: '#666', fontSize: '16px' }}>
                        <p><strong>Doc Bear Enterprises, LLC.</strong></p>
                        <p>5249 N Park Pl NE, PMB 4011<br/>Cedar Rapids, IA 52402</p>
                        <p>
                            Email: <a href="mailto:privacy@patriotthanks.com" style={{ color: '#e74c3c', textDecoration: 'none' }}>privacy@patriotthanks.com</a><br/>
                            Website: <a href="https://www.docbear-ent.com" target="_blank" rel="noopener noreferrer" style={{ color: '#e74c3c', textDecoration: 'none' }}>www.docbear-ent.com</a>
                        </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginTop: '2rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🇺🇸</div>
                            <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>Honor Service</div>
                            <div style={{ fontSize: '14px', color: '#666' }}>Recognize those who serve</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤝</div>
                            <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>Build Community</div>
                            <div style={{ fontSize: '14px', color: '#666' }}>Connect service & appreciation</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💪</div>
                            <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>Support Local</div>
                            <div style={{ fontSize: '14px', color: '#666' }}>Strengthen local businesses</div>
                        </div>
                    </div>
                </section>

                {/* Footer Note */}
                <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#e9ecef', borderRadius: '5px' }}>
                    <p style={{ color: '#6c757d', fontSize: '14px', textAlign: 'center', margin: '0' }}>
                        Patriot Thanks - Where service meets appreciation, one business at a time. 🇺🇸
                    </p>
                </div>
            </div>
    );
};

export default AboutUs;