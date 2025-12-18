import { Link } from 'react-router-dom';

export default function BlogPage() {
    const posts = [
        {
            title: 'How AI is Transforming RFP Response Management',
            excerpt: 'Discover how modern AI tools are helping teams win more proposals in less time.',
            date: 'Dec 15, 2024',
            readTime: '5 min read',
            category: 'AI & Automation'
        },
        {
            title: '10 Tips for Writing Winning Proposals',
            excerpt: 'Expert strategies to make your RFP responses stand out from the competition.',
            date: 'Dec 10, 2024',
            readTime: '7 min read',
            category: 'Best Practices'
        },
        {
            title: 'Building a Knowledge Base for RFP Success',
            excerpt: 'How to organize your company content for faster, more consistent responses.',
            date: 'Dec 5, 2024',
            readTime: '6 min read',
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
                <p className="text-xl text-white/70 mb-12">Insights, tips, and updates from the RFPgrep team.</p>

                {/* Posts */}
                <div className="space-y-8">
                    {posts.map((post, i) => (
                        <article key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 hover:border-indigo-500/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-sm px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400">
                                    {post.category}
                                </span>
                                <span className="text-white/50 text-sm">{post.date}</span>
                                <span className="text-white/50 text-sm">• {post.readTime}</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">{post.title}</h2>
                            <p className="text-white/70">{post.excerpt}</p>
                            <div className="mt-4">
                                <span className="text-indigo-400 font-medium">Read more →</span>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Coming Soon */}
                <div className="mt-16 text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-4xl mb-4 block">📝</span>
                    <h2 className="text-2xl font-bold text-white mb-4">More articles coming soon!</h2>
                    <p className="text-white/70">We're working on more content to help you succeed.</p>
                </div>
            </div>
        </div>
    );
}
