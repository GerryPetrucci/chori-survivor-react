"""
SQLAlchemy models para la aplicación NFL Survivor Pool
Representa la estructura de la base de datos Supabase
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Season(Base):
    __tablename__ = 'seasons'
    
    id = Column(Integer, primary_key=True)
    year = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=False)
    current_week = Column(Integer, default=1)
    max_weeks = Column(Integer, default=18)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    matches = relationship("Match", back_populates="season")
    entries = relationship("Entry", back_populates="season")
    picks = relationship("Pick", back_populates="season")

class Team(Base):
    __tablename__ = 'teams'
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    city = Column(String)
    abbreviation = Column(String, unique=True)
    conference = Column(String)  # AFC or NFC
    division = Column(String)
    logo_url = Column(String)
    color_primary = Column(String)
    color_secondary = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    home_matches = relationship("Match", foreign_keys="Match.home_team_id", back_populates="home_team")
    away_matches = relationship("Match", foreign_keys="Match.away_team_id", back_populates="away_team")
    picks = relationship("Pick", back_populates="selected_team")

class Match(Base):
    __tablename__ = 'matches'
    
    id = Column(Integer, primary_key=True)
    season_id = Column(Integer, ForeignKey('seasons.id'), nullable=False)
    week = Column(Integer, nullable=False)
    home_team_id = Column(Integer, ForeignKey('teams.id'), nullable=False)
    away_team_id = Column(Integer, ForeignKey('teams.id'), nullable=False)
    game_date = Column(DateTime, nullable=False)
    home_score = Column(Integer)
    away_score = Column(Integer)
    status = Column(String, default='scheduled')  # scheduled, in_progress, completed, postponed
    game_type = Column(String, default='regular')  # regular, playoff, wildcard, divisional, championship, superbowl
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    season = relationship("Season", back_populates="matches")
    home_team = relationship("Team", foreign_keys=[home_team_id], back_populates="home_matches")
    away_team = relationship("Team", foreign_keys=[away_team_id], back_populates="away_matches")
    picks = relationship("Pick", back_populates="match")

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    entries = relationship("Entry", back_populates="user")

class Entry(Base):
    __tablename__ = 'entries'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    season_id = Column(Integer, ForeignKey('seasons.id'), nullable=False)
    name = Column(String, nullable=False)
    points = Column(Integer, default=0)
    
    # Campos de estado y estadísticas
    status = Column(String, default='alive')  # alive, last_chance, eliminated
    is_active = Column(Boolean, default=True)
    eliminated_week = Column(Integer)
    
    # Estadísticas de racha y victorias/derrotas
    total_wins = Column(Integer, default=0)
    total_losses = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="entries")
    season = relationship("Season", back_populates="entries")
    picks = relationship("Pick", back_populates="entry")

class Pick(Base):
    __tablename__ = 'picks'
    
    id = Column(Integer, primary_key=True)
    entry_id = Column(Integer, ForeignKey('entries.id'), nullable=False)
    season_id = Column(Integer, ForeignKey('seasons.id'), nullable=False)
    match_id = Column(Integer, ForeignKey('matches.id'), nullable=False)
    semana = Column(Integer, nullable=False)  # Alias para week
    selected_team_id = Column(Integer, ForeignKey('teams.id'), nullable=False)
    result = Column(String)  # W (win), L (loss), T (tie), null (pending)
    points_earned = Column(Integer, default=0)
    multiplier = Column(Integer, default=1)  # Basado en horas de anticipación
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    entry = relationship("Entry", back_populates="picks")
    season = relationship("Season", back_populates="picks")
    match = relationship("Match", back_populates="picks")
    selected_team = relationship("Team", back_populates="picks")

class Token(Base):
    __tablename__ = 'tokens'
    
    id = Column(Integer, primary_key=True)
    token = Column(String, unique=True, nullable=False)
    user_email = Column(String, nullable=False)
    is_used = Column(Boolean, default=False)
    used_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    used_at = Column(DateTime)
    expires_at = Column(DateTime)