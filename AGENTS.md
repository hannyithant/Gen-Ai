# Repository Guidelines

## Project Structure & Module Organization

This is a small Flask application. `app.py` defines the web routes and proxies chat requests to Ollama; `templates/index.html` contains the page markup; `static/chat.js` and `static/style.css` provide browser behavior and styling. `requirements.txt` lists the sole Python dependency. Keep interface assets in `static/` and rendered pages in `templates/`.

## Build, Test, and Development Commands

Create a virtual environment and install dependencies with `python -m venv .venv`, then `python -m pip install -r requirements.txt`. Run locally with `python app.py`; browse to `http://127.0.0.1:5000`. Flask binds to loopback. Ollama must be running locally with `gemma3:1b` available. No automated test suite or build step is configured yet.

## Coding Style & Naming Conventions

Use four spaces for Python indentation, descriptive `snake_case` names, and small Flask route handlers. Keep browser code framework-free, use `camelCase` for JavaScript functions and variables, and store displayed user/model text with `textContent` so it is treated as text. Keep CSS in `static/style.css` rather than embedding it in the template.

## Testing Guidelines

There is no test framework configured. For changes to chat behavior, manually verify a first message, a follow-up that depends on prior context, and the Ollama-unavailable error state. Add automated tests with `pytest` if the application grows; name test files `test_*.py`.

## Commit & Pull Request Guidelines

Git history is not available in this directory, so no commit convention can be inferred. Use short, imperative commit subjects (for example, `Handle Ollama connection errors`). Pull requests should explain the change, list checks performed, and include screenshots for visible interface changes.

## Security & Configuration

Do not commit credentials or machine-specific configuration. Keep the Ollama endpoint local and Flask bound to `127.0.0.1`; do not enable public network binding for this demo.
