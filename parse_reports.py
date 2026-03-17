
import json
import os

def parse_report(filepath):
    try:
        with open(filepath, 'r', encoding='utf-16') as f:
            return json.load(f)
    except UnicodeDecodeError:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        return f"Error: {e}"

ux = parse_report('ux_report.json')
seo = parse_report('seo_report.json')

print("## UX AUDIT SUMMARY")
if isinstance(ux, dict):
    print(f"Status: {'COMPLIANT' if ux.get('compliant') else 'FAIL'}")
    print(f"Passed Checks: {ux.get('passed_checks')}")
    print("\nFAILURES:")
    for issue in ux.get('failures', []):
        print(f"- {issue}")
else:
    print(ux)

print("\n\n## SEO AUDIT SUMMARY")
if isinstance(seo, dict):
    print(f"Status: {seo.get('status')}")
    print(f"Score: {seo.get('score')}")
    print("\nFAILURES:")
    for issue in seo.get('failures', []):
        print(f"- {issue}")
else:
    print(seo)
