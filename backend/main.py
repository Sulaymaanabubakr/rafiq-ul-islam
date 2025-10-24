from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Rafiq ul-Islam")

# CORS for PWA
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    message: str

ISLAMIC_SYSTEM_PROMPT = """
You are "Rafiq ul-Islam" (Companion of Islam), a compassionate Islamic AI assistant.

CORE PRINCIPLES:
- Always begin with: "Assalamu alaikum warahmatullahi wabarakatuh"
- Always respond to greetings properly
- Use Islamic phrases naturally: "Alhamdulillah", "Insha'Allah", "Masha'Allah"
- Base all religious responses on Quran and authentic Hadith
- Speak with gentle, scholarly tone
- Acknowledge when matters require scholarly consultation
- Redirect non-Islamic topics to beneficial Islamic knowledge

PERSONALITY:
- Warm, welcoming, and patient
- Humble - position yourself as a learning companion
- Encouraging and supportive
- Focus on building love for Allah and His Messenger (PBUH)

RESPONSE STYLE:
1. Begin with proper Islamic greeting
2. Provide evidence from Quran/Hadith when applicable
3. Explain with Islamic wisdom
4. End with du'a or encouragement
"""

@app.get("/")
async def health_check():
    return {"status": "Rafiq ul-Islam is running", "message": "Assalamu alaikum!"}

@app.post("/chat")
async def chat_with_rafiq(user_message: ChatMessage):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.getenv('DEEPSEEK_API_KEY')}"
    }

    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": ISLAMIC_SYSTEM_PROMPT},
            {"role": "user", "content": user_message.message}
        ],
        "temperature": 0.7,
        "max_tokens": 800
    }

    try:
        response = requests.post(
            "https://api.deepseek.com/v1/chat/completions", 
            json=payload, 
            headers=headers,
            timeout=20
        )
        
        if response.status_code == 401:
            return {"reply": "Assalamu alaikum! Please check your API key configuration. The service needs proper authentication to work."}
        elif response.status_code == 429:
            return {"reply": "Assalamu alaikum! The service is currently busy. Please wait a moment and try again. May Allah grant you patience."}
        elif response.status_code == 500:
            return {"reply": "Assalamu alaikum! The knowledge service is temporarily unavailable. Please try again in a few moments. May Allah make it easy for us."}
        
        response.raise_for_status()
        
        bot_reply = response.json()["choices"][0]["message"]["content"]
        return {"reply": bot_reply}
        
    except requests.exceptions.Timeout:
        return {"reply": "Assalamu alaikum! The response is taking longer than expected. Please try again with a shorter question, or wait a moment and retry."}
    except requests.exceptions.ConnectionError:
        return {"reply": "Assalamu alaikum! I'm having trouble connecting to the knowledge service. Please check your internet connection and try again."}
    except Exception as e:
        return {"reply": "Assalamu alaikum! There seems to be a temporary issue. Please try again in a moment. If this continues, please check your API configuration. May Allah ease your affairs."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)