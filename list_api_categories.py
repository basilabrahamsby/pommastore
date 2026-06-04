import urllib.request
import json

def get_data(url):
    try:
        with urllib.request.urlopen(url) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Error calling {url}: {e}")
        return None

def main():
    print("--- CALLING CATEGORIES ---")
    cats = get_data("http://localhost:8000/api/v1/storefront/categories")
    if cats:
        print(f"Categories found: {len(cats)}")
        for c in cats:
            print(c)
    else:
        print("No categories returned.")

    print("\n--- CALLING BRANDS ---")
    brands = get_data("http://localhost:8000/api/v1/storefront/brands")
    if brands:
        print(f"Brands found: {len(brands)}")
        for b in brands:
            print(b)
    else:
        print("No brands returned.")

if __name__ == "__main__":
    main()
