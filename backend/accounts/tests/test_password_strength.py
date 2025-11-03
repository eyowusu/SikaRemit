from django.test import TestCase
from django.core.exceptions import ValidationError
from .validators import ComplexityValidator

class PasswordStrengthTests(TestCase):
    def test_complexity_validator(self):
        validator = ComplexityValidator()
        
        with self.assertRaises(ValidationError):
            validator.validate('weakpassword')  # No uppercase/digit/special
            
        # Should pass
        validator.validate('StrongPass123!')
