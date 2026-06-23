from flask import Flask, jsonify

app = Flask(__name__)


@app.route("/")
def home():
    return jsonify({
        "project": "Revenus IA Mission 500",
        "status": "running",
        "message": "Backend Flask initialisé avec succès."
    })


@app.route("/health")
def health():
    return jsonify({
        "status": "ok"
    })


if __name__ == "__main__":
    app.run(debug=True)
