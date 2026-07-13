import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import 'product_detail_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  static const List<Map<String, dynamic>> _mockCategories = [
    {
      'id': '1',
      'name': 'Niche Scents',
      'image_url': 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=200&q=80',
    },
    {
      'id': '2',
      'name': 'Best Sellers',
      'image_url': 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=200&q=80',
    },
    {
      'id': '3',
      'name': 'New Arrivals',
      'image_url': 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=200&q=80',
    },
    {
      'id': '4',
      'name': 'Gift Sets',
      'image_url': 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=200&q=80',
    }
  ];

  static const List<Map<String, dynamic>> _mockProducts = [
    {
      'id': '1',
      'name': 'Oudh Al Sahraa',
      'price': 1499,
      'image_url': 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=500&q=80',
      'description': 'A sensual, dark and highly mysterious fragrance centered around pure agarwood (oudh) with hints of saffron and patchouli.',
      'scent_notes': ['Oudh', 'Saffron', 'Patchouli', 'Frankincense'],
      'rating': '4.8',
      'reviews': '84',
    },
    {
      'id': '2',
      'name': 'Rose de Damas',
      'price': 1199,
      'image_url': 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500&q=80',
      'description': 'A velvet rose scent, blended with dark amber and fresh raspberry accents for a highly premium modern experience.',
      'scent_notes': ['Damask Rose', 'Raspberry', 'Amber', 'Clove'],
      'rating': '4.6',
      'reviews': '42',
    },
    {
      'id': '3',
      'name': 'Sandal Royal',
      'price': 1299,
      'image_url': 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500&q=80',
      'description': 'Warm and creamy Indian sandalwood accented by hints of leather and dark cinnamon.',
      'scent_notes': ['Sandalwood', 'Cinnamon', 'Leather', 'Vanilla'],
      'rating': '4.9',
      'reviews': '113',
    }
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('KOZMOCART'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none, color: Colors.black),
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
              height: 240,
              decoration: const BoxDecoration(
                image: DecorationImage(
                  image: NetworkImage('https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80'),
                  fit: BoxFit.cover,
                  colorFilter: ColorFilter.mode(Colors.black38, BlendMode.darken),
                ),
              ),
              child: const Padding(
                padding: EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'PRESTIGE COLLECTION',
                      style: TextStyle(
                        color: AppTheme.accentGold,
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
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.0,
                      ),
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Experience a masterfully curated collection of prestige fragrances, hand-selected to define your signature presence.',
                      style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.4),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Signature Categories
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20.0),
              child: Text(
                'SIGNATURE CATEGORIES',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                  color: Colors.black54,
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Categories horizontal circles
            SizedBox(
              height: 120,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _mockCategories.length,
                itemBuilder: (context, index) {
                  final cat = _mockCategories[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8.0),
                    child: Column(
                      children: [
                        // Outer Ring: elegant gradient border
                        Container(
                          padding: const EdgeInsets.all(2.5),
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              colors: [Color(0xFFFFB300), Color(0xFFE91E63), AppTheme.primaryRose],
                              begin: Alignment.bottomLeft,
                              end: Alignment.topRight,
                            ),
                          ),
                          child: Container(
                            padding: const EdgeInsets.all(2),
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white,
                            ),
                            child: CircleAvatar(
                              radius: 34,
                              backgroundImage: NetworkImage(cat['image_url']),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          cat['name'].toString().toUpperCase(),
                          style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.black87),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 12),
            
            // Section Title
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20.0),
              child: Text(
                'EXCLUSIVE OLFACTORY PICKS',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                  color: Colors.black54,
                ),
              ),
            ),
            
            const SizedBox(height: 16),

            // Products Grid
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.65,
              ),
              itemCount: _mockProducts.length,
              itemBuilder: (context, index) {
                final product = _mockProducts[index];
                return GestureDetector(
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => ProductDetailScreen(product: product),
                      ),
                    );
                  },
                  child: Card(
                    elevation: 0,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Image Container with rating badge overlay
                        Expanded(
                          child: Stack(
                            children: [
                              Container(
                                decoration: BoxDecoration(
                                  borderRadius: const BorderRadius.only(
                                    topLeft: Radius.circular(6),
                                    topRight: Radius.circular(6),
                                  ),
                                  image: DecorationImage(
                                    image: NetworkImage(product['image_url']),
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                              // Myntra-style rating overlay badge
                              Positioned(
                                bottom: 8,
                                left: 8,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xF2FFFFFF),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: AppTheme.borderLight),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        product['rating'],
                                        style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.black),
                                      ),
                                      const SizedBox(width: 2),
                                      const Icon(Icons.star, size: 8, color: Color(0xFFFFA41C)),
                                      const SizedBox(width: 2),
                                      const Text('|', style: TextStyle(fontSize: 8, color: Colors.black26)),
                                      const SizedBox(width: 2),
                                      Text(
                                        product['reviews'],
                                        style: const TextStyle(fontSize: 8, color: Colors.black54),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Text section
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                product['name'].toUpperCase(),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                  letterSpacing: 0.5,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                (product['scent_notes'] as List<dynamic>).join(', '),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppTheme.textMuted,
                                  fontSize: 10,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '₹${product['price']}',
                                    style: const TextStyle(
                                      color: AppTheme.primaryRose,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                  const Icon(
                                    Icons.shopping_bag_outlined,
                                    size: 16,
                                    color: AppTheme.primaryRose,
                                  )
                                ],
                              ),
                            ],
                          ),
                        )
                      ],
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
