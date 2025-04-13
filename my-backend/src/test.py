import unittest
from unittest.mock import patch, MagicMock, mock_open
import json
import os

# Import modules to test
import app as main_app
import calculations
from constants import G, M_sun

# Mock external libraries
mock_skyfield_load = MagicMock()
mock_eph = MagicMock()
mock_eph.__getitem__.side_effect = lambda key: MagicMock(name=key)
mock_skyfield_load.return_value = mock_eph
mock_requests_get = MagicMock()

# Patch dependencies for all tests
@patch('app.load', mock_skyfield_load)
@patch('app.requests.get', mock_requests_get)
class SimplifiedBaseTestCase(unittest.TestCase):
    # Base setup for tests
    @classmethod
    def setUpClass(cls):
        main_app.app.config['TESTING'] = True
        main_app.app.config['SECRET_KEY'] = 'testing'
        cls.app_context = main_app.app.app_context()
        cls.app_context.push()

    @classmethod
    def tearDownClass(cls):
        cls.app_context.pop()

    def setUp(self):
        self.app = main_app.app.test_client()
        self.socketio = main_app.socketio.test_client(main_app.app)
        mock_skyfield_load.reset_mock()
        mock_requests_get.reset_mock()
        self._cleanup_files()

    def tearDown(self):
        self._cleanup_files()
        if self.socketio.is_connected():
            self.socketio.disconnect()

    def _cleanup_files(self):
        # Remove test files if they exist
        files_to_remove = [
            main_app.CUSTOM_PLANETS_FILE,
            'cache_Halley.json'
        ]
        for f in files_to_remove:
            if os.path.exists(f):
                try:
                    os.remove(f)
                except OSError:
                    pass


class TestAppFeatures(SimplifiedBaseTestCase):

    # Test 1: Cache loading for small bodies
    @patch('app._fetch_small_body_data')
    @patch('builtins.open', new_callable=mock_open, read_data=json.dumps({'name': 'CachedHalley', 'x': 10, 'y': 20, 'z': 30, 'vx': 40, 'vy': 50, 'vz': 60}))
    @patch('app.os.path.exists', return_value=True)
    def test_initialize_small_body_cache_hit(self, mock_exists, mock_file, mock_fetch):
        """ When a cache exists, it should fetch from catch rather than load """
        body_data = main_app.initialize_small_body('1P', 'Halley')

        # Verify cache was checked and used
        self.assertTrue(mock_exists.called)
        self.assertTrue(mock_file.called)
        self.assertFalse(mock_fetch.called)
        self.assertEqual(body_data['name'], 'CachedHalley')

    # Test 2: Saving custom planets
    @patch('builtins.open', new_callable=mock_open)
    @patch('json.dump')
    def test_save_custom_planets(self, mock_json_dump, mock_file):
        """ Planet data should be saved to file correctly """
        test_data = [{'name': 'SaveMe', 'mass': 1e22}]
        main_app.save_custom_planets(test_data)

        # Verify file operations
        self.assertTrue(mock_file.called)
        self.assertTrue(mock_json_dump.called)

    # Test 3: Planet data API route
    def test_get_planet_data_route(self):
        """ API route should return the correct planet data"""
        # Setup test data
        original_planets = main_app.planets
        main_app.planets = [
            {'name': 'Sun', 'x':0, 'y':0, 'vx':0, 'vy':0, 'radius':1},
            {'name': 'Earth', 'x':1e11, 'y':0, 'vx':0, 'vy':30000, 'radius':6e6}
        ]

        # Make request
        response = self.app.get('/api/planet-data')

        # Verify response
        self.assertEqual(response.status_code, 200)
        json_data = response.get_json()
        self.assertEqual(len(json_data['planets']), 1)  # Sun filtered out
        self.assertEqual(json_data['planets'][0]['name'], 'Earth')

        # Cleanup
        main_app.planets = original_planets

    # Test 4: SocketIO connection
    def test_connect_disconnect(self):
        """ Should handle connection and disconnection """
        self.assertTrue(self.socketio.is_connected())
        self.socketio.disconnect()
        self.assertFalse(self.socketio.is_connected())

    # Test 5: Creating planets via socket
    @patch('app.load_custom_planets', return_value=[])
    @patch('app.save_custom_planets')
    @patch('app.math.sqrt')
    def test_handle_create_planet_socket(self, mock_sqrt, mock_save, mock_load):
        """ Should add new planet via socket event """
        mock_sqrt.return_value = 25000  # Mock velocity calculation
        original_planets = list(main_app.planets)
        initial_count = len(original_planets)

        # Send test data
        test_planet = {
            'name': 'TestSocketPlanet', 'mass': '1e23', 'radius': '6e6',
            'x': 1.5e11, 'y': 0, 'z': 0,
            'planetColor': '#ff0000', 'trailColor': '#00ff00'
        }
        self.socketio.emit('create_planet', test_planet)

        # Verify planet was added
        self.assertEqual(len(main_app.planets), initial_count + 1)
        new_planet = main_app.planets[-1]
        self.assertEqual(new_planet['name'], 'TestSocketPlanet')
        self.assertEqual(new_planet['vy'], 25000)

        # Cleanup
        main_app.planets = original_planets


class TestCalculations(unittest.TestCase):
    """ Tests for physics calculations """

    # Test 6: Force calculations
    def test_calculate_forces_two_bodies(self):
        """Should calculate correct gravitational forces"""
        p1 = {'name': 'P1', 'mass': M_sun, 'x': 0, 'y': 0, 'z': 0, 'ax': 0, 'ay': 0, 'az': 0}
        p2 = {'name': 'P2', 'mass': 1e24, 'x': 1.5e11, 'y': 0, 'z': 0, 'ax': 0, 'ay': 0, 'az': 0}

        calculations.calculate_forces([p1, p2])

        # Verify force calculations
        expected_force = (G * M_sun * 1e24) / (1.5e11**2)
        self.assertAlmostEqual(p1['ax'], expected_force / M_sun)
        self.assertAlmostEqual(p2['ax'], -expected_force / 1e24)

    # Test 7: Verlet integration
    @patch('calculations.calculate_forces')
    def test_verlet_step(self, mock_calc_forces):
        """ Should correctly update positions and velocities """
        dt = 1000.0
        p1 = {
            'name': 'P1', 'mass': 1,
            'x': 10, 'y': 20, 'z': 30,
            'vx': 1, 'vy': 2, 'vz': 3,
            'ax': 0.1, 'ay': 0.2, 'az': 0.3
        }

        # Setup mock force calculation
        def update_acceleration(planets):
            planets[0]['ax'] = 0.15
            planets[0]['ay'] = 0.25
            planets[0]['az'] = 0.35
        mock_calc_forces.side_effect = update_acceleration

        calculations.verlet_step([p1], dt)

        # Verify position and velocity updates
        expected_x = 10 + 1*1000 + 0.5*0.1*(1000**2)
        expected_vx = 1 + 0.5 * (0.1 + 0.15) * 1000
        self.assertAlmostEqual(p1['x'], expected_x)
        self.assertAlmostEqual(p1['vx'], expected_vx)


if __name__ == '__main__':
    unittest.main(verbosity=1)