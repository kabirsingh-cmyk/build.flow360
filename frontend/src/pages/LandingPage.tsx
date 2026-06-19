export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SF</span>
          </div>
          <span className="font-bold text-xl">SiteForge AI</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/login" className="text-gray-300 hover:text-white transition">Sign In</a>
          <a href="/register" className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-medium transition">
            Get Started Free
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 py-20 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Build Websites That{' '}
          <span className="text-blue-400">AI Can Find</span>
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          The first website builder with AEO (Answer Engine Optimization) built in. 
          Every site you create is structured to be cited by ChatGPT, Perplexity, and Gemini.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/register" className="bg-blue-500 hover:bg-blue-600 px-8 py-4 rounded-xl font-semibold text-lg transition">
            Build Your Site — Free
          </a>
          <a href="#how-it-works" className="bg-gray-700 hover:bg-gray-600 px-8 py-4 rounded-xl font-semibold text-lg transition">
            See How It Works
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="px-6 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">Built for the AI Era</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="font-bold text-lg mb-2">AI Site Generation</h3>
            <p className="text-gray-400">Describe your business in one sentence. Get a complete, professional website in under 5 minutes.</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-bold text-lg mb-2">AEO by Default</h3>
            <p className="text-gray-400">Auto-generated schema markup, semantic HTML, and AI-crawler optimization. No SEO knowledge required.</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📤</span>
            </div>
            <h3 className="font-bold text-lg mb-2">Own Your Code</h3>
            <p className="text-gray-400">Export as static HTML or React. No vendor lock-in. Your site, your code, your business.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8 text-center text-gray-500">
        <p>© 2026 SiteForge AI. Built for the AI era.</p>
      </footer>
    </div>
  )
}
