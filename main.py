from flask import Flask, request, jsonify
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import PassiveAggressiveClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from flask_cors import CORS
import google.generativeai as genai
import pandas as pd

app = Flask(__name__)
CORS(app)

# Load your dataset (replace 'your_dataset.csv' with your actual dataset file)
data = pd.read_csv('/Users/sreelakshmi/Desktop/Raghul/openaiapi/Creme data copy 3 Supersede dataset.csv', encoding='latin1')

# Data preprocessing
data = data.sample(frac=1).reset_index(drop=True)
data['Sentence'] = data['Sentence'].fillna('')
X = data['Sentence']
Y = data['Label']
X_train, X_test, y_train, y_test = train_test_split(X, Y, test_size=0.15, random_state=13)

# Load the trained model
model = make_pipeline(TfidfVectorizer(stop_words='english'), PassiveAggressiveClassifier())
model.fit(X_train, y_train)

# Access your API key as an environment variable
api_key = "AIzaSyBXKKqql55PMGHSwWDiuoSmVNpAYiQ4W3c"
genai.configure(api_key = api_key)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        input_data = request.json
        input_sentence = input_data.get('sentence', '')
        predicted_label = model.predict([input_sentence])[0]
        return jsonify({'prediction': predicted_label})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route("/generateContent", methods=['POST'])

def generate_content():
    try:
        model = genai.GenerativeModel('gemini-pro')
        prompt = request.json["prompt"]        
        response = model.generate_content(prompt) 
        text = response.text        
        return jsonify({"result": text})
    except Exception as error:
        print("Error generating content:", error)
        return jsonify({"error": str(error)}), 500

if __name__ == "__main__":
    print('Running in port 3333')
    app.run(port=3333)
