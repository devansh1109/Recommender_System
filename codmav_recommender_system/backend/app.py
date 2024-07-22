import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import spacy
from rank_bm25 import BM25Okapi
import os
from py2neo import Graph
from flask import Flask, request, jsonify
from flask_cors import CORS
from tqdm import tqdm

app = Flask(__name__)
CORS(app)  # This allows all origins. For production, configure this more strictly.

# Initialize models
sentence_model = SentenceTransformer('all-mpnet-base-v2')
nlp = spacy.load("en_core_web_sm")

# Neo4j Aura connection using py2neo
AURA_URI = "neo4j+s://4317f220.databases.neo4j.io"
AURA_USERNAME = "neo4j"
AURA_PASSWORD = "ieizSLiVB2yoMwHVIPpzzLhRK6YTPPzg92Bl6sPHYY0"

graph = Graph(AURA_URI, auth=(AURA_USERNAME, AURA_PASSWORD))

# Initialize global variables for TF-IDF and BM25
tfidf = None
tfidf_matrix = None
bm25 = None
corpus = None
embeddings = []
metadata = []

# Load existing embeddings and metadata
def load_embeddings_and_metadata(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'rb') as f:
            loaded_data = pickle.load(f)
            if isinstance(loaded_data, tuple) and len(loaded_data) == 2:
                return loaded_data
    return [], []

# Save embeddings and metadata
def save_embeddings_and_metadata(embeddings, metadata, file_path):
    with open(file_path, 'wb') as f:
        pickle.dump((embeddings, metadata), f)

# Preprocess text
def preprocess_text(text):
    doc = nlp(text.lower())
    return ' '.join([token.lemma_ for token in doc if not token.is_stop and token.is_alpha])

def entry_exists(entry, metadata_list):
    return any(
        m.get('title') == entry.get('title') and
        m.get('personName') == entry.get('personName') and
        m.get('year') == entry.get('year') and
        m.get('co_authors') == entry.get('co_authors') and
        m.get('doi', '').lower() == entry.get('doi', '').lower()
        for m in metadata_list
    )

# Function to format DOI
def format_doi(doi):
    if doi is None or doi == 'N/A' or doi == 'NAN':
        return 'N/A'
    if doi.startswith('http'):
        return doi
    return f'https://doi.org/{doi}'

# Function to check and update database
def check_and_update_database():
    global tfidf, tfidf_matrix, bm25, corpus, metadata, embeddings
    
    query = """
    MATCH (p:Person)-[:WRITES]->(t:Title)-[:HAS_KEYWORD]->(k:Keyword)
    RETURN p.name AS personName,
           t.title AS title, 
           t.abstract AS abstract, 
           t.Year AS year, 
           t.co_authors AS co_authors,
           t.DOI AS doi,
           collect(k.keyw) AS keywords
    """
    results = graph.run(query).data()
    
    new_entries = []
    for result in results:
        result['doi'] = format_doi(result.get('doi'))
        if not entry_exists(result, metadata):
            new_entries.append(result)
            metadata.append(result)
    
    if new_entries:
        print(f"Creating embeddings for {len(new_entries)} new entries...")
        for entry in tqdm(new_entries, desc="Creating embeddings", unit="entry"):
            text_to_embed = f"{entry['title']} {entry['abstract']} {' '.join(entry['keywords'])}"
            embedding = sentence_model.encode([text_to_embed])[0]
            embeddings.append(embedding)
        
        save_embeddings_and_metadata(embeddings, metadata, 'embeddings_metadata.pkl')
        update_search_indices()
    else:
        print("No new entries found. Database is up to date.")

# Update TF-IDF and BM25 indices
def update_search_indices():
    global tfidf, tfidf_matrix, bm25, corpus
    
    # Create TF-IDF index
    tfidf = TfidfVectorizer()
    tfidf_matrix = tfidf.fit_transform([
        " ".join(m['keywords']) + " " * 3 +
        m['title'] + " " +
        m['abstract']
        for m in metadata
    ])

    # Create BM25 index
    corpus = [doc.split() for doc in [
        (" ".join(m['keywords']) + " ") * 3 +
        (m['title'] + " ") * 4 +
        m['abstract']
        for m in metadata
    ]]
    bm25 = BM25Okapi(corpus)

def comprehensive_search(query, page=1, limit=20):
    global tfidf, tfidf_matrix, bm25, corpus
    
    if tfidf is None or tfidf_matrix is None or bm25 is None or corpus is None:
        update_search_indices()
    
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
        0.35 * tfidf_similarities +
        0.35 * bm25_scores +
        0.3 * st_similarities
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
            'co_authors': metadata[idx]['co_authors'],
            'year': int(year_str),
            'doi': metadata[idx]['doi'],
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
            'co_authors': metadata[idx]['co_authors'],
            'year': int(year_str),
            'doi': metadata[idx]['doi'],
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

@app.route('/api/update_database', methods=['POST'])
def update_database():
    check_and_update_database()
    return jsonify({'message': 'Database check completed'}), 200

if __name__ == '__main__':
    embeddings, metadata = load_embeddings_and_metadata('embeddings_metadata.pkl')
    check_and_update_database()
    app.run(debug=True)