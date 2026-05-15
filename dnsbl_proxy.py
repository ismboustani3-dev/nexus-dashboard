from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import subprocess
import re
import urllib.parse

class DNSBLHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Add CORS headers
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()
        
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        
        if parsed.path == '/check':
            ip = params.get('ip', [''])[0]
            if not ip or not re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', ip):
                self.wfile.write(json.dumps({'error': 'Invalid IP'}).encode())
                return
            
            rev = '.'.join(ip.split('.')[::-1])
            
            zones = [
                {'name': 'Spamhaus ZEN', 'zone': 'zen.spamhaus.org'},
                {'name': 'SpamCop', 'zone': 'bl.spamcop.net'},
                {'name': 'Barracuda', 'zone': 'b.barracudacentral.org'},
                {'name': 'UCEPROTECT-1', 'zone': 'dnsbl-1.uceprotect.net'},
                {'name': 'DroneRL', 'zone': 'dnsbl.dronebl.org'},
                {'name': 'SORBS', 'zone': 'dnsbl.sorbs.net'},
                {'name': 'Abuseat CBL', 'zone': 'cbl.abuseat.org'},
            ]
            
            results = []
            listed = False
            
            for z in zones:
                query = f"{rev}.{z['zone']}"
                try:
                    output = subprocess.run(
                        ['nslookup', '-type=A', query],
                        capture_output=True, text=True, timeout=5
                    )
                    stdout = output.stdout
                    # Look for 127.0.0.x pattern in output
                    match = re.search(r'Address:\s*(127\.0\.0\.\d+)', stdout)
                    if match:
                        results.append({'zone': z['name'], 'status': 'LISTED', 'code': match.group(1)})
                        listed = True
                    else:
                        results.append({'zone': z['name'], 'status': 'CLEAN'})
                except Exception as e:
                    results.append({'zone': z['name'], 'status': 'ERROR', 'error': str(e)})
            
            response = {
                'ip': ip,
                'listed': listed,
                'results': results,
                'listedOn': [r['zone'] for r in results if r['status'] == 'LISTED']
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.wfile.write(json.dumps({'status': 'DNSBL Proxy Running', 'usage': '/check?ip=1.2.3.4'}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()
    
    def log_message(self, format, *args):
        ip_match = re.search(r'ip=([^&\s]+)', args[0] if args else '')
        if ip_match:
            print(f"[DNSBL] Checking {ip_match.group(1)}...")
        else:
            print(f"[DNSBL] {args[0] if args else 'request'}")

if __name__ == '__main__':
    port = 8082
    server = HTTPServer(('0.0.0.0', port), DNSBLHandler)
    print(f"DNSBL Proxy running on http://localhost:{port}")
    print(f"Usage: http://localhost:{port}/check?ip=51.38.72.124")
    server.serve_forever()
