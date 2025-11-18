# 📄 Markdown to PDF Converter Server

A beautiful Node.js web server that converts Markdown files to PDF with a modern, user-friendly interface.

## ✨ Features

- 🎨 Beautiful gradient UI with drag-and-drop support
- 📤 Easy file upload interface
- 🔄 Real-time conversion
- 📥 Automatic PDF download
- 🎯 Professional PDF styling
- ⚡ Fast conversion using Puppeteer
- 🔗 Preserves links and formatting

## 🚀 Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Start the server:**
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## 📖 Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Click "Choose Markdown File" and select your `.md` file
3. Click "Convert to PDF"
4. Your PDF will be automatically downloaded!

## 🛠️ Technologies Used

- **Express.js** - Web server framework
- **Marked** - Markdown parser
- **Puppeteer** - Headless Chrome for PDF generation
- **HTML/CSS** - Beautiful frontend interface

## 📋 API Endpoints

### `GET /`
Serves the upload interface

### `POST /convert`
Converts uploaded markdown file to PDF
- **Content-Type:** `multipart/form-data`
- **Body:** Form data with `mdFile` field
- **Response:** PDF file download

## 🎨 Customization

You can customize the PDF styling by editing the CSS in the `styledHtml` section of `server.js`:

```javascript
const styledHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            /* Customize your PDF styles here */
            body { ... }
            h1 { ... }
            h2 { ... }
        </style>
    </head>
    ...
`;
```

## 📦 Project Structure

```
.
├── server.js           # Main server file
├── package.json        # Dependencies and scripts
└── README_SERVER.md    # This file
```

## 🔧 Configuration

The server runs on port 3000 by default. You can change this in `server.js`:

```javascript
const PORT = 3000; // Change to your preferred port
```

## 🐛 Troubleshooting

**Puppeteer installation issues:**
If you encounter issues installing Puppeteer, try:
```bash
npm install puppeteer --unsafe-perm=true --allow-root
```

**Port already in use:**
Change the PORT variable in server.js to a different port number.

## 📝 License

MIT License - Feel free to use this project for personal or commercial purposes!

## 👨‍💻 Author

Darshan Bhensdadia

---

Made with ❤️ by Darshan Bhensdadia using Node.js

