import os
import logging
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from chat_processor import get_best_answer
from data_processor import load_all_faqs

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_secret_key")

# Configure database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///chatbot.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
db = SQLAlchemy(app)

# Import models - imported here to avoid circular imports
from models import FAQ, ChatLog

# Create database tables
with app.app_context():
    db.create_all()
    logger.info("Database tables created")

# Load FAQ data on startup - always check for new Excel files
try:
    with app.app_context():
        # Clear existing FAQ data
        FAQ.query.delete()
        db.session.commit()
        
        # Load fresh data from Excel files
        faq_data = load_all_faqs()
        logger.info(f"Loaded {len(faq_data)} FAQ entries from files")
        
        # Add FAQ data to database
        for item in faq_data:
            faq = FAQ(
                question=item['Question'],
                answer=item['Answer'],
                material=item.get('Material', '')
            )
            db.session.add(faq)
        
        db.session.commit()
        logger.info(f"Added {len(faq_data)} FAQ entries to database")
except Exception as e:
    logger.error(f"Error loading FAQ data: {e}")

@app.route('/')
def index():
    """Render the main page with the chatbot interface."""
    return render_template('index.html')

@app.route('/admin')
def admin():
    """Render the admin page for database management."""
    with app.app_context():
        faq_count = FAQ.query.count()
        
        # Get latest ChatLog timestamp as last reload time
        last_reload = "Not available"
        latest_log = ChatLog.query.order_by(ChatLog.timestamp.desc()).first()
        if latest_log:
            last_reload = latest_log.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            
    return render_template('admin.html', faq_count=faq_count, last_reload=last_reload)

@app.route('/admin/reload_data', methods=['GET'])
def reload_data():
    """Admin endpoint to reload FAQ data from Excel files."""
    try:
        # Clear existing FAQ data
        with app.app_context():
            num_deleted = FAQ.query.delete()
            db.session.commit()
            logger.info(f"Deleted {num_deleted} existing FAQ entries")
            
            # Load new data from Excel files
            faq_data = load_all_faqs()
            logger.info(f"Loaded {len(faq_data)} FAQ entries from files")
            
            # Add new FAQ data to database
            for item in faq_data:
                faq = FAQ(
                    question=item['Question'],
                    answer=item['Answer'],
                    material=item.get('Material', '')
                )
                db.session.add(faq)
            
            db.session.commit()
            logger.info(f"Added {len(faq_data)} FAQ entries to database")
            
        return jsonify({
            'success': True,
            'message': f"Reloaded {len(faq_data)} FAQ entries from Excel files",
            'count': len(faq_data)
        })
            
    except Exception as e:
        logger.error(f"Error reloading FAQ data: {e}")
        return jsonify({
            'success': False,
            'error': 'An error occurred while reloading FAQ data',
            'details': str(e)
        }), 500

@app.route('/api/ask', methods=['POST'])
def ask():
    """Process user question and return the best matching answer."""
    try:
        user_question = request.json.get('question', '')
        if not user_question:
            return jsonify({'error': 'No question provided'}), 400

        logger.debug(f"Received question: {user_question}")
        
        # Get FAQ data from database
        with app.app_context():
            faq_data = []
            for faq in FAQ.query.all():
                faq_data.append({
                    'Question': faq.question,
                    'Answer': faq.answer,
                    'Material': faq.material
                })
        
        answer, confidence = get_best_answer(user_question, faq_data)
        
        # Log the interaction
        try:
            with app.app_context():
                chat_log = ChatLog(
                    user_question=user_question,
                    bot_answer=answer,
                    confidence_score=confidence,
                    timestamp=datetime.now()
                )
                db.session.add(chat_log)
                db.session.commit()
        except Exception as e:
            logger.error(f"Error logging chat: {e}")
        
        # Return answer based on confidence
        if answer and confidence > 0.55:  # Further increased threshold for much stricter matching
            return jsonify({
                'answer': answer,
                'confidence': confidence
            })
        else:
            return jsonify({
                'answer': "I'm sorry, I don't have enough information to answer that question.\n\nPlease contact our Tesa expert team:\n\nEmail: support@tesa.com\nPhone: +91-1234567890\nHours: Monday to Saturday, 9 AM to 6 PM",
                'confidence': confidence
            })
            
    except Exception as e:
        logger.error(f"Error processing question: {e}")
        return jsonify({
            'error': 'An error occurred while processing your question',
            'details': str(e)
        }), 500
