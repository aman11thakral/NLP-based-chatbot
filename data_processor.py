import os
import logging
import glob
import traceback

# Try to import pandas, but have a fallback
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    logging.warning("Pandas not available, using fallback data")

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def load_all_faqs():
    """
    Load and process all FAQ Excel files in the attached_assets directory.
    If files can't be loaded, return default data.
    
    Returns:
        list: List of dictionaries containing 'Question' and 'Answer' keys
    """
    faq_data = []
    
    try:
        # Check if pandas is available
        if not PANDAS_AVAILABLE:
            logger.warning("Pandas not available, returning default FAQs")
            # Import here to avoid circular imports
            from models import FAQ
            return FAQ.get_default_data()
        
        # Get all Excel files in the attached_assets directory
        excel_files = glob.glob("attached_assets/*.xlsx")
        logger.info(f"Found {len(excel_files)} Excel files: {excel_files}")
        
        if not excel_files:
            # If no files found, use default data
            logger.warning("No Excel files found in attached_assets directory")
            from models import FAQ
            return FAQ.get_default_data()
        
        # Process each Excel file
        for file_path in excel_files:
            try:
                material_name = os.path.basename(file_path).replace("_FAQs.xlsx", "").replace("_Details.xlsx", "")
                logger.info(f"Processing {material_name} FAQs from {file_path}")
                
                try:
                    # Read the Excel file
                    df = pd.read_excel(file_path)
                    
                    # Check if the required columns exist
                    required_cols = ["Question", "Answer"]
                    if not all(col in df.columns for col in required_cols):
                        logger.warning(f"File {file_path} is missing required columns. Expected: {required_cols}, Found: {df.columns}")
                        # Try to find alternative column names
                        if "question" in df.columns and "answer" in df.columns:
                            df = df.rename(columns={"question": "Question", "answer": "Answer"})
                        else:
                            # If we can't find the right columns, skip this file
                            continue
                    
                    # Convert to list of dictionaries and add a material tag
                    file_data = df[["Question", "Answer"]].fillna("").to_dict('records')
                    for item in file_data:
                        item['Material'] = material_name
                    
                    faq_data.extend(file_data)
                    logger.info(f"Added {len(file_data)} FAQs from {material_name}")
                except Exception as file_error:
                    logger.error(f"Error reading Excel file {file_path}: {file_error}")
                    traceback.print_exc()
                    continue
                
            except Exception as e:
                logger.error(f"Error processing file {file_path}: {e}")
                continue
        
        logger.info(f"Total FAQs loaded: {len(faq_data)}")
        
        # If no data was loaded from files, use default data
        if not faq_data:
            logger.warning("No data was loaded from files, using default data")
            from models import FAQ
            return FAQ.get_default_data()
        
    except Exception as e:
        logger.error(f"Error loading FAQ data: {e}")
        traceback.print_exc()
        # Use default data
        from models import FAQ
        return FAQ.get_default_data()
    
    return faq_data
