# Future Skills Advisor

A small Flask app that interviews undergraduate students and recommends skill priorities using uploaded job-market and future-of-work reports. It has no university course information and never recommends specific courses, programs, or instructors.

The browser runs a multiple-choice interview from `questions.json`; editing the question wording, choices, and conditional behavior does not require changing Python code. No Ollama calls are made while students answer the interview. Students can skip questions or request a recommendation early. When the interview ends, the browser sends the selected answers to Flask, which retrieves report excerpts and asks Ollama to generate a personalized recommendation. The chat then continues as personalized Q&A grounded in the report collection.

## Requirements

- Python 3.9 or newer
- Ollama running at `http://localhost:11434`
- `qwen3:1.7b` for recommendations and follow-up chat
- `nomic-embed-text` for document indexing and retrieval

## Setup and run

From the project folder:

```bash
ollama pull qwen3:1.7b
ollama pull nomic-embed-text
python -m pip install -r requirements.txt
python app.py
```

On Windows, use `py app.py` if `python` is unavailable. Open <http://127.0.0.1:5000>. Flask binds to loopback only.

## Report collection

The **Document collection** page accepts PDF, DOCX, TXT, and Markdown files up to 50 MB. Text is split into 800-character chunks with 100-character overlap and embedded locally through Ollama. The index is stored in `index/index.json`; uploaded files are stored in `uploads/`.

PDF chunks keep their page number for citations and the recommendation's **Sources used** disclosure. Other supported formats do not provide reliable page numbers, so citations identify the report without a page. Recommendations retrieve up to eight chunks, with at most two chunks from each numbered report page.

Existing uploaded reports do not need to be uploaded again. The next document page visit or chat request automatically reindexes old entries to add page metadata. This requires Ollama and `nomic-embed-text` to be available; large collections may take time to reindex. Existing documents remain stored locally.

The browser keeps the conversation and selected-answer profile for the current page session. Recommendation search uses up to three profile-based queries, removes duplicate chunks, limits numbered pages to two chunks, and sends up to ten excerpts to the chat model. No API key is required or stored by the app.
