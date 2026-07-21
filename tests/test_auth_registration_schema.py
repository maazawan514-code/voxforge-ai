import importlib
import os
import sqlite3
import tempfile
import unittest

from fastapi.testclient import TestClient

os.environ.setdefault('DATABASE_URL', 'sqlite:///./voxforge_test.db')
os.environ.setdefault('REDIS_URL', 'redis://localhost:6379/0')
os.environ.setdefault('CELERY_BROKER_URL', 'redis://localhost:6379/0')
os.environ.setdefault('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
os.environ.setdefault('SECRET_KEY', 'test-secret')


class AuthRegistrationSchemaTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, 'voxforge_test.db')
        os.environ['DATABASE_URL'] = f'sqlite:///{self.db_path}'

        conn = sqlite3.connect(self.db_path)
        conn.execute(
            'CREATE TABLE users ('
            'id INTEGER PRIMARY KEY, '
            'name TEXT NOT NULL, '
            'email TEXT NOT NULL, '
            'password_hash TEXT NOT NULL, '
            'role TEXT, '
            'is_active BOOLEAN, '
            'created_at DATETIME, '
            'updated_at DATETIME'
            ')' 
        )
        conn.commit()
        conn.close()

        import app.database as database_module
        import app.main as main_module

        self.database_module = importlib.reload(database_module)
        self.main_module = importlib.reload(main_module)

    def tearDown(self):
        if hasattr(self, 'database_module'):
            self.database_module.engine.dispose()
            self.database_module.SessionLocal.close_all()
        self.temp_dir.cleanup()

    def test_register_succeeds_when_users_table_is_legacy_schema(self):
        with TestClient(self.main_module.app) as client:
            response = client.post('/api/auth/register', json={
                'name': 'Test User',
                'email': 'test@example.com',
                'password': '12345678'
            })

        self.assertEqual(response.status_code, 201)
        self.assertIn('Registration successful', response.json()['message'])


if __name__ == '__main__':
    unittest.main()
