import { Link } from 'react-router-dom';
import { blogPosts } from './BlogPostPage';

export default function BlogPage() {
    const posts = [
        {
            slug: 'ai-transforming-rfp-response',
            title: 'How AI is Transforming RFP Response Management in 2025',
            excerpt: 'Discover how modern AI tools including RAG, custom training, and win predictions are helping teams win more proposals in less time.',
            date: 'Dec 26, 2024',
            readTime: '8 min read',
            category: 'AI & Automation',
            featured: true
        },
        {
            slug: '10-tips-winning-proposals',
            title: '10 Expert Tips for Writing Winning RFP Proposals',
            excerpt: 'After analyzing thousands of successful proposals, we reveal the strategies that separate winners from also-rans.',
            date: 'Dec 24, 2024',
            readTime: '10 min read',
            category: 'Best Practices'
        },
        {
            slug: 'building-knowledge-base-rfp',
            title: 'Building a Knowledge Base for RFP Success: A Complete Guide',
            excerpt: 'How to organize your company content for faster, more consistent responses. From audit to implementation.',
            date: 'Dec 22, 2024',
            readTime: '12 min read',
            category: 'Productivity'
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
            {/* Header */}
            <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-lg">⚡</div>
                        <span className="text-xl font-bold text-white">RFPgrep</span>
                    </Link>
                    <Link to="/" className="text-white/70 hover:text-white transition-colors">← Back to Home</Link>
                </div>
            </nav>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-5xl font-bold text-white mb-6">Blog</h1>
                <p className="text-xl text-white/70 mb-12">Insights, tips, and strategies to help you win more RFPs.</p>

                {/* Featured Post */}
                {posts.filter(p => p.featured).map((post) => (
                    <Link key={post.slug} to={`/blog/${post.slug}`}>
                        <article className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-md rounded-2xl p-8 border border-indigo-500/30 hover:border-indigo-400/50 transition-all mb-12 group">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-sm px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-300">
                                    ⭐ Featured
                                </span>
                                <span className="text-sm px-3 py-1 rounded-full bg-white/10 text-white/70">
                                    {post.category}
                                </span>
                                <span className="text-white/50 text-sm">{post.date}</span>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">
                                {post.title}
                            </h2>
                            <p className="text-white/70 text-lg mb-4">{post.excerpt}</p>
                            <div className="flex items-center gap-4">
                                <span className="text-white/50 text-sm">{post.readTime}</span>
                                <span className="text-indigo-400 font-medium group-hover:translate-x-2 transition-transform inline-flex items-center gap-1">
                                    Read article →
                                </span>
                            </div>
                        </article>
                    </Link>
                ))}

                {/* Other Posts */}
                <div className="space-y-6">
                    {posts.filter(p => !p.featured).map((post) => (
                        <Link key={post.slug} to={`/blog/${post.slug}`}>
                            <article className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 hover:border-indigo-500/50 transition-all group">
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="text-sm px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400">
                                        {post.category}
                                    </span>
                                    <span className="text-white/50 text-sm">{post.date}</span>
                                    <span className="text-white/50 text-sm">• {post.readTime}</span>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">
                                    {post.title}
                                </h2>
                                <p className="text-white/70">{post.excerpt}</p>
                                <div className="mt-4">
                                    <span className="text-indigo-400 font-medium group-hover:translate-x-2 transition-transform inline-block">
                                        Read more →
                                    </span>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>

                {/* Newsletter CTA */}
                <div className="mt-16 text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-4xl mb-4 block">📬</span>
                    <h2 className="text-2xl font-bold text-white mb-4">Get RFP Tips in Your Inbox</h2>
                    <p className="text-white/70 mb-6">Join 1,000+ proposal professionals getting weekly insights.</p>
                    <div className="flex justify-center gap-2 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-indigo-500"
                        />
                        <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform">
                            Subscribe
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
