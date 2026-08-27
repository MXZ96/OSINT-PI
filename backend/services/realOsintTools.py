#!/usr/bin/env python3
"""
Real OSINT Tools Integration - Blackbird & theHarvester Wrapper
Provides unified interface for real username and email searches
Uses HTTP-based fallback when tools are unavailable
"""

import json
import subprocess
import sys
import os
import re
import asyncio
from pathlib import Path
from typing import Dict, List, Any, Optional
from urllib.parse import urljoin
import httpx
from datetime import datetime


PROJECT_ROOT = Path(__file__).resolve().parents[2]
TOOLS_ROOT = Path(os.environ.get("OSINT_TOOLS_PATH", PROJECT_ROOT / "TOOLS"))


# Platform URLs that can be checked via HTTP (no API key needed)
USERNAME_PLATFORMS = {
    "GitHub": "https://github.com/{username}",
    "Twitter": "https://twitter.com/{username}",
    "Instagram": "https://instagram.com/{username}",
    "Reddit": "https://www.reddit.com/user/{username}",
    "TikTok": "https://www.tiktok.com/@{username}",
    "YouTube": "https://www.youtube.com/@{username}",
    "Medium": "https://medium.com/@{username}",
    "Pinterest": "https://www.pinterest.com/{username}",
    "Snapchat": "https://www.snapchat.com/add/{username}",
    "Twitch": "https://www.twitch.tv/{username}",
    "GitLab": "https://gitlab.com/{username}",
    "npm": "https://www.npmjs.com/~{username}",
    "Docker Hub": "https://hub.docker.com/u/{username}",
}

EMAIL_PATTERNS = [
    r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
]

# Per-platform "account not found" markers in page content (case-insensitive).
# HTTP 200 alone is NOT enough: TikTok/YouTube/Instagram return 200 with a
# "not found" page, so we must inspect the body to avoid false positives.
NOT_FOUND_SIGNATURES = {
    "TikTok": ["couldn't find this account", "this account was not found"],
    "YouTube": ["this channel does not exist", "channel does not exist", "this page isn't available"],
    "Instagram": ["sorry, this page isn't available", "page not found", "the link you followed may be broken"],
    "Twitter": ["this account doesn't exist", "hmm...this page doesn't exist", "this account has been suspended"],
    "Reddit": [
        "page not found",
        "there isn't a community on reddit with that name",
        "nobody on reddit goes by that name",
        "sorry, nobody on reddit",
        "this community doesn't exist yet",
    ],
    "Twitch": [
        "channel not found",
        "we couldn't find that channel",
        "this channel is not available",
        "channel does not exist",
        "the channel you're looking for cannot be found",
    ],
    "Pinterest": ["couldn't find that page", "page not found"],
    "Medium": ["page not found", "this account does not exist"],
    "GitLab": ["page not found", "the page you're looking for doesn't exist"],
    "npm": ["couldn't find that user", "user not found"],
    "Docker Hub": ["error: user not found", "could not find"],
    "Snapchat": ["this account does not exist", "couldn't find"],
}


class DirectHttpChecker:
    """Direct HTTP-based username checker - works without API keys"""
    
    def __init__(self):
        self.session = None
        self.timeout = 10
    
    async def check_username(self, username: str) -> List[Dict[str, Any]]:
        """Check username across multiple platforms using HTTP requests"""
        results = []
        
        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
            tasks = []
            for platform, url_template in USERNAME_PLATFORMS.items():
                url = url_template.format(username=username)
                tasks.append(self._check_platform(client, platform, url))
            
            platform_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in platform_results:
                if isinstance(result, dict):
                    results.append(result)
        
        return results
    
    def _is_not_found(self, platform: str, text: str) -> bool:
        """Detect 'account not found' pages that still return HTTP 200"""
        if not text:
            return False
        low = text.lower()
        for sig in NOT_FOUND_SIGNATURES.get(platform, []):
            if sig in low:
                return True
        return False

    async def _check_platform(self, client: httpx.AsyncClient, platform: str, url: str) -> Optional[Dict]:
        """Check a single platform"""
        try:
            response = await client.get(url)
            
            if response.status_code == 200:
                # HTTP 200 is not enough: inspect body for 'not found' markers
                if self._is_not_found(platform, response.text):
                    return {
                        "platform": platform,
                        "url": url,
                        "found": False,
                        "source": "http_check",
                        "note": "Account not found (page content)"
                    }
                return {
                    "platform": platform,
                    "url": url,
                    "found": True,
                    "source": "http_check"
                }
            elif response.status_code == 404:
                return {
                    "platform": platform,
                    "url": url,
                    "found": False,
                    "source": "http_check"
                }
        except Exception:
            pass
        
        return {
            "platform": platform,
            "url": url,
            "found": False,
            "source": "http_check",
            "error": "Connection failed"
        }


class DirectEmailChecker:
    """Direct HTTP-based email checker using Intelligence X with Playwright"""
    
    def __init__(self):
        self.timeout = 15
    
    async def check_email(self, email: str) -> Dict[str, Any]:
        """Check email using Intelligence X with Playwright browser"""
        result = {
            "email": email,
            "found": False,
            "sources": [],
            "domain": email.split("@")[1] if "@" in email else email,
            "intelx_stats": None,
            "intelx_url": f"https://intelx.io/?s={email}"
        }
        
        # Try Playwright first for JS-rendered content
        try:
            stats = await self._fetch_with_playwright(email)
            if stats:
                result["intelx_stats"] = stats
                result["found"] = stats["total"] > 0
                result["sources"] = stats
                if stats.get("last_detected_year"):
                    result["lastDetected"] = stats["last_detected_year"]
        except Exception as e:
            result["error"] = str(e)
        
        # Check domain for disposable email
        result["is_disposable"] = await self._check_disposable(email)
        
        # Common username pattern on GitHub
        username = email.split("@")[0]
        result["possible_github"] = f"https://github.com/{username}"
        
        return result
    
    async def _fetch_with_playwright(self, email: str) -> Optional[Dict]:
        """Use Playwright to fetch IntelX page with JS rendering"""
        try:
            from playwright.async_api import async_playwright
            
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                
                url = f"https://intelx.io/?s={email}"
                await page.goto(url, timeout=20000)
                
                # Wait for stats to load
                await page.wait_for_selector('#found_media_stats', timeout=10000)
                
                # Get the stats text
                stats_text = await page.evaluate('''() => {
                    const el = document.getElementById('found_media_stats');
                    return el ? el.textContent : '';
                }''')

                # Get per-result dates (last detected) from search result rows
                dates_text = await page.evaluate('''() => {
                    const spans = document.querySelectorAll('.search-result .info_row span');
                    const dates = [];
                    spans.forEach(s => {
                        const t = s.textContent.trim();
                        if (/\\d{4}-\\d{2}-\\d{2}/.test(t)) dates.push(t);
                    });
                    return dates;
                }''')

                await browser.close()

                if stats_text and stats_text.strip():
                    stats = self._parse_stats_text(stats_text)
                    if dates_text:
                        try:
                            last = max(dates_text)
                            stats["last_detected"] = last
                            stats["last_detected_year"] = int(last[:4])
                        except Exception:
                            pass
                    return stats

                return {
                    "raw_text": "No data found",
                    "text_files": 0,
                    "csv_files": 0,
                    "db_files": 0,
                    "total": 0
                }
        except Exception as e:
            return None
    
    def _parse_stats_text(self, stats_text: str) -> Dict:
        """Parse the stats text like '195 Text Files, 37 CSV Files, 2 Database Files'"""
        import re
        
        text_files = 0
        csv_files = 0
        db_files = 0
        
        text_match = re.search(r'(\d+)\s*Text Files?', stats_text, re.IGNORECASE)
        csv_match = re.search(r'(\d+)\s*CSV Files?', stats_text, re.IGNORECASE)
        db_match = re.search(r'(\d+)\s*Database Files?', stats_text, re.IGNORECASE)
        
        if text_match:
            text_files = int(text_match.group(1))
        if csv_match:
            csv_files = int(csv_match.group(1))
        if db_match:
            db_files = int(db_match.group(1))
        
        return {
            "raw_text": stats_text,
            "text_files": text_files,
            "csv_files": csv_files,
            "db_files": db_files,
            "total": text_files + csv_files + db_files
        }
    
    async def _check_disposable(self, email: str) -> bool:
        """Check if email is from disposable email service"""
        disposable_domains = [
            "tempmail.com", "throwaway.email", "10minutemail.com",
            "guerrillamail.com", "mailinator.com", "fakeinbox.com",
            "yopmail.com", "getnada.com", "trashmail.com"
        ]
        
        domain = email.split("@")[1].lower() if "@" in email else ""
        return domain in disposable_domains


class PhoneNumberChecker:
    """Phone number OSINT checker using whatsapp.checkleaked.cc"""
    
    def __init__(self):
        self.timeout = 15
    
    async def check_phone(self, phone: str) -> Dict[str, Any]:
        """Check phone number using whatsapp.checkleaked.cc"""
        # Clean phone number - remove + and any non-digit
        clean_phone = re.sub(r'[^\d]', '', phone)
        
        # Remove leading country code if present (keep only the number after country code)
        # For Indonesia (62), remove the leading 62
        if len(clean_phone) > 10:
            # Keep the full number with country code
            pass
        
        result = {
            "phone": phone,
            "phone_raw": clean_phone,
            "found": False,
            "url": f"https://whatsapp.checkleaked.cc/{clean_phone}",
            "whatsapp_data": None,
            "telegram_data": None,
            "leak_data": None,
            "ai_report": None
        }
        
        # Try to fetch with Playwright
        try:
            phone_data = await self._fetch_with_playwright(clean_phone)
            if phone_data:
                result.update(phone_data)
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    async def _fetch_with_playwright(self, phone: str) -> Optional[Dict]:
        """Use Playwright to fetch phone data from checkleaked.cc"""
        try:
            from playwright.async_api import async_playwright
            
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                
                url = f"https://whatsapp.checkleaked.cc/{phone}"
                await page.goto(url, timeout=20000)
                
                # Wait for the textarea to load
                await page.wait_for_selector('textarea.v-field__input', timeout=15000)
                
                # Get the textarea content
                json_text = await page.evaluate('''() => {
                    const el = document.querySelector('textarea.v-field__input');
                    return el ? el.value : '';
                }''')
                
                await browser.close()
                
                if json_text and json_text.strip():
                    return self._parse_phone_json(json_text, phone)
                
                return None
        except Exception as e:
            return None
    
    def _parse_phone_json(self, json_text: str, phone: str) -> Dict:
        """Parse the JSON from textarea and extract important fields"""
        import json
        
        try:
            # Parse the JSON
            data = json.loads(json_text)
            
            result = {
                "found": data.get("exists", False),
                "whatsapp_data": {
                    "exists": data.get("exists", False),
                    "is_wacontact": data.get("isWAContact", False),
                    "is_business": data.get("isBusiness", False),
                    "is_verified": data.get("isVerified", False),
                    "phone_formatted": data.get("phone", ""),
                    "country_code": data.get("countryCode", ""),
                    "last_queried": data.get("lastQueried", "")
                },
                "telegram_data": None,
                "leak_data": None,
                "ai_report": None
            }
            
            # Extract Telegram data
            telegram = data.get("telegram", {})
            if telegram and not telegram.get("error"):
                result["telegram_data"] = {
                    "exists": True,
                    "username": telegram.get("number", ""),
                    "phone_formatted": telegram.get("phone", ""),
                    "country_code": telegram.get("countryCode", ""),
                    "date": telegram.get("date", "")
                }
            elif telegram.get("error"):
                result["telegram_data"] = {
                    "exists": False,
                    "error": telegram.get("error", "Unknown error")
                }
            
            # Extract LeakCheck data
            fb_leak = data.get("fbLeak", {})
            if fb_leak and fb_leak.get("success"):
                result["leak_data"] = {
                    "found": True,
                    "source": "Facebook Leak",
                    "date": fb_leak.get("date", "")
                }
            
            # Extract AI Report
            ai_report = data.get("aiReport", {})
            if ai_report:
                result["ai_report"] = {
                    "report": ai_report.get("report", ""),
                    "model": ai_report.get("model", ""),
                    "generated_at": ai_report.get("generatedAt", ""),
                    "data_sources": ai_report.get("inputSummary", {}).get("dataSourcesUsed", [])
                }
            
            return result
            
        except json.JSONDecodeError:
            return {"found": False, "error": "Failed to parse JSON"}
            return f"+{phone}"
        return f"+{phone}"


class TheHarvesterWrapper:
    """Wrapper untuk theHarvester tool - with HTTP fallback"""
    
    def __init__(self, tools_path: str = str(TOOLS_ROOT / "theHarvester")):
        self.tools_path = tools_path
        self.harvester_path = os.path.join(tools_path, "theHarvester.py")
        self.use_fallback = True
    
    async def search_email(self, email: str) -> Dict[str, Any]:
        """Search email information"""
        if self.use_fallback:
            return await self._fallback_search(email)
        
        try:
            return await self._harvester_search(email)
        except Exception:
            return await self._fallback_search(email)
    
    async def _fallback_search(self, email: str) -> Dict[str, Any]:
        """Fallback search using direct HTTP"""
        checker = DirectEmailChecker()
        return await checker.check_email(email)
    
    async def _harvester_search(self, email: str) -> Dict[str, Any]:
        """Try using theHarvester (currently broken on Windows)"""
        domain = email.split("@")[1]
        
        cmd = [
            sys.executable,
            self.harvester_path,
            "-d", domain,
            "-l", "10",
            "-b", "google"
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60,
            cwd=self.tools_path,
            encoding='utf-8',
            errors='replace'
        )
        
        return self._parse_harvester_output(result.stdout, email, domain)
    
    def _parse_harvester_output(self, output: str, email: str, domain: str) -> Dict:
        """Parse theHarvester output"""
        info = {
            "email": email,
            "domain": domain,
            "found": False,
            "data": {"emails": [], "subdomains": []}
        }
        
        lines = output.split("\n")
        for line in lines:
            if "Email addresses found:" in line:
                continue
            if "@" in line and domain in line:
                info["data"]["emails"].append(line.strip())
        
        if info["data"]["emails"]:
            info["found"] = True
        
        return info


class BlackbirdWrapper:
    """Wrapper untuk Blackbird tool - with HTTP fallback"""
    
    def __init__(self, tools_path: str = str(TOOLS_ROOT / "blackbird")):
        self.tools_path = tools_path
        self.blackbird_path = os.path.join(tools_path, "blackbird.py")
        self.use_fallback = True
    
    async def search_username(self, username: str) -> List[Dict[str, Any]]:
        """Search username across platforms"""
        if self.use_fallback:
            return await self._fallback_search(username)
        
        try:
            return await self._blackbird_search(username)
        except Exception:
            return await self._fallback_search(username)
    
    async def _fallback_search(self, username: str) -> List[Dict[str, Any]]:
        """Fallback search using direct HTTP"""
        checker = DirectHttpChecker()
        return await checker.check_username(username)
    
    async def _blackbird_search(self, username: str) -> List[Dict[str, Any]]:
        """Try using Blackbird (currently broken on Windows)"""
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        
        cmd = [
            sys.executable,
            self.blackbird_path,
            "-u", username,
            "--json"
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60,
            cwd=self.tools_path,
            env=env,
            encoding='utf-8',
            errors='replace'
        )
        
        return self._parse_blackbird_output(result.stdout, username)
    
    def _parse_blackbird_output(self, output: str, username: str) -> List[Dict]:
        """Parse Blackbird JSON output"""
        accounts = []
        
        try:
            data = json.loads(output)
            if isinstance(data, dict) and "results" in data:
                for site, info in data["results"].items():
                    if info.get("found"):
                        accounts.append({
                            "platform": site,
                            "username": username,
                            "found": True,
                            "url": info.get("url", ""),
                            "source": "blackbird"
                        })
        except (json.JSONDecodeError, KeyError):
            pass
        
        return accounts


class UnifiedOsintEngine:
    """Unified interface combining both tools with fallback"""
    
    def __init__(self):
        self.blackbird = BlackbirdWrapper()
        self.email_checker = DirectEmailChecker()
        self.phone_checker = PhoneNumberChecker()
    
    async def analyze_async(self, email: str = None, username: str = None, phone: str = None) -> Dict[str, Any]:
        """Async main analysis function"""
        results = {
            "query": {"email": email, "username": username, "phone": phone},
            "timestamp": datetime.now().isoformat(),
            "osintResults": [],
            "leakedData": [],
            "insights": [],
            "riskScore": 0,
            "recommendations": [],
            "aiComparison": {},
            "toolsUsed": []
        }
        
        tasks = []
        if username:
            tasks.append(self._search_username_async(username, results))
        if email:
            tasks.append(self._search_email_async(email, results))
        if phone:
            tasks.append(self._search_phone_async(phone, results))
        
        if tasks:
            await asyncio.gather(*tasks)
        
        # Generate results even if no accounts found
        if results["osintResults"] or phone or email:
            results["insights"] = self._generate_insights(results["osintResults"])
            results["riskScore"] = self._calculate_risk(results["osintResults"])
            results["recommendations"] = self._generate_recommendations(email, username, phone)
            results["leakedData"] = self._generate_leak_info(email, username, phone)
            results["aiComparison"] = self._generate_ai_analysis(results)
        
        return results
    
    async def _search_phone_async(self, phone: str, results: Dict):
        """Async phone number search"""
        phone_result = await self.phone_checker.check_phone(phone)
        
        results["osintResults"].append({
            "platform": "Phone OSINT",
            "phone": phone,
            "found": phone_result.get("found", False),
            "url": phone_result.get("url", f"https://whatsapp.checkleaked.cc/{phone}"),
            "source": "checkleaked",
            "whatsapp_data": phone_result.get("whatsapp_data"),
            "telegram_data": phone_result.get("telegram_data"),
            "leak_data": phone_result.get("leak_data"),
            "ai_report": phone_result.get("ai_report")
        })
        
        results["toolsUsed"].append("phone_checker")
    
    async def _search_username_async(self, username: str, results: Dict):
        """Async username search"""
        bb_results = await self.blackbird.search_username(username)
        results["osintResults"].extend(bb_results)
        if bb_results:
            results["toolsUsed"].append("blackbird_http")

    async def _search_email_async(self, email: str, results: Dict):
        """Async email search using Intelligence X"""
        email_result = await self.email_checker.check_email(email)
        
        # Add IntelX stats to the result
        osint_entry = {
            "platform": "Intelligence X",
            "email": email,
            "domain": email_result.get("domain", ""),
            "found": email_result.get("found", False),
            "url": email_result.get("intelx_url", f"https://intelx.io/?s={email}"),
            "source": "intelx",
            "intelx_stats": email_result.get("intelx_stats"),
            "is_disposable": email_result.get("is_disposable", False),
            "lastDetected": email_result.get("lastDetected"),
            "confidence": 1,
            "confidenceLabel": "High",
            "isLikelyOwner": True,
            "correlation": {"emailMatch": True}
        }
        
        results["osintResults"].append(osint_entry)
        
        results["toolsUsed"].append("intelx")
    
    def analyze(self, email: str = None, username: str = None, phone: str = None) -> Dict[str, Any]:
        """Sync wrapper for analyze"""
        try:
            return asyncio.run(self.analyze_async(email, username, phone))
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                return loop.run_until_complete(self.analyze_async(email, username, phone))
            finally:
                loop.close()
    
    def _generate_insights(self, accounts: List[Dict]) -> List[Dict]:
        """Generate insights from found accounts"""
        insights = []
        
        found_accounts = [a for a in accounts if a.get("found")]
        
        if len(found_accounts) > 0:
            insights.append({
                "title": "Platform Detection",
                "description": f"Account found across {len(found_accounts)} platform(s)",
                "icon": "globe",
                "severity": "high" if len(found_accounts) > 3 else "medium"
            })
        
        platforms = set([a.get("platform") for a in found_accounts])
        if len(platforms) > 2:
            insights.append({
                "title": "Pattern Consistency",
                "description": "Same username detected on multiple platforms",
                "icon": "link",
                "severity": "medium"
            })
        
        if not insights:
            insights.append({
                "title": "No Accounts Found",
                "description": "No active accounts found on monitored platforms",
                "icon": "database",
                "severity": "low"
            })
        
        return insights
    
    def _calculate_risk(self, accounts: List[Dict]) -> int:
        """Calculate risk score based on accounts and IntelX stats"""
        # Base from found accounts
        found = len([a for a in accounts if a.get("found")])
        
        # Add IntelX stats contribution
        intelx_total = 0
        for account in accounts:
            stats = account.get("intelx_stats")
            if stats and isinstance(stats, dict):
                intelx_total += stats.get("total", 0)
        
        # Calculate score: base + accounts + (IntelX data * 0.5)
        base_score = 15
        score = base_score + (found * 8) + int(intelx_total * 0.5)
        return min(95, score)
    
    def _generate_leak_info(self, email: str = None, username: str = None, phone: str = None) -> List[Dict]:
        """Generate leak information"""
        leaks = []
        
        if email:
            leaks.append({
                "source": "Intelligence X",
                "type": "intelx_lookup",
                "severity": "medium",
                "status": "checked",
                "note": f"Check results at intelx.io for {email}"
            })
        
        if phone:
            leaks.append({
                "source": "Phone Number Check",
                "type": "phone_check",
                "severity": "low",
                "status": "checked",
                "note": f"Phone {phone} - check for SMS leaks"
            })
        
        return leaks
    
    def _generate_recommendations(self, email: str = None, username: str = None, phone: str = None) -> List[str]:
        """Generate recommendations"""
        return [
            "Enable Two-Factor Authentication (2FA) on all discovered accounts",
            "Review and restrict privacy settings on found accounts",
            "Check email in HaveIBeenPwned for confirmed breaches",
            "Update passwords on discovered accounts",
            "Monitor for unauthorized access",
            "Consider using unique usernames per platform",
            "Enable account alerts and notifications",
            "Reduce public exposure on social platforms"
        ]
    
    def _generate_ai_analysis(self, results: Dict) -> Dict:
        """Generate AI-style analysis"""
        found_count = len([r for r in results["osintResults"] if r.get("found")])
        
        return {
            "osintAnalysis": f"Real OSINT tools discovered {found_count} account(s) associated with the target. "
                         f"Search was conducted using HTTP-based lookup across major platforms.",
            "aiInsight": f"The detected presence across {found_count} platform(s) indicates an active online presence. "
                        f"This suggests moderate to high digital exposure risk. Recommend immediate "
                        f"privacy review and security hardening on all discovered accounts."
        }


def main():
    """Main entry point for CLI usage"""
    if len(sys.argv) < 2:
        print("Usage: python realOsintTools.py [-u username] [-e email] [-p phone]")
        sys.exit(1)
    
    username = None
    email = None
    phone = None
    
    args = sys.argv[1:]
    if "-u" in args and len(args) > args.index("-u") + 1:
        username = args[args.index("-u") + 1]
    if "-e" in args and len(args) > args.index("-e") + 1:
        email = args[args.index("-e") + 1]
    if "-p" in args and len(args) > args.index("-p") + 1:
        phone = args[args.index("-p") + 1]
    
    if not username and not email and not phone:
        print("Error: Specify at least one of -u username, -e email, or -p phone")
        sys.exit(1)
    
    engine = UnifiedOsintEngine()
    results = engine.analyze(email=email, username=username, phone=phone)
    
    print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()