import { Camera, Sparkles, Heart, TrendingUp } from 'lucide-react';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';

export function HomePage() {
  const { setCurrentPage } = useApp();

  const features = [
    {
      icon: Camera,
      title: 'Snap Your Ingredients',
      description: 'Take a photo of what you have in your kitchen and let AI do the work',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Suggestions',
      description: 'Get instant recipe recommendations tailored to your ingredients',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Heart,
      title: 'Track Your Favorites',
      description: 'Save recipes you love and get personalized recommendations',
      color: 'from-red-500 to-pink-500',
    },
    {
      icon: TrendingUp,
      title: 'Nutritional Insights',
      description: 'View detailed nutrition info for every recipe to meet your goals',
      color: 'from-blue-500 to-cyan-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/20 to-green-100/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-block animate-bounce mb-6">
                <Camera className="w-16 h-16 text-amber-500" />
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                  Snap. Discover. Cook.
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-2xl">
                Turn your ingredients into delicious recipes instantly. Let AI be your personal chef assistant.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={() => setCurrentPage('input')}
                  className="shadow-2xl"
                >
                  Get Started
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setCurrentPage('favorites')}
                >
                  My Favorites
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <img
                  src="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Fresh ingredients"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 max-w-xs">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                  <span className="font-bold text-gray-900">AI Powered</span>
                </div>
                <p className="text-sm text-gray-600">
                  Recognize ingredients instantly and suggest perfect recipes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI that knows what's for Dinner (Before You Do 😉)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} mb-6`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Cooking?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Cooking Starts With What You Have
          </p>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setCurrentPage('input')}
            className="bg-white text-orange-600 border-white hover:bg-orange-50"
          >
            Start Cooking Now
          </Button>
        </div>
      </div>
    </div>
  );
}
