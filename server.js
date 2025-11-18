const express = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve the upload form
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Markdown to PDF Converter</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    max-width: 600px;
                    width: 100%;
                }
                h1 {
                    color: #333;
                    margin-bottom: 10px;
                    text-align: center;
                }
                .subtitle {
                    color: #666;
                    text-align: center;
                    margin-bottom: 30px;
                    font-size: 14px;
                }
                .upload-area {
                    border: 2px dashed #667eea;
                    border-radius: 10px;
                    padding: 40px;
                    text-align: center;
                    margin-bottom: 20px;
                    transition: all 0.3s;
                }
                .upload-area:hover {
                    border-color: #764ba2;
                    background: #f8f9ff;
                }
                .file-input {
                    display: none;
                }
                .upload-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px 30px;
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: transform 0.2s;
                }
                .upload-btn:hover {
                    transform: translateY(-2px);
                }
                .convert-btn {
                    width: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px;
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: bold;
                    transition: transform 0.2s;
                    margin-top: 20px;
                }
                .convert-btn:hover {
                    transform: translateY(-2px);
                }
                .convert-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .file-name {
                    margin-top: 15px;
                    color: #667eea;
                    font-weight: bold;
                }
                .loading {
                    display: none;
                    text-align: center;
                    margin-top: 20px;
                }
                .spinner {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📄 Markdown to PDF Converter</h1>
                <p class="subtitle">Upload your .md file and convert it to a beautiful PDF</p>
                
                <form id="uploadForm" enctype="multipart/form-data">
                    <div class="upload-area">
                        <label for="mdFile" style="cursor: pointer;">
                            <div style="font-size: 48px; margin-bottom: 10px;">📁</div>
                            <button type="button" class="upload-btn" onclick="document.getElementById('mdFile').click()">
                                Choose Markdown File
                            </button>
                        </label>
                        <input type="file" id="mdFile" name="mdFile" accept=".md" class="file-input" required>
                        <div id="fileName" class="file-name"></div>
                    </div>
                    
                    <button type="submit" class="convert-btn" id="convertBtn">Convert to PDF</button>
                </form>
                
                <div class="loading" id="loading">
                    <div class="spinner"></div>
                    <p style="margin-top: 10px; color: #667eea;">Converting...</p>
                </div>
            </div>

            <script>
                const fileInput = document.getElementById('mdFile');
                const fileName = document.getElementById('fileName');
                const form = document.getElementById('uploadForm');
                const loading = document.getElementById('loading');
                const convertBtn = document.getElementById('convertBtn');

                fileInput.addEventListener('change', (e) => {
                    if (e.target.files.length > 0) {
                        fileName.textContent = '✓ ' + e.target.files[0].name;
                    }
                });

                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const formData = new FormData(form);
                    
                    loading.style.display = 'block';
                    convertBtn.disabled = true;

                    try {
                        const response = await fetch('/convert', {
                            method: 'POST',
                            body: formData
                        });

                        if (response.ok) {
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'converted.pdf';
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                            
                            alert('✓ PDF downloaded successfully!');
                        } else {
                            alert('Error converting file. Please try again.');
                        }
                    } catch (error) {
                        alert('Error: ' + error.message);
                    } finally {
                        loading.style.display = 'none';
                        convertBtn.disabled = false;
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// Convert endpoint
app.post('/convert', async (req, res) => {
    try {
        // Handle file upload
        let mdContent = '';
        
        // Simple file upload handling
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
            const buffer = Buffer.concat(chunks);
            const boundary = req.headers['content-type'].split('boundary=')[1];
            const parts = buffer.toString().split(`--${boundary}`);
            
            for (const part of parts) {
                if (part.includes('filename=')) {
                    const contentStart = part.indexOf('\r\n\r\n') + 4;
                    const contentEnd = part.lastIndexOf('\r\n');
                    mdContent = part.substring(contentStart, contentEnd);
                    break;
                }
            }

            if (!mdContent) {
                return res.status(400).send('No markdown content found');
            }

            // Convert markdown to HTML
            let htmlContent = marked(mdContent);

            // Replace chain emoji with custom SVG icon (grey color)
            const linkIcon = '<svg width="14" height="14" viewBox="0 0 16 16" fill="#6a737d" style="display: inline-block; vertical-align: text-bottom; margin-right: 2px;"><path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/><path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/></svg>';

            // Replace 🔗 emoji in links with SVG icon
            htmlContent = htmlContent.replace(/(<a[^>]*>)🔗/g, `$1${linkIcon}`);

            // Create styled HTML with professional formatting
            const styledHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        @page {
                            margin: 0.5in;
                            size: A4;
                        }

                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }

                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
                            font-size: 10pt;
                            line-height: 1.3;
                            color: #24292e;
                            background: white;
                            max-width: 100%;
                            padding: 0;
                            margin: 0;
                        }

                        /* Headings */
                        h1 {
                            font-size: 20pt;
                            font-weight: 600;
                            margin: 0 0 6pt 0;
                            padding: 0;
                            line-height: 1.2;
                            color: #1a1a1a;
                            page-break-after: avoid;
                        }

                        h2 {
                            font-size: 14pt;
                            font-weight: 600;
                            margin: 10pt 0 5pt 0;
                            padding-bottom: 3pt;
                            border-bottom: 1px solid #d0d7de;
                            line-height: 1.2;
                            color: #1a1a1a;
                            page-break-after: avoid;
                        }

                        h3 {
                            font-size: 12pt;
                            font-weight: 600;
                            margin: 8pt 0 4pt 0;
                            line-height: 1.2;
                            color: #1a1a1a;
                            page-break-after: avoid;
                        }

                        h4 {
                            font-size: 11pt;
                            font-weight: 600;
                            margin: 6pt 0 3pt 0;
                            line-height: 1.2;
                            color: #1a1a1a;
                        }

                        /* Paragraphs */
                        p {
                            margin: 0 0 5pt 0;
                            line-height: 1.3;
                        }

                        /* Links */
                        a {
                            color: #1a1a1a;
                            text-decoration: none;
                            display: inline-flex;
                            align-items: center;
                            gap: 2px;
                        }

                        a:hover {
                            text-decoration: underline;
                        }

                        a svg {
                            flex-shrink: 0;
                        }

                        /* Lists */
                        ul, ol {
                            margin: 0 0 10pt 0;
                            padding-left: 24pt;
                        }

                        li {
                            margin: 4pt 0;
                            line-height: 1.6;
                        }

                        li > p {
                            margin: 0;
                        }

                        ul ul, ol ul, ul ol, ol ol {
                            margin: 4pt 0;
                        }

                        /* Strong and emphasis */
                        strong, b {
                            font-weight: 600;
                            color: #1a1a1a;
                        }

                        em, i {
                            font-style: italic;
                        }

                        /* Code */
                        code {
                            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
                            font-size: 10pt;
                            background-color: #f6f8fa;
                            padding: 2pt 4pt;
                            border-radius: 3pt;
                        }

                        pre {
                            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
                            font-size: 10pt;
                            background-color: #f6f8fa;
                            padding: 12pt;
                            border-radius: 4pt;
                            overflow-x: auto;
                            margin: 0 0 10pt 0;
                            line-height: 1.45;
                        }

                        pre code {
                            background: none;
                            padding: 0;
                        }

                        /* Blockquotes */
                        blockquote {
                            margin: 0 0 10pt 0;
                            padding: 0 0 0 12pt;
                            border-left: 3pt solid #dfe2e5;
                            color: #6a737d;
                        }

                        /* Horizontal rules */
                        hr {
                            height: 0;
                            margin: 8pt 0;
                            border: 0;
                            border-top: 1pt solid #d0d7de;
                        }

                        /* Tables */
                        table {
                            border-collapse: collapse;
                            border-spacing: 0;
                            margin: 0 0 10pt 0;
                            width: 100%;
                        }

                        table th {
                            font-weight: 600;
                            background-color: #f6f8fa;
                            padding: 6pt 10pt;
                            border: 1pt solid #dfe2e5;
                        }

                        table td {
                            padding: 6pt 10pt;
                            border: 1pt solid #dfe2e5;
                        }

                        table tr {
                            background-color: white;
                        }

                        table tr:nth-child(2n) {
                            background-color: #f6f8fa;
                        }

                        /* Centered content */
                        [align="center"], .center {
                            text-align: center;
                        }

                        /* Page breaks */
                        .page-break {
                            page-break-after: always;
                        }

                        /* Avoid breaks */
                        h1, h2, h3, h4, h5, h6 {
                            page-break-inside: avoid;
                        }

                        /* Images */
                        img {
                            max-width: 100%;
                            height: auto;
                        }
                    </style>
                </head>
                <body>
                    ${htmlContent}
                </body>
                </html>
            `;

            // Convert HTML to PDF using Puppeteer with professional settings
            const browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            });

            const page = await browser.newPage();

            // Set viewport for consistent rendering
            await page.setViewport({
                width: 1200,
                height: 1600,
                deviceScaleFactor: 2
            });

            await page.setContent(styledHtml, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            // Generate PDF with professional settings
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: true,
                displayHeaderFooter: false,
                margin: {
                    top: '0.75in',
                    right: '0.75in',
                    bottom: '0.75in',
                    left: '0.75in'
                }
            });

            await browser.close();

            // Send PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=converted.pdf');
            res.send(pdfBuffer);
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error converting markdown to PDF');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📄 Upload your markdown files and convert them to PDF!`);
});

