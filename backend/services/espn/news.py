"""
ESPN News Service with sentiment analysis for predictions.

This service fetches and analyzes news articles to provide
sentiment-based factors for match predictions.
"""

import asyncio
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging

from backend.services.espn.client import get_espn_client, ESPN_LEAGUE_IDS

logger = logging.getLogger(__name__)


@dataclass
class NewsSentiment:
    """Sentiment analysis results for a team or match."""
    positive_count: int
    negative_count: int
    neutral_count: int
    sentiment_score: float  # -1.0 to 1.0
    key_topics: List[str]
    recent_articles: int
    
    @property
    def confidence(self) -> float:
        """Confidence based on number of articles analyzed."""
        total = self.positive_count + self.negative_count + self.neutral_count
        if total == 0:
            return 0.0
        # Higher confidence with more articles (max at 10+)
        return min(1.0, total / 10.0)


# Simple keyword-based sentiment analysis
POSITIVE_KEYWORDS = {
    "win", "victory", "dominant", "excellent", "outstanding", "brilliant",
    "recover", "return", "fit", "healthy", "confident", "strong", "impressive",
    "boost", "surge", "rise", "improve", "momentum", "form", "streak",
    "leader", "champion", "title", "goal", "scoring", "clinical", "solid",
    "clean sheet", "shutout", "defense", "secure", "comfortable",
}

NEGATIVE_KEYWORDS = {
    "loss", "defeat", "poor", "struggle", "injury", "injured", "out",
    "suspended", "ban", "crisis", "crisis", "doubt", "concern", "worry",
    "slump", "decline", "drop", "fall", "miss", "absence", "setback",
    "problem", "issue", "trouble", "disappointing", "frustrating",
    "criticism", "under fire", "pressure", "relegation", "sack", "fired",
}

INJURY_KEYWORDS = {
    "injury", "injured", "hurt", "hamstring", "muscle", "strain",
    "surgery", "operation", "recovery", "rehabilitation", "sidelined",
    "knee", "ankle", "back", "thigh", "calf", "groin",
}


def analyze_text_sentiment(text: str) -> Tuple[str, List[str]]:
    """
    Analyze sentiment of text using keyword matching.
    
    Returns:
        Tuple of (sentiment: 'positive'|'negative'|'neutral', topics: List[str])
    """
    if not text:
        return "neutral", []
    
    text_lower = text.lower()
    topics = []
    
    positive_count = sum(1 for kw in POSITIVE_KEYWORDS if kw in text_lower)
    negative_count = sum(1 for kw in NEGATIVE_KEYWORDS if kw in text_lower)
    
    # Extract injury topics
    if any(kw in text_lower for kw in INJURY_KEYWORDS):
        topics.append("injury")
    
    # Extract other topics
    if "transfer" in text_lower:
        topics.append("transfer")
    if "manager" in text_lower or "coach" in text_lower:
        topics.append("management")
    if "form" in text_lower or "streak" in text_lower:
        topics.append("form")
    
    # Determine overall sentiment
    if positive_count > negative_count + 1:
        return "positive", topics
    elif negative_count > positive_count + 1:
        return "negative", topics
    else:
        return "neutral", topics


class ESPNNewsService:
    """
    Service for fetching and analyzing ESPN news for predictions.
    
    Provides sentiment analysis that can be used as a factor in
    match outcome predictions.
    """
    
    def __init__(self):
        self._cache: Dict[str, Tuple[NewsSentiment, float]] = {}
        self._cache_ttl = 3600  # 1 hour cache for news sentiment
    
    async def get_team_sentiment(
        self,
        team_name: str,
        league_key: str,
        days_back: int = 7
    ) -> NewsSentiment:
        """
        Get sentiment analysis for a team based on recent news.
        
        Args:
            team_name: Team name to search for
            league_key: League key for context
            days_back: How many days of news to analyze
        
        Returns:
            NewsSentiment with analysis results
        """
        cache_key = f"sentiment_{team_name}_{league_key}"
        
        # Check cache
        if cache_key in self._cache:
            sentiment, expiry = self._cache[cache_key]
            if datetime.now().timestamp() < expiry:
                return sentiment
        
        client = get_espn_client()
        
        # Get league news
        articles = await client.get_league_news(league_key, limit=20)
        
        # Filter articles mentioning the team
        team_articles = []
        team_name_lower = team_name.lower()
        
        # Handle common name variations
        name_variations = [team_name_lower]
        if "united" in team_name_lower:
            name_variations.append(team_name_lower.replace(" united", ""))
        if "city" in team_name_lower:
            name_variations.append(team_name_lower.replace(" city", ""))
        
        for article in articles:
            headline = article.get("headline", "").lower()
            description = article.get("description", "").lower()
            full_text = f"{headline} {description}"
            
            if any(name in full_text for name in name_variations):
                team_articles.append(article)
        
        # Analyze sentiment
        positive = 0
        negative = 0
        neutral = 0
        all_topics: List[str] = []
        
        for article in team_articles:
            headline = article.get("headline", "")
            description = article.get("description", "")
            full_text = f"{headline} {description}"
            
            sentiment, topics = analyze_text_sentiment(full_text)
            
            if sentiment == "positive":
                positive += 1
            elif sentiment == "negative":
                negative += 1
            else:
                neutral += 1
            
            all_topics.extend(topics)
        
        # Calculate sentiment score (-1 to 1)
        total = positive + negative + neutral
        if total > 0:
            score = (positive - negative) / total
        else:
            score = 0.0
        
        # Get unique topics sorted by frequency
        topic_counts: Dict[str, int] = {}
        for topic in all_topics:
            topic_counts[topic] = topic_counts.get(topic, 0) + 1
        key_topics = sorted(topic_counts.keys(), key=lambda x: topic_counts[x], reverse=True)[:5]
        
        result = NewsSentiment(
            positive_count=positive,
            negative_count=negative,
            neutral_count=neutral,
            sentiment_score=score,
            key_topics=key_topics,
            recent_articles=len(team_articles),
        )
        
        # Cache result
        self._cache[cache_key] = (result, datetime.now().timestamp() + self._cache_ttl)
        
        return result
    
    async def get_match_news_factor(
        self,
        home_team: str,
        away_team: str,
        league_key: str
    ) -> Dict:
        """
        Get news-based factors for a match prediction.
        
        Returns factors that can influence prediction:
        - Positive sentiment may indicate confidence/momentum
        - Negative sentiment (injuries, crisis) may indicate weakness
        
        Returns:
            Dict with home_factor, away_factor, and analysis details
        """
        # Get sentiment for both teams
        home_sentiment, away_sentiment = await asyncio.gather(
            self.get_team_sentiment(home_team, league_key),
            self.get_team_sentiment(away_team, league_key),
        )
        
        # Convert sentiment to prediction factor (-0.1 to 0.1)
        # Positive sentiment slightly boosts win probability
        home_factor = home_sentiment.sentiment_score * 0.05 * home_sentiment.confidence
        away_factor = away_sentiment.sentiment_score * 0.05 * away_sentiment.confidence
        
        # Injury news has negative impact
        if "injury" in home_sentiment.key_topics:
            home_factor -= 0.03
        if "injury" in away_sentiment.key_topics:
            away_factor -= 0.03
        
        return {
            "home_news_factor": round(home_factor, 4),
            "away_news_factor": round(away_factor, 4),
            "home_sentiment": {
                "score": round(home_sentiment.sentiment_score, 3),
                "confidence": round(home_sentiment.confidence, 3),
                "topics": home_sentiment.key_topics,
                "articles_analyzed": home_sentiment.recent_articles,
            },
            "away_sentiment": {
                "score": round(away_sentiment.sentiment_score, 3),
                "confidence": round(away_sentiment.confidence, 3),
                "topics": away_sentiment.key_topics,
                "articles_analyzed": away_sentiment.recent_articles,
            },
        }
    
    def clear_cache(self):
        """Clear the sentiment cache."""
        self._cache.clear()


# Singleton instance
_service: Optional[ESPNNewsService] = None


def get_news_service() -> ESPNNewsService:
    """Get or create news service singleton."""
    global _service
    if _service is None:
        _service = ESPNNewsService()
    return _service
