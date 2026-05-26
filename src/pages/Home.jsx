import { motion } from 'framer-motion';
import { ArrowRight, Code, ShieldCheck, Zap, Star, Users, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full relative overflow-hidden min-h-[90vh] flex flex-col items-center justify-center">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-500/8 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent-500/6 rounded-full blur-[100px]"
          />
          <div className="absolute inset-0 bg-grid opacity-60" />
        </div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <span className="text-brand-700 text-sm font-medium">The #1 Marketplace for Developers</span>
            </motion.div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.1] mb-6">
              <span className="text-light-text">Premium Digital Assets</span>
              <br />
              <span className="gradient-text bg-gradient-to-r from-brand-500 via-purple-400 to-accent-500">
                Built by Top Developers
              </span>
            </h1>

            <p className="text-lg md:text-xl text-light-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
              Buy and sell production-ready web templates, mobile apps, SaaS boilerplates, and UI kits.
              Start building faster today.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/marketplace" className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold rounded-2xl transition-all duration-300 shadow-xl shadow-brand-500/20 hover:shadow-brand-500/35 active:scale-[0.98] overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  Explore Projects
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight size={20} />
                  </motion.span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </Link>
              <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-light-surface text-light-text font-semibold rounded-2xl border border-light-border hover:border-brand-300 transition-all duration-300 active:scale-[0.98] shadow-sm">
                Become a Seller
                <ArrowUpRight size={18} className="text-brand-500" />
              </Link>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16"
            >
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-light-text">500+</div>
                <div className="text-sm text-light-text-secondary mt-1">Projects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-light-text">2K+</div>
                <div className="text-sm text-light-text-secondary mt-1">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text">4.9</div>
                <div className="text-sm text-light-text-secondary mt-1">Avg. Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-light-text">99%</div>
                <div className="text-sm text-light-text-secondary mt-1">Satisfaction</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-light-surface/50 -z-10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-light-border to-transparent" />

        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="badge-primary mb-4">Why DevMarket</span>
            <h2 className="section-title">Built for Developers, Trusted by Teams</h2>
            <p className="section-subtitle mx-auto">Everything you need to build amazing products faster</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <FeatureCard
              icon={<ShieldCheck size={28} className="text-brand-500" />}
              title="Secure Transactions"
              description="Enterprise-grade payment processing with buyer protection and verified downloads."
              delay={0.1}
            />
            <FeatureCard
              icon={<Zap size={28} className="text-accent-500" />}
              title="Instant Delivery"
              description="Get immediate access to your digital files and source code right after purchase."
              delay={0.2}
            />
            <FeatureCard
              icon={<Code size={28} className="text-purple-500" />}
              title="High Quality Code"
              description="Every project is reviewed for quality, security, and documentation standards."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="w-full py-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-12 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 rounded-full blur-[80px]" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-500/8 rounded-full blur-[80px]" />

            <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10 text-light-text">
              Ready to <span className="gradient-text">Level Up</span> Your Projects?
            </h2>
            <p className="text-light-text-secondary text-lg mb-8 max-w-xl mx-auto relative z-10">
              Join thousands of developers building better products with premium digital assets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Link to="/marketplace" className="btn-primary text-base px-8 py-3.5">
                Get Started Now
              </Link>
              <Link to="/register" className="btn-secondary text-base px-8 py-3.5">
                Join as Seller
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ y: -8, transition: { duration: 0.2 } }}
    className="glass-card-hover p-8 group relative"
  >
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center mb-6 border border-brand-100 group-hover:border-brand-300 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-brand-500/10">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-light-text mb-3 group-hover:text-brand-600 transition-colors">{title}</h3>
    <p className="text-light-text-secondary leading-relaxed">{description}</p>
  </motion.div>
);

export default Home;
