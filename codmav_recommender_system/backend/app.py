import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import spacy
from rank_bm25 import BM25Okapi
import os
import json
from py2neo import Graph
from flask import Flask, request, jsonify
from flask_cors import CORS
from tqdm import tqdm
from functools import lru_cache
from collections import defaultdict
import threading
import concurrent.futures

app = Flask(__name__)
CORS(app)

# Initialize models
sentence_model = SentenceTransformer('all-mpnet-base-v2')
nlp = spacy.load("en_core_web_sm")

# Neo4j Aura connection using py2neo
AURA_URI = "neo4j+s://4317f220.databases.neo4j.io"
AURA_USERNAME = "neo4j"
AURA_PASSWORD = "ieizSLiVB2yoMwHVIPpzzLhRK6YTPPzg92Bl6sPHYY0"

graph = Graph(AURA_URI, auth=(AURA_USERNAME, AURA_PASSWORD))

# Initialize global variables
tfidf = None
tfidf_matrix = None
bm25 = None
corpus = None
embeddings = []
metadata = []
search_cache = defaultdict(lambda: {'results': [], 'page': 0})

# Thread-local storage for database connection
thread_local = threading.local()

def get_db_connection():
    if not hasattr(thread_local, "graph"):
        thread_local.graph = Graph(AURA_URI, auth=(AURA_USERNAME, AURA_PASSWORD))
    return thread_local.graph

def load_embeddings_and_metadata(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'rb') as f:
            return pickle.load(f)
    return [], []

def save_embeddings_and_metadata(embeddings, metadata, file_path):
    with open(file_path, 'wb') as f:
        pickle.dump((embeddings, metadata), f)

@lru_cache(maxsize=10000)
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

def format_doi(doi):
    if doi is None or doi == 'N/A' or doi == 'NAN':
        return 'N/A'
    return f'https://doi.org/{doi}' if not doi.startswith('http') else doi

def check_and_update_database():
    global metadata, embeddings
    
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
    results = get_db_connection().run(query).data()
    
    new_entries = [result for result in results if not entry_exists(result, metadata)]
    
    if new_entries:
        print(f"Creating embeddings for {len(new_entries)} new entries...")
        with concurrent.futures.ThreadPoolExecutor() as executor:
            new_embeddings = list(executor.map(
                lambda entry: sentence_model.encode(
                    f"{entry['title']} {entry['abstract']} {' '.join(entry['keywords'])}"
                ),
                new_entries
            ))
        
        embeddings.extend(new_embeddings)
        metadata.extend(new_entries)
        
        save_embeddings_and_metadata(embeddings, metadata, 'embeddings_metadata.pkl')
        update_search_indices()
        print(f"Added {len(new_entries)} new entries to the database.")
    else:
        print("No new entries found. Database is up to date.")

def update_search_indices():
    global tfidf, tfidf_matrix, bm25, corpus
    
    corpus = [
        (" ".join(m['keywords']) + " ") * 3 +
        (m['title'] + " ") * 5 +
        m['abstract']
        for m in metadata
    ]
    
    tfidf = TfidfVectorizer()
    tfidf_matrix = tfidf.fit_transform(corpus)
    
    tokenized_corpus = [doc.split() for doc in corpus]
    bm25 = BM25Okapi(tokenized_corpus)

def comprehensive_search(query, page=1, limit=20):
    global tfidf, tfidf_matrix, bm25, corpus, search_cache
    
    if tfidf is None or tfidf_matrix is None or bm25 is None or corpus is None:
        update_search_indices()
    
    cache_key = f"{query}_{limit}"
    cache_entry = search_cache[cache_key]
    
    if page <= cache_entry['page']:
        start = (page - 1) * limit
        end = start + limit
        return cache_entry['results'][start:end]
    
    preprocessed_query = preprocess_text(query)
    
    query_tfidf = tfidf.transform([preprocessed_query])
    tfidf_similarities = cosine_similarity(query_tfidf, tfidf_matrix).flatten()
    
    bm25_scores = np.array(bm25.get_scores(preprocessed_query.split()))
    
    query_embedding = sentence_model.encode([preprocessed_query])[0]
    st_similarities = cosine_similarity([query_embedding], embeddings).flatten()
    
    combined_scores = 0.35 * tfidf_similarities + 0.35 * bm25_scores + 0.3 * st_similarities
    
    max_score = np.max(combined_scores)
    normalized_scores = combined_scores / max_score if max_score > 0 else combined_scores
    
    sorted_indices = normalized_scores.argsort()[::-1]
    
    new_results = [
        {
            'id': int(idx),
            'title': metadata[idx]['title'],
            'keywords': metadata[idx]['keywords'],
            'author': metadata[idx]['personName'],
            'co_authors': metadata[idx]['co_authors'],
            'year': int(str(metadata[idx]['year']).split('.')[0]),
            'doi': metadata[idx]['doi'],
            'score': float(normalized_scores[idx])
        }
        for idx in sorted_indices[len(cache_entry['results']):]
    ]
    
    cache_entry['results'].extend(new_results)
    cache_entry['page'] = page
    
    start = (page - 1) * limit
    end = start + limit
    
    return cache_entry['results'][start:end]

@lru_cache(maxsize=1000)
def get_similar_papers(paper_id, n_results=5, exclude_ids=None):
    if exclude_ids is None:
        exclude_ids = set()
    else:
        exclude_ids = set(exclude_ids)

    paper_embedding = embeddings[paper_id]
    similarities = cosine_similarity([paper_embedding], embeddings).flatten()
    
    sorted_indices = np.argsort(similarities)[::-1]
    filtered_indices = [idx for idx in sorted_indices if idx != paper_id and idx not in exclude_ids]
    
    results = [
        {
            'id': int(idx),
            'title': metadata[idx]['title'],
            'keywords': metadata[idx]['keywords'],
            'author': metadata[idx]['personName'],
            'co_authors': metadata[idx]['co_authors'],
            'year': int(str(metadata[idx]['year']).split('.')[0]),
            'doi': metadata[idx]['doi'],
            'score': float(similarities[idx])
        }
        for idx in filtered_indices[:n_results]
    ]
    
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
        exclude_ids = tuple(int(id) for id in exclude_ids if id)
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
    threading.Thread(target=check_and_update_database).start()
    return jsonify({'message': 'Database update started in background'}), 202

if __name__ == '__main__':
    embeddings, metadata = load_embeddings_and_metadata('embeddings_metadata.pkl')
    check_and_update_database()
    app.run(debug=False, threaded=True)