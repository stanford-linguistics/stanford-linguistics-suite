"""
Configuration for Flask API with Redis state tracking feature flag.
"""
import os

class Config:
    """Base configuration."""
    
    # Existing configuration
    RESULTS_FOLDER = os.environ.get('RESULTS_FOLDER', '/results')
    PUBLIC_FOLDER = os.environ.get('PUBLIC_FOLDER', '/public')
    OUTPUT_FILE_EXTENSION = '.zip'
    
    # API environment
    API_ENVIRONMENT = os.environ.get('API_ENVIRONMENT', 'development')
    PREFERRED_URL_SCHEME = 'https' if API_ENVIRONMENT == 'production' else 'http'
    
    # Debugging
    DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 'yes')
    
    # Redis state tracking feature flag
    REDIS_STATE_TRACKING_ENABLED = os.environ.get(
        'REDIS_STATE_TRACKING_ENABLED', 
        'true'  # Enabled by default
    ).lower() in ('true', '1', 'yes', 'on')
    
    # Redis configuration
    REDIS_STATE_URL = os.environ.get('REDIS_STATE_URL', 'redis://redis:6379/1')
    
    # State tracking TTL (days)
    TASK_STATE_TTL_DAYS = int(os.environ.get('TASK_STATE_TTL_DAYS', '7'))
    
    # State recovery settings
    STATE_RECOVERY_ON_STARTUP = os.environ.get(
        'STATE_RECOVERY_ON_STARTUP',
        'false'  # Disabled by default
    ).lower() in ('true', '1', 'yes', 'on')
    
    @classmethod
    def is_redis_state_tracking_enabled(cls):
        """Check if Redis state tracking is enabled."""
        return cls.REDIS_STATE_TRACKING_ENABLED
    
    @classmethod
    def get_redis_state_url(cls):
        """Get Redis URL for state tracking."""
        return cls.REDIS_STATE_URL if cls.is_redis_state_tracking_enabled() else None


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    TESTING = False


class TestingConfig(Config):
    """Testing configuration."""
    DEBUG = True
    TESTING = True
    REDIS_STATE_TRACKING_ENABLED = False  # Disable for tests by default


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}


def get_config():
    """Get configuration based on environment."""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])