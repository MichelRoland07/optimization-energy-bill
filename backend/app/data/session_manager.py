"""
Session manager for storing user data in memory
Simple in-memory cache with user_id as key
"""
from typing import Dict, Optional
import pandas as pd


class SessionManager:
    """Manage user sessions with uploaded data"""

    def __init__(self):
        # Store: {user_id: {'raw_df': DataFrame, 'processed_df': DataFrame, 'service_no': str}}
        self._sessions: Dict[int, Dict] = {}

    def store_raw_data(self, user_id: int, df: pd.DataFrame):
        """Store raw uploaded DataFrame"""
        if user_id not in self._sessions:
            self._sessions[user_id] = {}
        self._sessions[user_id]['raw_df'] = df.copy()

    def store_processed_data(self, user_id: int, df: pd.DataFrame, service_no: str):
        """Store processed DataFrame with calculations"""
        if user_id not in self._sessions:
            self._sessions[user_id] = {}
        self._sessions[user_id]['processed_df'] = df.copy()
        self._sessions[user_id]['service_no'] = service_no

    def get_raw_data(self, user_id: int) -> Optional[pd.DataFrame]:
        """Get raw DataFrame for user"""
        if user_id in self._sessions and 'raw_df' in self._sessions[user_id]:
            return self._sessions[user_id]['raw_df'].copy()
        return None

    def get_processed_data(self, user_id: int) -> Optional[pd.DataFrame]:
        """Get processed DataFrame for user"""
        if user_id in self._sessions and 'processed_df' in self._sessions[user_id]:
            return self._sessions[user_id]['processed_df'].copy()
        return None

    def get_service_no(self, user_id: int) -> Optional[str]:
        """Get selected service number for user"""
        if user_id in self._sessions and 'service_no' in self._sessions[user_id]:
            return self._sessions[user_id]['service_no']
        return None

    def has_data(self, user_id: int) -> bool:
        """Check if user has processed data"""
        return (user_id in self._sessions and
                'processed_df' in self._sessions[user_id] and
                self._sessions[user_id]['processed_df'] is not None)

    def clear_session(self, user_id: int):
        """Clear all data for user"""
        if user_id in self._sessions:
            del self._sessions[user_id]

    def store_user_data(self, user_id: int, df: pd.DataFrame):
        """Store user data (alias for store_processed_data without service_no)"""
        if user_id not in self._sessions:
            self._sessions[user_id] = {}
        self._sessions[user_id]['processed_df'] = df.copy()

    def get_user_data(self, user_id: int) -> Optional[pd.DataFrame]:
        """Get user data (alias for get_processed_data)"""
        return self.get_processed_data(user_id)


# Global session manager instance
session_manager = SessionManager()
