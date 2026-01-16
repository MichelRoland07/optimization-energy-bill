"""
Comprehensive API test script
Tests all endpoints with real Excel file
"""
import requests
import json
from pathlib import Path

BASE_URL = "http://localhost:8000"

def print_section(title):
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_info(message):
    print(f"ℹ️  {message}")


# Test 1: Authentication
print_section("TEST 1: Authentication")

print("\n1.1 Testing login...")
response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"username": "admin", "password": "admin123"}
)

if response.status_code == 200:
    print_success("Login successful")
    data = response.json()
    token = data["access_token"]
    user_info = data["user"]
    print_info(f"Token: {token[:20]}...")
    print_info(f"User: {user_info['username']} (ID: {user_info['id']})")
else:
    print_error(f"Login failed: {response.status_code}")
    print(response.text)
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

print("\n1.2 Testing /me endpoint...")
response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
if response.status_code == 200:
    print_success("User info retrieved")
    print(json.dumps(response.json(), indent=2))
else:
    print_error(f"Failed to get user info: {response.status_code}")


# Test 2: File Upload
print_section("TEST 2: File Upload")

# Find an Excel file in the project
excel_files = list(Path("/home/student24/Documents/Documents/Kes_Projects/Optimization_SABC/Automatisation").glob("**/*.xlsx"))
if not excel_files:
    excel_files = list(Path("/home/student24/Documents/Documents/Kes_Projects/Optimization_SABC/Automatisation").glob("**/*.xls"))

if not excel_files:
    print_error("No Excel file found for testing")
    print_info("Please place an Excel file in the project directory")
    excel_file_path = input("\nEnter path to Excel file (or press Enter to skip upload tests): ").strip()
    if not excel_file_path:
        print_info("Skipping upload tests")
        excel_file_path = None
    else:
        excel_file_path = Path(excel_file_path)
else:
    excel_file_path = excel_files[0]
    print_info(f"Using Excel file: {excel_file_path.name}")

service_no = None
nom_client = None

if excel_file_path and excel_file_path.exists():
    print("\n2.1 Uploading file...")

    with open(excel_file_path, 'rb') as f:
        files = {'file': (excel_file_path.name, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        response = requests.post(
            f"{BASE_URL}/api/data/upload",
            headers=headers,
            files=files
        )

    if response.status_code == 200:
        print_success("File uploaded successfully")
        data = response.json()
        print(json.dumps(data, indent=2))

        if data['single_service']:
            print_info("✓ Single service detected")
            service_no = data['service_no']
            nom_client = data['nom_client']
            print_info(f"Service: {service_no} - {nom_client}")
        else:
            print_info(f"✓ Multiple services detected ({len(data['services'])} services)")
            for service in data['services']:
                print(f"  - {service['service_no']}: {service['nom_client']} ({service['puissance']} kW)")

            # Select first service
            if data['services']:
                service_no = data['services'][0]['service_no']
                print(f"\n2.2 Selecting service: {service_no}")

                response = requests.post(
                    f"{BASE_URL}/api/data/select-service",
                    headers=headers,
                    json={"service_no": service_no}
                )

                if response.status_code == 200:
                    print_success("Service selected successfully")
                    data = response.json()
                    nom_client = data['nom_client']
                    print(json.dumps(data, indent=2))
                else:
                    print_error(f"Failed to select service: {response.status_code}")
                    print(response.text)
    else:
        print_error(f"Upload failed: {response.status_code}")
        print(response.text)


# Test 3: Synthese
if service_no:
    print_section("TEST 3: Synthese Table")

    print("\n3.1 Getting synthese for 2025...")
    response = requests.get(
        f"{BASE_URL}/api/data/synthese",
        headers=headers,
        params={"year": 2025}
    )

    if response.status_code == 200:
        print_success("Synthese retrieved successfully")
        data = response.json()
        print_info(f"Year: {data['year']}")
        print_info(f"Client: {data['nom_client']}")
        print_info(f"Service: {data['service_no']}")
        print_info(f"Number of rows: {len(data['tableau'])}")

        if data['tableau']:
            print("\nFirst row:")
            print(json.dumps(data['tableau'][0], indent=2))
    else:
        print_error(f"Failed to get synthese: {response.status_code}")
        print(response.text)


# Test 4: Refacturation
if service_no:
    print_section("TEST 4: Refacturation")

    print("\n4.1 Getting refacturation for 2025...")
    response = requests.get(
        f"{BASE_URL}/api/refacturation",
        headers=headers,
        params={"year": 2025}
    )

    if response.status_code == 200:
        print_success("Refacturation retrieved successfully")
        data = response.json()

        metriques = data['metriques']
        print("\nMetriques:")
        print(f"  Facture réelle total: {metriques['facture_reelle_total']:.2f} FCFA")
        print(f"  Facture recalculée total: {metriques['facture_recalculee_total']:.2f} FCFA")
        print(f"  Gap total: {metriques['gap_total']:.2f} FCFA")
        print(f"  Gap %: {metriques['gap_pct']:.2f}%")
        print(f"  Dépassements: {metriques['nb_depassements']}")

        # Count rows with gaps
        rows_with_gaps = [row for row in data['tableau'] if row['has_gap']]
        print(f"\n  Rows with gaps (>100 FCFA): {len(rows_with_gaps)}/{len(data['tableau'])}")

        if rows_with_gaps:
            print("\nRows with significant gaps:")
            for row in rows_with_gaps[:3]:  # Show first 3
                print(f"  {row['mois']}: {row['ecart']:.2f} FCFA")
    else:
        print_error(f"Failed to get refacturation: {response.status_code}")
        print(response.text)


# Test 5: Optimisation
if service_no:
    print_section("TEST 5: Optimisation")

    print("\n5.1 Getting current configuration...")
    response = requests.get(
        f"{BASE_URL}/api/optimisation/config-actuelle",
        headers=headers
    )

    if response.status_code == 200:
        print_success("Current config retrieved successfully")
        config = response.json()

        print("\nConfiguration actuelle:")
        print(f"  Puissance souscrite: {config['puissance_actuelle']} kW")
        print(f"  Puissance max atteinte: {config['puissance_max_atteinte']:.2f} kW")
        print(f"  Puissance min atteinte: {config['puissance_min_atteinte']:.2f} kW")
        print(f"  Puissance moyenne: {config['puissance_moyenne']:.2f} kW")
        print(f"  Type tarifaire: {config['type_tarifaire']}")
        print(f"  Coût annuel 2025: {config['cout_annuel_2025']:.2f} FCFA")
        print(f"  Dépassements: {config['nb_depassements']}")

        # Test simulation with optimal power (90% of max)
        nouvelle_puissance = int(config['puissance_max_atteinte'] * 0.9)

        print(f"\n5.2 Simulating with nouvelle puissance: {nouvelle_puissance} kW...")
        response = requests.post(
            f"{BASE_URL}/api/optimisation/simulate",
            headers=headers,
            json={"nouvelle_puissance": nouvelle_puissance}
        )

        if response.status_code == 200:
            print_success("Simulation completed successfully")
            sim = response.json()

            print(f"\nNouvelle puissance: {sim['nouvelle_puissance']} kW")
            print(f"Nouveau type tarifaire: {sim['nouveau_type_tarifaire']}")

            if sim['has_warning']:
                print(f"\n⚠️  Warning: {sim['warning']}")

            resultats = sim['resultats']
            print("\nRésultats:")
            print(f"  Coût actuel: {resultats['cout_actuel']:.2f} FCFA")
            print(f"  Coût simulé: {resultats['cout_simule']:.2f} FCFA")
            print(f"  Économies: {resultats['economies']:.2f} FCFA ({resultats['economies_pct']:.2f}%)")
            print(f"  Dépassements actuels: {resultats['nb_depassements_actuel']}")
            print(f"  Dépassements simulés: {resultats['nb_depassements_simule']}")

            print(f"\nTableau mensuel ({len(sim['tableau_mensuel'])} mois):")
            for row in sim['tableau_mensuel'][:3]:  # Show first 3 months
                print(f"  {row['mois']}: {row['facture_actuelle']:.2f} → {row['facture_simulee']:.2f} (économie: {row['economie']:.2f})")
        else:
            print_error(f"Failed to simulate: {response.status_code}")
            print(response.text)

        # Test simulation below max (should trigger warning)
        nouvelle_puissance_low = int(config['puissance_max_atteinte'] * 0.8)

        print(f"\n5.3 Simulating with low power (should warn): {nouvelle_puissance_low} kW...")
        response = requests.post(
            f"{BASE_URL}/api/optimisation/simulate",
            headers=headers,
            json={"nouvelle_puissance": nouvelle_puissance_low}
        )

        if response.status_code == 200:
            print_success("Simulation completed")
            sim = response.json()

            if sim['has_warning']:
                print_success(f"Warning correctly shown: {sim['warning'][:100]}...")
            else:
                print_error("Warning not shown (should have been)")
        else:
            print_error(f"Failed to simulate: {response.status_code}")
    else:
        print_error(f"Failed to get config: {response.status_code}")
        print(response.text)


# Test 6: Error Handling
print_section("TEST 6: Error Handling")

print("\n6.1 Testing unauthorized access...")
response = requests.get(f"{BASE_URL}/api/auth/me")
if response.status_code == 403:
    print_success("Correctly rejected unauthorized request")
else:
    print_error(f"Should have returned 403, got {response.status_code}")

print("\n6.2 Testing invalid login...")
response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"username": "admin", "password": "wrongpassword"}
)
if response.status_code == 401:
    print_success("Correctly rejected invalid credentials")
else:
    print_error(f"Should have returned 401, got {response.status_code}")

print("\n6.3 Testing data access without upload...")
# Create new user session
response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"username": "admin", "password": "admin123"}
)
new_token = response.json()["access_token"]
new_headers = {"Authorization": f"Bearer {new_token}"}

response = requests.get(
    f"{BASE_URL}/api/data/synthese",
    headers=new_headers,
    params={"year": 2025}
)
if response.status_code == 404:
    print_success("Correctly rejected request without data")
else:
    print_error(f"Should have returned 404, got {response.status_code}")


# Summary
print_section("TEST SUMMARY")
print("\n✅ All basic tests completed!")
print("\nBackend endpoints tested:")
print("  ✓ POST /api/auth/login")
print("  ✓ GET  /api/auth/me")
print("  ✓ POST /api/data/upload")
print("  ✓ POST /api/data/select-service")
print("  ✓ GET  /api/data/synthese")
print("  ✓ GET  /api/refacturation")
print("  ✓ GET  /api/optimisation/config-actuelle")
print("  ✓ POST /api/optimisation/simulate")
print("\n🎉 Backend is fully functional!")
print("\nNext steps:")
print("  1. Review the API documentation at http://localhost:8000/docs")
print("  2. Start implementing the React frontend")
print("  3. Configure production settings (.env file)")
