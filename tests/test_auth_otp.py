import unittest

from app.utils.security import generate_otp_code, hash_otp_code, verify_otp_code


class OTPHelpersTests(unittest.TestCase):
    def test_generate_otp_code_returns_six_digits(self):
        otp = generate_otp_code()
        self.assertEqual(len(otp), 6)
        self.assertTrue(otp.isdigit())

    def test_hash_and_verify_otp_code(self):
        otp = "583291"
        hashed = hash_otp_code(otp)
        self.assertTrue(verify_otp_code(otp, hashed))
        self.assertFalse(verify_otp_code("000000", hashed))


if __name__ == "__main__":
    unittest.main()
