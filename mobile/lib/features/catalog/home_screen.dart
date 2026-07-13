import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import 'product_detail_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  static const List<Map<String, dynamic>> _mockProducts = [
    {
      'id': '1',
      'name': 'Oudh Al Sahraa',
      'price': 1499,
      'image_url': 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=500&q=80',
      'description': 'A sensual, dark and highly mysterious fragrance centered around pure agarwood (oudh) with hints of saffron and patchouli.',
      'scent_notes': ['Oudh', 'Saffron', 'Patchouli', 'Frankincense'],
    },
    {
      'id': '2',
      'name': 'Rose de Damas',
      'price': 1199,
      'image_url': 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500&q=80',
      'description': 'A velvet rose scent, blended with dark amber and fresh raspberry accents for a highly premium modern experience.',
      'scent_notes': ['Damask Rose', 'Raspberry', 'Amber', 'Clove'],
    },
    {
      'id': '3',
      'name': 'Sandal Royal',
      'price': 1299,
      'image_url': 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500&q=80',
      'description': 'Warm and creamy Indian sandalwood accented by hints of leather and dark cinnamon.',
      'scent_notes': ['Sandalwood', 'Cinnamon', 'Leather', 'Vanilla'],
    }
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('KOZMOCART'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () {},
          )
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Curation Banner
            Container(
              height: 200,
              decoration: const BoxDecoration(
                image: DecorationImage(
                  image: NetworkImage('https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80'),
                  fit: BoxFit.cover,
                  colorFilter: ColorFilter.mode(Colors.black45, BlendMode.darken),
                ),
              ),
              child: const Padding(
                padding: EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'CURATED FRAGRANCE',
                      style: TextStyle(
                        color: AppTheme.primaryGold,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 2.0,
                      ),
                    ),
                    SizedBox(height: 6),
                    Text(
                      'THE ART OF PERFUMERY',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.0,
                      ),
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Hand-selected olfactory masterpieces for the true connoisseur.',
                      style: TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),
            
            // Section Title
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20.0),
              child: Text(
                'EXCLUSIVE OLFACTORY PICKS',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                  color: AppTheme.textMuted,
                ),
              ),
            ),
            
            const SizedBox(height: 16),

            // Products list
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _mockProducts.length,
              itemBuilder: (context, index) {
                final product = _mockProducts[index];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                  child: GestureDetector(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => ProductDetailScreen(product: product),
                        ),
                      );
                    },
                    child: Card(
                      child: Row(
                        children: [
                          Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              borderRadius: const BorderRadius.only(
                                topLeft: Radius.circular(8),
                                bottomLeft: Radius.circular(8),
                              ),
                              image: DecorationImage(
                                image: NetworkImage(product['image_url']),
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    product['name'].toUpperCase(),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    product['description'],
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: AppTheme.textMuted,
                                      fontSize: 11,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    '₹${product['price']}',
                                    style: const TextStyle(
                                      color: AppTheme.primaryGold,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}
