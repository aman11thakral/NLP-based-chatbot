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
    
    # Remove common stop words that don't add much meaning
    stop_words = {'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
                 'be', 'been', 'being', 'in', 'on', 'at', 'to', 'for', 'with',
                 'about', 'against', 'between', 'into', 'through', 'during', 
                 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'of', 
                 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
                 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each'}
    
    words = text.split()
    filtered_words = [word for word in words if word not in stop_words]
    
    # If all words were stop words, return the original processed text to avoid empty strings
    if not filtered_words and words:
        return text
        
    return ' '.join(filtered_words)

def calculate_similarity(text1, text2):
    """
    Calculate similarity between two texts using a combination of techniques.
    
    Args:
        text1 (str): First text
        text2 (str): Second text
        
    Returns:
        float: Similarity score between 0 and 1
    """
    # Preprocess texts
    text1 = preprocess_text(text1)
    text2 = preprocess_text(text2)
    
    # If either string is empty after preprocessing, return 0
    if not text1 or not text2:
        return 0.0
    
    # Calculate similarity using SequenceMatcher
    sequence_score = SequenceMatcher(None, text1, text2).ratio()
    
    # Calculate word overlap similarity
    words1 = set(text1.split())
    words2 = set(text2.split())
    
    # If either set is empty, return the sequence score to avoid division by zero
    if not words1 or not words2:
        return sequence_score
    
    # Calculate Jaccard similarity (intersection over union)
    intersection = len(words1.intersection(words2))
    union = len(words1.union(words2))
    jaccard_score = intersection / union if union > 0 else 0
    
    # Calculate word match percentage
    match_percentage = intersection / min(len(words1), len(words2)) if min(len(words1), len(words2)) > 0 else 0
    
    # Weigh the different similarity metrics
    # Sequence matcher is good for detecting similar phrases, while Jaccard and word match are better for semantic similarity
    weighted_score = (sequence_score * 0.3) + (jaccard_score * 0.5) + (match_percentage * 0.2)
    
    # Add a penalty for short questions or very different word counts (often indicates unrelated questions)
    word_count_similarity = min(len(words1), len(words2)) / max(len(words1), len(words2)) if max(len(words1), len(words2)) > 0 else 0
    
    # If the lengths are very different, reduce the score
    if word_count_similarity < 0.5:
        weighted_score *= 0.8  # Penalty for very different lengths
        
    # Add context-specific keywords boost for material-related terms
    material_keywords = {"mdf", "hdhmr", "wood", "particle", "board", "boilo", "plywood", "timber", 
                        "material", "furniture", "cabinet", "door", "panel", "wardrobe", "kitchen",
                        "moisture", "resistance", "density", "termite", "borer", "action", "tesa"}
    
    user_words = set(text1.split())
    faq_words = set(text2.split())
    
    # If the user question contains material-related keywords that also appear in the FAQ question, boost the score
    material_overlap = len(user_words.intersection(material_keywords).intersection(faq_words))
    if material_overlap > 0:
        keyword_boost = min(0.15, 0.05 * material_overlap)  # Up to 15% boost based on keyword matches
        weighted_score = min(1.0, weighted_score + keyword_boost)  # Cap at 1.0
    
    return weighted_score

def is_comparison_question(question):
    """
    Determine if a question is asking for a comparison between different wood materials.
    
    Args:
        question (str): The user's question
        
    Returns:
        bool: True if it's a comparison question, False otherwise
    """
    # Convert to lowercase for easier matching
    q = question.lower()
    
    # List of materials to check for
    materials = ["mdf", "hdhmr", "boilo", "particle board", "particleboard", "wood"]
    
    # Check if multiple materials are mentioned
    mentioned_materials = [m for m in materials if m in q]
    
    # Comparison keywords
    comparison_words = ["vs", "versus", "compare", "difference", "between", "better", "stronger", 
                         "comparison", "differ", "or", ",", "and"]
    
    # Check if any comparison words are present
    has_comparison_word = any(word in q for word in comparison_words)
    
    # Return True if at least 2 materials are mentioned and there's a comparison word
    return len(mentioned_materials) >= 2 and has_comparison_word


def get_material_definitions():
    """
    Return definitions for all materials for comparison questions.
    
    Returns:
        str: Formatted definitions of all materials
    """
    definitions = {
        "MDF": "Medium Density Fiberboard (MDF) is an engineered wood product. It is made by breaking down hardwood or softwood residuals into wood fibers. These fibers are combined with wax and a resin binder, then formed into panels by applying high temperature and pressure. MDF is known for its uniform density, smooth surface, and consistent properties throughout the panel.",
        
        "HDHMR": "Action TESA HDHMR is a registered trademark of Balaji Action Buildwell Pvt. Ltd. It has many characteristics which make it the first choice of consumers and influencers. HDHMR characteristics include:\n• High Density\n• High Moisture Resistance\n• Borer Resistance\n• Termite Resistance\n• Ready-to-use smooth surface",
        
        "BOILO": "Boiling Water Resistant (BOILO) panels are high-quality engineered wood products. They offer exceptional resistance to moisture, even when exposed to boiling water. BOILO panels are specially treated to withstand humid conditions. This makes them suitable for kitchens, bathrooms, and other areas with high moisture exposure.",
        
        "Particle Board": "Particle board is an engineered wood product manufactured from wood chips, sawmill shavings, or sawdust. It uses a synthetic resin or other suitable binder, which is pressed and extruded. Particle board offers several benefits:\n• Cost-effective solution\n• Uniform density throughout\n• Environmentally friendly (uses recycled wood materials)\n• Good screw-holding ability"
    }
    
    # Format the definitions in a readable way with clear separation
    formatted_response = "**Comparison of Wood Materials**\n\n"
    
    for material, definition in definitions.items():
        formatted_response += f"**{material}**\n"
        # Handle the definition text with proper formatting
        if "\n•" in definition:
            # For bullet points, preserve them
            formatted_response += definition.replace("\n•", "\n  •")
        else:
            # For regular text paragraphs
            sentences = [s.strip() for s in definition.split(". ") if s.strip()]
            formatted_response += "\n  ".join(sentences)
        formatted_response += "\n\n--------------------\n\n"  # Horizontal divider between materials
    
    return formatted_response


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
        # Check if this is a comparison question between different materials
        if is_comparison_question(question):
            logger.debug("Detected a comparison question, providing definitions for all materials")
            return get_material_definitions(), 0.95  # High confidence for these specific responses
        
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
