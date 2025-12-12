from playwright.sync_api import sync_playwright
import os

def verify_modal(page):
    # Load the local HTML file - using absolute path
    cwd = os.getcwd()
    page.goto(f"file://{cwd}/Index PlaceHolder.html")

    # Mock google.script.run
    page.evaluate("window.google = { script: { run: { withSuccessHandler: () => ({ withFailureHandler: () => ({ previewAIContent: () => {} }) }) } } }")

    # Open the preview modal with dummy data
    long_text = "This is a long text to test scrolling.\n" * 50
    page.evaluate(f"""
        openPreviewModal({{
            titre: 'Test Project',
            contexte: `{long_text}`,
            demarche: 'Step 1...',
            phases: 'Phase 1...',
            phrase: 'Conclusion...'
        }});
    """)

    # Wait for modal
    page.wait_for_selector("#previewModal", state="visible")

    # Take a screenshot
    page.screenshot(path="verification/modal_scroll.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_modal(page)
        except Exception as e:
            print(e)
        finally:
            browser.close()
