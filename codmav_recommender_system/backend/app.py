from flask import Flask, request, jsonify
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi
import spacy
import chromadb
from chromadb.utils import embedding_functions
import os
import pandas as pd

app = Flask(__name__)

# Load Spacy model
nlp = spacy.load("en_core_web_sm")

# Load necessary models and data
df = pd.read_csv('preprocessed_file.csv')  # Replace with your data source

# Initialize models
sentence_model = SentenceTransformer('all-mpnet-base-v2')

def load_embeddings_and_metadata(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'rb') as f:
            embeddings, metadata = pickle.load(f)
    else:
        embeddings, metadata = [], []
    return embeddings, metadata

embeddings, metadata = load_embeddings_and_metadata('embeddings_metadata.pkl')

client = chromadb.Client()

try:
    collection = client.get_collection(
        name="enhanced_search",
        embedding_function=embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-mpnet-base-v2")
    )
    print("Using existing collection")
except ValueError:
    collection = client.create_collection(
        name="enhanced_search",
        embedding_function=embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-mpnet-base-v2")
    )
    print("Created new collection")

def preprocess_text(text):
    doc = nlp(text.lower())
    return ' '.join([token.lemma_ for token in doc if not token.is_stop and token.is_alpha])

def add_new_entries(df, embeddings, metadata, collection):
    existing_ids = {entry['Title_y'] for entry in metadata}
    new_embeddings = []
    new_metadata = []

    for idx, row in df.iterrows():
        if row['Title_y'] not in existing_ids:
            preprocessed_keywords = preprocess_text(row['keywords'])
            preprocessed_abstract = preprocess_text(row['abstract'])
            document = (preprocessed_keywords + " ")*3 + preprocessed_abstract
            embedding = sentence_model.encode(document)
            
            new_embeddings.append(embedding)
            new_metadata.append({
                'Title_y': row['Title_y'],
                'First_Name': row['First_Name'],
                'Last_Name': row['Last_Name'],
                'abstract': row['abstract'],
                'keywords': row['keywords'],
                'year': str(row['year'])
            })
            
            collection.add(
                ids=[str(idx)],
                documents=[document],
                metadatas=[new_metadata[-1]]
            )

    embeddings.extend(new_embeddings)
    metadata.extend(new_metadata)

    return embeddings, metadata

embeddings, metadata = add_new_entries(df, embeddings, metadata, collection)

def save_embeddings_and_metadata(embeddings, metadata, file_path):
    with open(file_path, 'wb') as f:
        pickle.dump((embeddings, metadata), f)

save_embeddings_and_metadata(embeddings, metadata, 'embeddings_metadata.pkl')

tfidf = TfidfVectorizer()
tfidf_matrix = tfidf.fit_transform([(m['keywords'] + " ")*3 + m['abstract'] for m in metadata])

corpus = [doc.split() for doc in ([(m['keywords'] + " ")*3 + m['abstract'] for m in metadata])]
bm25 = BM25Okapi(corpus)

def enhanced_semantic_search(query, n_direct_results=5, n_similar_results=3):
    preprocessed_query = preprocess_text(query)
    
    chroma_results = collection.query(
        query_texts=[preprocessed_query],
        n_results=n_direct_results
    )
    
    query_tfidf = tfidf.transform([preprocessed_query])
    tfidf_similarities = cosine_similarity(query_tfidf, tfidf_matrix).flatten()
    
    bm25_scores = bm25.get_scores(preprocessed_query.split())
    
    query_embedding = sentence_model.encode([preprocessed_query])[0]
    st_similarities = cosine_similarity([query_embedding], np.array(embeddings)).flatten()
    
    combined_scores = (
        0.35 * tfidf_similarities +
        0.35 * bm25_scores +
        0.3 * st_similarities
    )

    max_score = np.max(combined_scores)
    if max_score > 0:
        normalized_scores = combined_scores / max_score
    else:
        normalized_scores = combined_scores
    
    top_indices = normalized_scores.argsort()[-n_direct_results:][::-1]
    
    similar_results = []
    for index in top_indices:
        article_embedding = embeddings[index]
        similarities = cosine_similarity([article_embedding], np.array(embeddings)).flatten()
        similar_indices = similarities.argsort()[-n_similar_results-1:][::-1][1:]
        similar_results.extend(similar_indices)

    similar_results = list(set(similar_results) - set(top_indices))

    return top_indices, normalized_scores, similar_results

@app.route('/api/search', methods=['POST'])
def search():
    data = request.json
    query = data.get('query', '')
    n_direct_results = data.get('n_direct_results', 5)
    n_similar_results = data.get('n_similar_results', 3)
    
    top_indices, scores, similar_results = enhanced_semantic_search(query, n_direct_results, n_similar_results)
    
    response = {
        'direct_results': [{'id': idx, 'score': scores[idx], 'metadata': metadata[idx]} for idx in top_indices],
        'similar_results': [{'id': idx, 'metadata': metadata[idx]} for idx in similar_results]
    }
    
    return jsonify(response)

# New endpoint to handle keyword search
@app.route('/api/keyword-search', methods=['POST'])
def keyword_search():
    data = request.json
    keyword = data.get('keyword', '')
    
    # Filter articles based on keyword
    filtered_articles = [m for m in metadata if keyword.lower() in m['keywords'].lower()]
    
    response = {
        'articles': filtered_articles
    }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)
