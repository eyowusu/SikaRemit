"""
Tests for Input Validators
Tests all validation functions for phone numbers, amounts, names, etc.
"""
import pytest
from decimal import Decimal
from core.validators import (
    PhoneNumberValidator,
    AmountValidator,
    NameValidator,
    EmailValidatorCustom,
    PasswordValidator,
    BankAccountValidator,
    DocumentValidator,
    TransactionValidator,
)


class TestPhoneNumberValidator:
    """Test phone number validation"""
    
    def test_valid_mtn_number(self):
        """Test valid MTN number"""
        is_valid, cleaned, provider = PhoneNumberValidator.validate('0241234567', 'GH')
        assert is_valid is True
        assert provider == 'mtn'
        assert cleaned == '0241234567'
    
    def test_valid_telecel_number(self):
        """Test valid Telecel number"""
        is_valid, cleaned, provider = PhoneNumberValidator.validate('0201234567', 'GH')
        assert is_valid is True
        assert provider == 'telecel'
    
    def test_valid_airteltigo_number(self):
        """Test valid AirtelTigo number"""
        is_valid, cleaned, provider = PhoneNumberValidator.validate('0261234567', 'GH')
        assert is_valid is True
        assert provider == 'airteltigo'
    
    def test_number_with_country_code(self):
        """Test number with +233 country code"""
        is_valid, cleaned, provider = PhoneNumberValidator.validate('+233241234567', 'GH')
        assert is_valid is True
        assert cleaned == '0241234567'
    
    def test_invalid_number(self):
        """Test invalid phone number"""
        is_valid, cleaned, provider = PhoneNumberValidator.validate('0001234567', 'GH')
        assert is_valid is False
        assert provider is None
    
    def test_empty_number(self):
        """Test empty phone number"""
        is_valid, cleaned, provider = PhoneNumberValidator.validate('', 'GH')
        assert is_valid is False


class TestAmountValidator:
    """Test amount validation"""
    
    def test_valid_amount(self):
        """Test valid amount"""
        is_valid, amount, error = AmountValidator.validate('100.50', 'GHS')
        assert is_valid is True
        assert amount == Decimal('100.50')
        assert error == ''
    
    def test_zero_amount(self):
        """Test zero amount fails"""
        is_valid, amount, error = AmountValidator.validate('0', 'GHS')
        assert is_valid is False
        assert 'greater than zero' in error.lower()
    
    def test_negative_amount(self):
        """Test negative amount fails"""
        is_valid, amount, error = AmountValidator.validate('-50', 'GHS')
        assert is_valid is False
    
    def test_amount_below_minimum(self):
        """Test amount below minimum"""
        is_valid, amount, error = AmountValidator.validate('0.001', 'GHS')
        assert is_valid is False
        assert 'minimum' in error.lower()
    
    def test_amount_above_maximum(self):
        """Test amount above maximum"""
        is_valid, amount, error = AmountValidator.validate('999999999', 'GHS')
        assert is_valid is False
        assert 'maximum' in error.lower()
    
    def test_invalid_amount_format(self):
        """Test invalid amount format"""
        is_valid, amount, error = AmountValidator.validate('abc', 'GHS')
        assert is_valid is False
        assert 'invalid' in error.lower()
    
    def test_too_many_decimals(self):
        """Test amount with too many decimal places"""
        is_valid, amount, error = AmountValidator.validate('100.123', 'GHS')
        assert is_valid is False
        assert 'decimal' in error.lower()


class TestNameValidator:
    """Test name validation"""
    
    def test_valid_name(self):
        """Test valid name"""
        is_valid, cleaned, error = NameValidator.validate_person_name('John Doe')
        assert is_valid is True
        assert cleaned == 'John Doe'
    
    def test_name_with_hyphen(self):
        """Test name with hyphen"""
        is_valid, cleaned, error = NameValidator.validate_person_name('Mary-Jane')
        assert is_valid is True
    
    def test_name_with_apostrophe(self):
        """Test name with apostrophe"""
        is_valid, cleaned, error = NameValidator.validate_person_name("O'Brien")
        assert is_valid is True
    
    def test_empty_name(self):
        """Test empty name fails"""
        is_valid, cleaned, error = NameValidator.validate_person_name('')
        assert is_valid is False
        assert 'required' in error.lower()
    
    def test_name_too_short(self):
        """Test name too short"""
        is_valid, cleaned, error = NameValidator.validate_person_name('A')
        assert is_valid is False
        assert 'at least 2' in error.lower()
    
    def test_name_with_numbers(self):
        """Test name with numbers fails"""
        is_valid, cleaned, error = NameValidator.validate_person_name('John123')
        assert is_valid is False
        assert 'invalid' in error.lower()
    
    def test_valid_business_name(self):
        """Test valid business name"""
        is_valid, cleaned, error = NameValidator.validate_business_name('ABC Corp & Co.')
        assert is_valid is True


class TestEmailValidator:
    """Test email validation"""
    
    def test_valid_email(self):
        """Test valid email"""
        is_valid, cleaned, error = EmailValidatorCustom.validate('test@example.com')
        assert is_valid is True
        assert cleaned == 'test@example.com'
    
    def test_email_normalized(self):
        """Test email is normalized to lowercase"""
        is_valid, cleaned, error = EmailValidatorCustom.validate('Test@EXAMPLE.com')
        assert is_valid is True
        assert cleaned == 'test@example.com'
    
    def test_invalid_email(self):
        """Test invalid email"""
        is_valid, cleaned, error = EmailValidatorCustom.validate('invalid-email')
        assert is_valid is False
        assert 'invalid' in error.lower()
    
    def test_empty_email(self):
        """Test empty email"""
        is_valid, cleaned, error = EmailValidatorCustom.validate('')
        assert is_valid is False
        assert 'required' in error.lower()
    
    def test_disposable_email(self):
        """Test disposable email rejected"""
        is_valid, cleaned, error = EmailValidatorCustom.validate('test@tempmail.com')
        assert is_valid is False
        assert 'disposable' in error.lower()


class TestPasswordValidator:
    """Test password validation"""
    
    def test_valid_password(self):
        """Test valid strong password"""
        is_valid, errors = PasswordValidator.validate('SecurePass123!')
        assert is_valid is True
        assert len(errors) == 0
    
    def test_password_too_short(self):
        """Test password too short"""
        is_valid, errors = PasswordValidator.validate('Ab1!')
        assert is_valid is False
        assert any('at least' in e.lower() for e in errors)
    
    def test_password_no_uppercase(self):
        """Test password without uppercase"""
        is_valid, errors = PasswordValidator.validate('securepass123!')
        assert is_valid is False
        assert any('uppercase' in e.lower() for e in errors)
    
    def test_password_no_lowercase(self):
        """Test password without lowercase"""
        is_valid, errors = PasswordValidator.validate('SECUREPASS123!')
        assert is_valid is False
        assert any('lowercase' in e.lower() for e in errors)
    
    def test_password_no_digit(self):
        """Test password without digit"""
        is_valid, errors = PasswordValidator.validate('SecurePass!')
        assert is_valid is False
        assert any('digit' in e.lower() for e in errors)
    
    def test_password_no_special(self):
        """Test password without special character"""
        is_valid, errors = PasswordValidator.validate('SecurePass123')
        assert is_valid is False
        assert any('special' in e.lower() for e in errors)
    
    def test_common_password(self):
        """Test common password pattern rejected"""
        is_valid, errors = PasswordValidator.validate('Password123!')
        assert is_valid is False
        assert any('common' in e.lower() for e in errors)


class TestBankAccountValidator:
    """Test bank account validation"""
    
    def test_valid_gcb_account(self):
        """Test valid GCB account"""
        is_valid, cleaned, error = BankAccountValidator.validate('1234567890123', 'GCB')
        assert is_valid is True
        assert cleaned == '1234567890123'
    
    def test_account_wrong_length(self):
        """Test account with wrong length"""
        is_valid, cleaned, error = BankAccountValidator.validate('12345', 'GCB')
        assert is_valid is False
        assert 'digits' in error.lower()
    
    def test_account_with_letters(self):
        """Test account with letters fails"""
        is_valid, cleaned, error = BankAccountValidator.validate('123ABC456', 'GCB')
        assert is_valid is False
        assert 'digits' in error.lower()


class TestDocumentValidator:
    """Test document validation"""
    
    def test_valid_ghana_card(self):
        """Test valid Ghana Card number"""
        is_valid, cleaned, error = DocumentValidator.validate('GHA-123456789-0', 'ghana_card')
        assert is_valid is True
    
    def test_invalid_ghana_card(self):
        """Test invalid Ghana Card format"""
        is_valid, cleaned, error = DocumentValidator.validate('12345', 'ghana_card')
        assert is_valid is False


class TestTransactionValidator:
    """Test transaction validation"""
    
    def test_valid_transfer(self):
        """Test valid transfer validation"""
        is_valid, data, errors = TransactionValidator.validate_transfer(
            sender_id='user123',
            recipient_phone='0241234567',
            amount='100.00',
            currency='GHS'
        )
        assert is_valid is True
        assert 'amount' in data
        assert data['amount'] == Decimal('100.00')
    
    def test_transfer_invalid_phone(self):
        """Test transfer with invalid phone"""
        is_valid, data, errors = TransactionValidator.validate_transfer(
            sender_id='user123',
            recipient_phone='invalid',
            amount='100.00',
            currency='GHS'
        )
        assert is_valid is False
        assert any('phone' in e.lower() for e in errors)
    
    def test_transfer_invalid_amount(self):
        """Test transfer with invalid amount"""
        is_valid, data, errors = TransactionValidator.validate_transfer(
            sender_id='user123',
            recipient_phone='0241234567',
            amount='-50',
            currency='GHS'
        )
        assert is_valid is False
