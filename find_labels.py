
import re
import os
from pathlib import Path

def check_missing_labels(file_path):
    try:
        content = file_path.read_text(encoding='utf-8', errors='ignore')
    except:
        return []
    
    issues = []
    # Look for input/select/textarea without a label
    inputs = re.findall(r'<(input|select|textarea)[^>]*>', content, re.I)
    for input_tag in inputs:
        if 'aria-label=' not in input_tag.lower() and 'type="hidden"' not in input_tag.lower() and 'type=\'hidden\'' not in input_tag.lower():
            pos = content.find(input_tag)
            lookback = content[max(0, pos-200):pos]
            if '<label' not in lookback.lower():
                issues.append(f"{file_path.name}: {input_tag[:50]}...")
    return issues

files = []
for p in Path('src').rglob('*'):
    if p.suffix in ['.tsx', '.jsx', '.html']:
        files.append(p)

all_issues = []
for f in files:
    issues = check_missing_labels(f)
    if issues:
        all_issues.extend(issues)

for issue in all_issues:
    print(issue)
