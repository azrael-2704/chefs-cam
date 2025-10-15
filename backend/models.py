# backend/models.py
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# Association table for recipe ingredients
recipe_ingredients = Table(
    'recipe_ingredients',
    Base.metadata,
    Column('recipe_id', Integer, ForeignKey('recipes.id')),
    Column('ingredient_id', Integer, ForeignKey('ingredients.id'))
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    favorites = relationship("Favorite", back_populates="user")
    ratings = relationship("Rating", back_populates="user")

class Recipe(Base):
    __tablename__ = "recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    image_url = Column(String)
    difficulty = Column(String)  # Easy, Medium, Hard
    cooking_time = Column(Integer)  # in minutes
    servings = Column(Integer)
    cuisine = Column(String)
    calories = Column(Integer)
    protein = Column(Float)
    carbs = Column(Float)
    fat = Column(Float)
    instructions = Column(Text)  # JSON string of instructions array
    dietary_tags = Column(Text)  # JSON string of tags array
    average_rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    ingredients_rel = relationship("Ingredient", secondary=recipe_ingredients, back_populates="recipes")
    favorites = relationship("Favorite", back_populates="recipe")
    ratings = relationship("Rating", back_populates="recipe")

class Ingredient(Base):
    __tablename__ = "ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    amount = Column(String)
    unit = Column(String)
    
    recipes = relationship("Recipe", secondary=recipe_ingredients, back_populates="ingredients_rel")

class Favorite(Base):
    __tablename__ = "favorites"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="favorites")
    recipe = relationship("Recipe", back_populates="favorites")

class Rating(Base):
    __tablename__ = "ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    rating = Column(Integer)  # 1-5
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="ratings")
    recipe = relationship("Recipe", back_populates="ratings")