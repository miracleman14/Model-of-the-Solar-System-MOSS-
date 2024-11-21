from calculations import get_positions
from constants import START_DATE

positions = get_positions(START_DATE, speed=1)
for planet, coords in positions.items():
    print(f"{planet.capitalize()} - X: {coords['x']:.2e}, Y: {coords['y']:.2e}")
