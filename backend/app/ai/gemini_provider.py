import asyncio
import google.generativeai as genai
from app.ai.provider import AIProvider


class GeminiProvider(AIProvider):
    def __init__(self, api_key: str, model: str = "gemini-2.0-flash"):
        self._api_key = api_key
        self._model_name = model

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self._sync_complete,
            system_prompt,
            user_prompt,
        )

    def _sync_complete(self, system_prompt: str, user_prompt: str) -> str:
        genai.configure(api_key=self._api_key)
        model = genai.GenerativeModel(
            model_name=self._model_name,
            system_instruction=system_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.3,
                max_output_tokens=1024,
            ),
        )
        response = model.generate_content(user_prompt)
        return response.text

    def get_name(self) -> str:
        return "gemini"
