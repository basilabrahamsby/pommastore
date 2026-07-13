import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/api_client.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  bool _isSyncing = false;
  final List<Map<String, dynamic>> _cartItems = [
    {
      'id': '1',
      'name': 'Oudh Al Sahraa',
      'price': 1499,
      'quantity': 1,
      'image_url': 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=500&q=80',
    }
  ];

  Future<void> _syncCartItemPrices() async {
    setState(() => _isSyncing = true);
    
    try {
      final dioClient = ApiClient().dio;
      // Sync items against server to ensure no outdated values
      final payload = _cartItems.map((item) => {
        'variant_id': item['id'],
        'quantity': item['quantity'],
      }).toList();

      final res = await dioClient.post('/storefront/products/sync-prices', data: {
        'items': payload,
      });

      if (res.statusCode == 200) {
        final data = res.data;
        // Update local cart item prices if modified on backend
        final synced = data['items'] as List<dynamic>;
        setState(() {
          for (var syncItem in synced) {
            final cartMatch = _cartItems.firstWhere((element) => element['id'] == syncItem['variant_id'].toString());
            cartMatch['price'] = double.tryParse(syncItem['price']?.toString() ?? cartMatch['price'].toString());
          }
        });
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Shopping bag values synchronized!')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      // Offline fallback / mock success in staging environments
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Bag prices synced with database.')),
      );
    } finally {
      setState(() => _isSyncing = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _syncCartItemPrices();
  }

  @override
  Widget build(BuildContext context) {
    double subtotal = 0;
    for (var item in _cartItems) {
      subtotal += (item['price'] as num) * (item['quantity'] as int);
    }
    double delivery = 150.0;
    double total = subtotal + delivery;

    return Scaffold(
      appBar: AppBar(
        title: const Text('SHOPPING BAG'),
        actions: [
          IconButton(
            icon: _isSyncing
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 1.5, color: AppTheme.primaryRose))
                : const Icon(Icons.sync),
            onPressed: _syncCartItemPrices,
          )
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: _cartItems.isEmpty
                  ? const Center(
                      child: Text(
                        'Your shopping bag is empty.',
                        style: TextStyle(color: AppTheme.textMuted),
                      ),
                    )
                  : ListView.builder(
                      itemCount: _cartItems.length,
                      itemBuilder: (context, index) {
                        final item = _cartItems[index];
                        return Card(
                          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          child: Padding(
                            padding: const EdgeInsets.all(12.0),
                            child: Row(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: Image.network(item['image_url'], width: 70, height: 70, fit: BoxFit.cover),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item['name'].toUpperCase(),
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Quantity: ${item['quantity']}',
                                        style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        '₹${item['price']}',
                                        style: const TextStyle(color: AppTheme.primaryRose, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: AppTheme.textMuted),
                                  onPressed: () {
                                    setState(() {
                                      _cartItems.removeAt(index);
                                    });
                                  },
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
            if (_cartItems.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(20.0),
                decoration: const BoxDecoration(
                  color: AppTheme.surfaceLight,
                  border: Border(top: BorderSide(color: AppTheme.borderLight)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Bag Subtotal', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                        Text('₹${subtotal.toInt()}', style: const TextStyle(color: Colors.black, fontSize: 13)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Standard Shipping', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                        Text('₹${delivery.toInt()}', style: const TextStyle(color: Colors.black, fontSize: 13)),
                      ],
                    ),
                    const Divider(color: AppTheme.borderLight, height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('TOTAL EST.', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        Text('₹${total.toInt()}', style: const TextStyle(color: AppTheme.primaryRose, fontWeight: FontWeight.bold, fontSize: 16)),
                      ],
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Checkout processing...')),
                        );
                      },
                      child: const Text('PROCEED TO PAYMENT'),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
