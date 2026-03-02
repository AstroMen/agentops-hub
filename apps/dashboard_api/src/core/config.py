from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'AgentOps Dashboard API'
    version: str = '0.1.0'
    database_url: str = 'postgresql+psycopg://agentops:agentops@localhost:5432/agentops'
    admin_token: str = 'admin-dev-token'
    member_token: str = 'member-dev-token'


settings = Settings()
