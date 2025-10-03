
from flask import Flask, jsonify, request, send_from_directory
import sqlite3, os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'bloodbank.db')
FRONTEND_DIR = os.path.join(BASE_DIR, '../frontend')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='/')

# Serve frontend index.html
@app.route('/')
def index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

# Serve static files (css, js, etc.)
@app.route('/<path:path>')
def static_proxy(path):
    file_path = os.path.join(FRONTEND_DIR, path)
    if os.path.exists(file_path):
        return send_from_directory(FRONTEND_DIR, path)
    return send_from_directory(FRONTEND_DIR, 'index.html')

# --- API ---
@app.route('/api/donors', methods=['GET'])
def list_donors():
    conn = get_db()
    cur = conn.execute('SELECT * FROM donors')
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

@app.route('/api/donors', methods=['POST'])
def add_donor():
    data = request.get_json() or request.form
    fields = ('name','age','blood_group','contact','city','last_donation_date')
    vals = [data.get(f) for f in fields]
    conn = get_db()
    cur = conn.execute('INSERT INTO donors (name,age,blood_group,contact,city,last_donation_date) VALUES (?,?,?,?,?,?)', vals)
    conn.commit()
    donor_id = cur.lastrowid
    conn.close()
    return jsonify({'id': donor_id}), 201

@app.route('/api/requests', methods=['GET'])
def list_requests():
    conn = get_db()
    cur = conn.execute('SELECT * FROM requests ORDER BY created_at DESC')
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

@app.route('/api/requests', methods=['POST'])
def add_request():
    data = request.get_json() or request.form
    fields = ('patient_name','blood_group','units','hospital','city','contact')
    vals = [data.get(f) for f in fields]
    conn = get_db()
    cur = conn.execute('INSERT INTO requests (patient_name,blood_group,units,hospital,city,contact) VALUES (?,?,?,?,?,?)', vals)
    conn.commit()
    req_id = cur.lastrowid
    conn.close()
    return jsonify({'id': req_id}), 201

@app.route('/api/requests/<int:req_id>/status', methods=['PUT'])
def update_request_status(req_id):
    data = request.get_json() or request.form
    status = data.get('status')
    if status not in ('pending','fulfilled','cancelled'):
        return jsonify({'error':'invalid status'}), 400
    conn = get_db()
    conn.execute('UPDATE requests SET status=? WHERE id=?', (status, req_id))
    conn.commit()
    conn.close()
    return jsonify({'id': req_id, 'status': status})

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json() or request.form
    username = data.get('username')
    password = data.get('password')
    conn = get_db()
    cur = conn.execute('SELECT * FROM admin WHERE username=? AND password=?', (username, password))
    row = cur.fetchone()
    conn.close()
    if row:
        return jsonify({'success': True})
    return jsonify({'success': False}), 401

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
