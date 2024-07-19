# %%
import pickle
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.utils import embedding_functions
import spacy
from rank_bm25 import BM25Okapi
import os

# %%
df = pd.read_csv('preprocessed_file.csv')  # Replace with your data source

# Initialize models
sentence_model = SentenceTransformer('all-mpnet-base-v2')
nlp = spacy.load("en_core_web_sm")

# Load existing embeddings and metadata if available
def load_embeddings_and_metadata(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'rb') as f:
            embeddings, metadata = pickle.load(f)
    else:
        embeddings, metadata = [], []
    return embeddings, metadata

embeddings, metadata = load_embeddings_and_metadata('embeddings_metadata.pkl')

# %%
client = chromadb.Client()

# Load or create collection
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

# %%


# %%
# Preprocess text
def preprocess_text(text):
    doc = nlp(text.lower())
    return ' '.join([token.lemma_ for token in doc if not token.is_stop and token.is_alpha])


# %%
# Function to add new entries
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

# Add new entries to embeddings and metadata
embeddings, metadata = add_new_entries(df, embeddings, metadata, collection)


# %%
# Function to save embeddings and metadata
def save_embeddings_and_metadata(embeddings, metadata, file_path):
    with open(file_path, 'wb') as f:
        pickle.dump((embeddings, metadata), f)

# Save updated embeddings and metadata to file
save_embeddings_and_metadata(embeddings, metadata, 'embeddings_metadata.pkl')

tfidf = TfidfVectorizer()
tfidf_matrix = tfidf.fit_transform([(m['keywords'] + " ")*3 + m['abstract'] for m in metadata])

# Create BM25 index
corpus = [doc.split() for doc in ([(m['keywords'] + " ")*3 + m['abstract'] for m in metadata])]
bm25 = BM25Okapi(corpus)


# %%
def enhanced_semantic_search(query, n_direct_results=5, n_similar_results=3):
    # Preprocess query
    preprocessed_query = preprocess_text(query)
    
    # ChromaDB search
    chroma_results = collection.query(
        query_texts=[preprocessed_query],
        n_results=n_direct_results
    )
    
    # TF-IDF search
    query_tfidf = tfidf.transform([preprocessed_query])
    tfidf_similarities = cosine_similarity(query_tfidf, tfidf_matrix).flatten()
    
    # BM25 search
    bm25_scores = bm25.get_scores(preprocessed_query.split())
    
    # Sentence Transformer embeddings
    query_embedding = sentence_model.encode([preprocessed_query])[0]
    st_similarities = cosine_similarity([query_embedding], np.array(embeddings)).flatten()
    
    # Combine scores
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
    
    # Get top direct results
    top_indices = normalized_scores.argsort()[-n_direct_results:][::-1]
    
    # Print direct results
    print("Direct Search Results:")
    for idx, index in enumerate(top_indices):
        print(f"Result {idx + 1}:")
        print(f"ID: {index}")
        print(f"Normalized Score: {normalized_scores[index]:.4f}")
        print(f"Title: {metadata[index]['Title_y']}")
        print(f"Name: {metadata[index]['First_Name']} {metadata[index]['Last_Name']}")
        print(f"Keywords: {metadata[index]['keywords']}")
        print(f"Abstract: {metadata[index]['abstract'][:100]}...")
        print(f"Year: {metadata[index]['year']}")
        print("\n")

    # Find similar articles for each top result
    similar_results = []
    for index in top_indices:
        article_embedding = embeddings[index]
        similarities = cosine_similarity([article_embedding], np.array(embeddings)).flatten()
        similar_indices = similarities.argsort()[-n_similar_results-1:][::-1][1:]  # exclude the article itself
        similar_results.extend(similar_indices)

    # Remove duplicates and already shown results
    similar_results = list(set(similar_results) - set(top_indices))

    # Print similar results
    print("Similar Articles:")
    for idx, index in enumerate(similar_results):
        print(f"Similar Result {idx + 1}:")
        print(f"ID: {index}")
        print(f"Title: {metadata[index]['Title_y']}")
        print(f"Name: {metadata[index]['First_Name']} {metadata[index]['Last_Name']}")
        print(f"Keywords: {metadata[index]['keywords']}")
        print(f"Abstract: {metadata[index]['abstract'][:100]}...")
        print(f"Year: {metadata[index]['year']}")
        print("\n")

    return top_indices, normalized_scores, similar_results

# Example usage
top_indices, scores, similar_results = enhanced_semantic_search("Recommendation system")

# %%
# Example usage
enhanced_semantic_search("Machine Learning")


# %%



