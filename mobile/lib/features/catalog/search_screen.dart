import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import 'product_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  String _query = '';

  static const List<Map<String, dynamic>> _allProducts = [
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
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _allProducts.where((p) {
      final name = (p['name'] as String).toLowerCase();
      final notes = (p['scent_notes'] as List<String>).join(' ').toLowerCase();
      return name.contains(_query.toLowerCase()) || notes.contains(_query.toLowerCase());
    }).toList();

    return Scaffold(
      appBar: AppBar(title: Image.asset('assets/logo.png', height: 26, fit: BoxFit.contain)),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search for scent families, notes, or titles...',
                  prefixIcon: const Icon(Icons.search, color: AppTheme.textMuted),
                  suffixIcon: _query.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, color: AppTheme.textMuted),
                          onPressed: () {
                            setState(() {
                              _searchController.clear();
                              _query = '';
                            });
                          },
                        )
                      : null,
                ),
                onChanged: (val) {
                  setState(() {
                    _query = val;
                  });
                },
              ),
            ),
            Expanded(
              child: filtered.isEmpty
                  ? const Center(
                      child: Text(
                        'No fragrances match your search.',
                        style: TextStyle(color: AppTheme.textMuted),
                      ),
                    )
                  : ListView.builder(
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final product = filtered[index];
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          leading: ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: Image.network(product['image_url'], width: 50, height: 50, fit: BoxFit.cover),
                          ),
                          title: Text(
                            product['name'].toUpperCase(),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5),
                          ),
                          subtitle: Text('₹${product['price']}', style: const TextStyle(color: AppTheme.primaryRose, fontSize: 12)),
                          trailing: const Icon(Icons.chevron_right, color: AppTheme.textMuted),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) => ProductDetailScreen(product: product),
                              ),
                            );
                          },
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
