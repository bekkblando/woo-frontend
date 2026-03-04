const Footer = () => {
    return (
        <footer className="w-full bg-[#f1f1f1] border-t border-gray-300 mt-auto pt-12 min-h-24">
            <div className="w-full px-6 md:px-12 py-4 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-4" style={{ minHeight: '3rem' }}>
                {/* Left: Logo + Text */}
                <div className="flex-1 flex items-center gap-4">
                    <img src="/government-logo.png" alt="Ministerie van Justitie en Veiligheid" className="h-16 object-contain" />
                    <div className="text-[#9c9ea3]" style={{ fontSize: '0.7rem', lineHeight: '1.4' }}>
                        <p>
                            <span className="font-bold">VraagMijnOverheid</span> is ontwikkeld in samenwerking
                        </p>
                        <p>
                            tussen het Ministerie van Justitie en Veiligheid en
                        </p>
                        <p>Thoughtful Oasis.</p>
                        <p>
                            Meer weten?{" "}
                            <a
                                href="mailto:rens@thoughtful-oasis.com"
                                className="underline hover:text-[#154273] transition-colors"
                            >
                                Kom in contact
                            </a>
                            .
                        </p>
                    </div>
                </div>

                {/* Center: Copyright */}
                <div className="flex-1 text-[#9c9ea3] text-center self-center" style={{ fontSize: '0.7rem' }}>
                    © 2026 Thoughtful Oasis B.V. All rights reserved.
                </div>

                {/* Right: Links */}
                <div className="flex-1 flex flex-col items-end gap-1">
                    <a
                        href="/privacy"
                        className="text-[#9c9ea3] hover:text-[#154273] transition-colors underline"
                        style={{ fontSize: '0.7rem' }}
                    >
                        Privacy policy
                    </a>
                    <a
                        href="https://www.rijksoverheid.nl"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#9c9ea3] hover:text-[#154273] transition-colors underline"
                        style={{ fontSize: '0.7rem' }}
                    >
                        Publicatie op Rijksoverheid.nl
                    </a>
                    <a
                        href="https://thoughtful-oasis.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#9c9ea3] hover:text-[#154273] transition-colors underline"
                        style={{ fontSize: '0.7rem' }}
                    >
                        Thoughtful Oasis
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
