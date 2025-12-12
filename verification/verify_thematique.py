
from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        # We need an absolute path
        cwd = os.getcwd()
        filepath = f'file://{cwd}/Index PlaceHolder.html'

        print(f'Navigating to {filepath}')
        page.goto(filepath)

        # Take a screenshot of the form area where we added the field
        # The new field has id 'f_thematique'

        # Wait for the element to be attached to DOM
        page.wait_for_selector('#f_thematique')

        # Scroll to the element to make sure it's in view
        element = page.locator('#f_thematique')
        element.scroll_into_view_if_needed()

        # Take a screenshot of the viewport
        page.screenshot(path='verification/thematique_field.png')

        browser.close()

if __name__ == '__main__':
    run()
