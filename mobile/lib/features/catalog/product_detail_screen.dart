import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/api_client.dart';

class ProductDetailScreen extends StatefulWidget {
  final Map<String, dynamic> product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final _pincodeController = TextEditingController();
  bool _isCheckingPincode = false;
  String? _pincodeStatus;
  double? _deliveryCharge;
  int _selectedImageIndex = 0;

  @override
  void dispose() {
    _pincodeController.dispose();
    super.dispose();
  }

  Future<void> _checkPincode() async {
    final pin = _pincodeController.text.trim();
    if (pin.isEmpty || pin.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 6-digit pincode')),
      );
      return;
    }

    setState(() {
      _isCheckingPincode = true;
      _pincodeStatus = null;
      _deliveryCharge = null;
    });

    try {
      final dioClient = ApiClient().dio;
      // Fetch live rate calculation from VM backend
      final res = await dioClient.get('/storefront/shipping/verify-pincode', queryParameters: {
        'pincode': pin,
      });

      if (res.statusCode == 200) {
        final data = res.data;
        setState(() {
          if (data['serviceable'] == true) {
            _pincodeStatus = 'Delivering to $pin • COD Available';
            _deliveryCharge = double.tryParse(data['delivery_charge']?.toString() ?? '150');
          } else {
            _pincodeStatus = 'Sorry, service is not available at $pin';
          }
        });
      }
    } catch (e) {
      setState(() {
        _pincodeStatus = 'Pincode validation failed. Standard shipping applies.';
        _deliveryCharge = 150.0;
      });
    } finally {
      setState(() => _isCheckingPincode = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final images = widget.product['gallery_images'] as List<String>? ?? [widget.product['image_url'] ?? ''];
    final name = widget.product['name'] ?? 'Luxury Fragrance';
    final price = widget.product['price'] ?? 999;
    final description = widget.product['description'] ?? 'An exquisite curation of rare spices and notes.';
    final notes = widget.product['scent_notes'] as List<dynamic>? ?? ['Saffron', 'Amberwood', 'Fir Resin', 'Cedar'];

    return Scaffold(
      appBar: AppBar(title: Image.asset('assets/logo.png', height: 26, fit: BoxFit.contain)),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Interactive Horizontal Zoom Gallery
            SizedBox(
              height: 320,
              child: Stack(
                children: [
                  PageView.builder(
                    itemCount: images.length,
                    onPageChanged: (index) {
                      setState(() {
                        _selectedImageIndex = index;
                      });
                    },
                    itemBuilder: (context, index) {
                      return InteractiveViewer(
                        panEnabled: true,
                        minScale: 1.0,
                        maxScale: 3.0,
                        child: Center(
                          child: images[index].startsWith('http')
                              ? Image.network(images[index], fit: BoxFit.contain)
                              : Image.asset('assets/images/placeholder.png', fit: BoxFit.contain), // Fallback
                        ),
                      );
                    },
                  ),
                  if (images.length > 1)
                    Positioned(
                      bottom: 16,
                      left: 0,
                      right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(images.length, (index) {
                          return Container(
                            width: 6,
                            height: 6,
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _selectedImageIndex == index
                                  ? AppTheme.primaryRose
                                  : Colors.black26,
                            ),
                          );
                        }),
                      ),
                    ),
                ],
              ),
            ),
            
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product Headers
                  Text(
                    name.toUpperCase(),
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: 1.0),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '₹${price.toString()}',
                    style: const TextStyle(color: AppTheme.primaryRose, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 18),
                  
                  // Description
                  const Text('DESCRIPTION', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: AppTheme.textMuted)),
                  const SizedBox(height: 6),
                  Text(description, style: const TextStyle(fontSize: 13, height: 1.5, color: Colors.black87)),
                  const SizedBox(height: 20),

                  // Scent Notes Chips
                  const Text('FRAGRANCE FAMILY NOTES', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: AppTheme.textMuted)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: notes.map((note) {
                      return Chip(
                        label: Text(note.toString(), style: const TextStyle(fontSize: 11, color: Colors.black87)),
                        backgroundColor: AppTheme.surfaceLight,
                        side: const BorderSide(color: AppTheme.borderLight),
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),

                  // Delhivery Pincode Checker Widget
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceLight,
                      border: Border.all(color: AppTheme.borderLight),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('🚚 CHECK DELIVERY DETAILS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.0, color: AppTheme.primaryRose)),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: SizedBox(
                                height: 42,
                                child: TextField(
                                  controller: _pincodeController,
                                  decoration: const InputDecoration(
                                    labelText: 'PINCODE',
                                    fillColor: AppTheme.backgroundLight,
                                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  ),
                                  keyboardType: TextInputType.number,
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            SizedBox(
                              height: 42,
                              child: ElevatedButton(
                                onPressed: _isCheckingPincode ? null : _checkPincode,
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                ),
                                child: _isCheckingPincode
                                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 1.5))
                                    : const Text('CHECK', style: TextStyle(fontSize: 12)),
                              ),
                            ),
                          ],
                        ),
                        if (_pincodeStatus != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            _pincodeStatus!,
                            style: TextStyle(
                              fontSize: 12,
                              color: _pincodeStatus!.startsWith('Sorry') ? Colors.red : Colors.greenAccent,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                        if (_deliveryCharge != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Shipping Charge: ₹${_deliveryCharge!.toInt()}',
                            style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                        ]
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 30),
                  
                  // Action buttons
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Added to Shopping Bag')),
                            );
                          },
                          child: const Text('ADD TO BAG'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Proceeding to Checkout')),
                            );
                          },
                          child: const Text('BUY NOW'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
