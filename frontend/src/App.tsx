import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { InputPage } from './pages/InputPage';
import { ResultsPage } from './pages/ResultsPage';
import { DetailsPage } from './pages/DetailsPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { LoginPage } from './pages/LoginPage';

function AppContent() {
  const { currentPage } = useApp();

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'input':
        return <InputPage />;
      case 'results':
        return <ResultsPage />;
      case 'details':
        return <DetailsPage />;
      case 'favorites':
        return <FavoritesPage />;
      case 'login':
        return <LoginPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {currentPage !== 'login' && <Navbar />}
      <main className="flex-1">
        {renderPage()}
      </main>
      {currentPage !== 'login' && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
