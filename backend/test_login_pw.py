import asyncio
from playwright.async_api import async_playwright
import time

async def main():
    async with async_playwright() as p:
        print("Launching browser...")
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Pipe page console to stdout
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
        
        email = f"testuser_{int(time.time())}@example.com"
        password = "Password123!"

        print(f"Navigating to http://localhost:5173/register...")
        await page.goto("http://localhost:5173/register")
        
        print(f"Filling register form with {email}...")
        await page.fill('input[placeholder="Jane Doe"]', "Test User")
        await page.fill('input[type="email"]', email)
        await page.fill('input[type="password"]', password)
        await page.fill('input[placeholder="••••••••"]', password) # Confirm password placeholder is ••••••••
        
        print("Submitting register...")
        # wait a moment for react to update states
        await asyncio.sleep(1)
        await page.click('button[type="submit"]')
        
        print("Waiting 10 seconds to observe state...")
        await asyncio.sleep(10)
        
        print("Current URL:", page.url)
        
        if "dashboard" not in page.url:
            print("Did not redirect! Checking refresh...")
            await page.reload()
            await asyncio.sleep(3)
            print("URL after refresh:", page.url)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
