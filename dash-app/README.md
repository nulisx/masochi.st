# Modular Dashboard Example

This folder contains a minimal modular dashboard example demonstrating:

- a collapsible sidebar component (`dash/components/sidebar.html`)
- modular SCSS structure under `static/scss/dash/`
- a small view loader (`dash/js/view-loader.js`) which dynamically fetches HTML fragments from `dash/views/{view}.html`
- example page `dash/modular-dashboard-example.html`

Build SCSS (requires Dart Sass):

```bash
# from repository root
npm install -g sass   # or install locally and run via npx
sass static/scss/dash/main.scss static/css/dash/main.css --style=expanded
```

Then open the example page via a local static server:

```bash
# from repository root
python3 -m http.server 8080
# visit: http://localhost:8080/dash/modular-dashboard-example.html
```

Next steps:
- Implement profile and files components' full functionality (JS interactions, API hooks).
- Optionally wire server-side includes or template rendering to reuse `dash/components/sidebar.html` across pages.