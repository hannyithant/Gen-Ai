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

The **Document collection** page combines repository-shared reports from `shared_documents/` with each user's local uploads in `uploads/`. Shared reports are tracked by Git and read-only in the app; files uploaded through the page stay in the local `uploads/` folder and can be deleted there.

To share another report, add a PDF, DOCX, TXT, or Markdown file to `shared_documents/`, then commit and push the change. Teammates run `git pull` and click **Sync shared documents** on the Document collection page. The app also scans and indexes shared files automatically when it starts. Syncing skips unchanged files, updates changed files, and removes shared index entries for files removed from the folder. The local index is stored in ignored `index/index.json`; it is generated separately on each computer.

PDF, DOCX, TXT, and Markdown files up to 50 MB are supported. Text is split into 800-character chunks with 100-character overlap and embedded locally through Ollama. The index is stored in `index/index.json` and is regenerated on each user's machine from both shared and local files. Shared reports appear as read-only in the collection; local uploads can be deleted there.

PDF chunks keep their page number for citations and the recommendation's **Sources used** disclosure. Other supported formats do not provide reliable page numbers, so citations identify the report without a page. Recommendations retrieve up to eight chunks, with at most two chunks from each numbered report page.

Syncing uses Ollama and `nomic-embed-text` and can take several minutes for large reports. The Document collection page shows progress and reports file-specific indexing errors; a failed file does not stop other files from syncing.

The browser keeps the conversation and selected-answer profile for the current page session. Recommendation search uses up to three profile-based queries, removes duplicate chunks, limits numbered pages to two chunks, and sends up to ten excerpts to the chat model. No API key is required or stored by the app.
