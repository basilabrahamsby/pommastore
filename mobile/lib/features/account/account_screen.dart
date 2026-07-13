import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../auth/login_screen.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('MY ACCOUNT')),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // User Profile Section
              Container(
                color: AppTheme.surfaceLight,
                padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 24),
                child: Column(
                  children: [
                    const CircleAvatar(
                      radius: 36,
                      backgroundColor: AppTheme.primaryRose,
                      child: Icon(Icons.person, size: 40, color: Colors.white),
                    ),
                    const SizedBox(height: 14),
                    const Text(
                      'Arun',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'arunaveendran155@gmail.com',
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                    ),
                    const SizedBox(height: 14),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (context) => const LoginScreen()),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      ),
                      child: const Text('SIGN OUT / REGISTER', style: TextStyle(fontSize: 11)),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Settings list
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                child: Text('PREFERENCES', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: AppTheme.textMuted)),
              ),
              
              ListTile(
                leading: const Icon(Icons.shopping_bag_outlined, color: AppTheme.primaryRose),
                title: const Text('My Orders', style: TextStyle(fontSize: 14)),
                trailing: const Icon(Icons.chevron_right, color: AppTheme.textMuted),
                onTap: () {},
              ),
              const Divider(color: AppTheme.borderLight, height: 1),
              
              ListTile(
                leading: const Icon(Icons.location_on_outlined, color: AppTheme.primaryRose),
                title: const Text('Shipping Addresses', style: TextStyle(fontSize: 14)),
                trailing: const Icon(Icons.chevron_right, color: AppTheme.textMuted),
                onTap: () {},
              ),
              const Divider(color: AppTheme.borderLight, height: 1),

              ListTile(
                leading: const Icon(Icons.credit_card_outlined, color: AppTheme.primaryRose),
                title: const Text('Saved Payments', style: TextStyle(fontSize: 14)),
                trailing: const Icon(Icons.chevron_right, color: AppTheme.textMuted),
                onTap: () {},
              ),
              const Divider(color: AppTheme.borderLight, height: 1),
              
              ListTile(
                leading: const Icon(Icons.help_outline, color: AppTheme.primaryRose),
                title: const Text('Customer Support', style: TextStyle(fontSize: 14)),
                trailing: const Icon(Icons.chevron_right, color: AppTheme.textMuted),
                onTap: () {},
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}
