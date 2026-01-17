"""
Test script pour vérifier l'implémentation des tarifs détaillés
"""
import sys
from app.optimisation.router import calculer_tarifs_detailles
from app.optimisation.schemas import TarifsInfo, ConfigurationInfo

print("=" * 80)
print("TEST IMPLÉMENTATION TARIFS DÉTAILLÉS")
print("=" * 80)

# Test 1: Fonction helper
print("\n1. TEST FONCTION calculer_tarifs_detailles()")
print("-" * 80)

try:
    # Test petit client
    tarifs_petit = calculer_tarifs_detailles(2000, 2025)
    assert isinstance(tarifs_petit, TarifsInfo)
    assert tarifs_petit.categorie == "Petit client"
    assert tarifs_petit.intervalle_min == 2000.0
    assert tarifs_petit.intervalle_max == 3000.0
    print("✅ Petit client (2000 kW, 2025):")
    print(f"   - Catégorie: {tarifs_petit.categorie}")
    print(f"   - Plage horaire: {tarifs_petit.plage_horaire}")
    print(f"   - Tarif HC: {tarifs_petit.tarif_hc:.3f} FCFA/kWh")
    print(f"   - Tarif HP: {tarifs_petit.tarif_hp:.3f} FCFA/kWh")
    print(f"   - Prime Fixe: {tarifs_petit.prime_fixe:.2f} FCFA/mois")
    print(f"   - Intervalle: [{tarifs_petit.intervalle_min}, {tarifs_petit.intervalle_max}] kW")

    # Test gros client
    tarifs_gros = calculer_tarifs_detailles(5000, 2025)
    assert isinstance(tarifs_gros, TarifsInfo)
    assert tarifs_gros.categorie == "Gros client"
    assert tarifs_gros.intervalle_min == 5000.0
    assert tarifs_gros.intervalle_max == 6000.0
    print("\n✅ Gros client (5000 kW, 2025):")
    print(f"   - Catégorie: {tarifs_gros.categorie}")
    print(f"   - Plage horaire: {tarifs_gros.plage_horaire}")
    print(f"   - Tarif HC: {tarifs_gros.tarif_hc:.3f} FCFA/kWh")
    print(f"   - Tarif HP: {tarifs_gros.tarif_hp:.3f} FCFA/kWh")
    print(f"   - Prime Fixe: {tarifs_gros.prime_fixe:.2f} FCFA/mois")

    # Test année différente
    tarifs_2026 = calculer_tarifs_detailles(4200, 2026)
    assert isinstance(tarifs_2026, TarifsInfo)
    print("\n✅ Gros client (4200 kW, 2026):")
    print(f"   - Tarif HC: {tarifs_2026.tarif_hc:.3f} FCFA/kWh")
    print(f"   - Tarif HP: {tarifs_2026.tarif_hp:.3f} FCFA/kWh")
    print(f"   - Prime Fixe: {tarifs_2026.prime_fixe:.2f} FCFA/mois")
    print(f"   - Intervalle: [{tarifs_2026.intervalle_min}, {tarifs_2026.intervalle_max}] kW")

    print("\n✅ Fonction calculer_tarifs_detailles() fonctionne correctement")

except Exception as e:
    print(f"\n❌ ERREUR: {e}")
    sys.exit(1)

# Test 2: Schema TarifsInfo
print("\n2. TEST SCHEMA TarifsInfo")
print("-" * 80)

try:
    tarifs_test = TarifsInfo(
        tarif_hc=29.04,
        tarif_hp=29.04,
        prime_fixe=11132.0,
        plage_horaire=">400h",
        intervalle_min=5000.0,
        intervalle_max=6000.0,
        categorie="Gros client"
    )

    # Vérifier sérialisation
    tarifs_dict = tarifs_test.model_dump()
    assert 'tarif_hc' in tarifs_dict
    assert 'tarif_hp' in tarifs_dict
    assert 'prime_fixe' in tarifs_dict
    assert 'plage_horaire' in tarifs_dict
    assert 'intervalle_min' in tarifs_dict
    assert 'intervalle_max' in tarifs_dict
    assert 'categorie' in tarifs_dict

    print("✅ Schema TarifsInfo validé:")
    print(f"   - Tous les champs présents: {list(tarifs_dict.keys())}")
    print(f"   - Sérialisation JSON: OK")

except Exception as e:
    print(f"\n❌ ERREUR: {e}")
    sys.exit(1)

# Test 3: ConfigurationInfo avec tarifs
print("\n3. TEST SCHEMA ConfigurationInfo (avec tarifs)")
print("-" * 80)

try:
    config = ConfigurationInfo(
        puissance=5000,
        type_tarifaire=9,
        cout_annuel=1500000000,
        nb_depassements=3,
        tarifs=calculer_tarifs_detailles(5000, 2025),
        variation_vs_actuel=0
    )

    assert config.puissance == 5000
    assert isinstance(config.tarifs, TarifsInfo)
    assert config.variation_vs_actuel == 0

    config_dict = config.model_dump()
    assert 'tarifs' in config_dict
    assert 'variation_vs_actuel' in config_dict

    print("✅ ConfigurationInfo avec tarifs validé:")
    print(f"   - Puissance: {config.puissance} kW")
    print(f"   - Tarifs inclus: {config.tarifs.categorie}")
    print(f"   - Variation vs actuel: {config.variation_vs_actuel} kW")

except Exception as e:
    print(f"\n❌ ERREUR: {e}")
    sys.exit(1)

# Test 4: Coefficients d'évolution
print("\n4. TEST COEFFICIENTS D'ÉVOLUTION TARIFS")
print("-" * 80)

try:
    # Petit client: 5% par an
    tarifs_2023 = calculer_tarifs_detailles(2000, 2023)
    tarifs_2024 = calculer_tarifs_detailles(2000, 2024)
    tarifs_2025 = calculer_tarifs_detailles(2000, 2025)

    # Vérifier augmentation de ~5%
    ratio_2024 = tarifs_2024.tarif_hc / tarifs_2023.tarif_hc
    ratio_2025 = tarifs_2025.tarif_hc / tarifs_2024.tarif_hc

    assert 1.04 < ratio_2024 < 1.06, f"Ratio 2024/2023 attendu ~1.05, obtenu {ratio_2024}"
    assert 1.04 < ratio_2025 < 1.06, f"Ratio 2025/2024 attendu ~1.05, obtenu {ratio_2025}"

    print("✅ Petit client - Évolution +5%/an:")
    print(f"   - 2023: {tarifs_2023.tarif_hc:.3f} FCFA/kWh")
    print(f"   - 2024: {tarifs_2024.tarif_hc:.3f} FCFA/kWh (ratio: {ratio_2024:.4f})")
    print(f"   - 2025: {tarifs_2025.tarif_hc:.3f} FCFA/kWh (ratio: {ratio_2025:.4f})")

    # Gros client: 10% par an
    tarifs_gros_2023 = calculer_tarifs_detailles(5000, 2023)
    tarifs_gros_2024 = calculer_tarifs_detailles(5000, 2024)
    tarifs_gros_2025 = calculer_tarifs_detailles(5000, 2025)

    ratio_gros_2024 = tarifs_gros_2024.tarif_hc / tarifs_gros_2023.tarif_hc
    ratio_gros_2025 = tarifs_gros_2025.tarif_hc / tarifs_gros_2024.tarif_hc

    assert 1.09 < ratio_gros_2024 < 1.11, f"Ratio gros 2024/2023 attendu ~1.10, obtenu {ratio_gros_2024}"
    assert 1.09 < ratio_gros_2025 < 1.11, f"Ratio gros 2025/2024 attendu ~1.10, obtenu {ratio_gros_2025}"

    print("\n✅ Gros client - Évolution +10%/an:")
    print(f"   - 2023: {tarifs_gros_2023.tarif_hc:.3f} FCFA/kWh")
    print(f"   - 2024: {tarifs_gros_2024.tarif_hc:.3f} FCFA/kWh (ratio: {ratio_gros_2024:.4f})")
    print(f"   - 2025: {tarifs_gros_2025.tarif_hc:.3f} FCFA/kWh (ratio: {ratio_gros_2025:.4f})")

except Exception as e:
    print(f"\n❌ ERREUR: {e}")
    sys.exit(1)

# Test 5: Plages horaires et types tarifaires
print("\n5. TEST TYPES TARIFAIRES ET PLAGES HORAIRES")
print("-" * 80)

try:
    # Note: La fonction utilise >400h comme défaut (plage la plus courante)
    # Car le calcul de facture dans Streamlit utilise cette plage

    # Petit client - Type 1
    tarifs_type1 = calculer_tarifs_detailles(100, 2025)  # Type 1
    assert tarifs_type1.plage_horaire == ">400h"
    assert tarifs_type1.categorie == "Petit client"
    assert tarifs_type1.intervalle_min == 50.0
    assert tarifs_type1.intervalle_max == 500.0
    print(f"✅ Type 1 (100 kW): Intervalle [{int(tarifs_type1.intervalle_min)}-{int(tarifs_type1.intervalle_max)}], Plage: {tarifs_type1.plage_horaire}")

    # Petit client - Type 3
    tarifs_type3 = calculer_tarifs_detailles(600, 2025)  # Type 3
    assert tarifs_type3.plage_horaire == ">400h"
    assert tarifs_type3.intervalle_min == 500.0
    assert tarifs_type3.intervalle_max == 1000.0
    print(f"✅ Type 3 (600 kW): Intervalle [{int(tarifs_type3.intervalle_min)}-{int(tarifs_type3.intervalle_max)}], Plage: {tarifs_type3.plage_horaire}")

    # Petit client - Type 5
    tarifs_type5 = calculer_tarifs_detailles(2500, 2025)  # Type 5
    assert tarifs_type5.plage_horaire == ">400h"
    assert tarifs_type5.intervalle_min == 2000.0
    assert tarifs_type5.intervalle_max == 3000.0
    print(f"✅ Type 5 (2500 kW): Intervalle [{int(tarifs_type5.intervalle_min)}-{int(tarifs_type5.intervalle_max)}], Plage: {tarifs_type5.plage_horaire}")

    # Gros client - Type 6
    tarifs_type6 = calculer_tarifs_detailles(3200, 2025)  # Type 6
    assert tarifs_type6.plage_horaire == ">400h"
    assert tarifs_type6.categorie == "Gros client"
    assert tarifs_type6.intervalle_min == 3000.0
    assert tarifs_type6.intervalle_max == 4000.0
    print(f"✅ Type 6 (3200 kW): Intervalle [{int(tarifs_type6.intervalle_min)}-{int(tarifs_type6.intervalle_max)}], Plage: {tarifs_type6.plage_horaire}")

    # Gros client - Type 8+
    tarifs_type8 = calculer_tarifs_detailles(4500, 2025)  # Type 8
    assert tarifs_type8.plage_horaire == ">400h"
    assert tarifs_type8.intervalle_min == 4000.0
    assert tarifs_type8.intervalle_max == 5000.0
    print(f"✅ Type 8 (4500 kW): Intervalle [{int(tarifs_type8.intervalle_min)}-{int(tarifs_type8.intervalle_max)}], Plage: {tarifs_type8.plage_horaire}")

    print("\n✅ Types détectés correctement selon les intervalles de puissance")
    print("   Note: Plage horaire >400h utilisée par défaut (la plus courante)")

except Exception as e:
    print(f"\n❌ ERREUR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Résumé final
print("\n" + "=" * 80)
print("RÉSUMÉ DES TESTS")
print("=" * 80)
print("""
✅ TOUS LES TESTS PASSÉS

1. ✅ Fonction calculer_tarifs_detailles() fonctionne
2. ✅ Schema TarifsInfo validé
3. ✅ ConfigurationInfo avec tarifs validé
4. ✅ Coefficients d'évolution corrects (5% petit, 10% gros)
5. ✅ Plages horaires détectées correctement

IMPLÉMENTATION TARIFS DÉTAILLÉS: 100% FONCTIONNELLE ✨
""")

print("=" * 80)
print("Pour tester l'endpoint complet /full-analysis:")
print("  python test_exact_reproduction.py")
print("=" * 80)
