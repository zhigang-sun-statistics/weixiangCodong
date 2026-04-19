from app.ai.provider import AIProvider
from app.ai.openai_provider import OpenAIProvider
from app.ai.anthropic_provider import AnthropicProvider
from app.utils.exceptions import AIServiceException

_providers: dict[str, type[AIProvider]] = {
    "openai": OpenAIProvider,
    "anthropic": AnthropicProvider,
}


def get_provider(provider_name: str, api_key: str) -> AIProvider:
    cls = _providers.get(provider_name)
    if not cls:
        raise AIServiceException(f"Unknown AI provider: {provider_name}")
    if not api_key:
        raise AIServiceException(
            f"API key not configured for provider: {provider_name}. "
            "Please set it in AI Settings."
        )
    return cls(api_key=api_key)
