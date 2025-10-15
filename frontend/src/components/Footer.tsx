import { ChefHat, Mail, FileText, Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-50 to-amber-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-2 rounded-xl">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Chef's Cam
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              Turn your ingredients into culinary masterpieces. Snap, discover, and cook with AI-powered recipe suggestions.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="https://www.linkedin.com/in/anayachala/" className="hover:text-amber-600 transition-colors flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="https://github.com/azrael-2704/" className="hover:text-amber-600 transition-colors flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
            <a
              href="mailto:amartya2704@gmail.com"
              className="text-sm text-gray-600 hover:text-amber-600 transition-colors flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              amartya2704@gmail.com
            </a>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Chef's Cam. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
