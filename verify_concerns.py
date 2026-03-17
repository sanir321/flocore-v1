import os
import re
import sys

# Configuration
PROJECT_ROOT = "."
SRC_DIR = os.path.join(PROJECT_ROOT, "src")
LINE_COUNT_THRESHOLD = 500
CONCERNS_SUMMARY = []

def safe_read(file_path):
    """Try to read file with common encodings."""
    encodings = ['utf-8', 'utf-16', 'utf-16-le', 'utf-16-be', 'latin-1']
    for enc in encodings:
        try:
            with open(file_path, 'r', encoding=enc) as f:
                return f.read(), enc
        except UnicodeDecodeError:
            continue
    # Fallback to binary if all fail (shouldn't happen for text files)
    return "", None

def log_concern(category, file_path, issue, status="OUTSTANDING"):
    CONCERNS_SUMMARY.append({
        "category": category,
        "file": file_path,
        "issue": issue,
        "status": status
    })

def check_file_length():
    files_to_check = [
        "src/pages/AgentsPage.tsx",
        "src/pages/LandingPage.tsx",
        "src/pages/AppointmentsPage.tsx",
        "src/types/database.types.ts"
    ]
    for file_rel in files_to_check:
        file_path = os.path.join(PROJECT_ROOT, file_rel)
        if os.path.exists(file_path):
            content, enc = safe_read(file_path)
            if content:
                lines = content.splitlines()
                count = len(lines)
                if count > LINE_COUNT_THRESHOLD:
                    log_concern("Tech Debt", file_rel, f"File length is {count} lines (Threshold: {LINE_COUNT_THRESHOLD})")
                else:
                    log_concern("Tech Debt", file_rel, f"File length is {count} lines", "FIXED")

def check_any_usage():
    # Targeted files for 'any' check
    files_to_check = [
        "src/pages/WhatsAppSettingsPage.tsx",
        "src/pages/TelegramSettingsPage.tsx",
        "src/components/auth/SignUpForm.tsx",
        "src/hooks/queries/useGmailConnection.ts",
        "src/pages/ChannelsPage.tsx"
    ]
    pattern = re.compile(r"(: any|as any)")
    for file_rel in files_to_check:
        file_path = os.path.join(PROJECT_ROOT, file_rel)
        if os.path.exists(file_path):
            content, enc = safe_read(file_path)
            if content:
                matches = pattern.findall(content)
                if matches:
                    log_concern("Tech Debt", file_rel, f"Found {len(matches)} instances of 'any' type usage")
                else:
                    log_concern("Tech Debt", file_rel, "No 'any' type usage found", "FIXED")

def check_console_logs():
    files_to_check = [
        "src/lib/whatsapp.ts",
        "src/hooks/usePresence.ts",
        "src/hooks/useMessages.ts",
        "src/lib/notifications.ts",
        "src/components/auth/SignUpForm.tsx"
    ]
    pattern = re.compile(r"console\.(log|warn|error)")
    for file_rel in files_to_check:
        file_path = os.path.join(PROJECT_ROOT, file_rel)
        if os.path.exists(file_path):
            content, enc = safe_read(file_path)
            if content:
                matches = pattern.findall(content)
                if matches:
                    log_concern("Known Bugs", file_rel, f"Found {len(matches)} console logging statements")
                else:
                    log_concern("Known Bugs", file_rel, "No console logs found", "FIXED")

def check_local_storage():
    file_rel = "src/pages/NotificationSettingsPage.tsx"
    file_path = os.path.join(PROJECT_ROOT, file_rel)
    if os.path.exists(file_path):
        content, enc = safe_read(file_path)
        if content:
            if "localStorage" in content and "getItem" in content:
                 log_concern("Security", file_rel, "Still uses localStorage for settings")
            else:
                 log_concern("Security", file_rel, "Using database persistence for settings", "FIXED")

def check_hardcoded_urls():
    files_to_check = [
        "src/pages/TelegramSettingsPage.tsx",
        "src/pages/SlackSettingsPage.tsx",
        "src/pages/CalendarSettingsPage.tsx"
    ]
    patterns = [
        r"https://api\.telegram\.org",
        r"https://slack\.com",
        r"https://app\.slack\.com"
    ]
    for file_rel in files_to_check:
        file_path = os.path.join(PROJECT_ROOT, file_rel)
        if os.path.exists(file_path):
            content, enc = safe_read(file_path)
            if content:
                found = False
                for p in patterns:
                    if re.search(p, content):
                        log_concern("Security", file_rel, f"Found hardcoded URL matching {p}")
                        found = True
                        break
                if not found:
                    log_concern("Security", file_rel, "No sensitive hardcoded URLs found", "FIXED")

def check_inbox_complexity():
    file_rel = "src/pages/InboxPage.tsx"
    file_path = os.path.join(PROJECT_ROOT, file_rel)
    if os.path.exists(file_path):
        content, enc = safe_read(file_path)
        if content:
            effect_count = len(re.findall(r"useEffect", content))
            if effect_count > 3:
                log_concern("Performance", file_rel, f"Found {effect_count} useEffect hooks (Target: <= 3)")
            else:
                log_concern("Performance", file_rel, f"Found {effect_count} useEffect hooks", "FIXED")

def print_report():
    print("\n" + "="*80)
    print("CODEBASE CONCERNS VERIFICATION REPORT")
    print("="*80)
    
    fixed = [c for c in CONCERNS_SUMMARY if c['status'] == "FIXED"]
    outstanding = [c for c in CONCERNS_SUMMARY if c['status'] == "OUTSTANDING"]
    
    print(f"\nFIXED CONCERNS ({len(fixed)}):")
    for c in fixed:
        print(f"  [PASS] {c['category']:15} | {c['file']:40} | {c['issue']}")
        
    print(f"\nOUTSTANDING CONCERNS ({len(outstanding)}):")
    for c in outstanding:
        print(f"  [FAIL] {c['category']:15} | {c['file']:40} | {c['issue']}")
    
    print("\n" + "="*80)
    print(f"TOTAL: {len(CONCERNS_SUMMARY)} | FIXED: {len(fixed)} | OUTSTANDING: {len(outstanding)}")
    print("="*80 + "\n")

if __name__ == "__main__":
    check_file_length()
    check_any_usage()
    check_console_logs()
    check_local_storage()
    check_hardcoded_urls()
    check_inbox_complexity()
    print_report()
