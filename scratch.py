import urllib.request, json
url_offers = 'http://localhost:8000/api/v1/storefront/offers'

print("--- Active Storefront Offers ---")
try:
    res = urllib.request.urlopen(url_offers)
    data = json.loads(res.read().decode())
    print(json.dumps(data, indent=2))
except Exception as e:
    print('Error Offers:', e)




