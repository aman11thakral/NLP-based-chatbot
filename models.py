from app import db
from datetime import datetime

class FAQ(db.Model):
    """Model for storing FAQ data from Excel files."""
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)
    material = db.Column(db.String(50), nullable=True)
    category = db.Column(db.String(50), nullable=True)
    
    def __repr__(self):
        return f'<FAQ {self.question[:30]}...>'
    
    @staticmethod
    def get_default_data():
        """Return some default FAQ data if no Excel files are available."""
        return [
            {
                "question": "What is MDF?",
                "answer": "Medium Density Fiberboard (MDF) is an engineered wood product made by breaking down hardwood or softwood residuals into wood fibers, combining it with wax and a resin binder, and forming it into panels by applying high temperature and pressure.",
                "material": "MDF"
            },
            {
                "question": "What are the advantages of particle board?",
                "answer": "Particle board is cost-effective, has consistent density throughout, is environmentally friendly as it uses recycled wood materials, has good screw-holding ability, and is resistant to warping and expansion.",
                "material": "Particle Board"
            },
            {
                "question": "What is Action TESA HDHMR?",
                "answer": "Action TESA HDHMR is a registered trademark of Balaji Action Buildwell Pvt. Ltd. It has many characteristics which make it apparently the first choice of consumers and influencers. HDHMR characteristics include High Density, High Moisture Resistance, Borer Resistance, Termite Resistance, and a ready-to-use smooth surface.",
                "material": "HDHMR"
            }
        ]

class ChatLog(db.Model):
    """Model for storing chat interactions for analysis."""
    id = db.Column(db.Integer, primary_key=True)
    user_question = db.Column(db.Text, nullable=False)
    bot_answer = db.Column(db.Text, nullable=False)
    confidence_score = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.now)
    
    def __repr__(self):
        return f'<ChatLog {self.id}>'
