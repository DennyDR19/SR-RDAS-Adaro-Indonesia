import math

WGS84_A = 6378137.0
WGS84_ECC_SQ = 0.00669437999014
UTM_K0 = 0.9996

def utm_to_latlon(easting, northing, zone, hemisphere='S'):
    e2 = WGS84_ECC_SQ
    ePrime2 = e2 / (1.0 - e2)
    x = easting - 500000.0
    y = northing
    if hemisphere == 'S':
        y -= 10000000.0
    
    centralLon = ((zone - 1) * 6 - 180 + 3) * (math.pi / 180.0)
    M = y / UTM_K0
    mu = M / (WGS84_A * (1.0 - e2 / 4.0 - (3.0 * e2 * e2) / 64.0 - (5.0 * e2 * e2 * e2) / 256.0))
    e1 = (1.0 - math.sqrt(1.0 - e2)) / (1.0 + math.sqrt(1.0 - e2))
    
    phi1Rad = (
        mu +
        ((3.0 * e1) / 2.0 - (27.0 * (e1 ** 3)) / 32.0) * math.sin(2.0 * mu) +
        ((21.0 * e1 * e1) / 16.0 - (55.0 * (e1 ** 4)) / 32.0) * math.sin(4.0 * mu) +
        ((151.0 * (e1 ** 3)) / 96.0) * math.sin(6.0 * mu) +
        ((1097.0 * (e1 ** 4)) / 512.0) * math.sin(8.0 * mu)
    )
    
    N1 = WGS84_A / math.sqrt(1.0 - e2 * math.sin(phi1Rad) * math.sin(phi1Rad))
    T1 = math.tan(phi1Rad) * math.tan(phi1Rad)
    C1 = ePrime2 * math.cos(phi1Rad) * math.cos(phi1Rad)
    R1 = (WGS84_A * (1.0 - e2)) / (math.pow(1.0 - e2 * math.sin(phi1Rad) * math.sin(phi1Rad), 1.5))
    D = x / (N1 * UTM_K0)
    
    latRad = (
        phi1Rad -
        ((N1 * math.tan(phi1Rad)) / R1) *
        ((D * D) / 2.0 -
         ((5.0 + 3.0 * T1 + 10.0 * C1 - 4.0 * C1 * C1 - 9.0 * ePrime2) * (D ** 4)) / 24.0 +
         ((61.0 + 90.0 * T1 + 298.0 * C1 + 45.0 * T1 * T1 - 252.0 * ePrime2 - 3.0 * C1 * C1) * (D ** 6)) / 720.0)
    )
    
    lonRad = (
        centralLon +
        (D -
         ((1.0 + 2.0 * T1 + C1) * (D ** 3)) / 6.0 +
         ((5.0 - 2.0 * C1 + 28.0 * T1 - 3.0 * C1 * C1 + 8.0 * ePrime2 + 24.0 * T1 * T1) * (D ** 5)) / 120.0) /
        math.cos(phi1Rad)
    )
    
    latitude = round((latRad * 180.0) / math.pi, 6)
    longitude = round((lonRad * 180.0) / math.pi, 6)
    return latitude, longitude

print("Test 50M 275294 9598293:", utm_to_latlon(275294, 9598293, 50, 'S'))
print("Test 48M 705581 9177828:", utm_to_latlon(705581, 9177828, 48, 'S'))
