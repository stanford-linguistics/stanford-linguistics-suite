"""
Unit tests for text validation utilities
"""
import unittest
import os
import tempfile
from text_validation import normalize_text, validate_text_file

class TestTextValidation(unittest.TestCase):
    """Test cases for text validation utilities"""
    
    def test_normalize_text_smart_quotes(self):
        """Test that smart quotes are properly normalized"""
        # Test with smart quotes and apostrophes
        text = '\u201cHello,\u201d he said. \u201cDon\u2019t forget!\u201d'
        normalized, warnings, error = normalize_text(text)
        
        # The normalized text should have straight quotes and apostrophes
        expected = '"Hello," he said. "Don\'t forget!"'
        self.assertEqual(normalized, expected)
        
        # There should be no warnings or errors
        self.assertEqual(len(warnings), 0)
        self.assertIsNone(error)
    
    def test_normalize_text_em_dash(self):
        """Test that em dashes are properly normalized"""
        # Test with em dash
        text = "This is a sentence\u2014with an em dash."
        normalized, warnings, error = normalize_text(text)
        
        # The normalized text should have a hyphen instead of em dash
        expected = "This is a sentence-with an em dash."
        self.assertEqual(normalized, expected)
        
        # There should be no warnings or errors
        self.assertEqual(len(warnings), 0)
        self.assertIsNone(error)
    
    def test_normalize_text_ellipsis(self):
        """Test that ellipsis is properly normalized"""
        # Test with ellipsis
        text = "To be continued\u2026"
        normalized, warnings, error = normalize_text(text)
        
        # The normalized text should have three dots instead of ellipsis
        expected = "To be continued..."
        self.assertEqual(normalized, expected)
        
        # There should be no warnings or errors
        self.assertEqual(len(warnings), 0)
        self.assertIsNone(error)
    
    def test_accented_vowels_lowercase(self):
        """Test that accented lowercase vowels are properly normalized"""
        text = "àáâãäå èéêë ìíîï òóôõöø ùúûü ýÿ"
        expected = "aaaaaa eeee iiii oooooo uuuu yy"
        normalized, warnings, error = normalize_text(text)
        self.assertEqual(normalized, expected)
        self.assertEqual(len(warnings), 0)
        self.assertIsNone(error)

    def test_accented_vowels_uppercase(self):
        """Test that accented uppercase vowels are properly normalized"""
        text = "ÀÁÂÃÄÅ ÈÉÊË ÌÍÎÏ ÒÓÔÕÖØ ÙÚÛÜ Ý"
        expected = "AAAAAA EEEE IIII OOOOOO UUUU Y"
        normalized, warnings, error = normalize_text(text)
        self.assertEqual(normalized, expected)
        self.assertEqual(len(warnings), 0)
        self.assertIsNone(error)
    
    def test_special_consonants(self):
        """Test that special consonants are properly normalized"""
        text = "ñÑ çÇ ß"
        expected = "nN cC ss"
        normalized, warnings, error = normalize_text(text)
        self.assertEqual(normalized, expected)
        self.assertEqual(len(warnings), 0)
        self.assertIsNone(error)
    
    def test_mixed_special_characters(self):
        """Test normalization of text with mixed special characters"""
        text = "Résumé for François: études à l'université. Straße in München."
        expected = "Resume for Francois: etudes a l'universite. Strasse in Munchen."
        normalized, warnings, error = normalize_text(text)
        self.assertEqual(normalized, expected)
        self.assertEqual(len(warnings), 0)
        self.assertIsNone(error)
    
    def test_complex_paragraph(self):
        """Test normalization of a complex paragraph with various special characters"""
        text = (
            "Caf\u00e9 au lait \u2014 a classic breakfast in Z\u00fcrich and M\u00fcnchen.\n"
            "Fran\u00e7ois said, \u201cI'll visit the ch\u00e2teau in the Rh\u00f4ne valley.\u201d\n"
            "\u201cDon\u2019t forget to bring your r\u00e9sum\u00e9,\u201d replied Andr\u00e9.\n"
            "The fa\u00e7ade of the opera house was renovated\u2026"
        )
        expected = (
            "Cafe au lait - a classic breakfast in Zurich and Munchen.\n"
            "Francois said, \"I'll visit the chateau in the Rhone valley.\"\n"
            "\"Don't forget to bring your resume,\" replied Andre.\n"
            "The facade of the opera house was renovated..."
        )
        normalized, warnings, error = normalize_text(text)
        self.assertEqual(normalized, expected)
        self.assertEqual(len(warnings), 0)
        self.assertIsNone(error)
    
    def test_validate_text_file(self):
        """Test validating and normalizing a text file"""
        # Create a temporary file with smart quotes and apostrophes
        with tempfile.NamedTemporaryFile(delete=False, mode='w', encoding='utf-8') as f:
            f.write('\u201cHello,\u201d he said. \u201cDon\u2019t forget!\u201d')
            temp_file = f.name
        
        try:
            # Validate and normalize the file
            success, warnings, error = validate_text_file(temp_file)
            
            # Check that validation was successful
            self.assertTrue(success)
            self.assertIsNone(error)
            
            # Read the normalized content
            with open(temp_file, 'r', encoding='utf-8') as f:
                normalized = f.read()
            
            # Check that the content was properly normalized
            expected = '"Hello," he said. "Don\'t forget!"'
            self.assertEqual(normalized, expected)
        finally:
            # Clean up the temporary file
            os.unlink(temp_file)
    
    def test_mixed_file_normalization(self):
        """Test validating and normalizing a file with mixed special characters"""
        # Create a temporary file with mixed special characters
        content = (
            "Caf\u00e9 au lait \u2014 a classic breakfast.\n"
            "Fran\u00e7ois said, \u201cI'll visit the ch\u00e2teau.\u201d\n"
            "The fa\u00e7ade was renovated\u2026"
        )
        with tempfile.NamedTemporaryFile(delete=False, mode='w', encoding='utf-8') as f:
            f.write(content)
            temp_file = f.name
        
        try:
            # Validate and normalize the file
            success, warnings, error = validate_text_file(temp_file)
            
            # Check that validation was successful
            self.assertTrue(success)
            self.assertIsNone(error)
            
            # Read the normalized content
            with open(temp_file, 'r', encoding='utf-8') as f:
                normalized = f.read()
            
            # Check that the content was properly normalized
            expected = (
                "Cafe au lait - a classic breakfast.\n"
                "Francois said, \"I'll visit the chateau.\"\n"
                "The facade was renovated..."
            )
            self.assertEqual(normalized, expected)
        finally:
            # Clean up the temporary file
            os.unlink(temp_file)

if __name__ == '__main__':
    unittest.main()
