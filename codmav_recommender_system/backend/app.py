import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.utils import embedding_functions
import spacy
from rank_bm25 import BM25Okapi
import os
from py2neo import Graph
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # This allows all origins. For production, configure this more strictly.

# Initialize models
sentence_model = SentenceTransformer('all-mpnet-base-v2')
nlp = spacy.load("en_core_web_sm")

# Neo4j Aura connection using py2neo
AURA_URI = "neo4j+s://xxxxxxxx.databases.neo4j.io"
AURA_USERNAME = "neo4j"
AURA_PASSWORD = "your-password"

graph = Graph(AURA_URI, auth=(AURA_USERNAME, AURA_PASSWORD))

# Load existing embeddings and metadata
def load_embeddings_and_metadata(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'rb') as f:
            embeddings, metadata = pickle.load(f)
    else:
        embeddings, metadata = [], []
    return embeddings, metadata

embeddings, metadata = load_embeddings_and_metadata('embeddings_metadata.pkl')

# Initialize ChromaDB
client = chromadb.Client()
collection = client.get_or_create_collection(
    name="enhanced_search",
    embedding_function=embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-mpnet-base-v2")
)

# Preprocess text
def preprocess_text(text):
    doc = nlp(text.lower())
    return ' '.join([token.lemma_ for token in doc if not token.is_stop and token.is_alpha])

# Create TF-IDF and BM25 indices
tfidf = TfidfVectorizer()
tfidf_matrix = tfidf.fit_transform([
    (m['keywords'] + " ") * 3 +  # Increase weight for keywords
    (m['title'] + " ") * 4 +     # Add title with high weight
    m['abstract']                # Keep abstract with lower weight
    for m in metadata
])

corpus = [doc.split() for doc in ([
    (m['keywords'] + " ") * 3 +
    (m['title'] + " ") * 4 +
    m['abstract']
    for m in metadata
])]
bm25 = BM25Okapi(corpus)

def comprehensive_search(query, page=1, limit=20):
    preprocessed_query = preprocess_text(query)
    
    # TF-IDF search
    query_tfidf = tfidf.transform([preprocessed_query])
    tfidf_similarities = cosine_similarity(query_tfidf, tfidf_matrix).flatten()
    
    # BM25 search
    bm25_scores = bm25.get_scores(preprocessed_query.split())
    
    # Sentence Transformer embeddings
    query_embedding = sentence_model.encode([preprocessed_query])[0]
    st_similarities = cosine_similarity([query_embedding], np.array(embeddings)).flatten()
    
    # Combine scores with updated weights
    combined_scores = (
        0.35 * tfidf_similarities +  # Increase weight for TF-IDF
        0.35 * bm25_scores +         # Increase weight for BM25
        0.3 * st_similarities       # Decrease weight for sentence embeddings
    )

    # Normalize scores
    max_score = np.max(combined_scores)
    if max_score > 0:
        normalized_scores = combined_scores / max_score
    else:
        normalized_scores = combined_scores
    
    # Sort indices by score in descending order
    sorted_indices = normalized_scores.argsort()[::-1]
    
    # Calculate start and end indices for pagination
    start = (page - 1) * limit
    end = start + limit
    
    # Get paginated results
    results = []
    for idx in sorted_indices[start:end]:
        score = normalized_scores[idx]
        year_str = str(metadata[idx]['year']).split('.')[0]
        results.append({
            'id': int(idx),
            'title': metadata[idx]['title'],
            'keywords': metadata[idx]['keywords'],
            'author': metadata[idx]['personName'],
            'year': int(year_str),
            'score': float(score)
        })
    
    return results

def get_similar_papers(paper_id, n_results=5, exclude_ids=None):
    if exclude_ids is None:
        exclude_ids = set()
    else:
        exclude_ids = set(exclude_ids)

    paper_embedding = embeddings[paper_id]
    similarities = cosine_similarity([paper_embedding], embeddings).flatten()
    
    # Sort indices by similarity, excluding the input paper and previously returned results
    sorted_indices = np.argsort(similarities)[::-1]
    filtered_indices = [idx for idx in sorted_indices if idx != paper_id and idx not in exclude_ids]
    
    results = []
    for idx in filtered_indices[:n_results]:
        year_str = str(metadata[idx]['year']).split('.')[0]
        results.append({
            'id': int(idx),
            'title': metadata[idx]['title'],
            'keywords': metadata[idx]['keywords'],
            'author': metadata[idx]['personName'],
            'year': int(year_str),
            'score': float(similarities[idx])
        })
    
    return results

@app.route('/')
def home():
    return "Enhanced Academic Search Engine Flask server is running!"

@app.route('/api/search', methods=['GET'])
def search():
    query = request.args.get('q', '')
    page = int(request.args.get('page', '1'))
    limit = int(request.args.get('limit', '20'))
    if not query:
        return jsonify({'error': 'No query provided'}), 400
    
    results = comprehensive_search(query, page, limit)
    return jsonify(results)

@app.route('/api/similar', methods=['GET'])
def similar():
    paper_id = request.args.get('id')
    exclude_ids = request.args.get('exclude', '').split(',')
    if not paper_id:
        return jsonify({'error': 'No paper ID provided'}), 400
    
    try:
        paper_id = int(paper_id)
        exclude_ids = [int(id) for id in exclude_ids if id]
        results = get_similar_papers(paper_id, n_results=5, exclude_ids=exclude_ids)
        if not results:
            return jsonify({'message': 'No similar papers found'}), 404
        return jsonify(results)
    except ValueError:
        return jsonify({'error': 'Invalid paper ID or exclude IDs'}), 400
    except IndexError:
        return jsonify({'error': 'Paper ID not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)