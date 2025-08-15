#!/usr/bin/env python3
import http.server
import socketserver
import os

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

PORT = 8080
os.chdir('/Users/sambrewer/Desktop/Opus Test/FantasyGolf')

# Try different ports if the default is in use
for port in [8080, 8081, 8082, 8000, 3000]:
    try:
        with socketserver.TCPServer(("", port), MyHTTPRequestHandler) as httpd:
            print(f"Server running at http://localhost:{port}/")
            print(f"Open http://localhost:{port}/index.html in your browser")
            print("Press Ctrl+C to stop the server")
            httpd.serve_forever()
            break
    except OSError as e:
        if port == 3000:  # Last port in the list
            print(f"All ports are in use. Please try: python3 -m http.server 8888")
            raise
        else:
            print(f"Port {port} is in use, trying next port...")
            continue