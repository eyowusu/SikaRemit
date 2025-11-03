from django.db import models
from users.models import User

class RegulatorySubmission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    report_data = models.JSONField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField()
    response = models.TextField(blank=True)
    
    def __str__(self):
        return f"Submission for {self.user.email}"
