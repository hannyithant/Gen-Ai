# Local Qwen Chat

A small Flask app for chatting with Ollama's `qwen3:1.7b` model. The browser keeps conversation history while the page is open; Flask forwards each turn to Ollama without saving chat data. The **Document collection** page accepts PDF, DOCX, TXT, and Markdown files up to 50 MB. The app extracts text, splits it into 800-character chunks with 100-character overlap, and embeds each chunk using Ollama's `nomic-embed-text` model. Chunks and embeddings are stored locally in `index/index.json`.

For each question, Flask embeds the question and retrieves up to five relevant document chunks. The model is instructed to use those excerpts first and call Ollama web search only when the documents do not answer the question or current external information is needed. Search results include a title, URL, and short content excerpt. If document retrieval or web search is unavailable, chat continues and displays a notice.

## Requirements

- Python 3.9 or newer
- Ollama running at `http://localhost:11434`
- An Ollama API key for web search, available from [Ollama](https://ollama.com/settings/keys)

Each user must obtain and configure their own `OLLAMA_API_KEY` for web search. Keep the key private; do not commit it or add it to source files. The app can still chat and use uploaded documents when the key is missing, but web search will be unavailable.

## Setup and run

Install Ollama from <https://ollama.com/download>, then run these commands from the project folder:

```bash
ollama pull qwen3:1.7b
ollama pull nomic-embed-text
pip install -r requirements.txt
python3 app.py
```

Before starting the app, set your own key in the same terminal. On macOS or Linux:

```bash
export OLLAMA_API_KEY="your-ollama-api-key"
```

On Windows PowerShell:

```powershell
$env:OLLAMA_API_KEY = "your-ollama-api-key"
python app.py
```

On Windows, use `py app.py` if `python` is unavailable. The app reads the key in the Python backend and sends it to Ollama's web search endpoint. If the variable is missing, or search fails, chat continues and displays a notice.

Open <http://127.0.0.1:5000> in your browser. Flask binds to loopback only. Start Ollama and pull both models before uploading documents. Uploads are stored in `uploads/`; the local index is `index/index.json`. Deleting a document also removes its indexed chunks. Press Enter to send or Shift+Enter for a new line.

On Windows, if `python` is not available, use the Python launcher as `py`.
