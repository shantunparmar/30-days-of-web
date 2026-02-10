from flask import Flask, render_template, request
import json

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def index():
    formatted_json = ""
    error = ""
    original_input = ""

    if request.method == "POST":
        original_input = request.form.get("json_input", "")
        try:
            # Step 1: Validate the data
            parsed_data = json.loads(original_input)
            
            # Step 2: Format with 4-space indentation
            formatted_json = json.dumps(parsed_data, indent=4, sort_keys=True)
        except json.JSONDecodeError as e:
            # Catch specific syntax errors (missing commas, quotes, etc.)
            error = f"Invalid JSON: {e.msg} (Line {e.lineno}, Col {e.colno})"

    return render_template("index.html", 
                           formatted_json=formatted_json, 
                           error=error, 
                           original_input=original_input)

if __name__ == "__main__":
    app.run(debug=True)
