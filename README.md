# Smart Recipe Generator 🍳

An intelligent recipe recommendation system that suggests personalized recipes based on the ingredients you have. Built with a modern tech stack including FastAPI, React, and Google's Gemini AI for smart features.

![Chef's Cam App Screenshot](https://raw.githubusercontent.com/adrianhajdin/smart_recipe_generator/main/frontend/public/project-thumbnail.png)

---

## 🌟 Features

- **Smart Ingredient Matching:** Find recipes based on ingredients you have.
- **AI-Powered Image Analysis:** Upload a photo of your ingredients, and let the AI identify them for you.
- **Dietary Preferences:** Filter by vegetarian, vegan, gluten-free, and more.
- **Personalization:** Save favorites, rate recipes, and get recommendations.
- **Serving Adjustments:** Dynamically adjust ingredient quantities for any number of servings.
- **Responsive Design:** Works seamlessly on desktop and mobile devices.

---

## 🚀 Live Demo

The application is live and ready to use:
- **Frontend Application:** [**Chef's Cam on Vercel**](https://chefs-cam.vercel.app/)
- **Backend API Docs:** The backend is hosted on Render. You can access the interactive API documentation at `https://<your-backend-render-url>/docs`.

---

## 🛠️ Tech Stack

**Frontend**  
- React 18 with TypeScript  
- Vite for fast development builds  
- Tailwind CSS for styling  
- Lucide React for icons  
- Context API for state management  

**Backend**  
- FastAPI with Python  
- SQLite with SQLAlchemy ORM  
- JWT authentication  
- Google Gemini AI for image analysis  
- Scikit-learn for TF-IDF matching  
- Pillow for image processing  

**Deployment**  
- Vercel for frontend hosting  
- Render for backend API  
- Environment-based configuration  

---

## 📁 Project Structure

```
smart-recipe-generator/
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable React UI components (buttons, cards, etc.)
│   │   ├── pages/           # Main pages of the application (Home, RecipeDetails, etc.)
│   │   ├── context/         # React Context for global state management (e.g., auth)
│   │   ├── lib/             # Utility functions, including the API client
│   │   └── types/           # TypeScript type definitions for the project
│   └── package.json
├── backend/
│   ├── dataset/             # Recipe data and images
│   ├── models.py            # SQLAlchemy ORM models for database tables (User, Recipe, etc.)
│   ├── schemas.py           # Pydantic schemas for data validation and serialization (API request/response shapes)
│   ├── services.py          # Core business logic (searching, recommendations, database operations)
│   ├── auth.py              # JWT-based authentication logic (user registration, login, token verification)
│   ├── database.py          # SQLAlchemy database connection and session management
│   ├── main.py              # FastAPI application entrypoint, defines all API endpoints
│   └── requirements.txt
└── start-app.bat            # Development startup script
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm  
- Python 3.8+  
- Google Gemini API key  

### Local Development

#### Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
source venv/bin/activate
pip install -r requirements.txt
```

Create `.env` file:
```env
DATABASE_URL=sqlite:///./recipes.db
SECRET_KEY=your-jwt-secret-key
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=http://localhost:5173
```

Start backend:
```bash
python main.py
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

Access the application:  
- Frontend: `http://localhost:5173`  
- API Docs: `http://localhost:8000/docs`  

#### One-Click Startup (Windows)
Run `start-app.bat` from the project root to start both servers automatically.

---

## 🎯 How It Works

1. **Ingredient Matching Algorithm**  
   - TF-IDF vectorization converts ingredients to numerical features.  
   - Cosine similarity ranks recipes by match score with intelligent filtering.  

2. **AI Enhancement Pipeline**  
   - Gemini AI automatically enhances recipes missing nutritional data.  
   - Generates cooking times, difficulty levels, and dietary tags.  
   - Implements rate limiting to optimize API usage.  

3. **Smart Caching**  
   - Caches search results to improve performance.  
   - Reduces redundant API calls.  
   - Automatic cache invalidation strategies.  

4. **Image Analysis**  
   - Uses Gemini Vision API to analyze food images.  
   - Extracts ingredients automatically with confidence scores.  

---

## 🔧 API Endpoints

**Authentication**
- `POST /auth/register` - User registration  
- `POST /auth/login` - User login  
- `GET /auth/me` - Get current user  
- `DELETE /auth/delete` - Delete account  

**Recipes**
- `POST /recipes/search` - Search by ingredients  
- `GET /recipes` - Get all recipes with filtering  
- `GET /recipes/{id}` - Get specific recipe  
- `POST /recipes/{id}/favorite` - Toggle favorite  
- `POST /recipes/{id}/rate` - Rate recipe (1-5 stars)  

**User Features**
- `GET /favorites` - Get user's favorite recipes  
- `GET /recommendations` - Get personalized recommendations  
- `GET /popular` - Get popular recipes  

**Analysis**
- `POST /analyze/image` - Analyze image for ingredients  

---

## 🗃️ Database Schema

**Users** `(id, email, hashed_password, full_name, created_at)`  
**Recipes** `(id, title, description, image_url, difficulty, cooking_time, servings, cuisine, calories, protein, carbs, fat, instructions, dietary_tags, average_rating, rating_count, created_at)`  
**Ingredients** `(id, name, amount, unit)`  
**Favorites** `(id, user_id, recipe_id, created_at)`  
**Ratings** `(id, user_id, recipe_id, rating, created_at)`  

---

## 🌱 Dataset

Includes 25+ curated recipes with:  
- Diverse cuisines: Italian, Asian, Mexican, Indian, etc.  
- Multiple dietary options: Vegetarian, Vegan, Gluten-Free  
- Complete nutritional information  
- High-quality food images  

---

## 🔒 Security Features

- JWT-based authentication  
- Password hashing with PBKDF2  
- CORS configuration for secure cross-origin requests  
- Input validation with Pydantic schemas  
- SQL injection prevention with SQLAlchemy  

---

## 🚀 Deployment

**Frontend (Vercel)**  
- Connect GitHub repository to Vercel  
- Set environment variable: `VITE_API_URL=https://your-backend-url.render.com`  
- Deploy automatically on git push  

**Backend (Render)**  
- Connect GitHub repository to Render  
- Build command: `pip install -r requirements.txt`  
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`  
- Configure environment variables  

---

## 🤝 Contributing

- Fork the repository  
- Create a feature branch: `git checkout -b feature/amazing-feature`  
- Commit changes: `git commit -m 'Add amazing feature'`  
- Push to branch: `git push origin feature/amazing-feature`  
- Open a Pull Request  

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Google Gemini AI for recipe enhancement  
- FastAPI for excellent API framework  
- Vercel and Render for hosting services  
- Pexels for food photography  

---

## 📞 Support

For support, open an issue on GitHub or contact the development team.

---

Built with ❤️ for food lovers and home cooks everywhere!
