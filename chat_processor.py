import logging
import re
from difflib import SequenceMatcher

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def preprocess_text(text):
    """
    Preprocess text by converting to lowercase and removing special characters.
    
    Args:
        text (str): Input text
        
    Returns:
        str: Preprocessed text
    """
    if not text:
        return ""
    # Convert to lowercase
    text = text.lower()
    # Remove special characters and extra spaces
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def calculate_similarity(text1, text2):
    """
    Calculate similarity between two texts using SequenceMatcher.
    
    Args:
        text1 (str): First text
        text2 (str): Second text
        
    Returns:
        float: Similarity score between 0 and 1
    """
    # Preprocess texts
    text1 = preprocess_text(text1)
    text2 = preprocess_text(text2)
    
    # Calculate similarity using SequenceMatcher
    matcher = SequenceMatcher(None, text1, text2)
    return matcher.ratio()

def get_best_answer(question, faq_data):
    """
    Find the best matching answer for a user question from the FAQ data.
    
    Args:
        question (str): The user's question
        faq_data (list): List of dictionaries containing 'Question' and 'Answer' keys
        
    Returns:
        tuple: (best_answer, confidence_score)
    """
    if not faq_data:
        logger.warning("No FAQ data available")
        return "I don't have any information in my database yet.", 0.0
    
    if not question:
        return "Please ask a question.", 0.0
    
    try:
        # Preprocess user question
        preprocessed_question = preprocess_text(question)
        
        # Calculate similarity scores for all FAQ questions
        similarity_scores = []
        for item in faq_data:
            faq_question = item['Question']
            similarity = calculate_similarity(preprocessed_question, faq_question)
            similarity_scores.append(similarity)
        
        # Find the best match
        if not similarity_scores:
            return "No matching questions found.", 0.0
            
        best_match_idx = similarity_scores.index(max(similarity_scores))
        best_match_score = similarity_scores[best_match_idx]
        
        logger.debug(f"Best match score: {best_match_score} for question: {faq_data[best_match_idx]['Question']}")
        
        # Return the answer for the best matching question
        return faq_data[best_match_idx]['Answer'], best_match_score
        
    except Exception as e:
        logger.error(f"Error finding best answer: {e}")
        return "I'm sorry, I encountered an error while processing your question.", 0.0
