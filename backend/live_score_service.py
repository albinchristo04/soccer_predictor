"""
Live Score Service for Soccer Predictor.

This module provides real-time match score updates through polling
and WebSocket-like mechanisms. It caches live match data and provides
instant updates for ongoing matches.

Features:
- Real-time score polling from FotMob
- Live match status tracking
- Score change detection and notifications
- Automatic refresh intervals
"""

import asyncio
import time
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import threading
import logging

from backend import fotmob_service as fm

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MatchStatus(Enum):
    """Match status enumeration."""
    NOT_STARTED = "not_started"
    FIRST_HALF = "first_half"
    HALF_TIME = "half_time"
    SECOND_HALF = "second_half"
    EXTRA_TIME = "extra_time"
    PENALTIES = "penalties"
    FULL_TIME = "full_time"
    POSTPONED = "postponed"
    CANCELLED = "cancelled"
    LIVE = "live"


@dataclass
class LiveMatch:
    """Represents a live match with real-time data."""
    match_id: str
    home_team: str
    away_team: str
    home_score: int = 0
    away_score: int = 0
    status: MatchStatus = MatchStatus.NOT_STARTED
    minute: int = 0
    league: str = ""
    start_time: Optional[datetime] = None
    events: List[Dict[str, Any]] = field(default_factory=list)
    last_updated: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'match_id': self.match_id,
            'home_team': self.home_team,
            'away_team': self.away_team,
            'home_score': self.home_score,
            'away_score': self.away_score,
            'status': self.status.value,
            'minute': self.minute,
            'league': self.league,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'events': self.events,
            'last_updated': self.last_updated.isoformat(),
            'is_live': self.status in [
                MatchStatus.FIRST_HALF, MatchStatus.SECOND_HALF,
                MatchStatus.HALF_TIME, MatchStatus.EXTRA_TIME,
                MatchStatus.PENALTIES, MatchStatus.LIVE
            ],
        }


class LiveScoreCache:
    """Cache for live match scores with automatic updates."""
    
    def __init__(self, refresh_interval: int = 30):
        self.matches: Dict[str, LiveMatch] = {}
        self.refresh_interval = refresh_interval
        self.last_refresh: datetime = datetime.min
        self.listeners: List[Callable[[str, LiveMatch], None]] = []
        self._lock = threading.Lock()
    
    def add_listener(self, callback: Callable[[str, LiveMatch], None]):
        """Add a listener for score changes."""
        self.listeners.append(callback)
    
    def notify_listeners(self, match_id: str, match: LiveMatch):
        """Notify all listeners of a score change."""
        for listener in self.listeners:
            try:
                listener(match_id, match)
            except Exception as e:
                logger.error(f"Error notifying listener: {e}")
    
    def update_match(self, match_data: Dict[str, Any]) -> Optional[LiveMatch]:
        """Update a match in the cache."""
        match_id = str(match_data.get('match_id', ''))
        if not match_id:
            return None
        
        with self._lock:
            existing = self.matches.get(match_id)
            
            # Parse status
            status_str = match_data.get('status', 'not_started')
            if status_str == 'live':
                status = MatchStatus.LIVE
            elif status_str == 'played' or status_str == 'finished':
                status = MatchStatus.FULL_TIME
            elif status_str == 'scheduled':
                status = MatchStatus.NOT_STARTED
            else:
                status = MatchStatus.NOT_STARTED
            
            # Create or update match
            match = LiveMatch(
                match_id=match_id,
                home_team=match_data.get('home_team', ''),
                away_team=match_data.get('away_team', ''),
                home_score=match_data.get('home_goals', 0) or 0,
                away_score=match_data.get('away_goals', 0) or 0,
                status=status,
                minute=match_data.get('minute', 0) or 0,
                league=match_data.get('league', ''),
                last_updated=datetime.now(),
            )
            
            # Check for score changes
            score_changed = (
                existing is not None and
                (existing.home_score != match.home_score or
                 existing.away_score != match.away_score)
            )
            
            self.matches[match_id] = match
            
            # Notify if score changed
            if score_changed:
                self.notify_listeners(match_id, match)
            
            return match
    
    def get_match(self, match_id: str) -> Optional[LiveMatch]:
        """Get a match from the cache."""
        with self._lock:
            return self.matches.get(match_id)
    
    def get_live_matches(self) -> List[LiveMatch]:
        """Get all currently live matches."""
        with self._lock:
            return [
                m for m in self.matches.values()
                if m.status in [
                    MatchStatus.FIRST_HALF, MatchStatus.SECOND_HALF,
                    MatchStatus.HALF_TIME, MatchStatus.EXTRA_TIME,
                    MatchStatus.PENALTIES, MatchStatus.LIVE
                ]
            ]
    
    def get_matches_by_league(self, league: str) -> List[LiveMatch]:
        """Get all matches for a specific league."""
        with self._lock:
            return [m for m in self.matches.values() if m.league == league]
    
    def clear_old_matches(self, hours: int = 24):
        """Remove matches older than specified hours."""
        cutoff = datetime.now() - timedelta(hours=hours)
        with self._lock:
            old_keys = [
                k for k, v in self.matches.items()
                if v.last_updated < cutoff and v.status == MatchStatus.FULL_TIME
            ]
            for key in old_keys:
                del self.matches[key]


class LiveScoreService:
    """Service for managing live score updates."""
    
    def __init__(self, poll_interval: int = 30):
        self.cache = LiveScoreCache()
        self.poll_interval = poll_interval
        self._running = False
        self._poll_thread: Optional[threading.Thread] = None
        self.supported_leagues = [
            'premier_league', 'la_liga', 'bundesliga', 
            'serie_a', 'ligue_1', 'ucl', 'uel', 'mls'
        ]
    
    def start(self):
        """Start the polling service."""
        if self._running:
            return
        
        self._running = True
        self._poll_thread = threading.Thread(target=self._poll_loop, daemon=True)
        self._poll_thread.start()
        logger.info("Live score service started")
    
    def stop(self):
        """Stop the polling service."""
        self._running = False
        if self._poll_thread:
            self._poll_thread.join(timeout=5)
        logger.info("Live score service stopped")
    
    def _poll_loop(self):
        """Main polling loop."""
        while self._running:
            try:
                self._refresh_all_leagues()
            except Exception as e:
                logger.error(f"Error in poll loop: {e}")
            
            time.sleep(self.poll_interval)
    
    def _refresh_all_leagues(self):
        """Refresh matches for all supported leagues."""
        for league in self.supported_leagues:
            try:
                self._refresh_league(league)
            except Exception as e:
                logger.error(f"Error refreshing {league}: {e}")
    
    def _refresh_league(self, league: str):
        """Refresh matches for a specific league."""
        try:
            # Get matches from FotMob
            data = fm.get_all_matches_for_display(league, days_range=1)
            
            # Update cache with live matches
            for match in data.get('live', []):
                match['league'] = league
                self.cache.update_match(match)
            
            # Also cache upcoming/recent for context
            for match in data.get('upcoming', [])[:10]:
                match['league'] = league
                self.cache.update_match(match)
            
            for match in data.get('results', [])[:10]:
                match['league'] = league
                self.cache.update_match(match)
                
        except Exception as e:
            logger.warning(f"FotMob unavailable for {league}: {e}")
    
    def get_live_scores(self, league: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get current live scores."""
        if league:
            matches = self.cache.get_matches_by_league(league)
        else:
            matches = list(self.cache.matches.values())
        
        # Filter to live matches and sort by league
        live_matches = [
            m for m in matches
            if m.status in [
                MatchStatus.FIRST_HALF, MatchStatus.SECOND_HALF,
                MatchStatus.HALF_TIME, MatchStatus.EXTRA_TIME,
                MatchStatus.PENALTIES, MatchStatus.LIVE
            ]
        ]
        
        return [m.to_dict() for m in sorted(live_matches, key=lambda x: x.league)]
    
    def get_todays_matches(self, league: Optional[str] = None) -> Dict[str, List[Dict[str, Any]]]:
        """Get all matches for today grouped by status."""
        if league:
            matches = self.cache.get_matches_by_league(league)
        else:
            matches = list(self.cache.matches.values())
        
        result = {
            'live': [],
            'upcoming': [],
            'completed': [],
        }
        
        for match in matches:
            match_dict = match.to_dict()
            if match.status in [
                MatchStatus.FIRST_HALF, MatchStatus.SECOND_HALF,
                MatchStatus.HALF_TIME, MatchStatus.EXTRA_TIME,
                MatchStatus.PENALTIES, MatchStatus.LIVE
            ]:
                result['live'].append(match_dict)
            elif match.status == MatchStatus.FULL_TIME:
                result['completed'].append(match_dict)
            else:
                result['upcoming'].append(match_dict)
        
        return result
    
    def force_refresh(self, league: Optional[str] = None):
        """Force an immediate refresh."""
        if league:
            self._refresh_league(league)
        else:
            self._refresh_all_leagues()


# Global service instance
_live_service: Optional[LiveScoreService] = None


def get_live_service() -> LiveScoreService:
    """Get or create the live score service."""
    global _live_service
    if _live_service is None:
        _live_service = LiveScoreService()
        _live_service.start()
    return _live_service


def get_live_scores(league: Optional[str] = None) -> List[Dict[str, Any]]:
    """Convenience function to get live scores."""
    service = get_live_service()
    return service.get_live_scores(league)


def get_todays_matches(league: Optional[str] = None) -> Dict[str, List[Dict[str, Any]]]:
    """Get today's matches from FotMob API with CSV fallback."""
    from backend import fotmob_service as fm
    import pandas as pd
    from backend import prediction_service as ps
    
    result = {
        'live': [],
        'upcoming': [],
        'completed': [],
    }
    
    # Current date/time for comparison
    now = datetime.now()
    today = now.date()
    today_str = now.strftime('%Y%m%d')  # FotMob format: YYYYMMDD
    
    # League display name mapping
    league_display_names = {
        'premier_league': 'Premier League',
        'la_liga': 'La Liga',
        'serie_a': 'Serie A',
        'bundesliga': 'Bundesliga',
        'ligue_1': 'Ligue 1',
        'mls': 'MLS',
        'ucl': 'Champions League',
        'uel': 'Europa League',
    }
    
    # Try FotMob API first for real-time data
    try:
        leagues_data = fm.fetch_matches_by_date(today_str)
        if leagues_data:
            for league_data in leagues_data:
                league_name = league_data.get('name', '')
                league_id = league_data.get('id')
                
                # Map FotMob league ID to our internal name
                internal_league = None
                for internal, fid in fm.LEAGUE_IDS.items():
                    if fid == league_id:
                        internal_league = internal
                        break
                
                # Filter by league if specified
                if league and internal_league != league:
                    continue
                
                matches = league_data.get('matches', [])
                for match in matches:
                    match_data = fm.extract_match_data(match)
                    
                    match_dict = {
                        'home_team': match_data.get('home_team', ''),
                        'away_team': match_data.get('away_team', ''),
                        'home_score': match_data.get('home_goals') or 0,
                        'away_score': match_data.get('away_goals') or 0,
                        'league': internal_league or league_name,
                        'league_name': league_display_names.get(internal_league, league_name),
                        'status': match_data.get('status', 'scheduled'),
                        'time': match_data.get('time', 'TBD'),
                        'minute': match_data.get('minute', 0),
                    }
                    
                    status = match_data.get('status', 'scheduled')
                    if status == 'live':
                        result['live'].append(match_dict)
                    elif status == 'played':
                        result['completed'].append(match_dict)
                    else:
                        result['upcoming'].append(match_dict)
            
            # If we got data from FotMob, return it
            if result['live'] or result['upcoming'] or result['completed']:
                logger.info(f"FotMob returned {len(result['live'])} live, {len(result['upcoming'])} upcoming, {len(result['completed'])} completed")
                return result
                
    except Exception as e:
        logger.warning(f"FotMob API error: {e}, falling back to CSV")
    
    # Fallback to CSV data
    leagues_to_check = [league] if league else [
        'premier_league', 'la_liga', 'serie_a', 'bundesliga', 'ligue_1', 'mls'
    ]
    
    for lg in leagues_to_check:
        try:
            df = ps.load_league_data(lg)
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
            
            # Get matches for today
            today_matches = df[df['date'].dt.date == today].copy()
            today_matches = today_matches.drop_duplicates(subset=['home_team', 'away_team'])
            
            for _, row in today_matches.iterrows():
                # Use 'time' column if available, otherwise try to extract from date
                time_str = 'TBD'
                if 'time' in row and pd.notna(row.get('time')) and row.get('time'):
                    time_str = str(row['time'])
                elif pd.notna(row['date']) and row['date'].hour != 0:
                    time_str = row['date'].strftime('%H:%M')
                
                match_dict = {
                    'home_team': row['home_team'],
                    'away_team': row['away_team'],
                    'home_score': int(row['home_goals']) if pd.notna(row.get('home_goals')) else 0,
                    'away_score': int(row['away_goals']) if pd.notna(row.get('away_goals')) else 0,
                    'league': lg,
                    'league_name': league_display_names.get(lg, lg),
                    'status': row.get('status', 'scheduled'),
                    'time': time_str,
                }
                
                if row.get('status') == 'played':
                    result['completed'].append(match_dict)
                else:
                    result['upcoming'].append(match_dict)
                    
        except Exception as e:
            logger.warning(f"Error loading {lg} data: {e}")
    
    return result
