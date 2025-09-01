import os
import io
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, session, jsonify, send_file
from werkzeug.utils import secure_filename
from PIL import Image

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload size
app.secret_key = 'super-secret-key'  # Necessary for session management

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    template_image = session.get('template_image', None)
    panel_images = session.get('panel_images', None)
    return render_template('index.html', template_image=template_image, panel_images=panel_images)

@app.route('/upload_template', methods=['POST'])
def upload_template():
    if 'template_file' not in request.files:
        return redirect(request.url)
    file = request.files['template_file']
    if file.filename == '':
        return redirect(request.url)
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        session['template_image'] = filename
        # Clear old panel images when a new template is uploaded
        session.pop('panel_images', None)
    return redirect(url_for('index'))

@app.route('/upload_panels', methods=['POST'])
def upload_panels():
    files = request.files.getlist('panel_files[]')
    panel_filenames = session.get('panel_images', [])

    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            if filename not in panel_filenames:
                panel_filenames.append(filename)

    session['panel_images'] = panel_filenames
    return redirect(url_for('index'))

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/generate', methods=['POST'])
def generate_image():
    data = request.json
    template_image_name = session.get('template_image')

    if not template_image_name:
        return jsonify({'error': 'No template image found'}), 400

    base_path = os.path.join(app.config['UPLOAD_FOLDER'], template_image_name)
    base_image = Image.open(base_path).convert('RGBA')

    for img_data in data.get('images', []):
        panel_path = os.path.join(app.config['UPLOAD_FOLDER'], img_data['src'])
        panel_image = Image.open(panel_path).convert('RGBA')

        # Resize panel image
        panel_image = panel_image.resize((img_data['width'], img_data['height']))

        # Paste onto base image
        base_image.paste(panel_image, (img_data['x'], img_data['y']), panel_image)

    # Save to a bytes buffer
    img_io = io.BytesIO()
    base_image.save(img_io, 'PNG')
    img_io.seek(0)

    return send_file(img_io, mimetype='image/png', as_attachment=True, download_name='ma_planche_de_bd.png')

if __name__ == '__main__':
    app.run(debug=True, port=5001) # Using a different port to avoid conflicts
